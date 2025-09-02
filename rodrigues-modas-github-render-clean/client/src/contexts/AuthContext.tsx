import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import { authService } from "../lib/auth";
import type { AuthUser } from "../types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ao carregar o site, ele pega o usuário que já pode estar salvo no localStorage
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Ouve por eventos para manter a sincronia entre abas
    const authListener = authService.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(authService.getCurrentUser());
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Funções que alteram o estado
  const signIn = async (email: string, password: string) => {
    const loggedInUser = await authService.signIn(email, password);
    setUser(loggedInUser); // Avisa a todos os componentes sobre o novo usuário
    return loggedInUser;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null); // Avisa a todos que o usuário saiu
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
