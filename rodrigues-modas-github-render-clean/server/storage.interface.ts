// server/storage.interface.ts
import type { 
  User, InsertUser, Product, InsertProduct, CartItem, InsertCartItem, 
  Order, InsertOrder, MpTransaction, InsertMpTransaction 
} from "@shared/schema";

export interface IStorage {
  // Usuários
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  // Produtos
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  // Carrinho
  getCartItems(userId: string): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  // Pedidos
  getOrders(): Promise<Order[]>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrderPayment(id: string, paymentId: string, paymentStatus: string): Promise<Order | undefined>;
  // Transações
  createMpTransaction(transaction: InsertMpTransaction): Promise<MpTransaction>;
  getMpTransaction(paymentId: string): Promise<MpTransaction | undefined>;
  updateMpTransaction(paymentId: string, data: Partial<MpTransaction>): Promise<MpTransaction | undefined>;
}
