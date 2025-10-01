import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileText, Save, X } from 'lucide-react';
import { BankAccount, CreateReconciliationRequest } from '@/types/bankReconciliation';
import { useToast } from '@/hooks/use-toast';
import bankReconciliationService from '@/services/bankReconciliationService';

interface ReconciliationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: BankAccount[];
}

const ReconciliationFormModal: React.FC<ReconciliationFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accounts
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateReconciliationRequest>({
    accountId: '',
    referenceDate: new Date().toISOString().split('T')[0],
    bankBalance: 0,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        accountId: '',
        referenceDate: new Date().toISOString().split('T')[0],
        bankBalance: 0,
        notes: ''
      });
      setErrors({});
      setSelectedAccount(null);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountId) {
      newErrors.accountId = 'Conta bancária é obrigatória';
    }

    if (!formData.referenceDate) {
      newErrors.referenceDate = 'Data de referência é obrigatória';
    }

    if (formData.bankBalance === undefined || formData.bankBalance === null) {
      newErrors.bankBalance = 'Saldo bancário é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      await bankReconciliationService.createReconciliation(formData);
      
      toast({
        title: "Sucesso",
        description: "Conciliação criada com sucesso!",
        variant: "default"
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar conciliação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateReconciliationRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    setSelectedAccount(account || null);
    handleInputChange('accountId', accountId);
    
    // Pré-preencher o saldo bancário com o saldo atual da conta
    if (account) {
      handleInputChange('bankBalance', account.balance);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Filtrar apenas contas ativas
  const activeAccounts = accounts.filter(account => account.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nova Conciliação Bancária
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Crie uma nova conciliação bancária para verificar a consistência entre o sistema e o banco
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Conta Bancária */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="accountId" className="text-seguranca-lightgray">
                Conta Bancária *
              </Label>
              <Select
                value={formData.accountId}
                onValueChange={handleAccountChange}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione uma conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-sm text-gray-400">
                          {account.bank} - {account.agency} / {account.accountNumber}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && (
                <p className="text-red-400 text-sm">{errors.accountId}</p>
              )}
            </div>

            {/* Data de Referência */}
            <div className="space-y-2">
              <Label htmlFor="referenceDate" className="text-seguranca-lightgray">
                Data de Referência *
              </Label>
              <Input
                id="referenceDate"
                type="date"
                value={formData.referenceDate}
                onChange={(e) => handleInputChange('referenceDate', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                disabled={isLoading}
              />
              {errors.referenceDate && (
                <p className="text-red-400 text-sm">{errors.referenceDate}</p>
              )}
            </div>

            {/* Saldo Bancário */}
            <div className="space-y-2">
              <Label htmlFor="bankBalance" className="text-seguranca-lightgray">
                Saldo no Banco *
              </Label>
              <Input
                id="bankBalance"
                type="number"
                step="0.01"
                value={formData.bankBalance}
                onChange={(e) => handleInputChange('bankBalance', parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                disabled={isLoading}
              />
              {errors.bankBalance && (
                <p className="text-red-400 text-sm">{errors.bankBalance}</p>
              )}
            </div>
          </div>

          {/* Informações da Conta Selecionada */}
          {selectedAccount && (
            <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4">
              <h4 className="text-seguranca-lightgray font-medium mb-3">Informações da Conta</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Saldo Atual no Sistema:</span>
                  <div className="font-semibold text-seguranca-lightgray">
                    {formatCurrency(selectedAccount.balance)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Saldo Informado do Banco:</span>
                  <div className="font-semibold text-seguranca-lightgray">
                    {formatCurrency(formData.bankBalance)}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Diferença Inicial:</span>
                  <div className={`font-semibold ${
                    (formData.bankBalance - selectedAccount.balance) === 0 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {formatCurrency(formData.bankBalance - selectedAccount.balance)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-seguranca-lightgray">
              Observações
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Adicione observações sobre esta conciliação..."
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.accountId}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Save size={16} className="mr-2" />
              {isLoading ? 'Criando...' : 'Criar Conciliação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReconciliationFormModal;