import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "../components/ProductCard";
import type { Product } from "@shared/schema";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  // Sempre usar grid de 3 colunas para melhor visualização

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const categories = [
    { id: "all", name: "Todos os Produtos" },
    { id: "sutias", name: "Sutiãs" },
    { id: "calcinhas", name: "Calcinhas" },
    { id: "conjuntos", name: "Conjuntos" },
    { id: "camisolas", name: "Camisolas" },
  ];

  const sortOptions = [
    { value: "name", label: "Nome A-Z" },
    { value: "price-asc", label: "Menor Preço" },
    { value: "price-desc", label: "Maior Preço" },
    { value: "newest", label: "Mais Novos" },
  ];

  // Filtros e busca
  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory && product.isActive;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-asc":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-desc":
          return parseFloat(b.price) - parseFloat(a.price);
        case "newest":
          return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
        default:
          return 0;
      }
    });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-destructive mb-4">
              <i className="fas fa-exclamation-triangle text-4xl"></i>
            </div>
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar produtos</h2>
            <p className="text-muted-foreground">
              Não foi possível carregar os produtos. Tente novamente mais tarde.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-secondary">Nossos Produtos</h1>
              <p className="text-muted-foreground mt-1">
                Descubra nossa coleção completa de moda íntima feminina
              </p>
            </div>
            
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar com filtros */}
          <div className="lg:w-1/4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Categorias */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      Categorias
                    </h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          {category.name}
                          <Badge 
                            variant="secondary" 
                            className="ml-auto"
                          >
                            {category.id === "all" 
                              ? products.filter(p => p.isActive).length 
                              : products.filter(p => p.category === category.id && p.isActive).length
                            }
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Ordenação */}
                  <div>
                    <h3 className="font-semibold mb-3">Ordenar por</h3>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área principal com produtos */}
          <div className="lg:w-3/4">
            {/* Controles de visualização e resultados */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  "Carregando produtos..."
                ) : (
                  `${filteredAndSortedProducts.length} produto${filteredAndSortedProducts.length !== 1 ? 's' : ''} encontrado${filteredAndSortedProducts.length !== 1 ? 's' : ''}`
                )}
                {searchTerm && ` para "${searchTerm}"`}
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Grid className="h-3 w-3" />
                  Grade 3x3
                </div>
              </div>
            </div>

            {/* Grid de produtos - sempre 3 colunas */}
            {isLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3"></div>
                      <div className="flex space-x-2 mb-3">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="w-6 h-6 bg-gray-200 rounded-full"></div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {filteredAndSortedProducts.map((product, index) => (
                  <div 
                    key={product.id} 
                    className="animate-fade-in" 
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <i className="fas fa-search text-6xl"></i>
                </div>
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm 
                    ? `Não encontramos produtos para "${searchTerm}"`
                    : "Não há produtos disponíveis nesta categoria"
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {searchTerm && (
                    <Button 
                      variant="outline"
                      onClick={() => setSearchTerm("")}
                    >
                      Limpar busca
                    </Button>
                  )}
                  <Button onClick={() => setSelectedCategory("all")}>
                    Ver todos os produtos
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
