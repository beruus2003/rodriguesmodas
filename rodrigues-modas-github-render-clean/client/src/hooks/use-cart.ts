import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { CartItem, CartItemWithProduct, Product } from "../types/index";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

// Helper para ler o carrinho do localStorage de forma segura
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
  const isMerging = useRef(false); // Flag para controlar a fusão

  // Estado para o carrinho de visitante
  const [guestCart, setGuestCart] = useState<CartItemWithProduct[]>(getGuestCartFromStorage);

  // Efeito para salvar o carrinho de visitante no localStorage
  useEffect(() => {
    if (!user) {
      window.localStorage.setItem('guest-cart', JSON.stringify(guestCart));
    }
  }, [guestCart, user]);

  // Busca o carrinho do banco de dados APENAS se o usuário estiver logado
  const {
    data: dbCartItems = [],
    isLoading,
    error,
  } = useQuery<CartItemWithProduct[]>({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/cart/${user!.id}`);
      if (!res.ok) throw new Error("Falha ao buscar o carrinho");
      return res.json();
    },
    enabled: !!user, // Query só é executada se 'user' existir
  });

  // Mutação para adicionar itens (funciona para a fusão também)
  const addToCartMutation = useMutation({
    mutationFn: async (item: {
      product: Product;
      quantity: number;
      selectedColor: string;
      selectedSize: string;
    }) => {
      if (!user) { // Lógica de visitante
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
      
      // Lógica de usuário logado
      return apiRequest("POST", "/api/cart", {
        userId: user.id, productId: item.product.id, quantity: item.quantity,
        selectedColor: item.selectedColor, selectedSize: item.selectedSize,
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
      // Só mostra o toast se não estiver no processo de fusão silenciosa
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

  // EFEITO DE FUSÃO: Roda quando o usuário faz login
  useEffect(() => {
    const guestCartOnLogin = getGuestCartFromStorage();
    if (user && guestCartOnLogin.length > 0) {
      isMerging.current = true; // Ativa a flag para não mostrar múltiplos toasts
      
      // Promessa para adicionar todos os itens do carrinho de visitante à conta do usuário
      const mergePromises = guestCartOnLogin.map(item => 
        addToCartMutation.mutateAsync({
          product: item.product,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize
        })
      );

      Promise.all(mergePromises)
        .then(() => {
          console.log("Carrinho de visitante fundido com sucesso!");
          setGuestCart([]); // Limpa o estado local
          window.localStorage.removeItem('guest-cart'); // Limpa o armazenamento local
          queryClient.invalidateQueries({ queryKey: ["cart", user.id] }); // Atualiza a busca do carrinho final
        })
        .catch(err => {
          console.error("Erro ao fundir carrinhos:", err);
          toast({ title: "Erro", description: "Não foi possível mover os itens do seu carrinho de visitante.", variant: "destructive" });
        })
        .finally(() => {
          isMerging.current = false; // Desativa a flag
        });
    }
  }, [user]); // Dependência: Roda sempre que o 'user' mudar

  // O carrinho a ser exibido é o do banco (se logado) ou do localStorage (se visitante)
  const cartItems = user ? dbCartItems : guestCart;

  const subtotal = cartItems.reduce((total, item) => {
    const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
    return total + (price * item.quantity);
  }, 0);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return {
    cartItems, subtotal, itemCount, isLoading, error,
    isUpdating: addToCartMutation.isPending,
    addToCart: addToCartMutation.mutate,
    // (As outras funções como removeFromCart precisam ser implementadas com a mesma lógica if/else)
  };
}
