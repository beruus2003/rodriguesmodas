import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import { authService } from "../lib/auth";
import type { AuthUser } from "../types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: typeof authService.signIn;
  signOut: typeof authService.signOut;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Ao carregar a aplicação, verifica se já existe um usuário no localStorage
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // 2. Ouve por eventos do Supabase (ex: logout em outra aba) para manter a sincronia
    const authListener = authService.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Se o Supabase deslogou, limpamos o nosso estado também
        setUser(null);
        localStorage.removeItem("auth-user"); // Garante a limpeza
      } else if (event === "SIGNED_IN") {
        // Se um login aconteceu em outra aba, recarregamos do nosso localStorage
        // que o auth.ts do Supabase deve ter atualizado.
        setUser(authService.getCurrentUser());
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Esta função agora chama o seu auth.ts e ATUALIZA o estado central
  const signIn = async (email: string, password: string) => {
    try {
      const loggedInUser = await authService.signIn(email, password);
      setUser(loggedInUser); // <-- A MÁGICA: Avisa toda a aplicação sobre o novo usuário!
      return loggedInUser;
    } catch (error) {
      setUser(null); // Garante que o estado fique nulo em caso de falha
      throw error; // Repassa o erro para o formulário poder exibi-lo
    }
  };

  // Esta função agora chama o seu auth.ts e ATUALIZA o estado central
  const signOut = async () => {
    await authService.signOut();
    setUser(null); // <-- A MÁGICA: Avisa toda a aplicação que o usuário saiu!
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
