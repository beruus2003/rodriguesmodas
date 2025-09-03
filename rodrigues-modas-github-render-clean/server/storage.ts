import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users,
  products,
  cartItems,
  orders,
  mpTransactions,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type MpTransaction,
  type InsertMpTransaction,
} from "@shared/schema";

export class DrizzleStorage {
  // ===================== USERS =====================
  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return result;
  }

  // ===================== PRODUCTS =====================
  async createProduct(product: InsertProduct): Promise<Product> {
    const [result] = await db.insert(products).values(product).returning();
    return result;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [result] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return result;
  }

  // ===================== CART =====================
  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const [result] = await db.insert(cartItems).values(item).returning();
    return result;
  }

  async getCartItems(userId: string): Promise<any[]> {
    const result = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        selectedColor: cartItems.selectedColor,
        selectedSize: cartItems.selectedSize,
        createdAt: cartItems.createdAt,
        product: {
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          images: products.images,
          stock: products.stock,
        },
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    return result.map((row) => ({
      ...row,
      subtotal: Number(row.product.price) * row.quantity,
    }));
  }

  async removeCartItem(itemId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // ===================== ORDERS =====================
  async createOrder(order: InsertOrder): Promise<Order> {
    const [result] = await db.insert(orders).values(order).returning();
    return result;
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [result] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return result;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));
  }

  // ===================== MP TRANSACTIONS =====================
  async createTransaction(
    tx: InsertMpTransaction
  ): Promise<MpTransaction> {
    const [result] = await db.insert(mpTransactions).values(tx).returning();
    return result;
  }

  async updateTransactionStatus(
    paymentId: string,
    status: string
  ): Promise<void> {
    await db
      .update(mpTransactions)
      .set({ status })
      .where(eq(mpTransactions.paymentId, paymentId));
  }

  async getTransactionByPaymentId(
    paymentId: string
  ): Promise<MpTransaction | undefined> {
    const [result] = await db
      .select()
      .from(mpTransactions)
      .where(eq(mpTransactions.paymentId, paymentId));
    return result;
  }
}

// Exporta uma instância padrão
export const storage = new DrizzleStorage();
