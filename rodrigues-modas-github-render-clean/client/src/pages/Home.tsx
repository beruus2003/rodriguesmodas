import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "../components/ProductCard";
import { ShoppingBag, Star, Heart, Users } from "lucide-react";
import type { Product } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const categories = [
    { id: "all", name: "Todos", icon: ShoppingBag },
    { id: "sutias", name: "Sutiãs", icon: Heart },
    { id: "calcinhas", name: "Calcinhas", icon: Star },
    { id: "conjuntos", name: "Conjuntos", icon: Users },
    { id: "camisolas", name: "Camisolas", icon: ShoppingBag },
  ];

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const featuredProducts = products.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-primary py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl lg:text-6xl font-bold text-secondary mb-6 leading-tight">
                Moda Íntima de{" "}
                <span className="text-gradient">Qualidade</span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed">
                Descubra nossa coleção exclusiva de lingerie feminina, 
                com peças confortáveis e elegantes para todas as ocasiões.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="btn-primary text-lg px-8 py-4"
                  onClick={() => setSelectedCategory("all")}
                >
                  Ver Coleção
                </Button>
                <Button 
                  variant="outline" 
                  className="btn-secondary text-lg px-8 py-4"
                >
                  Sobre Nós
                </Button>
              </div>
            </div>
            
            <div className="relative animate-slide-up">
              <div className="relative z-10">
                <img
                  src="/assets/IMG_1427_1754846634334.png"
                  alt="Coleção de lingerie elegante"
                  className="rounded-xl shadow-2xl w-full h-auto"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/30 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center card-hover">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Qualidade Premium</h3>
                <p className="text-gray-600">
                  Tecidos selecionados e acabamento impecável em todas as peças
                </p>
              </CardContent>
            </Card>

            <Card className="text-center card-hover">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Conforto Absoluto</h3>
                <p className="text-gray-600">
                  Lingerie desenvolvida para proporcionar bem-estar durante todo o dia
                </p>
              </CardContent>
            </Card>

            <Card className="text-center card-hover">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Variedade Exclusiva</h3>
                <p className="text-gray-600">
                  Coleções únicas com designs elegantes e modernos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary mb-4">
              Nossa Coleção
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Peças cuidadosamente selecionadas para valorizar sua feminilidade 
              e proporcionar máximo conforto.
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-4 mb-12 justify-center">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`px-6 py-3 rounded-full transition-all duration-200 ${
                    selectedCategory === category.id 
                      ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                      : "border-gray-300 hover:border-accent hover:text-accent"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.name}
                </Button>
              );
            })}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
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
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => (
                  <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-gray-500">
                    Tente selecionar uma categoria diferente
                  </p>
                </div>
              )}
            </>
          )}

          {/* Load More */}
          {filteredProducts.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" className="btn-secondary">
                Ver Mais Produtos
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-accent text-accent-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">
            Entre em Contato
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-xl font-semibold mb-4">WhatsApp</h3>
              <a href="https://wa.me/5585991802352" target="_blank" rel="noopener noreferrer" className="text-lg hover:underline">
                +55 85 99180-2352
              </a>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">E-mail</h3>
              <a href="mailto:contact.rodriguesmoda@gmail.com" className="text-lg hover:underline">
                contact.rodriguesmoda@gmail.com
              </a>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Localização</h3>
              <p className="text-lg">Fortaleza - CE</p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-6">Redes Sociais</h3>
            <div className="flex justify-center gap-6">
              <a 
                href="https://www.instagram.com/rodriguesmoda___?igsh=MWk0enZwdGdpcXg4dA=="
                target="_blank"
                rel="noopener noreferrer" 
                className="text-lg hover:underline"
              >
                Instagram
              </a>
              <a 
                href="https://wa.me/5585991802352" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg hover:underline"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
