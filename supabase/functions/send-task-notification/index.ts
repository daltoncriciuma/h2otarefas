import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskNotificationRequest {
  taskId: string;
  assigneeId: string;
}

const priorityLabels: Record<string, string> = {
  urgent: "🔴 URGENTE",
  high: "🟠 Alta",
  medium: "🟡 Média",
  low: "🟢 Baixa",
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "Não definido";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-task-notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, assigneeId }: TaskNotificationRequest = await req.json();
    console.log(`Processing notification for task ${taskId} to assignee ${assigneeId}`);

    if (!taskId || !assigneeId) {
      throw new Error("taskId and assigneeId are required");
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch task details with sector
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select(`
        *,
        sector:sectors(name)
      `)
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      console.error("Error fetching task:", taskError);
      throw new Error(`Task not found: ${taskError?.message}`);
    }

    console.log("Task fetched:", task.title);

    // Fetch assignee email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(assigneeId);

    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      throw new Error(`User email not found: ${userError?.message}`);
    }

    const assigneeEmail = userData.user.email;
    const assigneeName = userData.user.user_metadata?.full_name || "Colaborador";
    console.log(`Sending email to ${assigneeEmail}`);

    // Build email content
    const isUrgent = task.priority === "urgent" || task.priority === "high";
    const priorityLabel = priorityLabels[task.priority] || "Média";
    const sectorName = task.sector?.name || "Não definido";
    const dueDate = formatDate(task.due_at);

    const subject = isUrgent 
      ? `🚨 URGENTE: Nova tarefa atribuída - ${task.title}`
      : `📋 Nova tarefa atribuída: ${task.title}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isUrgent ? '#DC2626' : '#2563EB'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .value { font-size: 16px; color: #1f2937; margin-top: 4px; }
          .priority-urgent { color: #DC2626; font-weight: bold; }
          .priority-high { color: #EA580C; font-weight: bold; }
          .footer { background: #f3f4f6; padding: 15px 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .description { background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 20px;">
              ${isUrgent ? '🚨 Tarefa Urgente!' : '📋 Nova Tarefa Atribuída'}
            </h1>
          </div>
          <div class="content">
            <p>Olá <strong>${assigneeName}</strong>,</p>
            <p>Uma nova tarefa foi atribuída para você no sistema H2O Tarefas.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <div class="field">
              <div class="label">Título</div>
              <div class="value">${task.task_number ? `#${task.task_number} - ` : ''}${task.title}</div>
            </div>
            
            ${task.description ? `
            <div class="field">
              <div class="label">Descrição</div>
              <div class="description">${task.description}</div>
            </div>
            ` : ''}
            
            <div class="field">
              <div class="label">Setor</div>
              <div class="value">${sectorName}</div>
            </div>
            
            <div class="field">
              <div class="label">Prioridade</div>
              <div class="value ${isUrgent ? 'priority-urgent' : ''}">${priorityLabel}</div>
            </div>
            
            <div class="field">
              <div class="label">Prazo</div>
              <div class="value">${dueDate}</div>
            </div>
            
            ${task.possible_solution ? `
            <div class="field">
              <div class="label">Possível Solução</div>
              <div class="description">${task.possible_solution}</div>
            </div>
            ` : ''}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="text-align: center;">
              <strong>Acesse o sistema para mais detalhes e atualizações.</strong>
            </p>
          </div>
          <div class="footer">
            H2O Laboratório - Sistema de Tarefas<br>
            Este é um e-mail automático, por favor não responda.
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "H2O Tarefas <onboarding@resend.dev>",
        to: [assigneeEmail],
        subject: subject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-task-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
