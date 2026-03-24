import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileText, FileSpreadsheet, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ClientStatus } from '@/types/client';

export interface ReportFilters {
  name?: string;
  cnpj?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ClientStatus | 'all';
  format: 'pdf' | 'excel';
}

interface ClientReportFiltersProps {
  onGenerate: (filters: ReportFilters) => void;
  isLoading: boolean;
}

export const ClientReportFilters: React.FC<ClientReportFiltersProps> = ({ onGenerate, isLoading }) => {
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<ClientStatus | 'all'>('all');
  const [formatType, setFormatType] = useState<'pdf' | 'excel'>('pdf');

  const handleGenerate = () => {
    onGenerate({
      name: name || undefined,
      cnpj: cnpj.replace(/\D/g, '') || undefined, // Remove mask for backend
      startDate,
      endDate,
      status: status === 'all' ? undefined : status,
      format: formatType,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg shadow-inner bg-seguranca-black/50 border-gray-600/30">
      <div className="space-y-2">
        <Label htmlFor="report-name" className="text-gray-300">Nome</Label>
        <Input
          id="report-name"
          placeholder="Nome do cliente"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-seguranca-graphite/50 border-gray-600/30 text-white placeholder-gray-400"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="report-cnpj" className="text-gray-300">CNPJ</Label>
        <Input
          id="report-cnpj"
          placeholder="CNPJ do cliente"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          className="bg-seguranca-graphite/50 border-gray-600/30 text-white placeholder-gray-400"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="report-status" className="text-gray-300">Status</Label>
        <Select value={status} onValueChange={(value: ClientStatus | 'all') => setStatus(value)}>
          <SelectTrigger className="bg-seguranca-graphite/50 border-gray-600/30 text-white">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent className="bg-seguranca-black border-gray-600/30">
            <SelectItem value="all" className="text-white">Todos</SelectItem>
            <SelectItem value={ClientStatus.ACTIVE} className="text-green-300">Ativo</SelectItem>
            <SelectItem value={ClientStatus.INACTIVE} className="text-gray-300">Inativo</SelectItem>
            <SelectItem value={ClientStatus.SUSPENDED} className="text-red-300">Suspenso</SelectItem>
            <SelectItem value={ClientStatus.PENDING} className="text-yellow-300">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="report-format" className="text-gray-300">Formato</Label>
        <Select value={formatType} onValueChange={(value: 'pdf' | 'excel') => setFormatType(value)}>
          <SelectTrigger className="bg-seguranca-graphite/50 border-gray-600/30 text-white">
            <SelectValue placeholder="Formato do relatório" />
          </SelectTrigger>
          <SelectContent className="bg-seguranca-black border-gray-600/30">
            <SelectItem value="pdf" className="text-white">PDF</SelectItem>
            <SelectItem value="excel" className="text-white">Excel</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="report-start-date" className="text-gray-300">Data Início</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal bg-seguranca-graphite/50 border-gray-600/30 text-white",
                !startDate && "text-gray-400"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Selecione a data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-seguranca-black border-gray-600/30">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="report-end-date" className="text-gray-300">Data Fim</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal bg-seguranca-graphite/50 border-gray-600/30 text-white",
                !endDate && "text-gray-400"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : <span>Selecione a data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-seguranca-black border-gray-600/30">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="col-span-full flex justify-end mt-4">
        <Button
          onClick={handleGenerate}
          disabled={isLoading}
          className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red shadow-lg shadow-seguranca-red/20"
        >
          <Filter size={20} className="mr-2" />
          Gerar Relatório
        </Button>
      </div>
    </div>
  );
};