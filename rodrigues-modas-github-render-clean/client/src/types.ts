// Tipos da aplicação

export interface CheckoutData {
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'whatsapp';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedColor: string;
    selectedSize: string;
  }>;
  total: number;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  selectedColor: string;
  selectedSize: string;
  product: {
    id: string;
    name: string;
    price: string;
    images: string[];
    colors: string[];
    sizes: string[];
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin';
}