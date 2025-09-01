import { sql, relations } from "drizzle-orm"; // 1. Importar 'relations'
import { pgTable, text, varchar, decimal, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password"),
  phone: text("phone"),
  role: text("role").notNull().default("customer"),
  emailVerified: timestamp("email_verified"),
  verificationToken: text("verification_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  colors: jsonb("colors").$type<string[]>().default([]),
  sizes: jsonb("sizes").$type<string[]>().default([]),
  stock: integer("stock").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  selectedColor: text("selected_color").notNull(),
  selectedSize: text("selected_size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  // ... (seu schema de orders continua igual)
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method", { enum: ["credit_card", "debit_card", "pix", "whatsapp"] }).notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().$type<string>(),
  customerInfo: jsonb("customer_info").$type<{ name: string; email: string; phone: string; }>().notNull(),
  items: jsonb("items").$type<Array<{ productId: string; name: string; price: number; quantity: number; selectedColor: string; selectedSize: string; }>>().notNull(),
  mpPaymentId: text("mp_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mpTransactions = pgTable("mp_transactions", {
  // ... (seu schema de transactions continua igual)
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  paymentId: text("payment_id").notNull().unique(),
  status: text("status").notNull(),
  statusDetail: text("status_detail"),
  paymentMethod: text("payment_method").notNull(),
  paymentTypeId: text("payment_type_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionData: jsonb("transaction_data").$type<any>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ======================= NOVA SEÇÃO ADICIONADA =======================
// RELAÇÕES
// Aqui definimos o "mapa" para o Drizzle entender como as tabelas se conectam.

export const usersRelations = relations(users, ({ many }) => ({
  cartItems: many(cartItems), // Um usuário pode ter muitos itens no carrinho
}));

export const productsRelations = relations(products, ({ many }) => ({
  cartItems: many(cartItems), // Um produto pode estar em muitos itens de carrinho
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  // Um item de carrinho pertence a UM usuário
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  // Um item de carrinho se refere a UM produto
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));
// ======================= FIM DA NOVA SEÇÃO =======================

// --- Esquemas de inserção e tipos (continuam iguais) ---
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email({ message: "E-mail inválido" }),
  name: z.string().min(3, { message: "Nome precisa ter pelo menos 3 caracteres" }),
  password: z.string().min(6, { message: "Senha precisa ter pelo menos 6 caracteres" }),
}).pick({ email: true, name: true, password: true, phone: true, role: true, verificationToken: true });

export const insertProductSchema = createInsertSchema(products).pick({ name: true, description: true, price: true, category: true, images: true, colors: true, sizes: true, stock: true, isActive: true });
export const insertCartItemSchema = createInsertSchema(cartItems).pick({ userId: true, productId: true, quantity: true, selectedColor: true, selectedSize: true });
export const insertOrderSchema = z.object({ userId: z.string(), paymentMethod: z.enum(["credit_card", "debit_card", "pix", "whatsapp"]), total: z.union([z.number(), z.string()]).transform(val => String(val)), customerInfo: z.object({ name: z.string(), email: z.string().email(), phone: z.string() }), items: z.array(z.object({ productId: z.string(), name: z.string(), price: z.number(), quantity: z.number(), selectedColor: z.string(), selectedSize: z.string() })) });
export const insertMpTransactionSchema = createInsertSchema(mpTransactions).pick({ orderId: true, paymentId: true, status: true, statusDetail: true, paymentMethod: true, paymentTypeId: true, amount: true, transactionData: true });

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
