import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportFiltersModalProps {
  onGenerateReport: (filters: ReportFilters, format: 'pdf' | 'excel') => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  vehicleFilter?: string;
  driverFilter?: string;
  statusFilter?: string;
  amountMin?: number;
  amountMax?: number;
}

const ReportFiltersModal: React.FC<ReportFiltersModalProps> = ({
  onGenerateReport,
  isOpen,
  onOpenChange
}) => {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenerate = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true);
    try {
      await onGenerateReport(filters, format);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros para Relatório de Multas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Período */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-seguranca-lightgray">Período</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-gray-300">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-gray-600 text-gray-300 hover:bg-seguranca-black"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ? format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-seguranca-graphite border-gray-600">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => handleFilterChange('startDate', date)}
                      initialFocus
                      className="bg-seguranca-graphite"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-gray-300">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-gray-600 text-gray-300 hover:bg-seguranca-black"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.endDate ? format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-seguranca-graphite border-gray-600">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => handleFilterChange('endDate', date)}
                      initialFocus
                      className="bg-seguranca-graphite"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Filtros de Conteúdo */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-seguranca-lightgray">Filtros de Conteúdo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleFilter" className="text-gray-300">Veículo (Placa)</Label>
                <Input
                  id="vehicleFilter"
                  placeholder="Ex: ABC-1234"
                  value={filters.vehicleFilter || ''}
                  onChange={(e) => handleFilterChange('vehicleFilter', e.target.value)}
                  className="border-gray-600 bg-seguranca-black text-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverFilter" className="text-gray-300">Motorista</Label>
                <Input
                  id="driverFilter"
                  placeholder="Nome do motorista"
                  value={filters.driverFilter || ''}
                  onChange={(e) => handleFilterChange('driverFilter', e.target.value)}
                  className="border-gray-600 bg-seguranca-black text-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statusFilter" className="text-gray-300">Status</Label>
                <Select
                  value={filters.statusFilter || ''}
                  onValueChange={(value) => handleFilterChange('statusFilter', value)}
                >
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-gray-300">
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="PAID">Paga</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountRange" className="text-gray-300">Valor (R$)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Mínimo"
                    type="number"
                    value={filters.amountMin || ''}
                    onChange={(e) => handleFilterChange('amountMin', e.target.value ? Number(e.target.value) : undefined)}
                    className="border-gray-600 bg-seguranca-black text-gray-300"
                  />
                  <Input
                    placeholder="Máximo"
                    type="number"
                    value={filters.amountMax || ''}
                    onChange={(e) => handleFilterChange('amountMax', e.target.value ? Number(e.target.value) : undefined)}
                    className="border-gray-600 bg-seguranca-black text-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-600">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-gray-600 text-gray-300 hover:bg-seguranca-black"
            >
              Limpar Filtros
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={() => handleGenerate('pdf')}
                disabled={isGenerating}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Gerando...' : 'Gerar PDF'}
              </Button>
              <Button
                onClick={() => handleGenerate('excel')}
                disabled={isGenerating}
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isGenerating ? 'Gerando...' : 'Gerar Excel'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportFiltersModal;
