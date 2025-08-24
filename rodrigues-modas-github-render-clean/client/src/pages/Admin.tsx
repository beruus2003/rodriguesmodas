import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Users,
  Eye,
  EyeOff,
  Upload,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import type { Product, Order } from "@shared/schema";

// Schema para validação de produto
const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Preço deve ser maior que zero"),
  category: z.string().min(1, "Categoria é obrigatória"),
  colors: z.array(z.string()).min(1, "Pelo menos uma cor deve ser selecionada"),
  sizes: z.array(z.string()).min(1, "Pelo menos um tamanho deve ser selecionado"),
  stock: z.number().min(0, "Estoque não pode ser negativo"),
  isActive: z.boolean(),
  images: z.array(z.string()),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados sempre no topo e fora de condicionais
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);


  // Queries
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setProductModalOpen(false);
      setEditingProduct(null);
      toast({ title: "Produto criado com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "Erro ao criar produto", 
        description: "Tente novamente mais tarde.", 
        variant: "destructive" 
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const response = await apiRequest("PATCH", `/api/products/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setProductModalOpen(false);
      setEditingProduct(null);
      toast({ title: "Produto atualizado com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "Erro ao atualizar produto", 
        description: "Tente novamente mais tarde.", 
        variant: "destructive" 
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produto removido com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "Erro ao remover produto", 
        description: "Tente novamente mais tarde.", 
        variant: "destructive" 
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Status do pedido atualizado!" });
    },
  });

  // Form
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      colors: [],
      sizes: [],
      stock: 0,
      isActive: true,
      images: [],
    },
  });

  // Verificar se o usuário é admin
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-destructive mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você precisa ter permissões de administrador para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Funções auxiliares
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(price));
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "default" as const },
      confirmed: { label: "Confirmado", variant: "secondary" as const },
      shipped: { label: "Enviado", variant: "outline" as const },
      delivered: { label: "Entregue", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setImageUrls(product.images as string[] || []);
      form.reset({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        colors: product.colors as string[],
        sizes: product.sizes as string[],
        stock: product.stock,
        isActive: product.isActive,
        images: product.images as string[],
      });
    } else {
      setEditingProduct(null);
      setImageUrls([]);
      form.reset({
        name: "",
        description: "",
        price: "",
        category: "",
        colors: [],
        sizes: [],
        stock: 0,
        isActive: true,
        images: [],
      });
    }
    setImageInput("");
    setProductModalOpen(true);
  };

  const addImageUrl = () => {
    if (imageInput.trim() && !imageUrls.includes(imageInput.trim())) {
      const newUrls = [...imageUrls, imageInput.trim()];
      setImageUrls(newUrls);
      form.setValue("images", newUrls);
      setImageInput("");
    }
  };

  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    form.setValue("images", newUrls);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result && !imageUrls.includes(result)) {
          const newUrls = [...imageUrls, result];
          setImageUrls(newUrls);
          form.setValue("images", newUrls);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitProduct = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // Estatísticas
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const totalRevenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, order) => sum + parseFloat(order.total), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary">Painel Administrativo</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie produtos, pedidos e visualize estatísticas
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Logado como: <span className="font-medium">{user.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                  <p className="text-xs text-muted-foreground">{activeProducts} ativos</p>
                </div>
                <Package className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                  <p className="text-2xl font-bold">{totalOrders}</p>
                  <p className="text-xs text-muted-foreground">{pendingOrders} pendentes</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold">{formatPrice(totalRevenue.toString())}</p>
                  <p className="text-xs text-success">Vendas confirmadas</p>
                </div>
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Produtos Ativos</p>
                  <p className="text-2xl font-bold">{activeProducts}</p>
                  <p className="text-xs text-muted-foreground">
                    {((activeProducts / totalProducts) * 100 || 0).toFixed(1)}% do total
                  </p>
                </div>
                <Eye className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principais */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
          </TabsList>

          {/* Aba de Produtos */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Gerenciar Produtos</h2>
                <p className="text-muted-foreground text-sm">
                  Adicione, edite ou remova produtos da sua loja
                </p>
              </div>
              <Button onClick={() => openProductModal()} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>

            {/* Grid de produtos em 3 colunas */}
            <div className="grid grid-cols-3 gap-6">
              {productsLoading ? (
                [...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                products.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={product.images?.[0] || "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="bg-white/90">
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-accent">
                            {formatPrice(product.price)}
                          </span>
                          <Badge 
                            variant={product.stock > 5 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                          >
                            {product.stock} un.
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {(product.colors as string[] || []).length} cores • {(product.sizes as string[] || []).length} tamanhos
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openProductModal(product)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Aba de Pedidos */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-semibold">Gerenciar Pedidos</h2>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersLoading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div></TableCell>
                        </TableRow>
                      ))
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-muted-foreground">
                            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhum pedido encontrado</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="font-medium">#{order.id.slice(0, 8)}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{order.customerInfo.name}</div>
                            <div className="text-sm text-muted-foreground">{order.customerInfo.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(order.createdAt!).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.createdAt!).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(order.total)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {order.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getOrderStatusBadge(order.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={order.status}
                              onValueChange={(status) => 
                                updateOrderStatusMutation.mutate({ id: order.id, status })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="confirmed">Confirmado</SelectItem>
                                <SelectItem value="shipped">Enviado</SelectItem>
                                <SelectItem value="delivered">Entregue</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Produto */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="product-form-description">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Adicionar Produto"}
            </DialogTitle>
          </DialogHeader>
          <div id="product-form-description" className="sr-only">
            {editingProduct ? "Formulário para editar um produto existente" : "Formulário para adicionar um novo produto"}
          </div>

          <form onSubmit={form.handleSubmit(handleSubmitProduct)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Ex: Sutiã Renda Delicata"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...form.register("price")}
                  placeholder="89.90"
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Descrição detalhada do produto..."
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(value) => form.setValue("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sutias">Sutiãs</SelectItem>
                    <SelectItem value="calcinhas">Calcinhas</SelectItem>
                    <SelectItem value="conjuntos">Conjuntos</SelectItem>
                    <SelectItem value="camisolas">Camisolas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  type="number"
                  {...form.register("stock", { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="isActive"
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) => form.setValue("isActive", checked)}
                />
                <Label htmlFor="isActive">Produto ativo</Label>
              </div>
            </div>

            {/* Cores */}
            <div>
              <Label>Cores Disponíveis</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {["Branco", "Preto", "Rosa", "Azul", "Cinza", "Vermelho", "Roxo", "Champagne"].map((color) => (
                  <label key={color} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.watch("colors").includes(color)}
                      onChange={(e) => {
                        const currentColors = form.watch("colors");
                        if (e.target.checked) {
                          form.setValue("colors", [...currentColors, color]);
                        } else {
                          form.setValue("colors", currentColors.filter(c => c !== color));
                        }
                      }}
                    />
                    <span className="text-sm">{color}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tamanhos */}
            <div>
              <Label>Tamanhos Disponíveis</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {["P", "M", "G", "GG"].map((size) => (
                  <label key={size} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.watch("sizes").includes(size)}
                      onChange={(e) => {
                        const currentSizes = form.watch("sizes");
                        if (e.target.checked) {
                          form.setValue("sizes", [...currentSizes, size]);
                        } else {
                          form.setValue("sizes", currentSizes.filter(s => s !== size));
                        }
                      }}
                    />
                    <span className="text-sm">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Imagens do Produto */}
            <div>
              <Label>Imagens do Produto</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Galeria
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Ou cole URLs de imagens:
                </div>
                <div className="flex gap-2">
                  <Input
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    placeholder="Cole o URL da imagem aqui..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addImageUrl}
                    disabled={!imageInput.trim()}
                    variant="outline"
                    size="sm"
                  >
                    Adicionar URL
                  </Button>
                </div>
                
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border">
                          <img
                            src={url}
                            alt={`Produto ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400";
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImageUrl(index)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        {index === 0 && (
                          <Badge className="absolute bottom-1 left-1 text-xs">Principal</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {imageUrls.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Escolha imagens da galeria ou adicione URLs</p>
                    <p className="text-xs text-gray-400 mt-1">A primeira imagem será a principal</p>
                    <Button
                      type="button"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      variant="outline"
                      className="mt-3"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Escolher da Galeria
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="btn-primary"
              >
                {createProductMutation.isPending || updateProductMutation.isPending
                  ? "Salvando..."
                  : editingProduct
                  ? "Atualizar"
                  : "Criar Produto"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
              O produto será removido permanentemente da sua loja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
