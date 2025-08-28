// server/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Esta linha vai pegar a URL do seu banco de dados Neon que está na Render
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('A variável de ambiente DATABASE_URL não está configurada!');
}

// Cria o cliente de conexão
const client = postgres(connectionString);

// Cria a instância do Drizzle que vamos usar para todas as operações
export const db = drizzle(client, { schema });
