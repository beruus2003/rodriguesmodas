import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertCartItemSchema, insertMpTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { mercadoPagoService, type PaymentData } from "./mercadopago";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {

  const uploadDir = path.resolve(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage: multerStorage });

  // Autenticação - ROTA DE LOGIN RESTAURADA
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if ((email === "Camila567" || email === "camila567") && password === "Marialuiza0510") {
        const authUser = {
          id: "admin-camila",
          email: "contact.rodriguesmoda@gmail.com",
          name: "Camila - Proprietária",
          phone: "+55 85 99180-2352",
          role: "admin",
        };
        return res.json({ success: true, user: authUser });
      }
      res.status(401).json({ success: false, message: "Credenciais inválidas" });
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ success: false, message: "Erro no servidor" });
    }
  });

  // ROTA DE CRIAÇÃO DE PRODUTO TRANSFORMADA EM "ECO"
  app.post("/api/products", upload.array('image', 10), async (req, res) => {
      
      // ======================= CÓDIGO DE DIAGNÓSTICO =======================
      // A linha abaixo vai interromper o processo e devolver exatamente
      // o que o servidor recebeu do seu formulário.
      console.log("DADOS RECEBIDOS PELO SERVIDOR:", req.body);
      res.status(418).json({
          message: "DEBUG: Estes são os dados que o servidor recebeu no req.body.",
          body_recebido: req.body
      });
      return; 
      // ======================= FIM DO DIAGNÓSTICO =======================
  });


  // --- O RESTANTE DAS SUAS ROTAS ORIGINAIS PARA O SITE CONTINUAR FUNCIONANDO ---

  app.get("/api/products", async (req, res) => {
    try {
      const { category } = req.query;
      let products;
      if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else {
        products = await storage.getProducts();
      }
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.json(product);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ message: "Erro ao buscar produto" });
    }
  });
  
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });
  
  // As outras rotas (PATCH, DELETE, etc.) foram omitidas aqui para manter a clareza,
  // mas o importante é que a de LOGIN e as de GET estão presentes para o painel funcionar.
  // O restante do seu arquivo original pode ser mantido se necessário.

  const httpServer = createServer(app);
  return httpServer;
}
