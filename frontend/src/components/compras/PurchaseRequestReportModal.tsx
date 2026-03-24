import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PurchaseRequestReportFilters } from '@/utils/purchaseRequestReportGenerator';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import { formatDateForBackend } from '@/utils/dateUtils';
import { Calendar, Filter, DollarSign, FileDown, Loader2 } from 'lucide-react';

interface PurchaseRequestReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (filters: PurchaseRequestReportFilters) => void;
  loading?: boolean;
}

export function PurchaseRequestReportModal({
  isOpen,
  onClose,
  onGenerate,
  loading = false,
}: PurchaseRequestReportModalProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState<PurchaseRequestReportFilters>({
    startDate: '',
    endDate: '',
    status: 'all',
    minValue: undefined,
    maxValue: undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filtersToSend: PurchaseRequestReportFilters = {
      ...filters,
      startDate: startDate ? formatDateForBackend(startDate) : undefined,
      endDate: endDate ? formatDateForBackend(endDate) : undefined,
    };
    onGenerate(filtersToSend);
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setFilters({
      startDate: '',
      endDate: '',
      status: 'all',
      minValue: undefined,
      maxValue: undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileDown className="h-6 w-6" />
            </div>
            Gerar Relatório de Solicitações de Compra
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            Configure os filtros para gerar o relatório em PDF
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Filtros de Data */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-seguranca-red" />
                </div>
                Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-seguranca-lightgray font-medium">
                    Data Inicial
                  </Label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    placeholderText="dd/mm/aaaa"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow bg-seguranca-graphite !text-seguranca-lightgray !placeholder:text-gray-400 font-medium h-11"
                    id="startDate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-seguranca-lightgray font-medium">
                    Data Final
                  </Label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    placeholderText="dd/mm/aaaa"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow bg-seguranca-graphite !text-seguranca-lightgray !placeholder:text-gray-400 font-medium h-11"
                    id="endDate"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Filtro de Status */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Filter className="h-5 w-5 text-seguranca-red" />
                </div>
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-seguranca-lightgray font-medium">
                  Status da Solicitação
                </Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value })
                  }
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder="Todos os Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                      Todos os Status
                    </SelectItem>
                    <SelectItem value="DRAFT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                      Rascunho
                    </SelectItem>
                    <SelectItem value="SUBMITTED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                      Enviada
                    </SelectItem>
                    <SelectItem value="PENDING" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                      Pendente
                    </SelectItem>
                    <SelectItem value="IN_PROCESS" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                      Em Processo
                    </SelectItem>
                    <SelectItem value="APPROVED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                      Aprovada
                    </SelectItem>
                    <SelectItem value="REJECTED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                      Rejeitada
                    </SelectItem>
                    <SelectItem value="COMPLETED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                      Completada
                    </SelectItem>
                    <SelectItem value="CANCELLED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                      Cancelada
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                    Valor Mínimo (R$)
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
                    Valor Máximo (R$)
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

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              Limpar Filtros
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Gerar Relatório PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

