import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuotationReportFilters } from '@/utils/quotationReportGenerator';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatDateForBackend } from '@/utils/dateUtils';
import { ptBR } from 'date-fns/locale';
import { Calendar, Filter, DollarSign, FileDown, Search, Building2, User as UserIcon, FileText } from 'lucide-react';
import { QuotationStatus } from '@/services/quotationService';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import { userService, User } from '@/services/userService';

interface QuotationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (filters: QuotationReportFilters) => void;
  loading?: boolean;
}

export function QuotationReportModal({
  isOpen,
  onClose,
  onGenerate,
  loading = false,
}: QuotationReportModalProps) {
  const [startValidUntil, setStartValidUntil] = useState<Date | null>(null);
  const [endValidUntil, setEndValidUntil] = useState<Date | null>(null);
  const [filters, setFilters] = useState<QuotationReportFilters>({
    quoteNumber: '',
    title: '',
    supplierId: '',
    status: 'all',
    assignedToId: '',
    minValue: undefined,
    maxValue: undefined,
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      loadUsers();
    }
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      const data = await contasAPagarService.getFornecedoresAtivos();
      setSuppliers(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setSuppliers([]);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filtersToSend: QuotationReportFilters = {
      ...filters,
      startValidUntil: startValidUntil ? formatDateForBackend(startValidUntil) : undefined,
      endValidUntil: endValidUntil ? formatDateForBackend(endValidUntil) : undefined,
      quoteNumber: filters.quoteNumber?.trim() || undefined,
      title: filters.title?.trim() || undefined,
      supplierId: filters.supplierId || undefined,
      status: filters.status === 'all' ? undefined : filters.status,
      assignedToId: filters.assignedToId || undefined,
      minValue: filters.minValue && filters.minValue > 0 ? filters.minValue : undefined,
      maxValue: filters.maxValue && filters.maxValue > 0 ? filters.maxValue : undefined,
    };
    onGenerate(filtersToSend);
  };

  const handleReset = () => {
    setStartValidUntil(null);
    setEndValidUntil(null);
    setFilters({
      quoteNumber: '',
      title: '',
      supplierId: '',
      status: 'all',
      assignedToId: '',
      minValue: undefined,
      maxValue: undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileDown className="h-6 w-6" />
            </div>
            Gerar Relatório de Cotações
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            Configure os filtros para gerar o relatório em PDF
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Filtros de Busca */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Search className="h-5 w-5 text-seguranca-red" />
                </div>
                Busca por Texto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quoteNumber" className="text-seguranca-lightgray font-medium">
                    Número da Cotação
                  </Label>
                  <Input
                    id="quoteNumber"
                    value={filters.quoteNumber || ''}
                    onChange={(e) => setFilters({ ...filters, quoteNumber: e.target.value })}
                    placeholder="Ex: COT-2024-001"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-seguranca-lightgray font-medium">
                    Título
                  </Label>
                  <Input
                    id="title"
                    value={filters.title || ''}
                    onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                    placeholder="Buscar por título..."
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Filtros de Seleção */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Filter className="h-5 w-5 text-seguranca-red" />
                </div>
                Filtros de Seleção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier" className="text-seguranca-lightgray font-medium">
                    Fornecedor
                  </Label>
                  <Select
                    value={filters.supplierId || 'all'}
                    onValueChange={(value) =>
                      setFilters({ ...filters, supplierId: value === 'all' ? '' : value })
                    }
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Todos os fornecedores" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Todos os fornecedores
                      </SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem
                          key={supplier.id}
                          value={String(supplier.id)}
                          className="text-seguranca-lightgray hover:bg-seguranca-red/20"
                        >
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-seguranca-lightgray font-medium">
                    Status
                  </Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Todos os status
                      </SelectItem>
                      <SelectItem value="DRAFT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Rascunho
                      </SelectItem>
                      <SelectItem value="SENT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Enviada
                      </SelectItem>
                      <SelectItem value="APPROVED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Aprovada
                      </SelectItem>
                      <SelectItem value="REJECTED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Rejeitada
                      </SelectItem>
                      <SelectItem value="EXPIRED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Expirada
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo" className="text-seguranca-lightgray font-medium">
                    Responsável
                  </Label>
                  <Select
                    value={filters.assignedToId || 'all'}
                    onValueChange={(value) =>
                      setFilters({ ...filters, assignedToId: value === 'all' ? '' : value })
                    }
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Todos os responsáveis" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Todos os responsáveis
                      </SelectItem>
                      {users.map((user) => (
                        <SelectItem
                          key={user.id}
                          value={String(user.id)}
                          className="text-seguranca-lightgray hover:bg-seguranca-red/20"
                        >
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Filtros de Data */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-seguranca-red" />
                </div>
                Validade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startValidUntil" className="text-seguranca-lightgray font-medium">
                    Data Inicial
                  </Label>
                  <DatePicker
                    selected={startValidUntil}
                    onChange={(date) => setStartValidUntil(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    placeholderText="dd/mm/aaaa"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow bg-seguranca-graphite !text-seguranca-lightgray !placeholder:text-gray-400 font-medium h-11"
                    id="startValidUntil"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endValidUntil" className="text-seguranca-lightgray font-medium">
                    Data Final
                  </Label>
                  <DatePicker
                    selected={endValidUntil}
                    onChange={(date) => setEndValidUntil(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    placeholderText="dd/mm/aaaa"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow bg-seguranca-graphite !text-seguranca-lightgray !placeholder:text-gray-400 font-medium h-11"
                    id="endValidUntil"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Filtros de Valor */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-seguranca-red" />
                </div>
                Valor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minValue" className="text-seguranca-lightgray font-medium">
                    Valor Mínimo
                  </Label>
                  <Input
                    id="minValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={filters.minValue || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minValue: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="0,00"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxValue" className="text-seguranca-lightgray font-medium">
                    Valor Máximo
                  </Label>
                  <Input
                    id="maxValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={filters.maxValue || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        maxValue: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="0,00"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white"
              >
                {loading ? (
                  <>
                    <FileDown className="h-4 w-4 mr-2 animate-pulse" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Gerar Relatório PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

