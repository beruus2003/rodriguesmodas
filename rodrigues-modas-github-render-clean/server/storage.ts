import { 
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
import { randomUUID } from "crypto";

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

  // Transações Mercado Pago
  createMpTransaction(transaction: InsertMpTransaction): Promise<MpTransaction>;
  getMpTransaction(paymentId: string): Promise<MpTransaction | undefined>;
  updateMpTransaction(paymentId: string, data: Partial<MpTransaction>): Promise<MpTransaction | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private cartItems: Map<string, CartItem> = new Map();
  private orders: Map<string, Order> = new Map();
  private mpTransactions: Map<string, MpTransaction> = new Map();

  constructor() {
    // Dados iniciais para demonstração
    this.seedData();
  }

  private seedData() {
    // Usuário admin padrão
    const adminUser: User = {
      id: randomUUID(),
      email: "contact.rodriguesmoda@gmail.com",
      name: "Camila567",
      phone: "+55 85 99180-2352",
      role: "admin",
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Usuário de teste para checkout
    const testUser: User = {
      id: "test-user-id",
      email: "teste@rodriguesmodas.com",
      name: "Cliente Teste",
      phone: "+55 85 99180-2352",
      role: "customer",
      createdAt: new Date(),
    };
    this.users.set(testUser.id, testUser);

    // Produtos de exemplo
    const sampleProducts: Product[] = [
      {
        id: randomUUID(),
        name: "Sutiã Renda Delicata",
        description: "Sutiã em renda francesa com bojo estruturado, perfeito para o dia a dia",
        price: "89.90",
        category: "sutias",
        images: ["/assets/IMG_1425_1754846586831.png"],
        colors: ["Rosa", "Branco", "Preto"],
        sizes: ["P", "M", "G", "GG"],
        stock: 15,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Calcinha Comfort Cotton",
        description: "Calcinha em algodão orgânico, sem costuras, máximo conforto",
        price: "45.90",
        category: "calcinhas",
        images: ["/assets/IMG_1426_1754846610570.png"],
        colors: ["Cinza", "Rosa", "Azul"],
        sizes: ["P", "M", "G", "GG"],
        stock: 8,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Camisola Silk Dreams",
        description: "Camisola em cetim com detalhes em renda, elegante e confortável",
        price: "129.90",
        category: "camisolas",
        images: ["/assets/IMG_1427_1754846634334.png"],
        colors: ["Champagne", "Roxo", "Vermelho"],
        sizes: ["P", "M", "G", "GG"],
        stock: 5,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Conjunto Luxury Lace",
        description: "Conjunto completo em renda francesa premium, sofisticação absoluta",
        price: "199.90",
        category: "conjuntos",
        images: ["/assets/IMG_1428_1754846651752.webp"],
        colors: ["Preto", "Vermelho", "Roxo"],
        sizes: ["P", "M", "G", "GG"],
        stock: 3,
        isActive: true,
        createdAt: new Date(),
      },
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
    });
  }

  // Usuários
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      phone: insertUser.phone || null,
      role: insertUser.role || "customer",
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Produtos
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.category === category && p.isActive);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct,
      colors: insertProduct.colors || [],
      sizes: insertProduct.sizes || [],
      images: insertProduct.images || [],
      id, 
      createdAt: new Date() 
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Carrinho
  async getCartItems(userId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.userId === userId);
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    const id = randomUUID();
    const cartItem: CartItem = { 
      ...insertCartItem,
      quantity: insertCartItem.quantity || 1,
      id, 
      createdAt: new Date() 
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async removeFromCart(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId: string): Promise<boolean> {
    const userItems = Array.from(this.cartItems.entries())
      .filter(([_, item]) => item.userId === userId)
      .map(([id]) => id);
    
    userItems.forEach(id => this.cartItems.delete(id));
    return true;
  }

  // Pedidos
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = { 
      ...insertOrder, 
      id, 
      status: "pending",
      paymentStatus: "pending",
      mpPaymentId: null,
      createdAt: new Date() 
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async updateOrderPayment(id: string, paymentId: string, paymentStatus: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, mpPaymentId: paymentId, paymentStatus };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Transações Mercado Pago
  async createMpTransaction(insertTransaction: InsertMpTransaction): Promise<MpTransaction> {
    const id = randomUUID();
    const transaction: MpTransaction = { 
      ...insertTransaction,
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mpTransactions.set(insertTransaction.paymentId, transaction);
    return transaction;
  }

  async getMpTransaction(paymentId: string): Promise<MpTransaction | undefined> {
    return this.mpTransactions.get(paymentId);
  }

  async updateMpTransaction(paymentId: string, data: Partial<MpTransaction>): Promise<MpTransaction | undefined> {
    const transaction = this.mpTransactions.get(paymentId);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...data, updatedAt: new Date() };
    this.mpTransactions.set(paymentId, updatedTransaction);
    return updatedTransaction;
  }
}

export const storage = new MemStorage();
