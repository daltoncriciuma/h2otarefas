import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Drive folder ID where files will be uploaded
const DRIVE_FOLDER_ID = "1r8KjYqEvUNCiE6bvLSSjBvZY1laRM-YO";

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

async function getAccessToken(serviceAccountKey: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const payload = {
    iss: serviceAccountKey.client_email,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: serviceAccountKey.token_uri,
    exp: exp,
    iat: now
  };

  // Base64url encode
  const base64UrlEncode = (obj: object) => {
    const json = JSON.stringify(obj);
    const base64 = btoa(json);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Import the private key and sign
  const privateKeyPem = serviceAccountKey.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const jwt = `${signatureInput}.${signatureBase64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch(serviceAccountKey.token_uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("Token exchange failed:", errorText);
    throw new Error("AUTH_TOKEN_FAILED");
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function uploadToDrive(accessToken: string, fileData: Uint8Array, fileName: string, mimeType: string): Promise<{ id: string; webViewLink: string }> {
  const metadata = {
    name: fileName,
    parents: [DRIVE_FOLDER_ID]
  };

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataString = JSON.stringify(metadata);
  
  // Build multipart request body
  const bodyParts = [
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    metadataString,
    delimiter,
    `Content-Type: ${mimeType}\r\n`,
    'Content-Transfer-Encoding: base64\r\n\r\n',
    btoa(String.fromCharCode(...fileData)),
    closeDelimiter
  ];

  const body = bodyParts.join('');

  const uploadResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body: body
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("Upload failed:", errorText);
    throw new Error("DRIVE_UPLOAD_FAILED");
  }

  return await uploadResponse.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create a client with the user's auth token to verify authentication
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const serviceAccountKeyStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKeyStr) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
    }

    const serviceAccountKey: ServiceAccountKey = JSON.parse(serviceAccountKeyStr);
    
    const { attachmentIds, taskNumber } = await req.json();
    
    if (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0) {
      throw new Error('No attachment IDs provided');
    }

    console.log(`Processing ${attachmentIds.length} attachments for task ${taskNumber || 'unknown'}`);

    // Initialize Supabase client with service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get access token
    const accessToken = await getAccessToken(serviceAccountKey);
    console.log("Got Google access token");

    const results: { attachmentId: string; driveFileId: string; driveLink: string }[] = [];

    for (const attachmentId of attachmentIds) {
      // Get attachment details from database
      const { data: attachment, error: attachmentError } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();

      if (attachmentError || !attachment) {
        console.error(`Attachment ${attachmentId} not found:`, attachmentError);
        continue;
      }

      console.log(`Downloading file: ${attachment.file_path}`);

      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('task-attachments')
        .download(attachment.file_path);

      if (downloadError || !fileData) {
        console.error(`Failed to download ${attachment.file_path}:`, downloadError);
        continue;
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Create filename with task number prefix
      const prefix = taskNumber ? `Tarefa_${taskNumber}_` : '';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${prefix}${timestamp}_${attachment.file_name}`;

      console.log(`Uploading to Drive: ${fileName}`);

      // Upload to Google Drive
      const driveResult = await uploadToDrive(
        accessToken,
        uint8Array,
        fileName,
        attachment.mime_type || 'application/octet-stream'
      );

      console.log(`Uploaded to Drive: ${driveResult.id}`);

      results.push({
        attachmentId,
        driveFileId: driveResult.id,
        driveLink: driveResult.webViewLink
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        uploaded: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in upload-to-drive function:', error);
    
    // Map internal errors to safe user messages
    let clientMessage = 'Erro ao enviar para o Drive. Tente novamente.';
    
    if (errorMessage === 'GOOGLE_SERVICE_ACCOUNT_KEY not configured') {
      clientMessage = 'Serviço temporariamente indisponível.';
    } else if (errorMessage === 'No attachment IDs provided') {
      clientMessage = 'Nenhum anexo fornecido.';
    } else if (errorMessage === 'AUTH_TOKEN_FAILED') {
      clientMessage = 'Erro de autenticação. Contate o administrador.';
    } else if (errorMessage === 'DRIVE_UPLOAD_FAILED') {
      clientMessage = 'Erro ao enviar arquivo. Verifique as permissões.';
    }
    
    return new Response(
      JSON.stringify({ error: clientMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
