import { useState, useEffect, useRef } from "react";
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
    window.localStorage.removeItem('guest-cart');
    return [];
  }
};

export function useCart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMerging = useRef(false);

  const [guestCart, setGuestCart] = useState<CartItemWithProduct[]>(getGuestCartFromStorage);

  useEffect(() => {
    if (!user) {
      window.localStorage.setItem('guest-cart', JSON.stringify(guestCart));
    }
  }, [guestCart, user]);
  
  const queryKey = ["cart", user?.id];

  const {
    data: dbCartItems = [],
    isLoading,
  } = useQuery<CartItemWithProduct[]>({
    queryKey,
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
          userId: user.id, productId: item.product.id, quantity: item.quantity,
          selectedColor: item.selectedColor, selectedSize: item.selectedSize,
        });
      } else {
        setGuestCart(currentCart => {
          const existingItemIndex = currentCart.findIndex(
            ci => ci.product.id === item.product.id && ci.selectedColor === item.selectedColor && ci.selectedSize === item.selectedSize
          );
          if (existingItemIndex > -1) {
            const newCart = [...currentCart];
            newCart[existingItemIndex].quantity += item.quantity;
            return newCart;
          } else {
            const newItem: CartItemWithProduct = {
              id: crypto.randomUUID(), productId: item.product.id, userId: 'guest',
              quantity: item.quantity, selectedColor: item.selectedColor, selectedSize: item.selectedSize,
              createdAt: new Date().toISOString(), product: item.product,
            };
            return [...currentCart, newItem];
          }
        });
        return Promise.resolve();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      if (!isMerging.current) {
        toast({ title: "Produto adicionado!", description: "Seu item já está no carrinho." });
      }
    },
    onError: (err) => {
      if (!isMerging.current) {
        toast({ title: "Erro", description: "Não foi possível adicionar o item.", variant: "destructive" });
      }
      console.error("Erro ao adicionar ao carrinho:", err);
    },
  });
  
  // ======================= NOVAS FUNÇÕES IMPLEMENTADAS AQUI =======================

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string, quantity: number }) => {
      if (user) {
        return apiRequest("PATCH", `/api/cart/${itemId}`, { quantity });
      } else {
        setGuestCart(currentCart =>
          currentCart
            .map(item => item.id === itemId ? { ...item, quantity } : item)
            .filter(item => item.quantity > 0) // Remove o item se a quantidade for 0
        );
        return Promise.resolve();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Carrinho atualizado" });
    },
    onError: (err) => {
      console.error("Erro ao atualizar quantidade:", err);
      toast({ title: "Erro", description: "Não foi possível atualizar o item.", variant: "destructive" });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (user) {
        return apiRequest("DELETE", `/api/cart/${itemId}`);
      } else {
        setGuestCart(currentCart => currentCart.filter(item => item.id !== itemId));
        return Promise.resolve();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Item removido" });
    },
    onError: (err) => {
      console.error("Erro ao remover item:", err);
      toast({ title: "Erro", description: "Não foi possível remover o item.", variant: "destructive" });
    },
  });

  // ==============================================================================

  useEffect(() => {
    const guestCartOnLogin = getGuestCartFromStorage();
    if (user && guestCartOnLogin.length > 0) {
      isMerging.current = true;
      const mergePromises = guestCartOnLogin.map(item => addToCartMutation.mutateAsync(item));
      Promise.all(mergePromises)
        .then(() => {
          setGuestCart([]);
          window.localStorage.removeItem('guest-cart');
          queryClient.invalidateQueries({ queryKey });
        })
        .catch(err => console.error("Erro ao fundir carrinhos:", err))
        .finally(() => { isMerging.current = false; });
    }
  }, [user]);

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
    isUpdating: addToCartMutation.isPending || updateQuantityMutation.isPending || removeFromCartMutation.isPending,
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
  };
}
