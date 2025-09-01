import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "../hooks/use-cart";
import { Loader2 } from "lucide-react"; // Importando um ícone de loading

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function Cart({ isOpen, onClose, onCheckout }: CartProps) {
  const { cartItems, subtotal, itemCount, updateQuantity, removeFromCart, isUpdating, isLoading } = useCart();

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numPrice);
  };

  // Verificação de Loading primeiro
  if (isLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full max-w-md flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </SheetContent>
      </Sheet>
    );
  }

  // Verificação de Carrinho Vazio
  if (!cartItems || cartItems.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2"><ShoppingBag className="h-5 w-5" /><span>Meu Carrinho</span></SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-full -mt-16 space-y-4 text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-1">Seu carrinho está vazio</h3>
              <p className="text-muted-foreground text-sm">Adicione produtos para vê-los aqui.</p>
            </div>
            <Button onClick={onClose} className="w-full max-w-xs">Continuar comprando</Button>
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

        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
          {cartItems.map((item) => (
            <div key={item.id} className="flex space-x-4">
              <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.product.images[0] || "/placeholder.png"}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="font-medium text-sm leading-tight line-clamp-2">{item.product.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Cor: {item.selectedColor} / Tam: {item.selectedSize}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={isUpdating || item.quantity <= 1}><Minus className="h-4 w-4" /></Button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={isUpdating}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <span className="font-semibold text-sm">{formatPrice(parseFloat(item.product.price) * item.quantity)}</span>
                </div>
              </div>

              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => removeFromCart(item.id)} disabled={isUpdating}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frete</span><span className="font-medium">Grátis</span></div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
          </div>
          <Button onClick={onCheckout} className="w-full" disabled={isUpdating}>Finalizar Compra</Button>
          <Button variant="outline" onClick={onClose} className="w-full">Continuar Comprando</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
