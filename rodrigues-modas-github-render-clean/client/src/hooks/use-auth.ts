// client/src/hooks/use-auth.ts
import { useContext } from 'react';
// Importa o contexto que acabamos de criar
import { AuthContext } from '../contexts/AuthContext';

// A função useAuth agora simplesmente pega o contexto compartilhado.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
