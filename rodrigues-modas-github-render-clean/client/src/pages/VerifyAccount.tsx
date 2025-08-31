// client/src/pages/VerifyAccount.tsx
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyAccount() {
  const [location] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<string>("verifying"); // 'verifying', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Pega o token da URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setVerificationStatus("error");
      setErrorMessage("Token de verificação não encontrado na URL.");
      return;
    }

    // Chama a API do back-end para verificar o token
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/users/verify?token=${token}`);
        
        if (response.ok) {
          // O backend redireciona em caso de sucesso, mas se por acaso não redirecionar,
          // podemos tratar o sucesso aqui também.
          setVerificationStatus("success");
        } else {
          // Se a resposta não for OK, pega a mensagem de erro do corpo da resposta
          const errorText = await response.text();
          setVerificationStatus("error");
          setErrorMessage(errorText || "Ocorreu um erro ao verificar sua conta.");
        }
      } catch (error) {
        setVerificationStatus("error");
        setErrorMessage("Não foi possível conectar ao servidor para verificação.");
      }
    };

    verifyToken();
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Verificação de Conta</CardTitle>
        </CardHeader>
        <CardContent>
          {verificationStatus === "verifying" && (
            <p className="text-muted-foreground">Verificando sua conta, por favor aguarde...</p>
          )}
          {verificationStatus === "success" && (
            <div className="space-y-4">
              <p className="text-green-600 font-semibold">Conta verificada com sucesso!</p>
              <p className="text-muted-foreground">
                Sua conta foi ativada. Agora você já pode fazer o login para começar a comprar.
              </p>
              <Button asChild className="w-full btn-primary">
                <Link href="/login">Ir para o Login</Link>
              </Button>
            </div>
          )}
          {verificationStatus === "error" && (
            <div className="space-y-4">
              <p className="text-destructive font-semibold">Falha na Verificação</p>
              <p className="text-muted-foreground">
                {errorMessage}
              </p>
              <Button asChild className="w-full btn-secondary">
                <Link href="/cadastro">Tentar Cadastro Novamente</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
