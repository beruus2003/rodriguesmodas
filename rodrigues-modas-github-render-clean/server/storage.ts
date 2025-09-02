import { db } from './db';
import { 
  products as productsTable,
  users as usersTable,
  cartItems as cartItemsTable,
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
import { eq, and, inArray } from "drizzle-orm";
import type { IStorage } from './storage.interface';

class DrizzleStorage implements IStorage {
  // --- Funções de User e Product (sem alterações) ---
  async getUserByEmail(email: string): Promise<User | undefined> { return await db.query.users.findFirst({ where: eq(usersTable.email, email.toLowerCase()) }); }
  async getUserByVerificationToken(token: string): Promise<User | undefined> { return await db.query.users.findFirst({ where: eq(usersTable.verificationToken, token) }); }
  async createUser(user: InsertUser): Promise<User> { const result = await db.insert(usersTable).values({ ...user, email: user.email.toLowerCase() }).returning(); return result[0]; }
  async verifyUser(id: string): Promise<User | undefined> { const result = await db.update(usersTable).set({ emailVerified: new Date(), verificationToken: null }).where(eq(usersTable.id, id)).returning(); return result[0]; }
  async getProducts(): Promise<Product[]> { return await db.query.products.findMany({ where: eq(productsTable.isActive, true) }); }
  async getProduct(id: string): Promise<Product | undefined> { return await db.query.products.findFirst({ where: eq(productsTable.id, id) }); }
  async getProductsByCategory(category: string): Promise<Product[]> { return await db.query.products.findMany({ where: eq(productsTable.category, category) }); }
  async createProduct(product: InsertProduct): Promise<Product> { const result = await db.insert(productsTable).values(product).returning(); return result[0]; }
  async updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined> { const result = await db.update(productsTable).set(product).where(eq(productsTable.id, id)).returning(); return result[0]; }
  async deleteProduct(id: string): Promise<boolean> { const result = await db.delete(productsTable).where(eq(productsTable.id, id)).returning({ id: productsTable.id }); return result.length > 0; }

  // --- Funções do Carrinho ---
  
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const items = await db.query.cartItems.findMany({
        where: eq(cartItemsTable.userId, userId),
        with: { product: true },
        orderBy: (cartItems, { asc }) => [asc(cartItems.createdAt)],
    });
    return items;
  }
  
  async addToCart(item: InsertCartItem): Promise<CartItem> {
    if (!item.userId || !item.productId || !item.quantity || !item.selectedSize || !item.selectedColor) {
      throw new Error("Dados insuficientes para adicionar ao carrinho.");
    }
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItemsTable.userId, item.userId),
        eq(cartItemsTable.productId, item.productId),
        eq(cartItemsTable.selectedSize, item.selectedSize),
        eq(cartItemsTable.selectedColor, item.selectedColor)
      )
    });
    if (existingItem) {
      const newQuantity = existingItem.quantity + item.quantity;
      const updatedItems = await db.update(cartItemsTable).set({ quantity: newQuantity }).where(eq(cartItemsTable.id, existingItem.id)).returning();
      return updatedItems[0];
    } else {
      const newItems = await db.insert(cartItemsTable).values(item).returning();
      return newItems[0];
    }
  }

  // ======================= NOVAS FUNÇÕES IMPLEMENTADAS AQUI =======================
  
  async updateCartItem(itemId: string, quantity: number): Promise<CartItem | undefined> {
    const updatedItems = await db.update(cartItemsTable)
      .set({ quantity })
      .where(eq(cartItemsTable.id, itemId))
      .returning();
    return updatedItems[0];
  }

  async removeFromCart(itemId: string): Promise<CartItem | undefined> {
    const removedItems = await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.id, itemId))
      .returning();
    return removedItems[0];
  }

  // ==============================================================================

  // --- MÉTODOS AINDA NÃO IMPLEMENTADOS ---
  async getUser(id: string) { throw new Error("Method not implemented."); }
  async updateUser(id: string, user: any) { throw new Error("Method not implemented."); }
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
