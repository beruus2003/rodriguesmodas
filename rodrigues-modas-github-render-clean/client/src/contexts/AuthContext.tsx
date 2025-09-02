import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import { authService } from "../lib/auth";
import { supabaseAuth } from "../lib/supabase"; // Importação que faltava
import type { AuthUser } from "../types";

// Definindo a "forma" do nosso contexto
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: typeof authService.signIn;
  signOut: typeof authService.signOut;
  // Adicione outras funções como signUp se precisar delas globalmente
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Criando o contexto (ainda sem exportar)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// O Provedor, que será a nossa "Central de Inteligência"
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // 1. Pega o usuário inicial do localStorage (rápido)
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // 2. Ouve por mudanças em tempo real (ex: login em outra aba)
    const { data: authListener } = supabaseAuth.onAuthStateChange((_event, session) => {
      const sessionUser = authService.getCurrentUser(); // Pega o usuário formatado do localStorage
      setUser(sessionUser);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // As funções que modificam o estado
  const signIn = async (email: string, password: string) => {
    const authUser = await authService.signIn(email, password);
    setUser(authUser); // Atualiza o estado central
    return authUser;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null); // Atualiza o estado central
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</Auth-Context.Provider>;
}

// O hook que os componentes usarão para acessar a "Central"
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
