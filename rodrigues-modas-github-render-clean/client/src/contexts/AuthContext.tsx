import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import { authService } from "../lib/auth";
import { supabaseAuth } from "../lib/supabase";
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
    setLoading(true);
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    const { data: authListener } = supabaseAuth.onAuthStateChange((_event, session) => {
      const sessionUser = authService.getCurrentUser();
      setUser(sessionUser);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const authUser = await authService.signIn(email, password);
    setUser(authUser);
    return authUser;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  // ================== A CORREÇÃO ESTÁ AQUI ==================
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
