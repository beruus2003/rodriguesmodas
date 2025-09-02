import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import { authService } from "../lib/auth";
import type { AuthUser } from "../types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: typeof authService.signUp;
  signIn: typeof authService.signIn;
  signOut: typeof authService.signOut;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// ================== A CORREÇÃO ESTÁ AQUI ==================
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // NOTA: A lógica de `onAuthStateChange` foi movida para dentro do authService
  // para manter este provedor mais limpo.
  useEffect(() => {
    setLoading(true);
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    const subscription = authService.onAuthStateChange((_event, sessionUser) => {
      setUser(sessionUser);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // As funções agora são apenas repassadas do serviço para o contexto
  const value = {
    user,
    loading,
    signUp: authService.signUp,
    signIn: authService.signIn,
    signOut: authService.signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// O hook useAuth que os componentes usarão
export function useAuthFromContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthFromContext must be used within an AuthProvider");
  }
  return context;
}
