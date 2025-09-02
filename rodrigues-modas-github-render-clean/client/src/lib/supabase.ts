import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://xnrszshropzlrsqlutqb.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucnN6c2hyb3B6bHJzcWx1dHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzQxNzUsImV4cCI6MjA3MDI1MDE3NX0.nQH6UvfQBsSe9SPDcIQT_x35EPHAvXGxuajkQIZVEB8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAuth = supabase.auth;

// Interface para compatibilidade com código existente
interface SupabaseAuthResponse {
  user: any;
  session: any;
  error?: any;
}

// Wrapper para manter compatibilidade com implementação anterior
export const authService = {
  async signUp(email: string, password: string, userData?: any): Promise<SupabaseAuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    return {
      user: data.user,
      session: data.session,
      error
    };
  },

  async signIn(email: string, password: string): Promise<SupabaseAuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return {
      user: data.user,
      session: data.session,
      error
    };
  },

  async signInWithOAuth(provider: 'google'): Promise<SupabaseAuthResponse> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin
      }
    });
    
    return {
      user: null,
      session: null,
      error
    };
  },

  async signOut(): Promise<{ error?: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getSession(): Promise<{ session: any; error?: any }> {
    const { data, error } = await supabase.auth.getSession();
    return {
      session: data.session,
      error
    };
  }
};

// Helper para requisições autenticadas
export const supabaseRequest = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    'apikey': supabaseAnonKey,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${supabaseUrl}/rest/v1${endpoint}`, {
    ...options,
    headers,
  });
};