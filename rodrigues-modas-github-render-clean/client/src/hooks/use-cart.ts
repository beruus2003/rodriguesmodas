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
      if (!user) return []; // Retorna vazio se não houver usuário, por segurança
      const res = await apiRequest("GET", `/api/cart/${user.id}`);
      if (!res.ok) throw new Error("Falha ao buscar o carrinho");
      return res.json();
    },
    enabled: !!user,
  });

  const useCartMutation = <TVariables>(
    mutationFn: (variables: TVariables) => Promise<any>,
    { successMessage, onMutate }: { successMessage: string, onMutate: (variables: TVariables) => void }
  ) => {
    return useMutation({
      mutationFn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        if (!isMerging.current) toast({ title: successMessage });
      },
      onError: (err) => {
        console.error("Erro na operação do carrinho:", err);
        if (!isMerging.current) toast({ title: "Erro", description: "A operação falhou.", variant: "destructive" });
      },
    });
  };

  const addToCartMutation = useMutation({
    mutationFn: (item: { product: Product; quantity: number; selectedColor: string; selectedSize: string; }) => {
      if (user) {
        return apiRequest("POST", "/api/cart", { userId: user.id, productId: item.product.id, ...item });
      } else {
        setGuestCart(current => { /* ... lógica guest ... */ });
        return Promise.resolve();
      }
    },
    // ================== A NOVA LÓGICA DE ATUALIZAÇÃO ==================
    onSuccess: (newItem: CartItem, variables) => {
      // Atualiza o cache manualmente e instantaneamente
      queryClient.setQueryData(queryKey, (oldData: CartItemWithProduct[] | undefined) => {
        const data = oldData || [];
        const newItemWithProduct = { ...newItem, product: variables.product };
        
        // Verifica se o item já existe para decidir se atualiza ou adiciona
        const existingItemIndex = data.findIndex(item => item.id === newItem.id);
        if (existingItemIndex > -1) {
          const updatedData = [...data];
          updatedData[existingItemIndex] = newItemWithProduct;
          return updatedData;
        }
        return [...data, newItemWithProduct];
      });
      if (!isMerging.current) toast({ title: "Produto adicionado!" });
    },
    onError: (err) => { /* ... */ }
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string, quantity: number }) => {
      if (user) { return apiRequest("PATCH", `/api/cart/${itemId}`, { quantity }); }
      else { setGuestCart(c => c.map(i => i.id === itemId ? { ...i, quantity } : i).filter(i => i.quantity > 0)); return Promise.resolve(); }
    },
    onSuccess: (updatedItem: CartItem, variables) => {
      queryClient.setQueryData(queryKey, (oldData: CartItemWithProduct[] | undefined) => {
        if (!oldData) return [];
        return oldData.map(item => item.id === variables.itemId ? { ...item, quantity: variables.quantity } : item).filter(item => item.quantity > 0);
      });
      toast({ title: "Carrinho atualizado." });
    },
    onError: (err) => { /* ... */ }
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: string) => {
      if (user) { return apiRequest("DELETE", `/api/cart/${itemId}`); }
      else { setGuestCart(c => c.filter(item => item.id !== itemId)); return Promise.resolve(); }
    },
    onSuccess: (removedItem: CartItem, itemId) => {
      queryClient.setQueryData(queryKey, (oldData: CartItemWithProduct[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(item => item.id !== itemId);
      });
      toast({ title: "Item removido." });
    },
    onError: (err) => { /* ... */ }
  });
  
  // (Efeito de fusão e cálculos continuam iguais)
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

  const subtotal = cartItems.reduce((total, item) => {
    const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
    return total + (price * item.quantity);
  }, 0);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return {
    cartItems, subtotal, itemCount, isLoading,
    isUpdating: addToCartMutation.isPending || updateQuantityMutation.isPending || removeFromCartMutation.isPending,
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
  };
}
