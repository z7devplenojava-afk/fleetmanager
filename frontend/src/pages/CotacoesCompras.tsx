import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, FileText, Calendar, DollarSign, Building2, User, AlertTriangle } from 'lucide-react';
import { Quotation, QuotationStatus, quotationService } from '@/services/quotationService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QuotationFormModal from '@/components/QuotationFormModal';

interface QuotationFilters {
  status: QuotationStatus | 'ALL';
  supplier: string;
  assignedTo: string;
  dateRange: string;
}

const CotacoesCompras: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [filters, setFilters] = useState<QuotationFilters>({
    status: 'ALL',
    supplier: '',
    assignedTo: '',
    dateRange: ''
  });

  // Mock data for development
  const mockQuotations: Quotation[] = [
    {
      id: '1',
      quoteNumber: 'COT-2024-001',
      title: 'Equipamentos de Segurança',
      description: 'Cotação para equipamentos de proteção individual',
      supplierId: '1',
      supplierName: 'Fornecedor ABC Ltda',
      unitId: '1',
      unitName: 'Unidade Central',
      status: 'SENT',
      totalValue: 15000.00,
      validUntil: '2024-02-15',
      terms: 'Pagamento em 30 dias',
      paymentMethod: 'Boleto',
      deliveryMethod: 'Entrega no local',
      notes: 'Urgente para renovação do estoque',
      createdById: '1',
      createdByName: 'João Silva',
      assignedToId: '2',
      assignedToName: 'Maria Santos',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      quoteNumber: 'COT-2024-002',
      title: 'Material de Limpeza',
      description: 'Produtos de limpeza para todas as unidades',
      supplierId: '2',
      supplierName: 'Limpeza Total S.A.',
      unitId: '2',
      unitName: 'Unidade Norte',
      status: 'APPROVED',
      totalValue: 8500.00,
      validUntil: '2024-02-20',
      terms: 'Pagamento à vista com desconto',
      paymentMethod: 'PIX',
      deliveryMethod: 'Retirada no fornecedor',
      createdById: '2',
      createdByName: 'Maria Santos',
      assignedToId: '1',
      assignedToName: 'João Silva',
      createdAt: '2024-01-10T14:30:00Z',
      updatedAt: '2024-01-12T09:15:00Z'
    },
    {
      id: '3',
      quoteNumber: 'COT-2024-003',
      title: 'Uniformes Corporativos',
      description: 'Uniformes para equipe de segurança',
      supplierId: '3',
      supplierName: 'Confecções Uniformes Ltda',
      status: 'EXPIRED',
      totalValue: 12000.00,
      validUntil: '2024-01-10',
      terms: 'Pagamento em 45 dias',
      paymentMethod: 'Cartão',
      deliveryMethod: 'Entrega programada',
      createdById: '1',
      createdByName: 'João Silva',
      createdAt: '2023-12-20T16:45:00Z',
      updatedAt: '2024-01-11T08:00:00Z'
    }
  ];

  useEffect(() => {
    loadQuotations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [quotations, searchTerm, filters]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      // For now, use mock data. Replace with actual API call when backend is ready
      // const data = await quotationService.getAll();
      setQuotations(mockQuotations);
    } catch (error) {
      console.error('Erro ao carregar cotações:', error);
      setQuotations(mockQuotations); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = quotations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(quotation =>
        quotation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(quotation => quotation.status === filters.status);
    }

    // Supplier filter
    if (filters.supplier) {
      filtered = filtered.filter(quotation => 
        quotation.supplierName?.toLowerCase().includes(filters.supplier.toLowerCase())
      );
    }

    // Assigned to filter
    if (filters.assignedTo) {
      filtered = filtered.filter(quotation => 
        quotation.assignedToName?.toLowerCase().includes(filters.assignedTo.toLowerCase())
      );
    }

    setFilteredQuotations(filtered);
  };

  const getStatusBadge = (status: QuotationStatus) => {
    const statusConfig = {
      DRAFT: { label: 'Rascunho', variant: 'secondary' as const },
      SENT: { label: 'Enviada', variant: 'default' as const },
      APPROVED: { label: 'Aprovada', variant: 'success' as const },
      REJECTED: { label: 'Rejeitada', variant: 'destructive' as const },
      EXPIRED: { label: 'Expirada', variant: 'outline' as const }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const isExpiringSoon = (validUntil: string) => {
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const handleCreateQuotation = () => {
    setSelectedQuotation(null);
    setShowModal(true);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedQuotation(null);
    loadQuotations(); // Reload data after modal closes
  };

  const getUniqueSuppliers = () => {
    const suppliers = quotations
      .map(q => q.supplierName)
      .filter((name, index, arr) => name && arr.indexOf(name) === index)
      .sort();
    return suppliers;
  };

  const getUniqueAssignees = () => {
    const assignees = quotations
      .map(q => q.assignedToName)
      .filter((name, index, arr) => name && arr.indexOf(name) === index)
      .sort();
    return assignees;
  };

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cotações de Compras</h1>
            <p className="text-muted-foreground">
              Gerencie cotações de fornecedores para solicitações de compra
            </p>
          </div>
          <Button onClick={handleCreateQuotation}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Cotação
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cotações</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando Resposta</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotations.filter(q => q.status === 'SENT').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotations.filter(q => q.status === 'APPROVED').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expirando em Breve</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotations.filter(q => isExpiringSoon(q.validUntil)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cotações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as QuotationStatus | 'ALL' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Status</SelectItem>
                  <SelectItem value="DRAFT">Rascunho</SelectItem>
                  <SelectItem value="SENT">Enviada</SelectItem>
                  <SelectItem value="APPROVED">Aprovada</SelectItem>
                  <SelectItem value="REJECTED">Rejeitada</SelectItem>
                  <SelectItem value="EXPIRED">Expirada</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Fornecedor..."
                value={filters.supplier}
                onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
              />
              <Input
                placeholder="Responsável..."
                value={filters.assignedTo}
                onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    status: 'ALL',
                    supplier: '',
                    assignedTo: '',
                    dateRange: ''
                  });
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quotations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Cotações</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-muted-foreground">Carregando cotações...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Válida Até</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{quotation.quoteNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quotation.title}</div>
                          {quotation.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {quotation.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          {quotation.supplierName || 'Não informado'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(quotation.status)}
                          {isExpiringSoon(quotation.validUntil) && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" title="Expira em breve" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(quotation.totalValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatDate(quotation.validUntil)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          {quotation.assignedToName || 'Não atribuído'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuotation(quotation)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredQuotations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm || filters.status !== 'ALL' || filters.supplier || filters.assignedTo
                            ? 'Nenhuma cotação encontrada com os filtros aplicados.'
                            : 'Nenhuma cotação cadastrada ainda.'}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      {showModal && (
        <QuotationFormModal
          quotation={selectedQuotation}
          onClose={handleModalClose}
        />
      )}
    </StandardLayout>
  );
};

export default CotacoesCompras;