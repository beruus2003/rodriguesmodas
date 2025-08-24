import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertCartItemSchema, insertMpTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { mercadoPagoService, type PaymentData } from "./mercadopago";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Produtos
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

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar produto" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.json({ message: "Produto removido com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover produto" });
    }
  });

  // Carrinho
  app.get("/api/cart/:userId", async (req, res) => {
    try {
      const cartItems = await storage.getCartItems(req.params.userId);
      
      // Enriquecer com dados do produto
      const enrichedItems = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            product
          };
        })
      );
      
      res.json(enrichedItems);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar carrinho" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao adicionar ao carrinho" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      if (!cartItem) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const success = await storage.removeFromCart(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      res.json({ message: "Item removido do carrinho" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover item" });
    }
  });

  app.delete("/api/cart/user/:userId", async (req, res) => {
    try {
      await storage.clearCart(req.params.userId);
      res.json({ message: "Carrinho limpo com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao limpar carrinho" });
    }
  });

  // Pedidos
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });

  app.get("/api/orders/user/:userId", async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.params.userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos do usuário" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      console.log("📝 Dados recebidos para pedido:", JSON.stringify(req.body, null, 2));
      console.log("🔍 Schema esperado:", insertOrderSchema._def);
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      
      // Limpar carrinho após criar pedido
      await storage.clearCart(validatedData.userId);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("❌ Erro de validação detalhado:");
        error.errors.forEach((err, index) => {
          console.log(`  ${index + 1}. Campo: ${err.path.join('.')} | Erro: ${err.message} | Valor recebido:`, err.received);
        });
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("❌ Erro ao criar pedido:", error);
      res.status(500).json({ message: "Erro ao criar pedido" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar status do pedido" });
    }
  });

  // Usuários
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.get("/api/users/email/:email", async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  // ==================== MERCADO PAGO ROUTES ====================

  // Schema para validação de pagamento
  const paymentSchema = z.object({
    orderId: z.string(),
    paymentMethod: z.enum(['credit_card', 'debit_card', 'pix']),
    amount: z.number().positive(),
    payer: z.object({
      email: z.string().email(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      identification: z.object({
        type: z.string(),
        number: z.string(),
      }).optional(),
    }),
    cardData: z.object({
      token: z.string(),
      issuer_id: z.number().optional(),
      payment_method_id: z.string(),
      installments: z.number(),
    }).optional(),
  });

  // Obter métodos de pagamento
  app.get("/api/payment/methods", async (req, res) => {
    try {
      const methods = await mercadoPagoService.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      console.error('Erro ao buscar métodos:', error);
      res.status(500).json({ message: "Erro ao buscar métodos de pagamento" });
    }
  });

  // Obter emissores de cartão
  app.get("/api/payment/card_issuers", async (req, res) => {
    try {
      const { payment_method_id, bin } = req.query;
      
      if (!payment_method_id || !bin) {
        return res.status(400).json({ message: "payment_method_id e bin são obrigatórios" });
      }

      const issuers = await mercadoPagoService.getCardIssuers(
        payment_method_id as string, 
        bin as string
      );
      res.json(issuers);
    } catch (error) {
      console.error('Erro ao buscar emissores:', error);
      res.status(500).json({ message: "Erro ao buscar emissores de cartão" });
    }
  });

  // Obter parcelas disponíveis
  app.get("/api/payment/installments", async (req, res) => {
    try {
      const { payment_method_id, amount, issuer_id } = req.query;
      
      if (!payment_method_id || !amount) {
        return res.status(400).json({ message: "payment_method_id e amount são obrigatórios" });
      }

      const installments = await mercadoPagoService.getInstallments(
        payment_method_id as string, 
        Number(amount),
        issuer_id ? Number(issuer_id) : undefined
      );
      res.json(installments);
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
      res.status(500).json({ message: "Erro ao buscar parcelas" });
    }
  });

  // Processar pagamento
  app.post("/api/payment/process", async (req, res) => {
    try {
      const validatedData = paymentSchema.parse(req.body);
      const { orderId, paymentMethod, amount, payer, cardData } = validatedData;

      // Verificar se o pedido existe
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Preparar dados de pagamento
      const paymentData: PaymentData = {
        amount,
        email: payer.email,
        description: `Pedido #${orderId.substring(0, 8)} - Rodrigues Modas`,
        paymentMethod,
        payer,
        cardData,
      };

      let paymentResult;

      // Processar pagamento baseado no método
      if (paymentMethod === 'pix') {
        paymentResult = await mercadoPagoService.processPixPayment(paymentData);
      } else {
        if (!cardData) {
          return res.status(400).json({ message: "Dados do cartão são obrigatórios" });
        }
        paymentResult = await mercadoPagoService.processCardPayment(paymentData);
      }

      // Salvar transação
      const transaction = await storage.createMpTransaction({
        orderId,
        paymentId: paymentResult.id.toString(),
        status: paymentResult.status,
        statusDetail: paymentResult.status_detail,
        paymentMethod: paymentResult.payment_method_id,
        paymentTypeId: paymentResult.payment_type_id,
        amount: paymentResult.transaction_amount.toString(),
        transactionData: paymentResult,
      });

      // Atualizar pedido com informações de pagamento
      await storage.updateOrderPayment(
        orderId,
        paymentResult.id.toString(),
        paymentResult.status === 'approved' ? 'approved' : 'pending'
      );

      res.json({
        success: true,
        paymentId: paymentResult.id,
        status: paymentResult.status,
        statusDetail: paymentResult.status_detail,
        ...(paymentMethod === 'pix' && paymentResult.point_of_interaction?.transaction_data && {
          qrCode: paymentResult.point_of_interaction.transaction_data.qr_code,
          qrCodeBase64: paymentResult.point_of_interaction.transaction_data.qr_code_base64,
          ticketUrl: paymentResult.point_of_interaction.transaction_data.ticket_url,
        }),
      });

    } catch (error) {
      console.error('Erro no processamento:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro ao processar pagamento" });
    }
  });

  // Consultar status do pagamento
  app.get("/api/payment/:paymentId/status", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const paymentStatus = await mercadoPagoService.getPaymentStatus(paymentId);
      
      // Atualizar transação local
      await storage.updateMpTransaction(paymentId, {
        status: paymentStatus.status,
        statusDetail: paymentStatus.status_detail,
        transactionData: paymentStatus,
      });

      res.json({
        id: paymentStatus.id,
        status: paymentStatus.status,
        statusDetail: paymentStatus.status_detail,
        paymentMethodId: paymentStatus.payment_method_id,
        paymentTypeId: paymentStatus.payment_type_id,
        transactionAmount: paymentStatus.transaction_amount,
        dateCreated: paymentStatus.date_created,
        dateApproved: paymentStatus.date_approved,
      });

    } catch (error) {
      console.error('Erro ao consultar pagamento:', error);
      res.status(500).json({ message: "Erro ao consultar status do pagamento" });
    }
  });

  // Webhook para receber notificações do Mercado Pago
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      const { id, topic } = req.body;
      
      if (topic === 'payment') {
        // Consultar o pagamento atualizado
        const paymentStatus = await mercadoPagoService.getPaymentStatus(id.toString());
        
        // Atualizar transação local
        const transaction = await storage.updateMpTransaction(id.toString(), {
          status: paymentStatus.status,
          statusDetail: paymentStatus.status_detail,
          transactionData: paymentStatus,
        });

        if (transaction) {
          // Atualizar status do pedido
          const order = await storage.getOrder(transaction.orderId);
          if (order) {
            await storage.updateOrderPayment(
              transaction.orderId,
              id.toString(),
              paymentStatus.status === 'approved' ? 'approved' : 
              paymentStatus.status === 'rejected' ? 'rejected' : 'pending'
            );
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Erro no webhook:', error);
      res.status(500).json({ message: "Erro ao processar webhook" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
