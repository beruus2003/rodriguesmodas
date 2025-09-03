import { db } from "./db"; // ajuste o caminho se necessário
import { eq, and } from "drizzle-orm";
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
  // --- USUÁRIOS ---
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return result[0];
  }

  async verifyUserEmail(token: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ emailVerified: new Date(), verificationToken: null })
      .where(eq(users.verificationToken, token))
      .returning();
    return result[0];
  }

  // --- PRODUTOS ---
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProductStock(id: string, stock: number): Promise<Product | undefined> {
    const result = await db
      .update(products)
      .set({ stock })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  // --- CARRINHO ---
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const result = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        product: products, // inclui os dados do produto
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    return result.map((row) => ({
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      quantity: row.quantity,
      product: row.product!,
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Verifica se já existe o produto no carrinho do usuário
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId)));

    if (existing[0]) {
      // Atualiza a quantidade
      const newQuantity = existing[0].quantity + item.quantity;
      const updated = await db
        .update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return updated[0];
    } else {
      // Insere novo item
      const result = await db.insert(cartItems).values(item).returning();
      return result[0];
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const result = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return result[0];
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.id, id))
      .returning({ id: cartItems.id });
    return result.length > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.userId, userId))
      .returning({ id: cartItems.id });
    return result.length > 0;
  }

  // --- PEDIDOS ---
  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  // --- TRANSAÇÕES MERCADO PAGO ---
  async createMpTransaction(tx: InsertMpTransaction): Promise<MpTransaction> {
    const result = await db.insert(mpTransactions).values(tx).returning();
    return result[0];
  }

  async getMpTransactionByPaymentId(paymentId: string): Promise<MpTransaction | undefined> {
    const result = await db
      .select()
      .from(mpTransactions)
      .where(eq(mpTransactions.paymentId, paymentId));
    return result[0];
  }

  async updateMpTransactionStatus(paymentId: string, status: string): Promise<MpTransaction | undefined> {
    const result = await db
      .update(mpTransactions)
      .set({ status })
      .where(eq(mpTransactions.paymentId, paymentId))
      .returning();
    return result[0];
  }
}

export const storage = new DrizzleStorage();
