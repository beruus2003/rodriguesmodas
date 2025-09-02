import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "../hooks/use-cart";
import { useToast } from "../hooks/use-toast";

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Checkout({ isOpen, onClose }: CheckoutProps) {
  const { cartItems, subtotal, clearCart } = useCart();
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleWhatsAppCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar.",
        variant: "destructive",
      });
      return;
    }

    // Criar mensagem para WhatsApp com links das imagens
const message = `Oi, Fiquei Interessado(a) Nesse(s) Produto(s) e Queria Saber Mais:

${cartItems.map((item, index) => {
  // Obter URL completa da imagem
  const imageUrl = item.product.images?.[0] 
    ? (item.product.images[0].startsWith('http') 
        ? item.product.images[0] 
        : `${window.location.origin}${item.product.images[0]}`)
    : '';
  
  return `${index + 1}. *${item.product.name}*
   • Cor: ${item.selectedColor}
   • Tamanho: ${item.selectedSize} 
   • Quantidade: ${item.quantity}
   • Preço: ${formatPrice(typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price)}${imageUrl ? `
   📷 Foto: ${imageUrl}` : ''}`
}).join('\n\n')}

💰 *Total: ${formatPrice(subtotal)}*

Aguardo seu contato para finalizar a compra! 😊`;

    // Número do WhatsApp da loja (seu número correto)
    const phoneNumber = "5585991802352"; // +55 85 99180-2352
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, "_blank");
    
    // Mostrar sucesso
    toast({
      title: "Redirecionado para WhatsApp!",
      description: "Sua mensagem foi preparada. Complete a compra via WhatsApp.",
    });
    
    // Limpar carrinho e fechar modal
    clearCart();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Compra</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do carrinho */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.selectedColor} • {item.selectedSize} • Qtd: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatPrice(parseFloat(item.product.price) * item.quantity)}
                    </p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between items-center font-semibold">
                  <span>Total:</span>
                  <span className="text-lg">{formatPrice(subtotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Método de pagamento - apenas WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como Finalizar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Clique no botão abaixo para enviar seu pedido via WhatsApp. 
                Nossa equipe entrará em contato para finalizar a compra com você.
              </p>
              
              <Button
                onClick={handleWhatsAppCheckout}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-whatsapp-checkout"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Finalizar via WhatsApp
              </Button>
            </CardContent>
          </Card>

          {/* Botão para continuar comprando */}
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
            data-testid="button-continue-shopping"
          >
            Continuar Comprando
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
