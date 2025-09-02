import { authService as supabaseAuthService } from "./supabase";
import type { AuthUser } from "../types";
import { type Session } from "@supabase/supabase-js";

export class AuthService {
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      // Apontando para a sua rota de login de cliente. Está correto.
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    
      const result = await response.json();
    
      if (result.success && result.user) {
        const authUser: AuthUser = result.user;
        // Salva o usuário no localStorage para a sessão persistir
        localStorage.setItem("auth-user", JSON.stringify(authUser));
        return authUser;
      } else {
        // Joga um erro com a mensagem do backend
        throw new Error(result.message || "Email ou senha incorretos.");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabaseAuthService.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Limpa o nosso localStorage. Crucial para o logout funcionar.
      localStorage.removeItem("auth-user");
    }
  }

  // Pega o usuário do localStorage. Perfeito.
  getCurrentUser(): AuthUser | null {
    try {
      const userData = localStorage.getItem("auth-user");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Ouve por eventos do Supabase para manter a sincronia entre abas.
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
