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
    data: cartItems = [],
    isLoading,
  } = useQuery<CartItemWithProduct[]>({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", `/api/cart/${user.id}`);
      if (!res.ok) throw new Error("Falha ao buscar o carrinho");
      return res.json();
    },
    enabled: !!user,
  });

  const addToCartMutation = useMutation({
    mutationFn: (item: { product: Product; quantity: number; selectedColor: string; selectedSize: string; }) => {
      if (user) {
        return apiRequest("POST", "/api/cart", { userId: user.id, productId: item.product.id, ...item });
      } else { /* ...lógica guest... */ return Promise.resolve(); }
    },
    onSuccess: (newItem: CartItem, variables) => {
      queryClient.setQueryData(queryKey, (oldData: CartItemWithProduct[] | undefined = []) => {
        const newItemWithProduct = { ...(newItem || variables), product: variables.product };
        const existingItemIndex = oldData.findIndex(item => item.product.id === variables.product.id && item.selectedColor === variables.selectedColor && item.selectedSize === variables.selectedSize);
        if (existingItemIndex > -1) {
          const updatedData = [...oldData];
          updatedData[existingItemIndex].quantity += variables.quantity;
          return updatedData;
        }
        return [...oldData, newItemWithProduct];
      });
      if (!isMerging.current) toast({ title: "Produto adicionado!" });
    },
    onError: (err) => { toast({ title: "Erro", description: "Não foi possível adicionar o item.", variant: "destructive" }); },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string, quantity: number }) => {
      if (user) { return apiRequest("PATCH", `/api/cart/${itemId}`, { quantity }); }
      else { setGuestCart(c => c.map(i => i.id === itemId ? { ...i, quantity } : i).filter(i => i.quantity > 0)); return Promise.resolve(); }
    },
    onSuccess: (updatedItem: CartItem, variables) => {
      queryClient.setQueryData(queryKey, (oldData: CartItemWithProduct[] | undefined = []) => 
        oldData.map(item => item.id === variables.itemId ? { ...item, quantity: variables.quantity } : item).filter(item => item.quantity > 0)
      );
      toast({ title: "Carrinho atualizado." });
    },
    onError: (err) => { toast({ title: "Erro", description: "Não foi possível atualizar o item.", variant: "destructive" }); },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: string) => {
      if (user) { return apiRequest("DELETE", `/api/cart/${itemId}`); }
      else { setGuestCart(c => c.filter(item => item.id !== itemId)); return Promise.resolve(); }
    },
    onSuccess: (removedItem: CartItem, itemId) => {
      queryClient.setQueryData(queryKey, (oldData: CartItemWithProduct[] | undefined = []) => 
        oldData.filter(item => item.id !== itemId)
      );
      toast({ title: "Item removido." });
    },
    onError: (err) => { toast({ title: "Erro", description: "Não foi possível remover o item.", variant: "destructive" }); },
  });
  
  useEffect(() => {
    const guestCartOnLogin = getGuestCartFromStorage();
    if (user && guestCartOnLogin.length > 0) {
      isMerging.current = true;
      const mergePromises = guestCartOnLogin.map(item => addToCartMutation.mutateAsync(item));
      Promise.all(mergePromises).then(() => {
        setGuestCart([]);
        window.localStorage.removeItem('guest-cart');
      }).catch(err => console.error("Erro ao fundir carrinhos:", err)).finally(() => {
        isMerging.current = false;
        queryClient.invalidateQueries({ queryKey });
      });
    }
  }, [user]);

  // ================== CÁLCULOS TORNADOS "À PROVA DE BALAS" ==================
  const subtotal = cartItems.reduce((total, item) => {
    // Verificação de segurança: Ignora itens malformados
    if (!item || !item.product || item.product.price == null) {
      return total;
    }
    const price = parseFloat(String(item.product.price)); // Força a conversão para string e depois float
    const quantity = Number(item.quantity) || 0; // Garante que a quantidade é um número
    
    // Se o preço não for um número válido, não soma nada
    if (isNaN(price)) {
      return total;
    }
    
    return total + (price * quantity);
  }, 0);

  const itemCount = cartItems.reduce((total, item) => {
    const quantity = Number(item?.quantity) || 0; // Garante que a quantidade é um número
    return total + quantity;
  }, 0);
  // =========================================================================

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
