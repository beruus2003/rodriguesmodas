import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users as usersTable,
  cartItems as cartItemsTable,
  type InsertUser,
  type InsertCartItem,
  type User,
  type CartItem,
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
};
