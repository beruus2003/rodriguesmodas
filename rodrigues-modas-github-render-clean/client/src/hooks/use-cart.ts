import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { CartItem, CartItemWithProduct, Product } from "../types/index"; // Importamos CartItem
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

const getGuestCartFromStorage = (): CartItemWithProduct[] => {
  if (typeof window === 'undefined') return [];
  try {
    const savedCart = window.localStorage.getItem('guest-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error("Erro ao ler o carrinho do localStorage:", error);
    return [];
  }
};

export function useCart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [guestCart, setGuestCart] = useState<CartItemWithProduct[]>(getGuestCartFromStorage);

  useEffect(() => {
    if (!user) {
      window.localStorage.setItem('guest-cart', JSON.stringify(guestCart));
    }
  }, [guestCart, user]);

  const {
    data: dbCartItems = [],
    isLoading,
    error
  } = useQuery<CartItemWithProduct[]>({ // Mantemos CartItemWithProduct para consistência
    queryKey: ["/api/cart", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/cart/${user!.id}`);
      const items: CartItem[] = await res.json();
      
      // [PARA TESTE] Como a API não retorna mais o produto, criamos um 'product' falso
      // Isso evita que o resto do frontend quebre durante o nosso teste.
      return items.map(item => ({
        ...item,
        product: {
          id: item.productId,
          name: `Produto ${item.productId.substring(0, 4)}...`,
          price: '0.00',
          images: [],
          description: '',
          category: '',
          colors: [],
          sizes: [],
          stock: 0,
          isActive: true,
          createdAt: new Date(),
        }
      }));
    },
    enabled: !!user,
  });

  const cartItems = user ? dbCartItems : guestCart;

  const addToCartMutation = useMutation({
    mutationFn: async (item: {
      product: Product;
      quantity: number;
      selectedColor: string;
      selectedSize: string;
    }) => {
      if (user) {
        const response = await apiRequest("POST", "/api/cart", {
          userId: user.id,
          productId: item.product.id,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
        });
        return response.json();
      } else {
        setGuestCart(currentCart => {
          const existingItemIndex = currentCart.findIndex(
            cartItem =>
              cartItem.product.id === item.product.id &&
              cartItem.selectedColor === item.selectedColor &&
              cartItem.selectedSize === item.selectedSize
          );
          if (existingItemIndex > -1) {
            const newCart = [...currentCart];
            newCart[existingItemIndex].quantity += item.quantity;
            return newCart;
          } else {
            const newItem: CartItemWithProduct = {
              id: crypto.randomUUID(),
              productId: item.product.id,
              userId: 'guest',
              quantity: item.quantity,
              selectedColor: item.selectedColor,
              selectedSize: item.selectedSize,
              createdAt: new Date().toISOString(),
              product: item.product,
            };
            return [...currentCart, newItem];
          }
        });
        return Promise.resolve();
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart", user.id] });
      }
      toast({ title: "Produto adicionado", description: "Item adicionado ao carrinho com sucesso!" });
    },
    onError: (error) => {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast({ title: "Erro", description: "Não foi possível adicionar o item ao carrinho.", variant: "destructive" });
    },
  });
  
  const subtotal = cartItems.reduce((total, item) => {
    if (!item.product) return total; // Guarda de segurança
    const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
    return total + (price * item.quantity);
  }, 0);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const isUpdating = addToCartMutation.isPending;

  return {
    cartItems,
    subtotal,
    itemCount,
    isLoading,
    isUpdating,
    error,
    addToCart: addToCartMutation.mutate,
    // ... as outras funções de mutação ...
  };
}
