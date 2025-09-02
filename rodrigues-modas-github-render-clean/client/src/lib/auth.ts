import { authService as supabaseAuthService } from "./supabase";
import type { AuthUser } from "../types";
import { type Session } from "@supabase/supabase-js";

export class AuthService {
  // Sua função de login de cliente. Apontei para a rota correta que criamos.
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    
      const result = await response.json();
    
      if (result.success && result.user) {
        const authUser: AuthUser = result.user;
        localStorage.setItem("auth-user", JSON.stringify(authUser));
        return authUser;
      } else {
        throw new Error(result.message || "Email ou senha incorretos.");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  // Sua função de logout.
  async signOut(): Promise<void> {
    try {
      await supabaseAuthService.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      localStorage.removeItem("auth-user");
    }
  }

  // Sua função para pegar o usuário do localStorage. Perfeita.
  getCurrentUser(): AuthUser | null {
    try {
      const userData = localStorage.getItem("auth-user");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // A função para ouvir mudanças externas do Supabase.
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: authListener } = supabaseAuthService.onAuthStateChange(
      (event, session) => {
        callback(event, session);
      }
    );
    return authListener;
  }
}

export const authService = new AuthService();
