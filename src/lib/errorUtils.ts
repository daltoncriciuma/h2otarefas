/**
 * Centralized error handling utility to prevent database error exposure.
 * Maps technical errors to user-friendly messages while logging details for debugging.
 */

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
}

/**
 * Maps database and API errors to safe, user-friendly messages.
 * Logs the full error for debugging while showing generic messages to users.
 */
export function getSafeErrorMessage(error: SupabaseError | Error | unknown, context?: string): string {
  // Log the full error for debugging (server-side visibility only)
  console.error(`[${context || 'Error'}]:`, error);

  // Type guard for Supabase errors
  const supaError = error as SupabaseError;
  
  // Map specific PostgreSQL error codes to user-friendly messages
  if (supaError?.code) {
    switch (supaError.code) {
      case '23505': // unique_violation
        return 'Este item já existe.';
      case '23503': // foreign_key_violation
        return 'Não é possível excluir - item em uso.';
      case '23502': // not_null_violation
        return 'Campos obrigatórios não preenchidos.';
      case '42501': // insufficient_privilege
      case 'PGRST301': // RLS policy violation
        return 'Você não tem permissão para esta operação.';
      case '42P01': // undefined_table
      case '42703': // undefined_column
        return 'Erro de configuração. Contate o suporte.';
      case 'PGRST116': // not found
        return 'Item não encontrado.';
    }
  }

  // Check for RLS policy messages (without exposing details)
  if (supaError?.message?.toLowerCase().includes('row-level security') ||
      supaError?.message?.toLowerCase().includes('rls')) {
    return 'Você não tem permissão para esta operação.';
  }

  // Check for network errors
  if (supaError?.message?.toLowerCase().includes('fetch') ||
      supaError?.message?.toLowerCase().includes('network') ||
      supaError?.message?.toLowerCase().includes('connection')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Default generic message
  return 'Erro ao processar operação. Tente novamente.';
}

/**
 * Maps authentication errors to user-friendly messages.
 */
export function getSafeAuthErrorMessage(error: SupabaseError | Error | unknown): string {
  console.error('[Auth Error]:', error);

  const supaError = error as SupabaseError;
  const message = supaError?.message?.toLowerCase() || '';

  if (message.includes('invalid login credentials') || 
      message.includes('invalid email or password')) {
    return 'Credenciais inválidas.';
  }

  if (message.includes('already registered') || 
      message.includes('user already exists')) {
    return 'Email já cadastrado.';
  }

  if (message.includes('email not confirmed')) {
    return 'Email ainda não confirmado. Verifique sua caixa de entrada.';
  }

  if (message.includes('too many requests') || 
      message.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos.';
  }

  if (message.includes('password') && message.includes('weak')) {
    return 'Senha muito fraca. Use pelo menos 6 caracteres.';
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet.';
  }

  return 'Erro na autenticação. Tente novamente.';
}
