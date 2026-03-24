import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  User,
  Building,
  Loader2,
  Filter,
  RefreshCw,
  HardHat
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { epiDeliveryFormService, EPIDeliveryForm } from '@/services/epiDeliveryFormService';
import { useGSAP } from '@/hooks/use-gsap';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const FichasEntregaEPI: React.FC = () => {
  const { toast } = useToast();
  useGSAP();
  
  const [fichas, setFichas] = useState<EPIDeliveryForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFicha, setSelectedFicha] = useState<EPIDeliveryForm | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  useEffect(() => {
    loadFichas();
  }, [page, employeeFilter, companyFilter, startDateFilter, endDateFilter]);

  // Recarregar lista quando a página receber foco (útil quando volta de outra página)
  useEffect(() => {
    const handleFocus = () => {
      loadFichas();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadFichas();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [page, employeeFilter, companyFilter, startDateFilter, endDateFilter]);

  const loadFichas = async () => {
    try {
      setLoading(true);
      
      const filters: any = {
        page,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'DESC'
      };

      // Apenas adicionar filtros se tiverem valor
      if (employeeFilter && employeeFilter.trim()) {
        filters.employeeId = employeeFilter;
      }
      if (companyFilter && companyFilter.trim()) {
        filters.companyId = companyFilter;
      }
      if (startDateFilter && startDateFilter.trim()) {
        filters.startDate = startDateFilter;
      }
      if (endDateFilter && endDateFilter.trim()) {
        filters.endDate = endDateFilter;
      }

      console.log('🔍 Buscando fichas com filtros:', filters);
      const response = await epiDeliveryFormService.search(filters);
      console.log('✅ Resposta recebida:', { 
        totalElements: response.totalElements, 
        contentLength: response.content?.length || 0 
      });
      setFichas(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error: any) {
      console.error('Erro ao carregar fichas:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Não foi possível carregar as fichas de entrega de EPI.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      // Em caso de erro, garantir que os estados estejam vazios
      setFichas([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (ficha: EPIDeliveryForm) => {
    setSelectedFicha(ficha);
    setViewModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ficha?')) {
      return;
    }

    try {
      await epiDeliveryFormService.delete(id);
      toast({
        title: 'Sucesso',
        description: 'Ficha excluída com sucesso!',
      });
      loadFichas();
    } catch (error) {
      console.error('Erro ao excluir ficha:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a ficha.',
        variant: 'destructive'
      });
    }
  };

  const filteredFichas = fichas.filter(ficha => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ficha.employeeName.toLowerCase().includes(search) ||
      ficha.companyName.toLowerCase().includes(search) ||
      ficha.employeeCpf?.toLowerCase().includes(search) ||
      ficha.companyCnpj?.toLowerCase().includes(search)
    );
  });

  const clearFilters = () => {
    setEmployeeFilter('');
    setCompanyFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setSearchTerm('');
    setPage(0);
  };

  return (
    <StandardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-t-4 border-t-primary shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <HardHat className="h-6 w-6 text-primary" />
                  Fichas de Entrega de EPI
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gerencie todas as fichas de entrega de EPI geradas
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFichas}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Limpar Filtros
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFichas}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Funcionário, empresa, CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Total de Fichas</Label>
                <div className="p-2 bg-muted rounded-md text-sm font-medium">
                  {totalElements}
                </div>
              </div>
            </div>

            {/* Tabela */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFichas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ficha encontrada</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Data de Entrega</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFichas.map((ficha) => (
                        <TableRow key={ficha.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{ficha.employeeName}</span>
                              {ficha.employeeCpf && (
                                <span className="text-xs text-muted-foreground">
                                  CPF: {ficha.employeeCpf}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{ficha.companyName}</span>
                              {ficha.companyCnpj && (
                                <span className="text-xs text-muted-foreground">
                                  CNPJ: {ficha.companyCnpj}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {ficha.deliveryDate
                              ? format(new Date(ficha.deliveryDate), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {ficha.items?.length || 0} item(s)
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {ficha.responsibleEmployeeName || '-'}
                          </TableCell>
                          <TableCell>
                            {ficha.createdAt
                              ? format(new Date(ficha.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(ficha)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(ficha.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Página {page + 1} de {totalPages} ({totalElements} fichas)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal de Visualização */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Ficha de Entrega de EPI</DialogTitle>
              <DialogDescription>
                Informações completas da ficha de entrega
              </DialogDescription>
            </DialogHeader>
            {selectedFicha && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Funcionário</Label>
                    <p className="font-medium">{selectedFicha.employeeName}</p>
                    {selectedFicha.employeeCpf && (
                      <p className="text-sm text-muted-foreground">CPF: {selectedFicha.employeeCpf}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Empresa</Label>
                    <p className="font-medium">{selectedFicha.companyName}</p>
                    {selectedFicha.companyCnpj && (
                      <p className="text-sm text-muted-foreground">CNPJ: {selectedFicha.companyCnpj}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Data de Entrega</Label>
                    <p className="font-medium">
                      {selectedFicha.deliveryDate
                        ? format(new Date(selectedFicha.deliveryDate), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Responsável</Label>
                    <p className="font-medium">{selectedFicha.responsibleEmployeeName || '-'}</p>
                  </div>
                </div>

                {selectedFicha.observations && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Observações</Label>
                    <p className="text-sm">{selectedFicha.observations}</p>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Itens de EPI</Label>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>EPI</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>CA</TableHead>
                          <TableHead>Validade</TableHead>
                          <TableHead>Observações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedFicha.items?.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.epiName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.ca || '-'}</TableCell>
                            <TableCell>
                              {item.validityDate
                                ? format(new Date(item.validityDate), 'dd/MM/yyyy', { locale: ptBR })
                                : '-'}
                            </TableCell>
                            <TableCell>{item.observations || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
};

export default FichasEntregaEPI;





