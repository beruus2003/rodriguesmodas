import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const loginSchema = z.object({
  email: z.string().min(1, "Campo obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      const authUser = await signIn(data.email, data.password);
      toast({
        title: "Login realizado!",
        description: `Bem-vinda de volta, ${authUser.name}!`,
      });
      onClose();
      // Atualizar UI após login
      window.location.reload();
    } catch (error) {
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Credenciais inválidas",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    loginForm.reset();
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Login do Proprietário</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Área restrita para administração da loja.
            </p>
          </div>

          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            {/* Username/Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Usuário ou Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="Digite usuário ou email"
                {...loginForm.register("email")}
                data-testid="input-login-email"
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...loginForm.register("password")}
                  data-testid="input-login-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Botão de Login */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-login-submit"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Informação para clientes */}
          <div className="text-center border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Clientes podem fazer compras sem cadastro via WhatsApp
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}