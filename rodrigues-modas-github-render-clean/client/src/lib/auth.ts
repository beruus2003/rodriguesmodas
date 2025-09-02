import { authService as supabaseAuthService } from "./supabase";
import type { AuthUser } from "../types";
import { type Session } from "@supabase/supabase-js"; // Import que precisamos

export class AuthService {
  async signUp(email: string, password: string, name: string, phone?: string): Promise<AuthUser> {
    try {
      const { user, error } = await supabaseAuthService.signUp(email, password, {
        name,
        phone,
        role: "customer",
      });

      if (error) throw error;

      const authUser: AuthUser = {
        id: user?.id || `user-${Date.now()}`,
        email: user?.email || email,
        name,
        phone,
        role: "customer",
      };

      localStorage.setItem("auth-user", JSON.stringify(authUser));
      return authUser;
    } catch (error) {
      console.error("Sign up error:", error);
      throw new Error("Erro ao criar conta. Verifique os dados e tente novamente.");
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
          // ================== CORREÇÃO APLICADA AQUI ==================
          // Apontando para a rota de login de CLIENTE que criamos
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const authUser: AuthUser = result.user;
      localStorage.setItem("auth-user", JSON.stringify(authUser));
      return authUser;
    } else {
      // Se a API falhar, joga um erro com a mensagem do backend
      throw new Error(result.message || "Email ou senha incorretos.");
    }
    // ================================================================

    } catch (error) {
      console.error("Sign in error:", error);
      // Repassa o erro para o formulário no Header.tsx poder mostrar a mensagem
      throw error;
    }
  }

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      const { error } = await supabaseAuthService.signInWithOAuth("google");

      if (error) throw error;

      // OAuth redirecionará o usuário - a sessão será tratada no retorno
      const authUser: AuthUser = {
        id: `google-${Date.now()}`,
        email: "usuario@gmail.com",
        name: "Usuário Google",
        role: "customer",
      };

      localStorage.setItem("auth-user", JSON.stringify(authUser));
      return authUser;
    } catch (error) {
      console.error("Google sign in error:", error);
      throw new Error("Erro ao fazer login com Google.");
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabaseAuthService.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      localStorage.removeItem("auth-user");
    }
  }

  getCurrentUser(): AuthUser | null {
    try {
      const userData = localStorage.getItem("auth-user");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "admin";
  }

  // ================== FUNÇÃO ADICIONADA AQUI ==================
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: authListener } = supabaseAuthService.onAuthStateChange(
      (event, session) => {
        callback(event, session);
      }
    );
    return authListener;
  }
  // ============================================================
}

export const authService = new AuthService();
