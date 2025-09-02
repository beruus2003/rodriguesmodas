import express from "express";
import { z } from "zod";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertProductSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertMpTransactionSchema,
} from "@shared/schema";

export const app = express();
app.use(express.json());

/* ==============================
   USUÁRIOS
============================== */
app.post("/api/users", async (req, res) => {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(validatedData);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

app.get("/api/users/:email", async (req, res) => {
  try {
    const user = await storage.getUserByEmail(req.params.email);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Erro ao buscar usuário" });
  }
});

app.get("/api/users/id/:id", async (req, res) => {
  try {
    const user = await storage.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Erro ao buscar usuário" });
  }
});

/* ==============================
   PRODUTOS
============================== */
app.get("/api/products", async (_req, res) => {
  try {
    const products = await storage.getProducts();
    res.json(products);
  } catch {
    res.status(500).json({ message: "Erro ao buscar produtos" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await storage.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: "Produto não encontrado" });
    res.json(product);
  } catch {
    res.status(500).json({ message: "Erro ao buscar produto" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const validatedData = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(validatedData);
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao criar produto" });
  }
});

/* ==============================
   CARRINHO
============================== */
app.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Confere se usuário existe
    const user = await storage.getUserById(userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const cartItems = await storage.getCartItems(userId);
    res.json(cartItems);
  } catch {
    res.status(500).json({ message: "Erro ao buscar carrinho" });
  }
});

app.post("/api/cart", async (req, res) => {
  try {
    console.log("📦 Add to cart body:", req.body);

    const body = {
      ...req.body,
      quantity: Number(req.body.quantity), // garante número
    };

    const validatedData = insertCartItemSchema.parse(body);
    const cartItem = await storage.addToCart(validatedData);
    res.status(201).json(cartItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("❌ Add to cart error:", error);
    res.status(500).json({ message: "Erro ao adicionar ao carrinho" });
  }
});

app.put("/api/cart/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const updatedItem = await storage.updateCartItem(id, Number(quantity));
    if (!updatedItem) return res.status(404).json({ message: "Item não encontrado" });

    res.json(updatedItem);
  } catch {
    res.status(500).json({ message: "Erro ao atualizar item do carrinho" });
  }
});

app.delete("/api/cart/:id", async (req, res) => {
  try {
    const success = await storage.removeFromCart(req.params.id);
    if (!success) return res.status(404).json({ message: "Item não encontrado" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Erro ao remover item do carrinho" });
  }
});

app.delete("/api/cart/user/:userId", async (req, res) => {
  try {
    const success = await storage.clearCart(req.params.userId);
    if (!success) return res.status(404).json({ message: "Carrinho vazio ou usuário não encontrado" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Erro ao limpar carrinho" });
  }
});

/* ==============================
   PEDIDOS
============================== */
app.post("/api/orders", async (req, res) => {
  try {
    const validatedData = insertOrderSchema.parse(req.body);
    const order = await storage.createOrder(validatedData);
    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao criar pedido" });
  }
});

app.get("/api/orders/user/:userId", async (req, res) => {
  try {
    const orders = await storage.getOrdersByUser(req.params.userId);
    res.json(orders);
  } catch {
    res.status(500).json({ message: "Erro ao buscar pedidos" });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await storage.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: "Pedido não encontrado" });
    res.json(order);
  } catch {
    res.status(500).json({ message: "Erro ao buscar pedido" });
  }
});

/* ==============================
   TRANSAÇÕES MERCADO PAGO
============================== */
app.post("/api/mp-transactions", async (req, res) => {
  try {
    const validatedData = insertMpTransactionSchema.parse(req.body);
    const tx = await storage.createMpTransaction(validatedData);
    res.status(201).json(tx);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao criar transação" });
  }
});

app.get("/api/mp-transactions/:paymentId", async (req, res) => {
  try {
    const tx = await storage.getMpTransactionByPaymentId(req.params.paymentId);
    if (!tx) return res.status(404).json({ message: "Transação não encontrada" });
    res.json(tx);
  } catch {
    res.status(500).json({ message: "Erro ao buscar transação" });
  }
});
