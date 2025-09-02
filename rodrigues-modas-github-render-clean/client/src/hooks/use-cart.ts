import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { CartItemWithProduct } from "../types/index";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export function useCart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use um ID guest padrão quando não estiver logado
  const userId = user?.id || "guest";

  const {
    data: cartItems = [],
    isLoading,
    error
  } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart", userId],
    enabled: true,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (item: {
      productId: string;
      quantity: number;
      selectedColor: string;
      selectedSize: string;
    }) => {
      const response = await apiRequest("POST", "/api/cart", {
        userId,
        ...item,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      toast({
        title: "Produto adicionado",
        description: "Item adicionado ao carrinho com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item ao carrinho.",
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await apiRequest("PATCH", `/api/cart/${id}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade.",
        variant: "destructive",
      });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/cart/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      toast({
        title: "Item removido",
        description: "Item removido do carrinho.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o item.",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/cart/user/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      toast({
        title: "Carrinho limpo",
        description: "Todos os itens foram removidos do carrinho.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível limpar o carrinho.",
        variant: "destructive",
      });
    },
  });

  // Calcular totais
  const subtotal = cartItems.reduce((total, item) => {
    const price = typeof item.product.price === 'string' 
      ? parseFloat(item.product.price) 
      : item.product.price;
    return total + (price * item.quantity);
  }, 0);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const isUpdating = addToCartMutation.isPending || 
                    updateQuantityMutation.isPending || 
                    removeFromCartMutation.isPending || 
                    clearCartMutation.isPending;

  return {
    cartItems,
    subtotal,
    itemCount,
    isLoading,
    isUpdating,
    error,
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
  };
}