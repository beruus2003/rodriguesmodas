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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A lógica que antes estava no hook, agora vive aqui, na nossa "central".
    setLoading(true);
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    const subscription = authService.onAuthStateChange((event, sessionUser) => {
      setUser(sessionUser);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    const authUser = await authService.signUp(email, password, name, phone);
    setUser(authUser);
    return authUser;
  };

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
    signUp,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
