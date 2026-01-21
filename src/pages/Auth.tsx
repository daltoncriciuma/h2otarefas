import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft } from 'lucide-react';
import { getSafeAuthErrorMessage } from '@/lib/errorUtils';
import { supabase } from '@/integrations/supabase/client';
import logoH2o from '@/assets/logo-h2o.webp';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Nome muito curto'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

const resetSchema = z.object({
  email: z.string().email('Email inválido'),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Detectar se o usuário veio do link de recuperação de senha
  useEffect(() => {
    const detectRecovery = async () => {
      // Verificar hash params (formato antigo)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashType = hashParams.get('type');
      const hashAccessToken = hashParams.get('access_token');
      
      // Verificar query params (formato novo PKCE)
      const urlParams = new URLSearchParams(window.location.search);
      const queryType = urlParams.get('type');
      const queryCode = urlParams.get('code');
      const queryError = urlParams.get('error');
      const queryErrorDescription = urlParams.get('error_description');
      
      // Se há erro na URL, mostrar
      if (queryError) {
        setError(queryErrorDescription || 'Erro ao processar link de recuperação');
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }

      // Detectar recovery via hash (formato antigo)
      if (hashType === 'recovery' && hashAccessToken) {
        console.log('Recovery detected via hash');
        setShowNewPasswordForm(true);
        return;
      }
      
      // Detectar recovery via query params (PKCE flow)
      if (queryType === 'recovery' && queryCode) {
        console.log('Recovery detected via query params, exchanging code...');
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(queryCode);
          if (error) {
            console.error('Error exchanging code:', error);
            setError('Link de recuperação expirado ou inválido. Solicite um novo.');
          } else {
            console.log('Code exchanged successfully, showing password form');
            setShowNewPasswordForm(true);
          }
        } catch (err) {
          console.error('Exception exchanging code:', err);
          setError('Erro ao processar link de recuperação. Solicite um novo.');
        }
        // Limpar a URL após processar
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }

      // Verificar se há token na URL sem tipo (alguns fluxos de magic link)
      if (queryCode && !queryType) {
        console.log('Code detected without type, attempting exchange...');
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(queryCode);
          if (!error) {
            // Verificar se a sessão atual é de recovery
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              // Checar o evento que gerou a sessão
              console.log('Session established after code exchange');
            }
          }
        } catch (err) {
          console.error('Exception during code exchange:', err);
        }
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    detectRecovery();

    // Escutar eventos de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event received');
        setShowNewPasswordForm(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', fullName: '', confirmPassword: '' },
  });

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  const newPasswordForm = useForm<z.infer<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await signIn(values.email, values.password);
    if (error) {
      setError(getSafeAuthErrorMessage(error));
    } else {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await signUp(values.email, values.password, values.fullName);
    if (error) {
      setError(getSafeAuthErrorMessage(error));
    } else {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (values: z.infer<typeof resetSchema>) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await resetPassword(values.email);
    if (error) {
      setError('Erro ao enviar email de recuperação. Tente novamente.');
    } else {
      setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
      resetForm.reset();
    }
    setIsLoading(false);
  };

  const handleNewPassword = async (values: z.infer<typeof newPasswordSchema>) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    const { error } = await supabase.auth.updateUser({
      password: values.password
    });

    if (error) {
      setError('Erro ao atualizar senha. Tente novamente.');
    } else {
      setSuccess('Senha atualizada com sucesso!');
      newPasswordForm.reset();
      // Limpar o hash da URL
      window.history.replaceState(null, '', window.location.pathname);
      // Redirecionar após 2 segundos
      setTimeout(() => {
        setShowNewPasswordForm(false);
        navigate('/dashboard');
      }, 2000);
    }
    setIsLoading(false);
  };

  // Formulário para definir nova senha
  if (showNewPasswordForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logoH2o} alt="H2O Laboratório" className="h-16 mx-auto mb-2" />
            <CardTitle className="text-2xl font-bold text-primary">Nova Senha</CardTitle>
            <CardDescription>Digite sua nova senha</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 text-green-600 text-sm rounded-lg">
                {success}
              </div>
            )}
            <Form {...newPasswordForm}>
              <form onSubmit={newPasswordForm.handleSubmit(handleNewPassword)} className="space-y-4">
                <FormField control={newPasswordForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={newPasswordForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl><Input type="password" placeholder="Digite novamente" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Atualizar Senha
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logoH2o} alt="H2O Laboratório" className="h-16 mx-auto mb-2" />
            <CardTitle className="text-2xl font-bold text-primary">Recuperar Senha</CardTitle>
            <CardDescription>Digite seu email para receber o link de recuperação</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 text-green-600 text-sm rounded-lg">
                {success}
              </div>
            )}
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
                <FormField control={resetForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Link de Recuperação
                </Button>
              </form>
            </Form>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => {
                setShowResetPassword(false);
                setError(null);
                setSuccess(null);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logoH2o} alt="H2O Laboratório" className="h-16 mx-auto mb-2" />
          <CardDescription>Sistema de Gestão de Tarefas</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                {error}
              </div>
            )}

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 mt-4">
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="text-right">
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setShowResetPassword(true);
                        setError(null);
                      }}
                    >
                      Esqueceu a senha?
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4 mt-4">
                  <FormField control={signupForm.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={signupForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={signupForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={signupForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar senha</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cadastrar
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
