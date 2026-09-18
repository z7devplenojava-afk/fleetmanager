import React, { useState, useEffect, useCallback } from 'react';
import { 
  HardHat, 
  Plus, 
  FileDown, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  RefreshCw, 
  RotateCcw, 
  Eye, 
  Trash2, 
  Calendar, 
  User, 
  Building2, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Download,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  epiDeliveryFormService, 
  EPIDeliveryForm, 
  CreateEPIDeliveryForm, 
  EPIDeliveryFormItem 
} from '@/services/epiDeliveryFormService';
import { employeeService, Employee } from '@/services/employeeService';
import { companyService, Company } from '@/services/companyService';
import { stockService } from '@/services/stockService';
import { StockItem } from '@/types/stock';

export const StockEpiDeliveryFormsTab: React.FC = () => {
  const { toast } = useToast();

  // Estados de dados
  const [fichas, setFichas] = useState<EPIDeliveryForm[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');

  // Modais
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedFicha, setSelectedFicha] = useState<EPIDeliveryForm | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [fichaToDelete, setFichaToDelete] = useState<EPIDeliveryForm | null>(null);

  // Form de Nova Ficha Manual
  const [newEmployeeId, setNewEmployeeId] = useState<string>('');
  const [newCompanyId, setNewCompanyId] = useState<string>('');
  const [newDeliveryDate, setNewDeliveryDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [newResponsibleId, setNewResponsibleId] = useState<string>('');
  const [newObservations, setNewObservations] = useState<string>('');
  const [itemsList, setItemsList] = useState<EPIDeliveryFormItem[]>([
    { epiName: '', quantity: 1, ca: '', observations: '' }
  ]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fichasRes, emps, comps, items] = await Promise.all([
        epiDeliveryFormService.getAll(0, 100).catch(() => ({ content: [], totalElements: 0 })),
        employeeService.getEmployees().catch(() => []),
        companyService.getCompanies().catch(() => []),
        stockService.getAllItems().catch(() => [])
      ]);

      setFichas(fichasRes?.content || []);
      setEmployees(Array.isArray(emps) ? emps : []);
      setCompanies(Array.isArray(comps) ? comps : []);
      setStockItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Erro ao carregar Fichas de EPI:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as fichas de entrega de EPI.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    toast({ title: 'Atualizado', description: 'Lista de fichas de EPI atualizada.' });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setCompanyFilter('ALL');
  };

  // Filtragem de fichas
  const filteredFichas = fichas.filter(f => {
    if (companyFilter !== 'ALL' && f.companyId !== companyFilter) return false;
    if (startDate && f.deliveryDate < startDate) return false;
    if (endDate && f.deliveryDate > endDate) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchEmp = f.employeeName?.toLowerCase().includes(q) || f.employeeCpf?.toLowerCase().includes(q);
      const matchComp = f.companyName?.toLowerCase().includes(q);
      const matchObs = f.observations?.toLowerCase().includes(q);
      const matchItem = f.items?.some(i => i.epiName?.toLowerCase().includes(q) || i.ca?.toLowerCase().includes(q));
      if (!matchEmp && !matchComp && !matchObs && !matchItem) return false;
    }
    return true;
  });

  // Ações de itens no form
  const handleAddItemRow = () => {
    setItemsList(prev => [...prev, { epiName: '', quantity: 1, ca: '', observations: '' }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setItemsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof EPIDeliveryFormItem, val: any) => {
    setItemsList(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleStockItemSelect = (idx: number, stockItemId: string) => {
    const item = stockItems.find(s => s.id === stockItemId);
    if (item) {
      setItemsList(prev => {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          epiName: item.name,
          ca: item.caNumber || '',
          observations: item.location ? `Loc: ${item.location}` : ''
        };
        return updated;
      });
    }
  };

  // Salvar Nova Ficha e Gerar PDF
  const handleSaveFicha = async () => {
    if (!newEmployeeId) {
      toast({ title: 'Atenção', description: 'Selecione o funcionário.', variant: 'destructive' });
      return;
    }
    const emp = employees.find(e => e.id === newEmployeeId);
    const resolvedCompanyId = newCompanyId || (emp as any)?.companyId || (companies[0]?.id);

    if (!resolvedCompanyId) {
      toast({ title: 'Atenção', description: 'Selecione a empresa.', variant: 'destructive' });
      return;
    }

    const validItems = itemsList.filter(i => i.epiName.trim().length > 0);
    if (validItems.length === 0) {
      toast({ title: 'Atenção', description: 'Adicione pelo menos um EPI/Uniforme.', variant: 'destructive' });
      return;
    }

    try {
      setIsSaving(true);
      const payload: CreateEPIDeliveryForm = {
        employeeId: newEmployeeId,
        companyId: resolvedCompanyId,
        deliveryDate: newDeliveryDate,
        responsibleEmployeeId: newResponsibleId || undefined,
        observations: newObservations.trim() || undefined,
        items: validItems
      };

      // Gerar PDF e salvar
      const pdfBlob = await epiDeliveryFormService.generateAndSavePdf(payload);
      
      // Fazer download automático do PDF para assinatura imediata
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ficha_EPI_${emp?.name || 'Funcionario'}_${newDeliveryDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: '✅ Ficha de EPI Gerada com Sucesso!',
        description: 'O PDF oficial foi gerado e baixado para colher a assinatura do colaborador.'
      });

      setShowNewModal(false);
      // Reset
      setNewEmployeeId('');
      setNewCompanyId('');
      setNewResponsibleId('');
      setNewObservations('');
      setItemsList([{ epiName: '', quantity: 1, ca: '', observations: '' }]);

      await loadData();
    } catch (error: any) {
      console.error('Erro ao gerar Ficha de EPI:', error);
      toast({
        title: 'Erro ao gerar ficha',
        description: error.response?.data?.message || 'Falha ao salvar ficha de EPI.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Download PDF de ficha existente
  const handleDownloadPdf = async (ficha: EPIDeliveryForm) => {
    try {
      toast({ title: 'Baixando PDF...', description: 'Aguarde a geração do documento oficial.' });
      const blob = await epiDeliveryFormService.downloadPdf(ficha.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ficha_EPI_${ficha.employeeName || 'Colaborador'}_${ficha.deliveryDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: 'Sucesso', description: 'PDF da Ficha de EPI baixado com sucesso.' });
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast({ title: 'Erro', description: 'Falha ao baixar PDF da ficha de EPI.', variant: 'destructive' });
    }
  };

  // Download Excel de ficha existente
  const handleDownloadExcel = async (ficha: EPIDeliveryForm) => {
    try {
      const blob = await epiDeliveryFormService.downloadExcel(ficha.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ficha_EPI_${ficha.employeeName || 'Colaborador'}_${ficha.deliveryDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar Excel:', error);
      toast({ title: 'Erro', description: 'Falha ao baixar Excel da ficha de EPI.', variant: 'destructive' });
    }
  };

  // Excluir ficha
  const handleDeleteFicha = async () => {
    if (!fichaToDelete) return;
    try {
      setIsDeleting(true);
      await epiDeliveryFormService.delete(fichaToDelete.id);
      toast({ title: 'Ficha Excluída', description: 'Registro de entrega de EPI removido.' });
      setFichaToDelete(null);
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: 'Não foi possível excluir a ficha.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Ações */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-seguranca-graphite p-5 rounded-2xl border border-gray-700 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-seguranca-yellow/20 border border-seguranca-yellow/50 flex items-center justify-center text-seguranca-yellow">
            <HardHat className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-seguranca-lightgray flex items-center gap-2">
              Fichas de Entrega de EPI
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Gerencie todas as fichas de entrega de EPI geradas no Almoxarifado e colete assinaturas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setShowNewModal(true)}
            className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 font-bold text-xs"
          >
            <Plus className="h-4 w-4 mr-1" /> Nova Entrega Manual
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-gray-600 text-gray-200 hover:bg-gray-800 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="text-gray-400 hover:text-white text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-800">
        <div>
          <Label className="text-[11px] text-gray-400 uppercase font-semibold">Buscar</Label>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Funcionário, CPF, setor..."
              className="pl-9 bg-seguranca-black border-gray-700 text-xs h-9 text-gray-100"
            />
          </div>
        </div>

        <div>
          <Label className="text-[11px] text-gray-400 uppercase font-semibold">Data Início</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 bg-seguranca-black border-gray-700 text-xs h-9 text-gray-100"
          />
        </div>

        <div>
          <Label className="text-[11px] text-gray-400 uppercase font-semibold">Data Fim</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 bg-seguranca-black border-gray-700 text-xs h-9 text-gray-100"
          />
        </div>

        <div>
          <Label className="text-[11px] text-gray-400 uppercase font-semibold">Total de Fichas</Label>
          <div className="mt-1 h-9 flex items-center justify-between px-3 bg-seguranca-black border border-gray-700 rounded-md">
            <span className="text-xs text-gray-400 font-medium">Cadastradas:</span>
            <span className="font-bold text-sm font-mono text-seguranca-yellow">{filteredFichas.length}</span>
          </div>
        </div>
      </div>

      {/* Tabela de Fichas de Entrega */}
      <div className="bg-seguranca-graphite border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-seguranca-yellow" />
            <p className="text-gray-400 text-sm">Carregando fichas de entrega de EPI...</p>
          </div>
        ) : filteredFichas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <HardHat className="h-12 w-12 mx-auto mb-2 text-gray-600" />
            <p className="font-semibold text-gray-300">Nenhuma ficha de EPI encontrada</p>
            <p className="text-xs mt-1">Gere uma nova entrega manual ou atenda requisições no almoxarifado.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-seguranca-black/80">
              <TableRow className="border-b border-gray-700">
                <TableHead className="text-gray-300 font-semibold text-xs">Funcionário</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">Empresa</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">Data Entrega</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs text-center">Itens</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">Responsável</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs text-center">Status</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFichas.map((ficha) => (
                <TableRow key={ficha.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition">
                  <TableCell>
                    <div className="font-semibold text-gray-100 text-sm">{ficha.employeeName}</div>
                    {ficha.employeeCpf && (
                      <div className="text-xs text-gray-400 font-mono">CPF: {ficha.employeeCpf}</div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-xs font-medium text-gray-300 truncate max-w-[180px]">
                      {ficha.companyName || 'Empresa Geral'}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs font-mono text-gray-300">
                      {ficha.deliveryDate ? new Date(ficha.deliveryDate).toLocaleDateString('pt-BR') : '—'}
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge variant="outline" className="border-gray-600 bg-gray-900/80 text-gray-200 text-xs">
                      {ficha.items?.length || 0} item(s)
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs text-gray-300">{ficha.responsibleEmployeeName || ficha.createdByName || 'Almoxarifado'}</div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 text-[11px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmado
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedFicha(ficha);
                          setShowViewModal(true);
                        }}
                        className="h-8 w-8 p-0 text-blue-400 hover:text-white hover:bg-blue-600/30"
                        title="Visualizar Itens"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadPdf(ficha)}
                        className="h-8 w-8 p-0 text-emerald-400 hover:text-white hover:bg-emerald-600/30"
                        title="Baixar PDF para Assinatura do Funcionário"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadExcel(ficha)}
                        className="h-8 w-8 p-0 text-cyan-400 hover:text-white hover:bg-cyan-600/30"
                        title="Baixar Planilha Excel"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFichaToDelete(ficha)}
                        className="h-8 w-8 p-0 text-rose-400 hover:text-white hover:bg-rose-600/30"
                        title="Excluir Registro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ================= MODAL: NOVA ENTREGA MANUAL DE EPI ================= */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-3xl bg-seguranca-black border-gray-700 text-gray-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-seguranca-lightgray flex items-center gap-2">
              <HardHat className="h-5 w-5 text-seguranca-yellow" />
              Nova Entrega & Ficha de EPI para Assinatura
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Registre a entrega de uniformes/EPIs e gere a ficha oficial em PDF pronta para assinatura do funcionário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Linha 1: Funcionário e Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-300">Funcionário *</Label>
                <Select value={newEmployeeId} onValueChange={setNewEmployeeId}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-xs h-9 mt-1">
                    <SelectValue placeholder="Selecione o funcionário..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-gray-100 max-h-60">
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id} className="text-xs">
                        {emp.name} {emp.document ? `(CPF: ${emp.document})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-300">Empresa Contratante</Label>
                <Select value={newCompanyId} onValueChange={setNewCompanyId}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-xs h-9 mt-1">
                    <SelectValue placeholder="Selecione a empresa..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-gray-100">
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2: Data e Responsável */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-300">Data de Entrega *</Label>
                <Input
                  type="date"
                  value={newDeliveryDate}
                  onChange={(e) => setNewDeliveryDate(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-xs h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-300">Responsável pelo Almoxarifado</Label>
                <Select value={newResponsibleId} onValueChange={setNewResponsibleId}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-xs h-9 mt-1">
                    <SelectValue placeholder="Almoxarife / Entregador..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-gray-100 max-h-60">
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id} className="text-xs">
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="border border-gray-800 rounded-xl p-4 bg-gray-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-seguranca-yellow uppercase tracking-wider">
                  Equipamentos / Uniformes Entregues
                </span>
                <Button
                  size="sm"
                  type="button"
                  onClick={handleAddItemRow}
                  variant="outline"
                  className="border-gray-700 text-xs h-7 px-2 text-gray-200"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Item
                </Button>
              </div>

              {itemsList.map((itemRow, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-gray-900/80 p-2.5 rounded-lg border border-gray-800">
                  <div className="sm:col-span-5">
                    <Label className="text-[10px] text-gray-400">Nome do Item / EPI *</Label>
                    <div className="flex gap-1 mt-0.5">
                      <Input
                        value={itemRow.epiName}
                        onChange={(e) => handleItemChange(idx, 'epiName', e.target.value)}
                        placeholder="Ex: Botina de Segurança Nº 41"
                        className="bg-seguranca-black border-gray-700 text-xs h-8 text-gray-100 flex-1"
                      />
                      {stockItems.length > 0 && (
                        <Select onValueChange={(val) => handleStockItemSelect(idx, val)}>
                          <SelectTrigger className="w-8 h-8 p-0 bg-gray-800 border-gray-700 text-gray-400" title="Puxar do Estoque">
                            <span className="text-xs">📦</span>
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700 text-gray-100 max-h-48">
                            {stockItems.slice(0, 30).map(si => (
                              <SelectItem key={si.id} value={si.id} className="text-xs">
                                {si.name} (Qtd: {si.currentQuantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-[10px] text-gray-400">Qtd</Label>
                    <Input
                      type="number"
                      min={1}
                      value={itemRow.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="bg-seguranca-black border-gray-700 text-xs h-8 text-gray-100 mt-0.5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-[10px] text-gray-400">Nº CA</Label>
                    <Input
                      value={itemRow.ca || ''}
                      onChange={(e) => handleItemChange(idx, 'ca', e.target.value)}
                      placeholder="Ex: 42150"
                      className="bg-seguranca-black border-gray-700 text-xs h-8 text-gray-100 mt-0.5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-[10px] text-gray-400">Observações</Label>
                    <Input
                      value={itemRow.observations || ''}
                      onChange={(e) => handleItemChange(idx, 'observations', e.target.value)}
                      placeholder="Tamanho G"
                      className="bg-seguranca-black border-gray-700 text-xs h-8 text-gray-100 mt-0.5"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pt-3">
                    {itemsList.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-950"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Observações Gerais */}
            <div>
              <Label className="text-xs text-gray-300">Observações Gerais</Label>
              <Textarea
                value={newObservations}
                onChange={(e) => setNewObservations(e.target.value)}
                placeholder="Ex: Primeira entrega referente à admissão na obra."
                className="bg-gray-900 border-gray-700 text-xs mt-1 h-16 text-gray-100"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-gray-800 pt-3">
            <Button
              variant="outline"
              onClick={() => setShowNewModal(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveFicha}
              disabled={isSaving}
              className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 font-bold text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Salvar e Gerar Ficha para Assinar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: VISUALIZAR DETALHES ================= */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl bg-seguranca-black border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-seguranca-lightgray flex items-center justify-between">
              <span>Detalhes da Ficha de EPI</span>
              <Badge className="bg-emerald-600 text-white text-xs">Entregue</Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedFicha && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
                <div>
                  <span className="text-gray-400">Colaborador:</span>
                  <p className="font-bold text-gray-100 text-sm">{selectedFicha.employeeName}</p>
                  <p className="text-gray-400 font-mono">CPF: {selectedFicha.employeeCpf || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Empresa:</span>
                  <p className="font-bold text-gray-100 text-sm">{selectedFicha.companyName}</p>
                  <p className="text-gray-400">Data: {new Date(selectedFicha.deliveryDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-seguranca-yellow uppercase mb-2">Itens Entregues</h4>
                <div className="border border-gray-800 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-900">
                      <TableRow className="border-b border-gray-800">
                        <TableHead className="text-gray-300 text-xs">Item / EPI</TableHead>
                        <TableHead className="text-gray-300 text-xs text-center">Qtd</TableHead>
                        <TableHead className="text-gray-300 text-xs">Nº CA</TableHead>
                        <TableHead className="text-gray-300 text-xs">Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFicha.items?.map((it, idx) => (
                        <TableRow key={idx} className="border-b border-gray-800">
                          <TableCell className="font-semibold text-gray-200">{it.epiName}</TableCell>
                          <TableCell className="text-center font-mono">{it.quantity}</TableCell>
                          <TableCell className="font-mono text-gray-400">{it.ca || '—'}</TableCell>
                          <TableCell className="text-gray-400">{it.observations || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedFicha.observations && (
                <div className="bg-gray-900/40 p-2.5 rounded border border-gray-800 text-gray-300">
                  <span className="font-semibold text-gray-400">Observações: </span>
                  {selectedFicha.observations}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-gray-800 pt-3 flex justify-between sm:justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowViewModal(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
            >
              Fechar
            </Button>
            {selectedFicha && (
              <Button
                size="sm"
                onClick={() => handleDownloadPdf(selectedFicha)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Baixar PDF da Ficha
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: CONFIRMAÇÃO DE EXCLUSÃO ================= */}
      <Dialog open={!!fichaToDelete} onOpenChange={() => setFichaToDelete(null)}>
        <DialogContent className="max-w-md bg-seguranca-black border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Excluir Ficha de EPI
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Tem certeza que deseja excluir o registro de entrega de EPI para <strong>{fichaToDelete?.employeeName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFichaToDelete(null)}
              className="border-gray-700 text-gray-300 text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteFicha}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockEpiDeliveryFormsTab;
