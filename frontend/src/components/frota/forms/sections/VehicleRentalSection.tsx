import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { VehicleFormSectionProps } from '../types';
import { clientService, Client } from '@/services/clientService';
import { contractService, Contract } from '@/services/contractService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { rentalInvoiceService } from '@/services/rentalInvoiceService';
import fleetService from '@/services/fleetService';
import {
  vehicleRentalExpenseService,
  VehicleRentalExpense,
  RENTAL_EXPENSE_CATEGORY_LABELS,
  RENTAL_EXPENSE_RESPONSIBILITY_LABELS,
  RENTAL_EXPENSE_STATUS_CONFIG,
} from '@/services/vehicleRentalExpenseService';
import { VehicleRentalReportService } from '@/services/vehicleRentalReportService';
import {
  Truck,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Receipt,
  X,
  Save,
} from 'lucide-react';

const formatCurrency = (val?: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  const clean = dateStr.substring(0, 10);
  const parts = clean.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
};

export const VehicleRentalSection: React.FC<VehicleFormSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  const { toast } = useToast();

  // Queries de apoio
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-for-rental-tab'],
    queryFn: () => clientService.getAllClients(),
    retry: 1,
  });

  const { data: workPosts = [], isLoading: workPostsLoading } = useQuery({
    queryKey: ['workPosts'],
    queryFn: () => workPostService.getWorkPosts(),
    retry: 1,
  });

  const { data: allRentalInvoices = [] } = useQuery({
    queryKey: ['rental-invoices-for-vehicle-tab'],
    queryFn: () => rentalInvoiceService.list(),
    staleTime: 30000,
    retry: 1,
  });

  // Resolver cliente válido
  const currentClientId = useMemo(() => {
    const candidateId = formData.clientId || formData.empresaId;
    if (!clients || clients.length === 0) return candidateId || '';
    if (candidateId && clients.some(c => c.id === candidateId)) return candidateId;
    const candidateName = (formData.clientName || formData.empresa || '').trim().toLowerCase();
    if (candidateName) {
      const byName = clients.find(c => (c.name || '').trim().toLowerCase() === candidateName);
      if (byName) return byName.id;
    }
    return '';
  }, [clients, formData.clientId, formData.empresaId, formData.clientName, formData.empresa]);

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-for-rental-tab', currentClientId],
    queryFn: () => contractService.getContracts(currentClientId ? { clientId: currentClientId } : {}),
    retry: 1,
  });

  const selectedClient = useMemo(
    () => clients.find(c => c.id === currentClientId) || null,
    [clients, currentClientId]
  );

  // Faturas de locação em que este veículo consta
  const vehicleInvoices = useMemo(() => {
    const cleanPlate = (formData.placa || '').trim().toUpperCase();
    return allRentalInvoices.filter(inv =>
      inv.items?.some(
        item =>
          (formData.vehicleId && item.vehicleId === formData.vehicleId) ||
          (cleanPlate && (item.plate || '').trim().toUpperCase() === cleanPlate)
      )
    );
  }, [allRentalInvoices, formData.vehicleId, formData.placa]);

  // Obras filtradas pelo cliente
  const filteredWorkPosts = useMemo(() => {
    if (!workPosts || workPosts.length === 0) return [];
    if (!currentClientId) return workPosts;
    const matching = workPosts.filter((wp: any) => wp.clientId === currentClientId);
    return matching.length > 0 ? matching : workPosts;
  }, [workPosts, currentClientId]);

  // Sincronização automática de dados da locação a partir de faturas/obras quando campos estão vazios
  useEffect(() => {
    if (vehicleInvoices.length > 0) {
      const latestInv = vehicleInvoices[0];
      const matchedItem = latestInv.items?.find(
        i =>
          (formData.vehicleId && i.vehicleId === formData.vehicleId) ||
          (formData.placa && (i.plate || '').trim().toUpperCase() === formData.placa.trim().toUpperCase())
      );

      if (!currentClientId && latestInv.clientId) {
        handleInputChange('clientId', latestInv.clientId);
        handleInputChange('empresaId', latestInv.clientId);
        if (latestInv.clientName) {
          handleInputChange('clientName', latestInv.clientName);
          handleInputChange('empresa', latestInv.clientName);
        }
      }
      if (!formData.allocationContractNumber && latestInv.contractNumber) {
        handleInputChange('allocationContractNumber', latestInv.contractNumber);
      }
      if (!formData.allocationStartDate && latestInv.periodStart) {
        handleInputChange('allocationStartDate', latestInv.periodStart.substring(0, 10));
      }
      if (!formData.allocationEndDate && latestInv.periodEnd) {
        handleInputChange('allocationEndDate', latestInv.periodEnd.substring(0, 10));
      }
      if (!formData.rentalMonthlyRate && matchedItem?.amount) {
        handleInputChange('rentalMonthlyRate', Number(matchedItem.amount) || 0);
      }
    }
  }, [vehicleInvoices, currentClientId]);

  useEffect(() => {
    if (currentClientId && !formData.postoDeTrabalho && workPosts.length > 0) {
      const clientPosts = workPosts.filter((wp: any) => wp.clientId === currentClientId);
      if (clientPosts.length > 0) {
        handleInputChange('postoDeTrabalho', clientPosts[0].id);
        if (!formData.obraSetorNome && clientPosts[0].name) {
          handleInputChange('obraSetorNome', clientPosts[0].name);
        }
      }
    } else if (formData.postoDeTrabalho && !formData.obraSetorNome && workPosts.length > 0) {
      const wp = workPosts.find(w => w.id === formData.postoDeTrabalho);
      if (wp?.name) {
        handleInputChange('obraSetorNome', wp.name);
      }
    }
  }, [currentClientId, formData.postoDeTrabalho, workPosts]);

  // Estado das Despesas da Locação
  const [expenses, setExpenses] = useState<VehicleRentalExpense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [savingExpense, setSavingExpense] = useState(false);
  const [syncingRecords, setSyncingRecords] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    expenseDate: new Date().toISOString().substring(0, 10),
    category: 'MANUTENCAO',
    description: '',
    workPostName: '',
    documentNumber: '',
    amount: '',
    responsibility: 'CLIENTE',
    reimbursementStatus: 'PENDENTE',
    notes: '',
  });

  const vehicleKey = formData.vehicleId || formData.placa || 'temp-vehicle';

  const loadExpenses = async () => {
    if (!vehicleKey) return;
    setLoadingExpenses(true);
    try {
      const list = await vehicleRentalExpenseService.listByVehicle(vehicleKey);
      setExpenses(list);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [vehicleKey]);

  const handleClientChange = (selectedId: string) => {
    const client = clients.find(c => c.id === selectedId);
    const name = client?.name || '';
    handleInputChange('clientId', selectedId);
    handleInputChange('clientName', name);
    handleInputChange('empresaId', selectedId);
    handleInputChange('empresa', name);

    const clientPosts = workPosts.filter((w: any) => w.clientId === selectedId);
    if (clientPosts.length > 0) {
      handleInputChange('postoDeTrabalho', clientPosts[0].id);
      handleInputChange('obraSetorNome', clientPosts[0].name || '');
    }

    const clientContracts = contracts.filter(c => c.clientId === selectedId);
    if (clientContracts.length > 0) {
      const active = clientContracts.find(c => c.status === 'ACTIVE') || clientContracts[0];
      if (active) {
        handleContractSelect(active);
      }
    }
  };

  const handleContractSelect = (contract: Contract) => {
    const num = contract.contractNumber || (contract as any).number || '';
    handleInputChange('allocationContractNumber', num);
    if (contract.startDate) {
      handleInputChange('allocationStartDate', contract.startDate.split('T')[0]);
    }
    if (contract.endDate) {
      handleInputChange('allocationEndDate', contract.endDate.split('T')[0]);
    }
    if ((contract as any).unitVehicleValue) {
      handleInputChange('rentalMonthlyRate', Number((contract as any).unitVehicleValue) || 0);
    }
  };

  const openNewExpenseForm = () => {
    setEditingExpenseId(null);
    setExpenseForm({
      expenseDate: new Date().toISOString().substring(0, 10),
      category: 'MANUTENCAO',
      description: '',
      workPostName: formData.obraSetorNome || '',
      documentNumber: '',
      amount: '',
      responsibility: 'CLIENTE',
      reimbursementStatus: 'PENDENTE',
      notes: '',
    });
    setIsExpenseFormOpen(true);
  };

  const openEditExpenseForm = (exp: VehicleRentalExpense) => {
    setEditingExpenseId(exp.id);
    setExpenseForm({
      expenseDate: (exp.expenseDate || new Date().toISOString()).substring(0, 10),
      category: exp.category || 'MANUTENCAO',
      description: exp.description || '',
      workPostName: exp.workPostName || formData.obraSetorNome || '',
      documentNumber: exp.documentNumber || '',
      amount: String(exp.amount ?? ''),
      responsibility: exp.responsibility || 'CLIENTE',
      reimbursementStatus: exp.reimbursementStatus || 'PENDENTE',
      notes: exp.notes || '',
    });
    setIsExpenseFormOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.description.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Informe a descrição da despesa da locação.',
        variant: 'destructive',
      });
      return;
    }
    const numericAmount = parseFloat(String(expenseForm.amount).replace(',', '.')) || 0;
    if (numericAmount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor maior que zero para a despesa.',
        variant: 'destructive',
      });
      return;
    }

    setSavingExpense(true);
    try {
      const payload = {
        clientId: currentClientId || undefined,
        clientName: formData.clientName || selectedClient?.name || undefined,
        workPostId: formData.postoDeTrabalho || undefined,
        workPostName: expenseForm.workPostName || formData.obraSetorNome || undefined,
        contractNumber: formData.allocationContractNumber || undefined,
        expenseDate: expenseForm.expenseDate,
        category: expenseForm.category,
        description: expenseForm.description.trim(),
        documentNumber: expenseForm.documentNumber.trim() || undefined,
        amount: numericAmount,
        responsibility: expenseForm.responsibility,
        reimbursementStatus: expenseForm.reimbursementStatus,
        notes: expenseForm.notes.trim() || undefined,
      };

      if (editingExpenseId) {
        await vehicleRentalExpenseService.update(vehicleKey, editingExpenseId, payload);
        toast({ title: 'Despesa atualizada', description: 'Despesa da locação atualizada com sucesso.' });
      } else {
        await vehicleRentalExpenseService.create(vehicleKey, payload);
        toast({ title: 'Despesa registrada', description: 'Despesa de responsabilidade do cliente adicionada.' });
      }

      setIsExpenseFormOpen(false);
      setEditingExpenseId(null);
      await loadExpenses();
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expId: string) => {
    await vehicleRentalExpenseService.remove(vehicleKey, expId);
    toast({ title: 'Despesa removida', description: 'O lançamento foi excluído da listagem.' });
    await loadExpenses();
  };

  // Importar manutenções e multas do veículo durante o período da locação
  const handleSyncVehicleMaintenancesAndFines = async () => {
    if (!formData.vehicleId) {
      toast({
        title: 'Salve o veículo primeiro',
        description: 'Para importar manutenções ou multas existentes, o veículo já deve estar salvo.',
        variant: 'destructive',
      });
      return;
    }

    setSyncingRecords(true);
    try {
      const [maintenances, fines] = await Promise.all([
        fleetService.getMaintenances(formData.vehicleId).catch(() => []),
        fleetService.getFines(formData.vehicleId).catch(() => []),
      ]);

      const existingDocs = new Set(expenses.map(e => `${e.category}:${e.description}:${e.expenseDate}`));
      let importedCount = 0;

      for (const m of maintenances || []) {
        const dateStr = (m.date || new Date().toISOString()).substring(0, 10);
        const desc = m.description || `Manutenção ${m.maintenanceType || ''}`.trim();
        const key = `MANUTENCAO:${desc}:${dateStr}`;
        if (!existingDocs.has(key) && Number(m.cost) > 0) {
          await vehicleRentalExpenseService.create(vehicleKey, {
            clientId: currentClientId || undefined,
            clientName: formData.clientName || selectedClient?.name || undefined,
            workPostId: formData.postoDeTrabalho || undefined,
            workPostName: formData.obraSetorNome || undefined,
            contractNumber: formData.allocationContractNumber || undefined,
            expenseDate: dateStr,
            category: 'MANUTENCAO',
            description: desc,
            documentNumber: m.provider || undefined,
            amount: Number(m.cost) || 0,
            responsibility: 'CLIENTE',
            reimbursementStatus: 'PENDENTE',
            notes: m.notes || 'Importado do histórico de manutenções do veículo',
          });
          existingDocs.add(key);
          importedCount++;
        }
      }

      for (const f of fines || []) {
        const dateStr = (f.date || new Date().toISOString()).substring(0, 10);
        const desc = f.description || `Infração de trânsito (${f.location || ''})`.trim();
        const key = `MULTA_INFRACAO:${desc}:${dateStr}`;
        if (!existingDocs.has(key) && Number(f.amount) > 0) {
          await vehicleRentalExpenseService.create(vehicleKey, {
            clientId: currentClientId || undefined,
            clientName: formData.clientName || selectedClient?.name || undefined,
            workPostId: formData.postoDeTrabalho || undefined,
            workPostName: formData.obraSetorNome || undefined,
            contractNumber: formData.allocationContractNumber || undefined,
            expenseDate: dateStr,
            category: 'MULTA_INFRACAO',
            description: desc,
            documentNumber: f.location || undefined,
            amount: Number(f.amount) || 0,
            responsibility: 'CLIENTE',
            reimbursementStatus: f.status === 'PAID' ? 'PAGO_PELO_CLIENTE' : 'PENDENTE',
            notes: 'Importado do histórico de multas do veículo',
          });
          existingDocs.add(key);
          importedCount++;
        }
      }

      await loadExpenses();

      if (importedCount > 0) {
        toast({
          title: 'Despesas importadas',
          description: `${importedCount} lançamento(s) de manutenção/multas importados para a locação.`,
        });
      } else {
        toast({
          title: 'Nenhum novo registro encontrado',
          description: 'Não há novas manutenções ou multas com valor para importar neste veículo.',
        });
      }
    } finally {
      setSyncingRecords(false);
    }
  };

  // Totais das despesas
  const expenseTotals = useMemo(() => {
    const clientResp = expenses.filter(e => (e.responsibility || 'CLIENTE') !== 'LOCADORA');
    const totalClient = clientResp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalPending = clientResp
      .filter(e => e.reimbursementStatus === 'PENDENTE' || e.reimbursementStatus === 'FATURADO')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalPaid = clientResp
      .filter(e => e.reimbursementStatus === 'PAGO_PELO_CLIENTE' || e.reimbursementStatus === 'REEMBOLSADO')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return {
      count: expenses.length,
      totalClient,
      totalPending,
      totalPaid,
    };
  }, [expenses]);

  const buildReportData = () => {
    const wpObj = workPosts.find(w => w.id === formData.postoDeTrabalho);
    const resolvedObra = formData.obraSetorNome || wpObj?.name || 'Não informado';
    const resolvedClientName = formData.clientName || selectedClient?.name || formData.empresa || 'Não alocado';

    return {
      vehicle: {
        id: formData.vehicleId,
        placa: formData.placa || '—',
        marca: formData.marca || '',
        modelo: formData.modelo || '',
        ano: formData.ano,
        cor: formData.cor,
        combustivel: formData.combustivel,
        quilometragem: formData.quilometragem,
        status: formData.status,
        vehicleType: formData.vehicleType,
        chassi: formData.chassi,
        renavan: formData.renavan,
      },
      rental: {
        clientId: currentClientId,
        clientName: resolvedClientName,
        clientCnpj: selectedClient?.cnpj || vehicleInvoices[0]?.clientCnpj || '',
        workPostName: resolvedObra,
        contractNumber: formData.allocationContractNumber || vehicleInvoices[0]?.contractNumber || '',
        startDate: formData.allocationStartDate || vehicleInvoices[0]?.periodStart || '',
        endDate: formData.allocationEndDate || vehicleInvoices[0]?.periodEnd || '',
        monthlyRate:
          formData.rentalMonthlyRate ||
          vehicleInvoices[0]?.items?.find(i => i.plate === formData.placa)?.amount ||
          0,
        garageName: formData.garagemNome || '',
        departmentName: formData.departamento || '',
      },
      expenses,
      invoices: vehicleInvoices,
    };
  };

  const handleExportPDF = () => {
    try {
      VehicleRentalReportService.generatePDF(buildReportData());
      toast({
        title: 'Relatório PDF Gerado',
        description: `Relatório de locação e despesas do veículo ${formData.placa} baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF de locação:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar o relatório em PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleExportExcel = () => {
    try {
      VehicleRentalReportService.generateExcel(buildReportData());
      toast({
        title: 'Relatório Excel Gerado',
        description: `Planilha de locação e despesas do veículo ${formData.placa} baixada com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao gerar Excel de locação:', error);
      toast({
        title: 'Erro ao gerar Excel',
        description: 'Não foi possível gerar a planilha em Excel.',
        variant: 'destructive',
      });
    }
  };

  const resolvedObraDisplay =
    formData.obraSetorNome ||
    workPosts.find(w => w.id === formData.postoDeTrabalho)?.name ||
    '';

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Aba de Locação com Exportação PDF e Excel */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 via-zinc-900 to-zinc-900 border border-amber-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 shrink-0 mt-0.5">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">Gestão de Locação do Veículo & Despesas do Cliente</h3>
              {(formData.clientName || selectedClient?.name) ? (
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Locado: {formData.clientName || selectedClient?.name}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-xs">
                  Sem Locação Ativa
                </Badge>
              )}
              {resolvedObraDisplay && (
                <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  Obra/Setor: {resolvedObraDisplay}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Controle o cliente, a obra/setor de trabalho, o período (data inicial e final) e liste todas as despesas da locação de responsabilidade do cliente com emissão de relatório em PDF e Excel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="bg-red-600/15 border-red-500/40 hover:bg-red-600/25 text-red-300 font-semibold text-xs h-9 px-3 gap-1.5"
          >
            <FileText className="h-4 w-4 text-red-400" />
            Relatório PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="bg-emerald-600/15 border-emerald-500/40 hover:bg-emerald-600/25 text-emerald-300 font-semibold text-xs h-9 px-3 gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            Relatório Excel
          </Button>
        </div>
      </div>

      {/* SEÇÃO 1: Dados do Cliente, Obra/Setor e Vigência da Locação */}
      <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wide">
              1. Cliente Alocado, Obra / Setor de Trabalho e Período da Locação
            </h4>
          </div>
          {formData.allocationStartDate && (
            <span className="text-xs text-amber-300 font-medium">
              Vigência: {formatDate(formData.allocationStartDate)} até{' '}
              {formData.allocationEndDate ? formatDate(formData.allocationEndDate) : 'Em Aberto'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Cliente onde o veículo está alocado */}
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs font-semibold">Cliente onde o Veículo está Alocado *</Label>
            <Select
              value={currentClientId || ''}
              onValueChange={handleClientChange}
              disabled={clientsLoading}
            >
              <SelectTrigger className="bg-gray-900/70 border-gray-600 text-white focus:border-amber-500">
                <SelectValue placeholder={formData.clientName || 'Selecione o cliente da locação...'} />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
                {clients.map((client: Client) => (
                  <SelectItem key={client.id} value={client.id} className="text-white hover:bg-gray-700">
                    {client.name} {client.cnpj ? `(${client.cnpj})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Posto de Trabalho / Obra Cadastrada */}
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs font-semibold">Posto de Trabalho / Obra (Cadastro)</Label>
            <Select
              value={formData.postoDeTrabalho || ''}
              onValueChange={val => {
                const wp = workPosts.find(w => w.id === val);
                handleInputChange('postoDeTrabalho', val);
                if (wp?.name) {
                  handleInputChange('obraSetorNome', wp.name);
                }
                if (wp?.clientId && wp.clientId !== currentClientId) {
                  handleClientChange(wp.clientId);
                }
              }}
              disabled={workPostsLoading}
            >
              <SelectTrigger className="bg-gray-900/70 border-gray-600 text-white focus:border-amber-500">
                <SelectValue placeholder={resolvedObraDisplay || 'Selecione o posto / obra...'} />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-600 z-[10060]">
                {filteredWorkPosts.length > 0 ? (
                  filteredWorkPosts.map((wp: WorkPost) => (
                    <SelectItem key={wp.id} value={wp.id} className="text-white hover:bg-gray-700">
                      {wp.name} {wp.postCode ? `(${wp.postCode})` : ''}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Nenhum posto cadastrado para este cliente
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Obra / Setor de Trabalho (Descrição direta) */}
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs font-semibold">Obra / Setor de Trabalho Alocado *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
              <Input
                value={formData.obraSetorNome || ''}
                onChange={e => handleInputChange('obraSetorNome', e.target.value)}
                placeholder="Ex: Obra Barragem / Setor Operacional..."
                className="bg-gray-900/70 border-gray-600 text-white pl-9 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Data Inicial da Locação */}
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              Data Inicial da Locação *
            </Label>
            <Input
              type="date"
              value={formData.allocationStartDate || ''}
              onChange={e => handleInputChange('allocationStartDate', e.target.value)}
              className="bg-gray-900/70 border-gray-600 text-white focus:border-amber-500"
            />
          </div>

          {/* Data Final da Locação (se tiver) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                Data Final da Locação (se tiver)
              </Label>
              {formData.allocationEndDate && (
                <button
                  type="button"
                  onClick={() => handleInputChange('allocationEndDate', '')}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Deixar em aberto
                </button>
              )}
            </div>
            <Input
              type="date"
              value={formData.allocationEndDate || ''}
              onChange={e => handleInputChange('allocationEndDate', e.target.value)}
              className="bg-gray-900/70 border-gray-600 text-white focus:border-amber-500"
            />
          </div>

          {/* Nº Contrato & Valor Mensal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs font-semibold">Nº Contrato</Label>
              <Input
                value={formData.allocationContractNumber || ''}
                onChange={e => handleInputChange('allocationContractNumber', e.target.value)}
                placeholder="Ex: QO-2026..."
                className="bg-gray-900/70 border-gray-600 text-white focus:border-amber-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs font-semibold">Valor Locação (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.rentalMonthlyRate ?? ''}
                onChange={e => handleInputChange('rentalMonthlyRate', parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="bg-gray-900/70 border-gray-600 text-white font-mono focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Faturas de Locação Vinculadas */}
        {vehicleInvoices.length > 0 && (
          <div className="pt-2 border-t border-gray-700/70">
            <span className="text-xs font-semibold text-gray-400 block mb-2">
              Faturas de Locação Vinculadas a este Veículo ({vehicleInvoices.length}):
            </span>
            <div className="flex flex-wrap gap-2">
              {vehicleInvoices.map(inv => (
                <div
                  key={inv.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/80 border border-amber-500/30 text-xs"
                >
                  <Receipt className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-mono font-bold text-amber-300">Fatura Nº {inv.number}</span>
                  <span className="text-gray-300">{inv.clientName}</span>
                  <span className="text-gray-400">
                    ({formatDate(inv.periodStart)} a {formatDate(inv.periodEnd)})
                  </span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {formatCurrency(inv.netAmount || inv.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: Despesas com essa Locação (Responsabilidade do Cliente) */}
      <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-700 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                2. Despesas com a Locação (Responsabilidade do Cliente)
              </h4>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Registre e acompanhe todas as despesas ocorridas na locação que são de responsabilidade do cliente contratante.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {formData.vehicleId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={syncingRecords}
                onClick={handleSyncVehicleMaintenancesAndFines}
                className="bg-gray-900 border-gray-600 hover:bg-gray-800 text-gray-200 text-xs h-8 gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncingRecords ? 'animate-spin' : ''}`} />
                Importar Manutenções / Multas
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={openNewExpenseForm}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-8 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Despesa do Cliente
            </Button>
          </div>
        </div>

        {/* Cards Totalizadores das Despesas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-gray-900/70 border border-red-500/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-gray-400">
                Total Despesas (Resp. Cliente)
              </p>
              <p className="text-lg font-extrabold text-red-400 font-mono mt-0.5">
                {formatCurrency(expenseTotals.totalClient)}
              </p>
            </div>
            <Badge className="bg-red-500/15 text-red-300 border-red-500/30 text-xs">
              {expenseTotals.count} item(ns)
            </Badge>
          </div>

          <div className="p-3.5 rounded-lg bg-gray-900/70 border border-amber-500/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-gray-400">
                Pendente de Cobrança / Reembolso
              </p>
              <p className="text-lg font-extrabold text-amber-400 font-mono mt-0.5">
                {formatCurrency(expenseTotals.totalPending)}
              </p>
            </div>
            <AlertCircle className="h-5 w-5 text-amber-400/70" />
          </div>

          <div className="p-3.5 rounded-lg bg-gray-900/70 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-gray-400">
                Pago / Reembolsado pelo Cliente
              </p>
              <p className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">
                {formatCurrency(expenseTotals.totalPaid)}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400/70" />
          </div>
        </div>

        {/* Formulário Inline de Nova / Edição de Despesa */}
        {isExpenseFormOpen && (
          <div className="p-4 rounded-xl bg-gray-900/90 border border-amber-500/40 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase text-amber-400">
                {editingExpenseId ? 'Editar Despesa da Locação' : 'Nova Despesa da Locação (Responsabilidade do Cliente)'}
              </h5>
              <button
                type="button"
                onClick={() => setIsExpenseFormOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Data da Despesa *</Label>
                <Input
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={e => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                  className="bg-gray-950 border-gray-700 text-white h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Categoria *</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={val => setExpenseForm(prev => ({ ...prev, category: val }))}
                >
                  <SelectTrigger className="bg-gray-950 border-gray-700 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 z-[10060]">
                    {Object.entries(RENTAL_EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-white text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-gray-300">Descrição da Despesa *</Label>
                <Input
                  value={expenseForm.description}
                  onChange={e => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Substituição de pneu danificado em obra, reparo de para-brisa..."
                  className="bg-gray-950 border-gray-700 text-white h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Obra / Setor de Trabalho</Label>
                <Input
                  value={expenseForm.workPostName}
                  onChange={e => setExpenseForm(prev => ({ ...prev, workPostName: e.target.value }))}
                  placeholder={resolvedObraDisplay || 'Obra / Setor...'}
                  className="bg-gray-950 border-gray-700 text-white h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Nº Documento / NF / OS</Label>
                <Input
                  value={expenseForm.documentNumber}
                  onChange={e => setExpenseForm(prev => ({ ...prev, documentNumber: e.target.value }))}
                  placeholder="Ex: NF 1420 / OS-089"
                  className="bg-gray-950 border-gray-700 text-white h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Responsabilidade</Label>
                <Select
                  value={expenseForm.responsibility}
                  onValueChange={val => setExpenseForm(prev => ({ ...prev, responsibility: val }))}
                >
                  <SelectTrigger className="bg-gray-950 border-gray-700 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 z-[10060]">
                    {Object.entries(RENTAL_EXPENSE_RESPONSIBILITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-white text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Status de Cobrança / Reembolso</Label>
                <Select
                  value={expenseForm.reimbursementStatus}
                  onValueChange={val => setExpenseForm(prev => ({ ...prev, reimbursementStatus: val }))}
                >
                  <SelectTrigger className="bg-gray-950 border-gray-700 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 z-[10060]">
                    {Object.entries(RENTAL_EXPENSE_STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key} className="text-white text-xs">
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Valor da Despesa (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0,00"
                  className="bg-gray-950 border-gray-700 text-white font-mono h-9 text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs text-gray-300">Observações</Label>
                <Input
                  value={expenseForm.notes}
                  onChange={e => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações sobre autorização do cliente, medição ou comprovante..."
                  className="bg-gray-950 border-gray-700 text-white h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsExpenseFormOpen(false)}
                className="bg-gray-800 border-gray-700 text-gray-300 h-8 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={savingExpense}
                onClick={handleSaveExpense}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold h-8 text-xs gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {editingExpenseId ? 'Atualizar Despesa' : 'Salvar Despesa'}
              </Button>
            </div>
          </div>
        )}

        {/* Tabela de Despesas da Locação */}
        {loadingExpenses ? (
          <div className="text-center py-8 text-gray-400 text-xs">Carregando despesas da locação...</div>
        ) : expenses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-8 text-center space-y-2">
            <Receipt className="h-8 w-8 text-gray-500 mx-auto" />
            <p className="text-sm font-semibold text-gray-300">
              Nenhuma despesa da locação registrada para este veículo
            </p>
            <p className="text-xs text-gray-400 max-w-lg mx-auto">
              Clique em <strong>"Adicionar Despesa do Cliente"</strong> para registrar manutenções, avarias, peças, pneus ou multas de responsabilidade do cliente durante a locação.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-900/90 border-gray-700">
                  <TableHead className="text-gray-300 text-xs">Data</TableHead>
                  <TableHead className="text-gray-300 text-xs">Categoria</TableHead>
                  <TableHead className="text-gray-300 text-xs">Descrição / Doc</TableHead>
                  <TableHead className="text-gray-300 text-xs">Obra / Setor</TableHead>
                  <TableHead className="text-gray-300 text-xs">Responsabilidade</TableHead>
                  <TableHead className="text-gray-300 text-xs">Status</TableHead>
                  <TableHead className="text-gray-300 text-xs text-right">Valor (R$)</TableHead>
                  <TableHead className="text-gray-300 text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(exp => {
                  const statusCfg = RENTAL_EXPENSE_STATUS_CONFIG[exp.reimbursementStatus] || {
                    label: exp.reimbursementStatus || 'Pendente',
                    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                  };
                  return (
                    <TableRow key={exp.id} className="border-gray-700/70 hover:bg-gray-900/40">
                      <TableCell className="text-xs text-gray-200 whitespace-nowrap">
                        {formatDate(exp.expenseDate)}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-amber-300">
                        {RENTAL_EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}
                      </TableCell>
                      <TableCell className="text-xs text-gray-200">
                        <div className="font-medium">{exp.description}</div>
                        {exp.documentNumber && (
                          <span className="text-[11px] text-gray-400">Doc/NF/OS: {exp.documentNumber}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-300">
                        {exp.workPostName || resolvedObraDisplay || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-gray-300">
                        {RENTAL_EXPENSE_RESPONSIBILITY_LABELS[exp.responsibility] || exp.responsibility}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${statusCfg.className}`}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-red-400 text-right whitespace-nowrap">
                        {formatCurrency(exp.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditExpenseForm(exp)}
                            className="h-7 w-7 text-gray-400 hover:text-amber-400"
                            title="Editar despesa"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="h-7 w-7 text-gray-400 hover:text-red-400"
                            title="Excluir despesa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

