import { useState } from "react";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "../hooks/use-cart";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function Cart({ isOpen, onClose, onCheckout }: CartProps) {
  const { cartItems, subtotal, itemCount, updateQuantity, removeFromCart, isUpdating } = useCart();

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numPrice);
  };

  const calculateItemTotal = (price: string, quantity: number) => {
    return parseFloat(price) * quantity;
  };

  if (cartItems.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5" />
              <span>Meu Carrinho</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-lg mb-2">Carrinho vazio</h3>
              <p className="text-muted-foreground text-sm">
                Adicione produtos ao seu carrinho para continuar
              </p>
            </div>
            <Button onClick={onClose} className="btn-primary">
              Continuar comprando
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5" />
              <span>Meu Carrinho</span>
              <Badge variant="secondary">{itemCount}</Badge>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Itens do carrinho */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex space-x-4 p-3 border rounded-lg animate-fade-in">
              <img
                src={item.product.images[0] || "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded-lg"
              />

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2">{item.product.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Cor: {item.selectedColor} | Tamanho: {item.selectedSize}
                </p>

                {/* Controles de quantidade */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={isUpdating}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={isUpdating}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive/80"
                    onClick={() => removeFromCart(item.id)}
                    disabled={isUpdating}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Preço do item */}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">
                    {formatPrice(item.product.price)} x {item.quantity}
                  </span>
                  <span className="font-semibold text-accent">
                    {formatPrice(calculateItemTotal(item.product.price, item.quantity))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Resumo do carrinho */}
        <div className="space-y-4 py-4">
          {/* Totais */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frete:</span>
              <span className="text-success font-medium">Grátis</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-accent">{formatPrice(subtotal)}</span>
            </div>
          </div>

          {/* Botão de checkout */}
          <Button
            onClick={onCheckout}
            className="w-full btn-primary"
            disabled={isUpdating}
          >
            Finalizar Compra
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Continuar Comprando
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
