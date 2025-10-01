import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Product, productService } from '@/services/productService';
import { ProductFormModal } from '@/components/estoque/ProductFormModal';
import { StandardLayout } from '@/components/StandardLayout';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

export default function Produtos() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [abcFilter, setAbcFilter] = useState('all');
  
  // Estatísticas
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, statusFilter, categoryFilter, stockFilter, abcFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [
        activeCount,
        lowStockCount,
        outOfStockCount,
        totalValue
      ] = await Promise.all([
        productService.getActiveProductsCount(),
        productService.getLowStockProductsCount(),
        productService.getOutOfStockProductsCount(),
        productService.getTotalInventoryValue(),
      ]);

      setStats({
        totalProducts: products.length,
        activeProducts: activeCount,
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
        totalValue: totalValue || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter);
    }

    // Filtro por categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Filtro por estoque
    if (stockFilter !== 'all') {
      switch (stockFilter) {
        case 'low':
          filtered = filtered.filter(product => product.currentStock <= (product.minimumStock || 0));
          break;
        case 'out':
          filtered = filtered.filter(product => product.currentStock === 0);
          break;
        case 'over':
          filtered = filtered.filter(product => product.currentStock > (product.maximumStock || 0));
          break;
      }
    }

    // Filtro por classificação ABC
    if (abcFilter !== 'all') {
      filtered = filtered.filter(product => product.abcClassification === abcFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleCreateProduct = async (productData: any) => {
    try {
      await productService.createProduct(productData);
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso.",
      });
      loadProducts();
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar produto.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async (productData: any) => {
    try {
      await productService.updateProduct(editingProduct!.id, productData);
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso.",
      });
      loadProducts();
      setIsModalOpen(false);
      setEditingProduct(undefined);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await productService.deleteProduct(id);
        toast({
          title: "Sucesso",
          description: "Produto excluído com sucesso.",
        });
        loadProducts();
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir produto.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-green-100 text-green-800';
      case 'high': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAbcColor = (classification: string) => {
    switch (classification) {
      case 'A': return 'bg-red-100 text-red-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getCategories = () => {
    const categories = products.map(p => p.category).filter(Boolean);
    return [...new Set(categories)];
  };

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">
              Gerenciamento completo de produtos
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total de Produtos</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Produtos Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-red-600">{stats.lowStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Sem Estoque</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.outOfStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Valor Total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {getCategories().map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="out">Sem Estoque</SelectItem>
                  <SelectItem value="over">Estoque Alto</SelectItem>
                </SelectContent>
              </Select>

              <Select value={abcFilter} onValueChange={setAbcFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Classificação ABC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="A">Classe A</SelectItem>
                  <SelectItem value="B">Classe B</SelectItem>
                  <SelectItem value="C">Classe C</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={loadProducts}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Variações</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Classificação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {product.size && (
                              <Badge variant="outline" className="text-xs">Tamanho: {product.size}</Badge>
                            )}
                            {product.color && (
                              <Badge variant="outline" className="text-xs">Cor: {product.color}</Badge>
                            )}
                            {product.productType && (
                              <Badge variant="outline" className="text-xs">Tipo: {product.productType}</Badge>
                            )}
                            {product.footwearSize && (
                              <Badge variant="outline" className="text-xs">Numeração: {product.footwearSize}</Badge>
                            )}
                            {product.clothingSize && (
                              <Badge variant="outline" className="text-xs">Tamanho: {product.clothingSize}</Badge>
                            )}
                            {product.beltSize && (
                              <Badge variant="outline" className="text-xs">Cinto: {product.beltSize}cm</Badge>
                            )}
                            {product.material && (
                              <Badge variant="outline" className="text-xs">Material: {product.material}</Badge>
                            )}
                            {product.style && (
                              <Badge variant="outline" className="text-xs">Estilo: {product.style}</Badge>
                            )}
                            {product.gender && (
                              <Badge variant="outline" className="text-xs">Gênero: {product.gender}</Badge>
                            )}
                            {product.season && (
                              <Badge variant="outline" className="text-xs">Estação: {product.season}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.supplier}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{formatNumber(product.currentStock || 0)}</span>
                            <Badge variant={product.currentStock <= (product.minimumStock || 0) ? "destructive" : "secondary"}>
                              {product.currentStock <= (product.minimumStock || 0) ? 'Baixo' : 'Normal'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(product.salePrice || 0)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(product.status || '')}>
                            {product.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getAbcColor(product.abcClassification || '')}>
                            {product.abcClassification || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Produto */}
        {isModalOpen && (
          <ProductFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={editingProduct ? handleUpdateProduct : handleCreateProduct}
            product={editingProduct}
          />
        )}
      </div>
    </StandardLayout>
  );
} 