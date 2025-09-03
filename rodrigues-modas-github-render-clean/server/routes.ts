import express from "express";
import { storage } from "./storage";

const router = express.Router();

// =======================
// ROTAS DE USUÁRIO
// =======================
router.post("/register", async (req, res) => {
  try {
    const user = await storage.createUser(req.body);
    res.json(user);
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }
    res.json(user);
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

// =======================
// ROTAS DE PRODUTOS
// =======================
router.get("/products", async (_req, res) => {
  try {
    const products = await storage.getProducts();
    res.json(products);
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const product = await storage.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "Produto não encontrado" });
    res.json(product);
  } catch (err) {
    console.error("Erro ao buscar produto:", err);
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

// =======================
// ROTAS DE CARRINHO
// =======================
router.get("/cart/:userId", async (req, res) => {
  try {
    const items = await storage.getCartItems(req.params.userId);

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({ items, total });
  } catch (err) {
    console.error("Erro ao buscar carrinho:", err);
    res.status(500).json({ error: "Erro ao buscar carrinho" });
  }
});

router.post("/cart/add", async (req, res) => {
  try {
    const item = await storage.addToCart(req.body);
    res.json(item);
  } catch (err) {
    console.error("Erro ao adicionar ao carrinho:", err);
    res.status(500).json({ error: "Erro ao adicionar ao carrinho" });
  }
});

router.delete("/cart/remove/:id", async (req, res) => {
  try {
    await storage.removeCartItem(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao remover item do carrinho:", err);
    res.status(500).json({ error: "Erro ao remover item do carrinho" });
  }
});

router.delete("/cart/clear/:userId", async (req, res) => {
  try {
    await storage.clearCart(req.params.userId);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao limpar carrinho:", err);
    res.status(500).json({ error: "Erro ao limpar carrinho" });
  }
});

// =======================
// ROTAS DE PEDIDOS
// =======================
router.post("/orders", async (req, res) => {
  try {
    const order = await storage.createOrder(req.body);
    res.json(order);
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    res.status(500).json({ error: "Erro ao criar pedido" });
  }
});

router.get("/orders/:userId", async (req, res) => {
  try {
    const orders = await storage.getUserOrders(req.params.userId);
    res.json(orders);
  } catch (err) {
    console.error("Erro ao buscar pedidos:", err);
    res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

// =======================
// ROTAS DE TRANSAÇÕES (MERCADO PAGO)
// =======================
router.post("/mp/transactions", async (req, res) => {
  try {
    const tx = await storage.createTransaction(req.body);
    res.json(tx);
  } catch (err) {
    console.error("Erro ao criar transação:", err);
    res.status(500).json({ error: "Erro ao criar transação" });
  }
});

router.get("/mp/transactions/:paymentId", async (req, res) => {
  try {
    const tx = await storage.getTransactionByPaymentId(req.params.paymentId);
    if (!tx) return res.status(404).json({ error: "Transação não encontrada" });
    res.json(tx);
  } catch (err) {
    console.error("Erro ao buscar transação:", err);
    res.status(500).json({ error: "Erro ao buscar transação" });
  }
});

router.put("/mp/transactions/:paymentId/status", async (req, res) => {
  try {
    await storage.updateTransactionStatus(req.params.paymentId, req.body.status);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao atualizar transação:", err);
    res.status(500).json({ error: "Erro ao atualizar transação" });
  }
});

// =======================
// EXPORTAR PARA O SERVER
// =======================
export function registerRoutes(app: any) {
  app.use("/api", router);
}
