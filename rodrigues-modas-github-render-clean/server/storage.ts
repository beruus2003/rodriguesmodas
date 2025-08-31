// server/storage.ts
import { db } from './db'; // Nossa conexão com o banco de dados Neon
import { 
  products as productsTable,
  users as usersTable,
  carts as cartsTable, // Adicionei a importação da tabela de carrinhos
  cartItems as cartItemsTable, // Adicionei a importação dos itens do carrinho
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Cart,
  type InsertCart,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type MpTransaction,
  type InsertMpTransaction
} from "@shared/schema";
import { eq, and } from "drizzle-orm"; // Adicionei o operador "and"
import type { IStorage } from './storage.interface'; // O "contrato" que criamos

class DrizzleStorage implements IStorage {
  // --- USUÁRIOS ---
  async getUserByEmail(email: string): Promise<User | undefined> {
    return await db.query.users.findFirst({ where: eq(usersTable.email, email.toLowerCase()) });
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return await db.query.users.findFirst({ where: eq(usersTable.verificationToken, token) });
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(usersTable).values({ ...user, email: user.email.toLowerCase() }).returning();
    return result[0];
  }

  async verifyUser(id: string): Promise<User | undefined> {
    const result = await db.update(usersTable).set({ emailVerified: new Date(), verificationToken: null }).where(eq(usersTable.id, id)).returning();
    return result[0];
  }

  // --- PRODUTOS ---
  async getProducts(): Promise<Product[]> {
    const products = await db.query.products.findMany({ where: eq(productsTable.isActive, true) });
    return products;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return await db.query.products.findFirst({ where: eq(productsTable.id, id) });
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.query.products.findMany({ where: eq(productsTable.category, category) });
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(productsTable).values(product).returning();
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

  // ======================= NOVAS FUNÇÕES IMPLEMENTADAS AQUI =======================
  // --- CARRINHO ---

  /**
   * Adiciona um item ao carrinho de um usuário.
   * Se o carrinho não existir, ele é criado.
   * Se o item (mesmo produto, tamanho e cor) já existir no carrinho, a quantidade é somada.
   * Se o item não existir, ele é criado.
   */
  async addToCart(item: InsertCartItem): Promise<CartItem> {
    if (!item.userId || !item.productId || !item.quantity || !item.size || !item.color) {
      throw new Error("Dados insuficientes para adicionar ao carrinho (userId, productId, quantity, size, color).");
    }
  
    // 1. Encontra ou cria o carrinho principal do usuário
    let userCart = await db.query.carts.findFirst({ where: eq(cartsTable.userId, item.userId) });
  
    if (!userCart) {
      const newCartResult = await db.insert(cartsTable).values({ userId: item.userId }).returning();
      userCart = newCartResult[0];
    }
    
    if (!userCart) throw new Error("Não foi possível criar ou encontrar o carrinho do usuário.");
  
    // 2. Verifica se o item exato já existe no carrinho
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItemsTable.cartId, userCart.id),
        eq(cartItemsTable.productId, item.productId),
        eq(cartItemsTable.size, item.size),
        eq(cartItemsTable.color, item.color)
      )
    });
  
    // 3. Se existir, atualiza a quantidade. Se não, insere um novo.
    if (existingItem) {
      const newQuantity = existingItem.quantity + item.quantity;
      const updatedItems = await db.update(cartItemsTable)
        .set({ quantity: newQuantity })
        .where(eq(cartItemsTable.id, existingItem.id))
        .returning();
      return updatedItems[0];
    } else {
      const newItems = await db.insert(cartItemsTable).values({
        cartId: userCart.id,
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }).returning();
      return newItems[0];
    }
  }

  /**
   * Busca todos os itens do carrinho de um usuário, já com os dados dos produtos.
   */
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const userCart = await db.query.carts.findFirst({
        where: eq(cartsTable.userId, userId)
    });

    if (!userCart) {
        return []; // Se o usuário não tem carrinho, retorna um array vazio.
    }

    const items = await db.query.cartItems.findMany({
        where: eq(cartItemsTable.cartId, userCart.id),
        with: {
            product: true // Mágica do Drizzle: busca os dados do produto relacionado automaticamente!
        },
        orderBy: (cartItems, { asc }) => [asc(cartItems.createdAt)],
    });

    return items;
  }


  // --- MÉTODOS AINDA NÃO IMPLEMENTADOS ---
  async getUser(id: string) { throw new Error("Method not implemented."); }
  async updateUser(id: string, user: any) { throw new Error("Method not implemented."); }
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
