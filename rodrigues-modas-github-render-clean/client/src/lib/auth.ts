export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "admin" | "customer";
}

export const authService = {
  async getUser(): Promise<AuthUser | null> {
    const raw = localStorage.getItem("auth-user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async signIn(email: string, password: string): Promise<AuthUser> {
    // helper local
    const tryLogin = async (path: string): Promise<AuthUser | null> => {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (res.ok && data?.success && data?.user) {
        const authUser: AuthUser = data.user;
        localStorage.setItem("auth-user", JSON.stringify(authUser));
        return authUser;
      }

      if (!res.ok && data?.message) {
        throw new Error(data.message);
      }

      return null;
    };

    // 1) cliente
    const userLogin = await tryLogin("/api/users/login");
    if (userLogin) return userLogin;

    // 2) admin
    const adminLogin = await tryLogin("/api/auth/login");
    if (adminLogin) return adminLogin;

    // 3) fallback de teste
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

    throw new Error("E-mail ou senha inválidos.");
  },

  async signOut() {
    localStorage.removeItem("auth-user");
  },
};
