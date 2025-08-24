import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart } from "lucide-react";
import { useCart } from "../hooks/use-cart";
import { useToast } from "../hooks/use-toast";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, isUpdating } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione cor e tamanho antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }

    addToCart({
      productId: product.id,
      quantity: 1,
      selectedColor,
      selectedSize,
    });
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(price));
  };

  return (
    <Card 
      className="card-hover overflow-hidden group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagem do produto */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.images?.[0] || "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badge de categoria */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 bg-white/90 text-accent"
        >
          {product.category}
        </Badge>

        {/* Botão de favorito */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Heart className="h-4 w-4" />
        </Button>

        {/* Overlay com ações rápidas */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              onClick={handleAddToCart}
              disabled={isUpdating || product.stock === 0}
              className="btn-primary animate-scale-in"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        )}

        {/* Indicador de estoque baixo */}
        {product.stock <= 5 && product.stock > 0 && (
          <Badge
            variant="destructive"
            className="absolute bottom-2 left-2 bg-warning text-black"
          >
            Últimas unidades
          </Badge>
        )}

        {/* Produto esgotado */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg py-2 px-4">
              Esgotado
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Nome e descrição */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

        {/* Opções de cor */}
        <div className="flex space-x-2 mb-3">
          <span className="text-xs font-medium text-gray-700">Cores:</span>
          <div className="flex space-x-1">
            {product.colors?.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                  selectedColor === color
                    ? "border-accent scale-110"
                    : "border-gray-300 hover:border-accent/50"
                }`}
                style={{
                  backgroundColor: color.toLowerCase() === "branco" ? "#ffffff" :
                                 color.toLowerCase() === "preto" ? "#000000" :
                                 color.toLowerCase() === "rosa" ? "#ffc0cb" :
                                 color.toLowerCase() === "azul" ? "#87ceeb" :
                                 color.toLowerCase() === "cinza" ? "#d3d3d3" :
                                 color.toLowerCase() === "vermelho" ? "#ff6b6b" :
                                 color.toLowerCase() === "roxo" ? "#dda0dd" :
                                 color.toLowerCase() === "champagne" ? "#f7e7ce" : "#f0f0f0"
                }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Opções de tamanho */}
        <div className="flex space-x-1 mb-4">
          <span className="text-xs font-medium text-gray-700 mr-2">Tamanhos:</span>
          {product.sizes?.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-2 py-1 text-xs rounded border transition-all duration-200 ${
                selectedSize === size
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-gray-300 hover:border-accent"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Preço e ação */}
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-accent">
            {formatPrice(product.price)}
          </span>
          <Button
            onClick={handleAddToCart}
            disabled={isUpdating || product.stock === 0}
            size="sm"
            className="btn-primary"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>

        {/* Informações de estoque */}
        <div className="mt-2 text-xs text-gray-500">
          {product.stock > 0 ? (
            <span>{product.stock} unidades disponíveis</span>
          ) : (
            <span className="text-destructive">Produto esgotado</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
