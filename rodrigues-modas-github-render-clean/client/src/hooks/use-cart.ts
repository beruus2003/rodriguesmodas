import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { CartItem, CartItemWithProduct, Product } from "../types/index";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

const getGuestCartFromStorage = (): CartItemWithProduct[] => {
  if (typeof window === 'undefined') return [];
  try {
    const savedCart = window.localStorage.getItem('guest-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error("Erro ao ler o carrinho do localStorage:", error);
    window.localStorage.removeItem('guest-cart'); // Limpa dados corrompidos
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
    } else {
      // Opcional: Limpar o carrinho de convidado após o login
      window.localStorage.removeItem('guest-cart');
    }
  }, [guestCart, user]);

  const {
    data: dbCartItems = [],
    isLoading,
    error,
  } = useQuery<CartItemWithProduct[]>({
    queryKey: ["cart", user?.id], // Chave de query mais semântica
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/cart/${user!.id}`);
      if (!res.ok) throw new Error("Falha ao buscar o carrinho");
      return res.json();
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
        return apiRequest("POST", "/api/cart", {
          userId: user.id,
          productId: item.product.id,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
        });
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
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
      toast({
        title: "Produto adicionado!",
        description: "Seu item já está no carrinho.",
      });
    },
    onError: (err) => {
      console.error("Erro ao adicionar ao carrinho:", err);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item.",
        variant: "destructive",
      });
    },
  });

  // (As outras mutações, como update, remove e clear, podem ser adicionadas aqui depois)

  const subtotal = cartItems.reduce((total, item) => {
    const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
    return total + (price * item.quantity);
  }, 0);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return {
    cartItems,
    subtotal,
    itemCount,
    isLoading,
    isUpdating: addToCartMutation.isPending,
    error,
    addToCart: addToCartMutation.mutate,
  };
}
