
// server/storage.ts
import { db } from './db'; // Nossa conexão com o banco de dados Neon
import { 
  products as productsTable,
  users as usersTable,
  cartItems as cartItemsTable,
  orders as ordersTable,
  mpTransactions as mpTransactionsTable,
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
  // ======================= USUÁRIOS =======================
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

  async getUser(id: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(usersTable.id, id),
    });
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const result = await db.update(usersTable)
      .set(user)
      .where(eq(usersTable.id, id))
      .returning();
    return result[0];
  }

  // ======================= PRODUTOS =======================
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

  async updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined> {
    const result = await db.update(productsTable).set(product).where(eq(productsTable.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(productsTable).where(eq(productsTable.id, id)).returning({ id: productsTable.id });
    return result.length > 0;
  }

  // ======================= CARRINHO =======================
  async getCartItems(userId: string): Promise<CartItem[]> {
    return await db.query.cartItems.findMany({
      where: eq(cartItemsTable.userId, userId),
    });
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    console.log("🛒 Tentando adicionar item ao carrinho:", JSON.stringify(item, null, 2));
    try {
      const result = await db.insert(cartItemsTable).values(item).returning();
      console.log("✅ Item inserido no banco com sucesso:", JSON.stringify(result[0], null, 2));
      return result[0];
    } catch (error) {
      console.error("❌ Erro ao inserir no banco de dados:", error);
      throw error;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const result = await db.update(cartItemsTable)
      .set({ quantity })
      .where(eq(cartItemsTable.id, id))
      .returning();
    return result[0];
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.id, id))
      .returning({ id: cartItemsTable.id });
    return result.length > 0;
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  }

  // ======================= PEDIDOS =======================
  async getOrders(): Promise<Order[]> {
    return await db.query.orders.findMany();
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db.query.orders.findMany({
      where: eq(ordersTable.userId, userId),
    });
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return await db.query.orders.findFirst({
      where: eq(ordersTable.id, id),
    });
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(ordersTable).values(order).returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await db.update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id))
      .returning();
    return result[0];
  }

  async updateOrderPayment(id: string, paymentId: string, paymentStatus: string): Promise<Order | undefined> {
    const result = await db.update(ordersTable)
      .set({ paymentId, paymentStatus })
      .where(eq(ordersTable.id, id))
      .returning();
    return result[0];
  }

  // ======================= TRANSAÇÕES MERCADO PAGO =======================
  async createMpTransaction(transaction: InsertMpTransaction): Promise<MpTransaction> {
    const result = await db.insert(mpTransactionsTable).values(transaction).returning();
    return result[0];
  }

  async getMpTransaction(paymentId: string): Promise<MpTransaction | undefined> {
    return await db.query.mpTransactions.findFirst({
      where: eq(mpTransactionsTable.paymentId, paymentId),
    });
  }

  async updateMpTransaction(paymentId: string, data: Partial<MpTransaction>): Promise<MpTransaction | undefined> {
    const result = await db.update(mpTransactionsTable)
      .set(data)
      .where(eq(mpTransactionsTable.paymentId, paymentId))
      .returning();
    return result[0];
  }
}

export const storage = new DrizzleStorage();
