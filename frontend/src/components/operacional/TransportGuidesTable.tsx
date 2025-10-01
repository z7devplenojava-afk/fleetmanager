import React, { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  MapPin,
  Calendar,
  User,
  Building,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MoreVertical
} from 'lucide-react';
import { TransportGuide, TransportGuideFilters, TransportGuideStatus, TransportGuideStatusLabels, TransportGuideStatusColors } from '@/types/transportGuide';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransportGuidesTableProps {
  guides: TransportGuide[];
  isLoading?: boolean;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (guide: TransportGuide) => void;
  onView: (guide: TransportGuide) => void;
  onDelete: (guide: TransportGuide) => void;
  onApprove?: (guide: TransportGuide) => void;
  onReject?: (guide: TransportGuide) => void;
  onGeneratePDF: (filters: TransportGuideFilters) => void;
}

const TransportGuidesTable: React.FC<TransportGuidesTableProps> = ({
  guides,
  isLoading = false,
  onRefresh,
  onCreate,
  onEdit,
  onView,
  onDelete,
  onApprove,
  onReject,
  onGeneratePDF
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const getStatusBadge = (status: TransportGuideStatus) => {
    const label = TransportGuideStatusLabels[status];
    const colorClass = TransportGuideStatusColors[status];
    return <Badge className={colorClass}>{label}</Badge>;
  };

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = 
      guide.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.numeroArma.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.cnpj.includes(searchTerm) ||
      guide.motivo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || guide.status === statusFilter;
    const matchesEmpresa = empresaFilter === 'all' || guide.empresa === empresaFilter;
    const matchesDate = !dateFilter || guide.createdAt.startsWith(dateFilter);
    
    return matchesSearch && matchesStatus && matchesEmpresa && matchesDate;
  });

  const handleGeneratePDF = () => {
    const filters: TransportGuideFilters = {
      status: statusFilter !== 'all' ? statusFilter as TransportGuideStatus : undefined,
      empresa: empresaFilter !== 'all' ? empresaFilter : undefined,
      startDate: dateFilter || undefined
    };
    onGeneratePDF(filters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Guias de Transporte</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gestão de guias de transporte de armas e munições
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={handleGeneratePDF} 
            className="w-full sm:w-auto h-11 text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          <Button 
            onClick={onCreate} 
            className="w-full sm:w-auto h-11 text-sm bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Guia</span>
            <span className="sm:hidden">Nova Guia</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
                {filtersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Empresa, arma, CNPJ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="DRAFT">Rascunho</SelectItem>
                      <SelectItem value="SUBMITTED">Enviado</SelectItem>
                      <SelectItem value="APPROVED">Aprovado</SelectItem>
                      <SelectItem value="REJECTED">Rejeitado</SelectItem>
                      <SelectItem value="IN_TRANSIT">Em Trânsito</SelectItem>
                      <SelectItem value="COMPLETED">Concluído</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Empresa</label>
                  <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as empresas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Array.from(new Set(guides.map(g => g.empresa))).map(empresa => (
                        <SelectItem key={empresa} value={empresa}>{empresa}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data</label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  {filteredGuides.length} guia(s) encontrada(s)
                </p>
                <Button variant="outline" size="sm" onClick={onRefresh} className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Tabela Desktop */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando guias...</span>
            </div>
          ) : filteredGuides.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma guia encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || empresaFilter !== 'all' || dateFilter
                  ? 'Tente ajustar os filtros para encontrar guias.'
                  : 'Comece criando sua primeira guia de transporte.'}
              </p>
              {!searchTerm && statusFilter === 'all' && empresaFilter === 'all' && !dateFilter && (
                <Button onClick={onCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Guia
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Tabela Desktop */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Arma</TableHead>
                      <TableHead>Calibre</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuides.map((guide) => (
                      <TableRow key={guide.id}>
                        <TableCell className="font-medium">{guide.empresa}</TableCell>
                        <TableCell>{guide.cnpj}</TableCell>
                        <TableCell>{guide.numeroArma}</TableCell>
                        <TableCell>{guide.calibre}</TableCell>
                        <TableCell>{guide.motivo}</TableCell>
                        <TableCell>{getStatusBadge(guide.status)}</TableCell>
                        <TableCell>
                          {format(new Date(guide.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => onView(guide)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onEdit(guide)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {onApprove && guide.status === 'SUBMITTED' && (
                              <Button variant="ghost" size="sm" onClick={() => onApprove(guide)}>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {onReject && guide.status === 'SUBMITTED' && (
                              <Button variant="ghost" size="sm" onClick={() => onReject(guide)}>
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => onDelete(guide)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cards Mobile */}
              <div className="lg:hidden">
                <div className="space-y-4 p-4">
                  {filteredGuides.map((guide) => (
                    <Card key={guide.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header com Data e Status */}
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{guide.empresa}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(guide.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {getStatusBadge(guide.status)}
                            </div>
                          </div>

                          {/* Informações da Guia */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">
                                <strong>Arma:</strong> {guide.numeroArma} - {guide.calibre}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">
                                <strong>CNPJ:</strong> {guide.cnpj}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">
                                <strong>Motivo:</strong> {guide.motivo}
                              </span>
                            </div>
                            {guide.numeroColete && (
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">
                                  <strong>Colete:</strong> {guide.numeroColete}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Ações */}
                          <div className="flex flex-col gap-3 pt-3 border-t">
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onView(guide)}
                                className="flex-1 h-10 text-sm"
                              >
                                <Eye className="h-4 w-4 mr-2" /> Ver
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onEdit(guide)}
                                className="flex-1 h-10 text-sm"
                              >
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </Button>
                            </div>
                            
                            <div className="flex gap-2">
                              {onApprove && guide.status === 'SUBMITTED' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => onApprove(guide)}
                                  className="flex-1 h-10 text-sm text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" /> Aprovar
                                </Button>
                              )}
                              {onReject && guide.status === 'SUBMITTED' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => onReject(guide)}
                                  className="flex-1 h-10 text-sm text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                >
                                  <XCircle className="h-4 w-4 mr-2" /> Rejeitar
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onDelete(guide)}
                                className="flex-1 h-10 text-sm text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransportGuidesTable;
