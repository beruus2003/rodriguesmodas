export interface CartItemWithProduct {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  selectedColor: string;
  selectedSize: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    description: string;
    price: string;
    category: string;
    images: string[];
    colors: string[];
    sizes: string[];
    stock: number;
    isActive: boolean;
    createdAt: Date;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
}

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
