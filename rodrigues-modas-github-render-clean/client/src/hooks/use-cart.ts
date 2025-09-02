import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { CartItem, CartItemWithProduct, Product } from "../types/index";
import { useAuth } from "../contexts/AuthContext"; // Importação final e correta
import { useToast } from "./use-toast";

// Helper para ler o carrinho do localStorage de forma segura
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

  // Efeito para salvar/limpar o carrinho de visitante no localStorage
  useEffect(() => {
    if (!user) {
      window.localStorage.setItem('guest-cart', JSON.stringify(guestCart));
    } else {
      // Se o usuário logou, o merge vai acontecer, então podemos limpar aqui
      if (guestCart.length > 0) {
        window.localStorage.removeItem('guest-cart');
      }
    }
  }, [guestCart, user]);
  
  const queryKey = ["cart", user?.id];

  // Busca o carrinho do banco de dados (APENAS se o usuário estiver logado)
  const { data: dbCartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", `/api/cart/${user.id}`);
      if (!res.ok) throw new Error("Falha ao buscar o carrinho");
      return res.json();
    },
    enabled: !!user,
  });

  // O carrinho a ser exibido é o do banco (se logado) OU o do localStorage (se visitante)
  const cartItems = user ? dbCartItems : guestCart;

  // Mutação para adicionar itens ao carrinho
  const addToCartMutation = useMutation({
    mutationFn: async (item: { product: Product; quantity: number; selectedColor: string; selectedSize: string; }) => {
      if (user) {
        return apiRequest("POST", "/api/cart", { userId: user.id, productId: item.product.id, ...item });
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
        return Promise.resolve(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      if (!isMerging.current) {
        toast({ title: "Produto adicionado!" });
      }
    },
    onError: (err) => {
      console.error("Erro ao adicionar ao carrinho:", err);
      if (!isMerging.current) {
        toast({ title: "Erro", description: "Não foi possível adicionar o item.", variant: "destructive" });
      }
    },
  });

  // Efeito para fundir os carrinhos quando o usuário faz login
  useEffect(() => {
    const guestCartOnLogin = getGuestCartFromStorage();
    if (user && guestCartOnLogin.length > 0) {
      isMerging.current = true;
      const mergePromises = guestCartOnLogin.map(item => addToCartMutation.mutateAsync(item));
      Promise.all(mergePromises)
        .catch(err => console.error("Erro ao fundir carrinhos:", err))
        .finally(() => {
          isMerging.current = false;
          setGuestCart([]); // Limpa o estado local
          queryClient.invalidateQueries({ queryKey });
        });
    }
  }, [user, queryClient, addToCartMutation]);

  // Funções para atualizar e remover (sem a lógica de setQueryData que estava dando problema)
  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string, quantity: number }) => {
      if (user) return apiRequest("PATCH", `/api/cart/${itemId}`, { quantity });
      setGuestCart(c => c.map(i => i.id === itemId ? { ...i, quantity } : i).filter(i => i.quantity > 0));
      return Promise.resolve(null);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast({ title: "Carrinho atualizado." }); },
    onError: () => { toast({ title: "Erro", description: "Não foi possível atualizar o item.", variant: "destructive" }); },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: string) => {
      if (user) return apiRequest("DELETE", `/api/cart/${itemId}`);
      setGuestCart(c => c.filter(item => item.id !== itemId));
      return Promise.resolve(null);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast({ title: "Item removido." }); },
    onError: () => { toast({ title: "Erro", description: "Não foi possível remover o item.", variant: "destructive" }); },
  });

  // Cálculos à prova de balas
  const subtotal = cartItems.reduce((total, item) => {
    if (!item?.product?.price) return total;
    const price = parseFloat(String(item.product.price));
    const quantity = Number(item.quantity) || 0;
    return total + (price * quantity);
  }, 0);

  const itemCount = cartItems.reduce((total, item) => total + (Number(item?.quantity) || 0), 0);

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
