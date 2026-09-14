import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, FileText, Trash2, Edit3, Calendar, DollarSign,
  Loader2, CheckCircle2, Clock, XCircle, AlertCircle, Briefcase
} from 'lucide-react';
import { contractService, Contract, CreateContractRequest } from '@/services/contractService';

interface ClientContractsTabProps {
  clientId: string;
  clientName: string;
}

const CONTRACT_TYPES = [
  { value: 'PRESTACAO_SERVICOS', label: 'Prestação de Serviços' },
  { value: 'LOCACAO_VEICULOS', label: 'Locação de Veículos' },
  { value: 'ARRENDAMENTO', label: 'Arrendamento' },
  { value: 'VENDA', label: 'Venda' },
  { value: 'OUTROS', label: 'Outros' },
];

const STATUS_CONFIG = {
  ACTIVE: { label: 'Ativo', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  INACTIVE: { label: 'Inativo', icon: XCircle, color: 'text-gray-400 bg-gray-500/15 border-gray-500/30' },
  TERMINATED: { label: 'Finalizado', icon: AlertCircle, color: 'text-red-400 bg-red-500/15 border-red-500/30' },
  PENDING: { label: 'Pendente', icon: Clock, color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' },
};

const ClientContractsTab: React.FC<ClientContractsTabProps> = ({ clientId, clientName }) => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<CreateContractRequest>({
    contractNumber: '',
    description: '',
    startDate: '',
    endDate: '',
    value: 0,
    status: 'ACTIVE',
    contractType: 'PRESTACAO_SERVICOS',
    clientId: clientId,
    notes: '',
    obraName: '',
    vehicleQuantity: 1,
    unitVehicleValue: 0,
    serviceType: '',
    vehicleDescription: '',
    vigenciaText: '',
  });

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contractService.getContractsByClient(clientId);
      setContracts(data || []);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar contratos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  const resetForm = () => {
    setFormData({
      contractNumber: '',
      description: '',
      startDate: '',
      endDate: '',
      value: 0,
      status: 'ACTIVE',
      contractType: 'PRESTACAO_SERVICOS',
      clientId: clientId,
      notes: '',
      obraName: '',
      vehicleQuantity: 1,
      unitVehicleValue: 0,
      serviceType: '',
      vehicleDescription: '',
      vigenciaText: '',
    });
    setEditingContract(null);
  };

  const openNewForm = () => { resetForm(); setShowForm(true); };

  const openEditForm = (contract: Contract) => {
    setFormData({
      contractNumber: contract.contractNumber,
      description: contract.description,
      startDate: contract.startDate,
      endDate: contract.endDate || '',
      value: contract.value,
      status: contract.status as any,
      contractType: contract.contractType as any || 'PRESTACAO_SERVICOS',
      clientId: clientId,
      notes: contract.notes || '',
      obraName: contract.obraName || '',
      vehicleQuantity: contract.vehicleQuantity || 1,
      unitVehicleValue: contract.unitVehicleValue || 0,
      serviceType: contract.serviceType || '',
      vehicleDescription: contract.vehicleDescription || '',
      vigenciaText: contract.vigenciaText || '',
    });
    setEditingContract(contract);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.contractNumber.trim() || !formData.description.trim()) {
      toast({ title: 'Atenção', description: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingContract) {
        await contractService.updateContract(editingContract.id, { ...formData, id: editingContract.id });
        toast({ title: 'Sucesso', description: 'Contrato atualizado' });
      } else {
        await contractService.createContract(formData);
        toast({ title: 'Sucesso', description: 'Contrato criado' });
      }
      setShowForm(false);
      resetForm();
      loadContracts();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao salvar contrato', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contract: Contract) => {
    if (!confirm(`Excluir o contrato "${contract.contractNumber}"?`)) return;
    try {
      await contractService.deleteContract(contract.id);
      toast({ title: 'Sucesso', description: 'Contrato excluído' });
      loadContracts();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir contrato', variant: 'destructive' });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-seguranca-yellow animate-spin" />
        <span className="ml-2 text-gray-400 text-sm">Carregando contratos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <FileText size={18} className="text-seguranca-yellow" />
            Contratos e Obras
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {contracts.length} contrato{contracts.length !== 1 ? 's' : ''} / obra{contracts.length !== 1 ? 's' : ''} de {clientName}
          </p>
        </div>
        <Button onClick={openNewForm} className="bg-seguranca-yellow text-black hover:bg-yellow-500">
          <Plus size={16} className="mr-1" /> Novo Contrato
        </Button>
      </div>

      {/* Lista */}
      {contracts.length === 0 ? (
        <Card className="bg-seguranca-graphite border-gray-700 p-8 text-center">
          <FileText className="mx-auto mb-2 text-gray-500" size={36} />
          <p className="text-gray-400">Nenhum contrato cadastrado para este cliente</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map(contract => {
            const stCfg = STATUS_CONFIG[contract.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ACTIVE;
            const StatusIcon = stCfg.icon;
            return (
              <Card key={contract.id} className="bg-seguranca-graphite border-gray-700 p-4 hover:border-seguranca-yellow transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-seguranca-yellow/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="text-seguranca-yellow" size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold">{contract.contractNumber}</p>
                        {contract.obraName && (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[11px]">
                            Obra: {contract.obraName}
                          </Badge>
                        )}
                        <Badge className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${stCfg.color}`}>
                          <StatusIcon size={10} className="mr-1" /> {stCfg.label}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5 truncate">{contract.description}</p>
                      
                      {/* Detalhes de Veículos e Serviços */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {contract.serviceType && (
                          <Badge variant="outline" className="text-[10px] text-gray-300 border-gray-600">
                            Serviço: {contract.serviceType}
                          </Badge>
                        )}
                        {contract.vehicleDescription && (
                          <Badge variant="outline" className="text-[10px] text-gray-300 border-gray-600">
                            Frota: {contract.vehicleDescription}
                          </Badge>
                        )}
                        {contract.vehicleQuantity !== undefined && contract.vehicleQuantity > 0 && (
                          <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/40">
                            {contract.vehicleQuantity} veículo{contract.vehicleQuantity > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {contract.unitVehicleValue !== undefined && contract.unitVehicleValue > 0 && (
                          <Badge variant="outline" className="text-[10px] text-emerald-300 border-emerald-500/40">
                            Unitário: {formatCurrency(contract.unitVehicleValue)}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 flex-wrap">
                        {contract.contractType && (
                          <span className="flex items-center gap-1">
                            <Briefcase size={10} /> {CONTRACT_TYPES.find(t => t.value === contract.contractType)?.label || contract.contractType}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(contract.startDate)}
                          {contract.endDate ? ` — ${formatDate(contract.endDate)}` : ' — Sem previsão'}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                          <DollarSign size={10} /> Valor Mensal: {formatCurrency(contract.value)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditForm(contract)} className="p-1.5 text-gray-400 hover:text-seguranca-yellow transition-colors" title="Editar">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(contract)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {contract.vigenciaText && (
                  <div className="mt-2 p-2 bg-seguranca-black/40 rounded border border-gray-800 text-xs text-amber-200/90">
                    <span className="font-semibold">Vigência / Aditivos:</span> {contract.vigenciaText}
                  </div>
                )}

                {contract.notes && (
                  <p className="text-xs text-gray-400 mt-2">{contract.notes}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={18} className="text-seguranca-yellow" />
              {editingContract ? 'Editar Contrato / Obra' : 'Novo Contrato / Obra'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nº do Contrato *</label>
                <Input value={formData.contractNumber} onChange={e => setFormData({ ...formData, contractNumber: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" placeholder="Ex: CONTRATO-2025-001" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nome da Obra / Setor</label>
                <Input value={formData.obraName || ''} onChange={e => setFormData({ ...formData, obraName: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" placeholder="Ex: ITABIRITO-MG" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tipo de Contrato</label>
                <Select value={formData.contractType || 'PRESTACAO_SERVICOS'} onValueChange={v => setFormData({ ...formData, contractType: v as any })}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    {CONTRACT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tipo de Serviço</label>
                <Input value={formData.serviceType || ''} onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" placeholder="Ex: LOCAÇÃO ou FRETAMENTO" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Descrição *</label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="bg-seguranca-black border-gray-700 text-white text-sm" rows={2} placeholder="Descrição do contrato" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Qtd Veículos</label>
                <Input type="number" min={1} value={formData.vehicleQuantity || 1}
                  onChange={e => setFormData({ ...formData, vehicleQuantity: parseInt(e.target.value) || 1 })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Valor por Veículo (R$)</label>
                <Input type="number" min={0} step={0.01} value={formData.unitVehicleValue || 0}
                  onChange={e => setFormData({ ...formData, unitVehicleValue: parseFloat(e.target.value) || 0 })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Valor Mensal (R$) *</label>
                <Input type="number" min={0} step={0.01} value={formData.value}
                  onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Data Início *</label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Data Fim</label>
                <Input type="date" value={formData.endDate || ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v as any })}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="TERMINATED">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Descrição da Frota</label>
              <Input value={formData.vehicleDescription || ''} onChange={e => setFormData({ ...formData, vehicleDescription: e.target.value })}
                className="bg-seguranca-black border-gray-700 text-white text-sm" placeholder="Ex: ONIBUS RODOVIARIO, MICRO 4X4, VAN" />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Texto de Vigência / Aditivos</label>
              <Textarea value={formData.vigenciaText || ''} onChange={e => setFormData({ ...formData, vigenciaText: e.target.value })}
                className="bg-seguranca-black border-gray-700 text-white text-sm" rows={2} placeholder="Ex: 20/01/2025 À 20/01/2026 - ADITIVO REALIZADO 13/06/2027" />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Observações</label>
              <Textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="bg-seguranca-black border-gray-700 text-white text-sm" rows={2} />
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-gray-700">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }} className="border-gray-600 text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-seguranca-yellow text-black hover:bg-yellow-500">
                {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <FileText size={16} className="mr-1" />}
                {editingContract ? 'Atualizar' : 'Criar Contrato'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientContractsTab;
