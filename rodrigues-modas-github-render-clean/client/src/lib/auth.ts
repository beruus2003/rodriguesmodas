import { authService as supabaseAuthService } from "./supabase";
import type { AuthUser } from "../types";

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
      // Conta admin do proprietário da loja - Camila (aceita tanto como email quanto username)
      if ((email === "Camila567" || email === "camila567") && password === "Js180620") {
        const authUser: AuthUser = {
          id: "admin-camila",
          email: "contact.rodriguesmoda@gmail.com",
          name: "Camila - Proprietária",
          phone: "+55 85 99180-2352",
          role: "admin",
        };

        localStorage.setItem("auth-user", JSON.stringify(authUser));
        return authUser;
      }

      // Conta admin para demonstração (manter como backup)
      if (email === "admin@rodriguesmodas.com" && password === "admin123") {
        const authUser: AuthUser = {
          id: "admin-123",
          email,
          name: "Administrador",
          phone: "(11) 99999-9999",
          role: "admin",
        };

        localStorage.setItem("auth-user", JSON.stringify(authUser));
        return authUser;
      }

      // Conta de teste para checkout
      if (email === "teste@rodriguesmodas.com" && password === "123456") {
        const authUser: AuthUser = {
          id: "test-user-id",
          email,
          name: "Cliente Teste",
          phone: "(11) 98765-4321",
          role: "customer",
        };

        localStorage.setItem("auth-user", JSON.stringify(authUser));
        return authUser;
      }

      const { user, error } = await supabaseAuthService.signIn(email, password);

      if (error) throw error;

      const authUser: AuthUser = {
        id: user?.id || `user-${Date.now()}`,
        email: user?.email || email,
        name: user?.user_metadata?.name || "Cliente",
        phone: user?.user_metadata?.phone,
        role: "customer",
      };

      localStorage.setItem("auth-user", JSON.stringify(authUser));
      return authUser;
    } catch (error) {
      console.error("Sign in error:", error);
      throw new Error("Email ou senha incorretos.");
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
}

export const authService = new AuthService();