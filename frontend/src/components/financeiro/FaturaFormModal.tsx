import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import CurrencyInput from 'react-currency-input-field';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatDateForBackend, parseDateFromBackend, DEFAULT_DATE_PICKER_PROPS } from '@/utils/dateUtils';
import { unitService, Unit } from '@/services/unitService';
import { financialService, Invoice } from '@/services/financialService';

interface FaturaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editMode?: boolean;
  initialData?: Invoice | null;
}

export const FaturaFormModal: React.FC<FaturaFormModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editMode = false,
  initialData = null
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    description: '',
    amount: '',
    issueDate: new Date(),
    dueDate: new Date(),
    unitId: '',
    clientId: '',
    contractId: '',
    category: '',
    notes: '',
    status: 'PENDENTE',
  });

  useEffect(() => {
    if (open) {
      unitService.getAllUnits().then(setUnits).catch(() => setUnits([]));
    }
    if (editMode && initialData) {
      setFormData({
        invoiceNumber: initialData.invoiceNumber || '',
        description: initialData.description || '',
        amount: initialData.amount?.toString() || '',
        issueDate: parseDateFromBackend(initialData.issueDate) || new Date(),
        dueDate: parseDateFromBackend(initialData.dueDate) || new Date(),
        unitId: initialData.unitId || '',
        clientId: initialData.clientId || '',
        contractId: initialData.contractId || '',
        category: initialData.category || '',
        notes: initialData.notes || '',
        status: initialData.status || 'PENDENTE',
      });
    } else if (!open) {
      setFormData({
        invoiceNumber: '',
        description: '',
        amount: '',
        issueDate: new Date(),
        dueDate: new Date(),
        unitId: '',
        clientId: '',
        contractId: '',
        category: '',
        notes: '',
        status: 'PENDENTE',
      });
    }
  }, [editMode, initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.issueDate || !formData.dueDate || !formData.unitId) return;
    setLoading(true);
    try {
      if (editMode && initialData) {
        // Implementar update se necessário
      } else {
        await financialService.createInvoice({
          invoiceNumber: formData.invoiceNumber,
          description: formData.description,
          amount: parseFloat(formData.amount),
          issueDate: formatDateForBackend(formData.issueDate) || '',
          dueDate: formatDateForBackend(formData.dueDate) || '',
          unitId: formData.unitId,
          clientId: formData.clientId,
          contractId: formData.contractId,
          notes: formData.notes,
          status: formData.status,
        });
        toast({
          title: 'Sucesso',
          description: 'Fatura cadastrada com sucesso!',
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar fatura. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Plus className="text-seguranca-yellow" size={20} />
            {editMode ? 'Editar Fatura' : 'Nova Fatura'}
          </DialogTitle>
          <DialogDescription id="descricao-fatura">
            Preencha os campos obrigatórios para {editMode ? 'editar' : 'cadastrar'} a fatura.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">Descrição *</label>
            <Input
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Descrição da fatura"
              className="form-input"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Valor *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">R$</span>
                <CurrencyInput
                  prefix=""
                  decimalSeparator="," 
                  groupSeparator="."
                  value={formData.amount}
                  onValueChange={value => handleInputChange('amount', value || '')}
                  placeholder="0,00"
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Número da Fatura</label>
              <Input
                value={formData.invoiceNumber}
                onChange={e => handleInputChange('invoiceNumber', e.target.value)}
                placeholder="Número da fatura"
                className="form-input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data de Emissão *</label>
              <DatePicker
                selected={formData.issueDate}
                onChange={(date: Date) => handleInputChange('issueDate', date)}
                {...DEFAULT_DATE_PICKER_PROPS}
                className="form-input w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data de Vencimento *</label>
              <DatePicker
                selected={formData.dueDate}
                onChange={(date: Date) => handleInputChange('dueDate', date)}
                {...DEFAULT_DATE_PICKER_PROPS}
                className="form-input w-full"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">Unidade *</label>
            <Select value={formData.unitId} onValueChange={value => handleInputChange('unitId', value)}>
              <SelectTrigger className="form-input">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {units.map(unit => (
                  <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Cliente</label>
              <Input
                value={formData.clientId}
                onChange={e => handleInputChange('clientId', e.target.value)}
                placeholder="ID do cliente"
                className="form-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Contrato</label>
              <Input
                value={formData.contractId}
                onChange={e => handleInputChange('contractId', e.target.value)}
                placeholder="ID do contrato"
                className="form-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">Categoria</label>
            <Input
              value={formData.category}
              onChange={e => handleInputChange('category', e.target.value)}
              placeholder="Categoria da fatura"
              className="form-input"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">Status *</label>
            <Select value={formData.status} onValueChange={value => handleInputChange('status', value)}>
              <SelectTrigger className="form-input">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="PAGA">Paga</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
                <SelectItem value="VENCIDA">Vencida</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">Observações</label>
            <Textarea
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              placeholder="Observações sobre a fatura"
              className="form-input"
              rows={2}
              maxLength={1000}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.description || !formData.amount || !formData.issueDate || !formData.dueDate || !formData.unitId}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {loading ? 'Salvando...' : (editMode ? 'Salvar Alterações' : 'Salvar Fatura')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 