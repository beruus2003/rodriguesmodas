import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'MERCADOPAGO_NODEJS_SDK',
  }
});

const payment = new Payment(client);

export interface PaymentData {
  amount: number;
  email: string;
  description: string;
  paymentMethod: 'credit_card' | 'debit_card' | 'pix';
  cardData?: {
    token: string;
    issuer_id?: number;
    payment_method_id: string;
    installments: number;
  };
  payer?: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}

export interface PaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  payment_method_id: string;
  payment_type_id: string;
  transaction_amount: number;
  description: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  date_created: string;
  date_approved?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code_base64?: string;
      qr_code?: string;
      ticket_url?: string;
    };
  };
}

export class MercadoPagoService {
  
  // Processar pagamento com cartão de crédito/débito
  async processCardPayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const paymentRequest = {
        transaction_amount: paymentData.amount,
        description: paymentData.description,
        payment_method_id: paymentData.cardData!.payment_method_id,
        token: paymentData.cardData!.token,
        installments: paymentData.cardData!.installments,
        issuer_id: paymentData.cardData!.issuer_id,
        payer: {
          email: paymentData.email,
          first_name: paymentData.payer?.first_name,
          last_name: paymentData.payer?.last_name,
          identification: paymentData.payer?.identification,
        },
      };

      const response = await payment.create({
        body: paymentRequest
      });

      return response as PaymentResponse;
    } catch (error) {
      console.error('Erro no pagamento com cartão:', error);
      throw new Error('Erro ao processar pagamento com cartão');
    }
  }

  // Processar pagamento PIX
  async processPixPayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const paymentRequest = {
        transaction_amount: paymentData.amount,
        description: paymentData.description,
        payment_method_id: 'pix',
        payer: {
          email: paymentData.email,
          first_name: paymentData.payer?.first_name || 'Cliente',
          last_name: paymentData.payer?.last_name || 'Rodrigues Modas',
        },
      };

      const response = await payment.create({
        body: paymentRequest
      });

      return response as PaymentResponse;
    } catch (error) {
      console.error('Erro no pagamento PIX:', error);
      throw new Error('Erro ao processar pagamento PIX');
    }
  }

  // Consultar status do pagamento
  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await payment.get({
        id: paymentId
      });

      return response as PaymentResponse;
    } catch (error) {
      console.error('Erro ao consultar pagamento:', error);
      throw new Error('Erro ao consultar status do pagamento');
    }
  }

  // Obter métodos de pagamento disponíveis
  async getPaymentMethods() {
    try {
      // Para testes, retornar métodos fixos sem chamar a API
      return [
        {
          id: "visa",
          name: "Visa",
          payment_type_id: "credit_card",
          status: "active",
          secure_thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
          thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
          deferred_capture: "supported",
          settings: [],
          additional_info_needed: ["cardholder_name", "cardholder_identification_number"]
        },
        {
          id: "master",
          name: "Mastercard", 
          payment_type_id: "credit_card",
          status: "active",
          secure_thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
          thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
          deferred_capture: "supported",
          settings: [],
          additional_info_needed: ["cardholder_name", "cardholder_identification_number"]
        },
        {
          id: "elo",
          name: "Elo",
          payment_type_id: "credit_card", 
          status: "active",
          secure_thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/elo.gif",
          thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/elo.gif",
          deferred_capture: "supported",
          settings: [],
          additional_info_needed: ["cardholder_name", "cardholder_identification_number"]
        }
      ];
    } catch (error) {
      console.error('Erro ao buscar métodos de pagamento:', error);
      throw new Error('Erro ao buscar métodos de pagamento');
    }
  }

  // Obter informações do emissor do cartão
  async getCardIssuers(paymentMethodId: string, bin: string) {
    try {
      const response = await fetch(
        `https://api.mercadopago.com/v1/payment_methods/card_issuers?payment_method_id=${paymentMethodId}&bin=${bin}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar emissores do cartão');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar emissores:', error);
      throw new Error('Erro ao buscar emissores do cartão');
    }
  }

  // Obter parcelas disponíveis
  async getInstallments(paymentMethodId: string, amount: number, issuerId?: number) {
    try {
      let url = `https://api.mercadopago.com/v1/payment_methods/installments?payment_method_id=${paymentMethodId}&amount=${amount}`;
      if (issuerId) {
        url += `&issuer_id=${issuerId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar parcelas');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
      throw new Error('Erro ao buscar parcelas');
    }
  }
}

export const mercadoPagoService = new MercadoPagoService();