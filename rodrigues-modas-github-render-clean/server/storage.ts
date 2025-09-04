// server/storage.ts
import { db } from './db'; // Nossa conexão com o banco de dados Neon
import { 
  products as productsTable,
  users as usersTable,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type MpTransaction,
  type InsertMpTransaction
} from "@shared/schema";
import { eq } from "drizzle-orm";
import type { IStorage } from './storage.interface'; // O "contrato" que criamos

class DrizzleStorage implements IStorage {
  // ======================= NOVAS FUNÇÕES IMPLEMENTADAS AQUI =======================
  // --- USUÁRIOS ---
  async getUserByEmail(email: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(usersTable.email, email.toLowerCase()),
    });
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(usersTable.verificationToken, token),
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(usersTable).values({
      ...user,
      email: user.email.toLowerCase() // Sempre salva o email em minúsculas para evitar duplicatas
    }).returning();
    return result[0];
  }

  async verifyUser(id: string): Promise<User | undefined> {
    const result = await db.update(usersTable)
      .set({ emailVerified: new Date(), verificationToken: null }) // Marca como verificado e limpa o token
      .where(eq(usersTable.id, id))
      .returning();
    return result[0];
  }

  // --- PRODUTOS (já implementados) ---
  async getProducts(): Promise<Product[]> {
    console.log("Buscando produtos do banco de dados Neon...");
    const products = await db.query.products.findMany({
      where: eq(productsTable.isActive, true)
    });
    console.log(`Encontrados ${products.length} produtos.`);
    return products;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return await db.query.products.findFirst({
      where: eq(productsTable.id, id),
    });
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.query.products.findMany({
      where: eq(productsTable.category, category),
    });
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    console.log("Inserindo novo produto no banco de dados Neon...");
    const result = await db.insert(productsTable).values(product).returning();
    console.log("Produto inserido com sucesso:", result[0].id);
    return result[0];
  }

  async updateUser(id: string, product: Partial<Product>): Promise<Product | undefined> {
    const result = await db.update(productsTable).set(product).where(eq(productsTable.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(productsTable).where(eq(productsTable.id, id)).returning({ id: productsTable.id });
    return result.length > 0;
  }

  // --- MÉTODOS AINDA NÃO IMPLEMENTADOS ---
  // (O resto dos métodos continua aqui, sem alterações por enquanto)
  async getUser(id: string) { throw new Error("Method not implemented."); }
  async updateUser(id: string, user: any) { throw new Error("Method not implemented."); }
  async getCartItems(userId: string) { throw new Error("Method not implemented."); }
  async addToCart(item: any) { throw new Error("Method not implemented."); }
  async updateCartItem(id: string, quantity: number) { throw new Error("Method not implemented."); }
  async removeFromCart(id: string) { throw new Error("Method not implemented."); }
  async clearCart(userId: string) { throw new Error("Method not implemented."); }
  async getOrders() { throw new Error("Method not implemented."); }
  async getOrdersByUser(userId: string) { throw new Error("Method not implemented."); }
  async getOrder(id: string) { throw new Error("Method not implemented."); }
  async createOrder(order: any) { throw new Error("Method not implemented."); }
  async updateOrderStatus(id: string, status: string) { throw new Error("Method not implemented."); }
  async updateOrderPayment(id: string, paymentId: string, paymentStatus: string) { throw new Error("Method not implemented."); }
  async createMpTransaction(transaction: any) { throw new Error("Method not implemented."); }
  async getMpTransaction(paymentId: string) { throw new Error("Method not implemented."); }
  async updateMpTransaction(paymentId: string, data: any) { throw new Error("Method not implemented."); }
}

export const storage = new DrizzleStorage();
