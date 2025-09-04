import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuários com role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("customer"), // "customer" | "admin"
  createdAt: timestamp("created_at").defaultNow(),
});

// Produtos
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // "sutias", "calcinhas", "conjuntos", "camisolas"
  images: jsonb("images").$type<string[]>().default([]), // URLs das imagens
  colors: jsonb("colors").$type<string[]>().default([]), // Cores disponíveis
  sizes: jsonb("sizes").$type<string[]>().default([]), // Tamanhos disponíveis
  stock: integer("stock").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Itens do carrinho
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  selectedColor: text("selected_color").notNull(),
  selectedSize: text("selected_size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pedidos
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // "pending", "confirmed", "shipped", "delivered", "cancelled"
  paymentMethod: text("payment_method", { 
    enum: ["credit_card", "debit_card", "pix", "whatsapp"] 
  }).notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending", "approved", "rejected", "cancelled"
  total: decimal("total", { precision: 10, scale: 2 }).notNull().$type<string>(),
  customerInfo: jsonb("customer_info").$type<{
    name: string;
    email: string;
    phone: string;
  }>().notNull(),
  items: jsonb("items").$type<Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedColor: string;
    selectedSize: string;
  }>>().notNull(),
  mpPaymentId: text("mp_payment_id"), // ID do pagamento no Mercado Pago
  createdAt: timestamp("created_at").defaultNow(),
});

// Transações do Mercado Pago
export const mpTransactions = pgTable("mp_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  paymentId: text("payment_id").notNull().unique(), // ID do pagamento no MP
  status: text("status").notNull(), // approved, pending, rejected, cancelled
  statusDetail: text("status_detail"), // Detalhe do status
  paymentMethod: text("payment_method").notNull(), // credit_card, debit_card, pix
  paymentTypeId: text("payment_type_id"), // Tipo específico (visa, master, etc)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionData: jsonb("transaction_data").$type<any>().default({}), // Dados completos da transação
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Esquemas de inserção
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  phone: true,
  role: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  category: true,
  images: true,
  colors: true,
  sizes: true,
  stock: true,
  isActive: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  userId: true,
  productId: true,
  quantity: true,
  selectedColor: true,
  selectedSize: true,
});

// Schema mais flexível para pedidos
export const insertOrderSchema = z.object({
  userId: z.string(),
  paymentMethod: z.enum(["credit_card", "debit_card", "pix", "whatsapp"]),
  total: z.union([z.number(), z.string()]).transform(val => String(val)),
  customerInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    selectedColor: z.string(),
    selectedSize: z.string(),
  })),
});

export const insertMpTransactionSchema = createInsertSchema(mpTransactions).pick({
  orderId: true,
  paymentId: true,
  status: true,
  statusDetail: true,
  paymentMethod: true,
  paymentTypeId: true,
  amount: true,
  transactionData: true,
});

// Tipos
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type MpTransaction = typeof mpTransactions.$inferSelect;
export type InsertMpTransaction = z.infer<typeof insertMpTransactionSchema>;
