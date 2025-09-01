import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { CartItemWithProduct, Product } from "../types/index"; // Garanta que 'Product' seja importado
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

// Helper para pegar o carrinho do localStorage de forma segura
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

  // Estado separado para o carrinho de visitante, inicializado do localStorage
  const [guestCart, setGuestCart] = useState<CartItemWithProduct[]>(getGuestCartFromStorage);

  // Efeito para salvar o carrinho de visitante no localStorage sempre que ele mudar
  useEffect(() => {
    if (!user) { // Este efeito só roda para visitantes
      window.localStorage.setItem('guest-cart', JSON.stringify(guestCart));
    }
  }, [guestCart, user]);

  // Busca o carrinho do banco de dados APENAS se o usuário estiver logado
  const {
    data: dbCartItems = [],
    isLoading,
    error
  } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart", user?.id],
    queryFn: async () => {
      // Ajuste para uma rota que busca o carrinho pelo ID do usuário
      const res = await apiRequest("GET", `/api/cart/${user!.id}`);
      return res.json();
    },
    enabled: !!user, // A MÁGICA ACONTECE AQUI: A query só é executada se 'user' existir
  });

  // O carrinho a ser exibido é o do banco de dados (se logado) OU o do localStorage (se visitante)
  const cartItems = user ? dbCartItems : guestCart;

  const addToCartMutation = useMutation({
    mutationFn: async (item: {
      product: Product; // Passamos o produto inteiro para ter os dados no localStorage
      quantity: number;
      selectedColor: string;
      selectedSize: string;
    }) => {
      if (user) {
        // --- LÓGICA PARA USUÁRIO LOGADO ---
        const response = await apiRequest("POST", "/api/cart", {
          userId: user.id, // Envia o ID do usuário real e atual!
          productId: item.product.id,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
        });
        return response.json();
      } else {
        // --- LÓGICA PARA VISITANTE (localStorage) ---
        setGuestCart(currentCart => {
          const existingItemIndex = currentCart.findIndex(
            cartItem =>
              cartItem.product.id === item.product.id &&
              cartItem.selectedColor === item.selectedColor &&
              cartItem.selectedSize === item.selectedSize
          );

          if (existingItemIndex > -1) {
            // Se o item já existe, atualiza a quantidade
            const newCart = [...currentCart];
            newCart[existingItemIndex].quantity += item.quantity;
            return newCart;
          } else {
            // Se não existe, adiciona o novo item
            const newItem: CartItemWithProduct = {
              id: crypto.randomUUID(), // ID temporário para o frontend
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
        return Promise.resolve(); // Retorna uma promessa resolvida para o react-query
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart", user.id] });
      }
      toast({
        title: "Produto adicionado",
        description: "Item adicionado ao carrinho com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item ao carrinho.",
        variant: "destructive",
      });
    },
  });

  // As outras mutações (update, remove, clear) precisariam de uma lógica similar 
  // para funcionar com o localStorage, mas vamos focar em fazer o 'addToCart' funcionar primeiro.
  
  const isUpdating = addToCartMutation.isPending; // Simplificado por enquanto

  // Calcular totais (agora funciona para ambos os tipos de carrinho)
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
    isUpdating,
    error,
    addToCart: addToCartMutation.mutate,
    // ... as outras funções de mutação ...
  };
}
