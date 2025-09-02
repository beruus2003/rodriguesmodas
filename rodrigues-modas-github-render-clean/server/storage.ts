import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users as usersTable,
  cartItems as cartItemsTable,
  products as productsTable,
  type InsertUser,
  type InsertCartItem,
  type InsertProduct,
  type User,
  type CartItem,
  type Product,
} from "@shared/schema";

export const storage = {
  // ========== USERS ==========
  async createUser(user: InsertUser) {
    const created = await db.insert(usersTable).values(user).returning();
    return created[0];
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return rows[0];
  },

  async getUserById(id: string): Promise<User | undefined> {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return rows[0];
  },

  // ========== CART ==========
  async addToCart(item: InsertCartItem) {
    const created = await db.insert(cartItemsTable).values(item).returning();
    return created[0];
  },

  async getCartItems(userId: string): Promise<CartItem[]> {
    return db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  },

  async updateCartItem(id: string, quantity: number) {
    const updated = await db
      .update(cartItemsTable)
      .set({ quantity })
      .where(eq(cartItemsTable.id, id))
      .returning();
    return updated[0];
  },

  async removeFromCart(id: string) {
    const deleted = await db.delete(cartItemsTable).where(eq(cartItemsTable.id, id)).returning();
    return deleted.length > 0;
  },

  async clearCart(userId: string) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));
    return true;
  },

  // ========== PRODUCTS ==========
  async createProduct(product: InsertProduct): Promise<Product> {
    const created = await db.insert(productsTable).values(product).returning();
    return created[0];
  },

  async getProducts(): Promise<Product[]> {
    return db.select().from(productsTable);
  },

  async getProductById(id: string): Promise<Product | undefined> {
    const rows = await db.select().from(productsTable).where(eq(productsTable.id, id));
    return rows[0];
  },

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const updated = await db.update(productsTable).set(product).where(eq(productsTable.id, id)).returning();
    return updated[0];
  },

  async deleteProduct(id: string): Promise<boolean> {
    const deleted = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();
    return deleted.length > 0;
  },
};
