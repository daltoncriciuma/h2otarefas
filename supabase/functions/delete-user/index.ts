import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create client with user's auth token for validation
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate JWT.
    // NOTE: In Lovable Cloud we use verify_jwt=false (gateway verification may fail with ES256 tokens),
    // so we must validate in-code.
    const token = authHeader.replace("Bearer ", "");

    let callerId: string | null = null;

    // Preferred: claims validation
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (!claimsError && claimsData?.claims?.sub) {
      callerId = claimsData.claims.sub;
    } else {
      // Fallback: explicit getUser(token) validation
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser(token);

      if (userError) console.error("getUser(token) error:", userError);
      if (claimsError) console.error("getClaims error:", claimsError);

      callerId = user?.id ?? null;
    }

    if (!callerId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .single();

    if (callerRole?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can delete users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-deletion
    if (userId === callerId) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // First, delete related data that might not cascade
    // Delete user_sectors
    const { error: sectorsError } = await supabaseAdmin
      .from('user_sectors')
      .delete()
      .eq('user_id', userId);
    
    if (sectorsError) {
      console.error("Error deleting user sectors:", sectorsError);
    }

    // Delete task_attachments uploaded by user
    const { error: attachmentsError } = await supabaseAdmin
      .from('task_attachments')
      .delete()
      .eq('uploaded_by', userId);
    
    if (attachmentsError) {
      console.error("Error deleting user attachments:", attachmentsError);
    }

    // Delete task_comments by user
    const { error: commentsError } = await supabaseAdmin
      .from('task_comments')
      .delete()
      .eq('author_id', userId);
    
    if (commentsError) {
      console.error("Error deleting user comments:", commentsError);
    }

    // Nullify tasks assigned to user (don't delete, just unassign)
    const { error: assigneeError } = await supabaseAdmin
      .from('tasks')
      .update({ assignee_id: null })
      .eq('assignee_id', userId);
    
    if (assigneeError) {
      console.error("Error nullifying task assignees:", assigneeError);
    }

    // Nullify tasks created by user
    const { error: createdByError } = await supabaseAdmin
      .from('tasks')
      .update({ created_by: null })
      .eq('created_by', userId);
    
    if (createdByError) {
      console.error("Error nullifying task creators:", createdByError);
    }

    // Nullify tasks completed by user
    const { error: completedByError } = await supabaseAdmin
      .from('tasks')
      .update({ completed_by: null })
      .eq('completed_by', userId);
    
    if (completedByError) {
      console.error("Error nullifying task completers:", completedByError);
    }

    // Delete user from auth (this will cascade to profiles and user_roles due to FK)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      return new Response(
        JSON.stringify({ error: `Erro ao excluir usuário: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
