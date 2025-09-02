import { useState, useEffect } from "react";
import { authService } from "../lib/auth";
import { supabaseAuth } from "../lib/supabase";
import type { AuthUser } from "../types";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Listen for auth state changes
    const { data } = supabaseAuth.onAuthStateChange((event: string, session: any) => {
      if (event === "SIGNED_IN" && session?.user) {
        const authUser = authService.getCurrentUser();
        setUser(authUser);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    setLoading(true);
    try {
      const authUser = await authService.signUp(email, password, name, phone);
      setUser(authUser);
      return authUser;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const authUser = await authService.signIn(email, password);
      setUser(authUser);
      return authUser;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const authUser = await authService.signInWithGoogle();
      setUser(authUser);
      return authUser;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };
}
