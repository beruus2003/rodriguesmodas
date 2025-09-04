// client/src/pages/Login.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth"; // Usaremos o hook de autenticação

// Validação do formulário de login
const loginSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  password: z.string().min(1, "Senha é obrigatória."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const { signIn } = useAuth(); // Pega a função de login do nosso hook
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Efeito para mostrar o toast de sucesso após a verificação do e-mail
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "true") {
      toast({
        title: "E-mail verificado com sucesso!",
        description: "Sua conta foi ativada. Agora você pode fazer o login.",
      });
    }
  }, []);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // (Ainda vamos criar esta rota no backend)
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Ocorreu um erro. Tente novamente.");
      }
      
      // Se o login no backend deu certo, atualiza o estado de autenticação no frontend
      signIn(result.user);
      
      toast({
        title: `Bem-vinda de volta, ${result.user.name}!`,
      });

      // Redireciona o usuário para a página inicial
      setLocation("/");

    } catch (error) {
      toast({
        title: "Erro no Login",
        description: error instanceof Error ? error.message : "Não foi possível acessar sua conta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Acesse sua Conta</CardTitle>
          <CardDescription>
            Bem-vinda de volta! Faça o login para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...form.register("email")}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                {...form.register("password")}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link href="/cadastro" className="text-accent hover:underline">
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
