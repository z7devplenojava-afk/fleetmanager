import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Building2, Save, X } from 'lucide-react';
import { BankAccount, CreateBankAccountRequest } from '@/types/bankReconciliation';
import { useToast } from '@/hooks/use-toast';
import bankReconciliationService from '@/services/bankReconciliationService';

interface BankAccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: BankAccount | null;
}

const BankAccountFormModal: React.FC<BankAccountFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  account
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateBankAccountRequest>({
    name: '',
    bank: '',
    agency: '',
    accountNumber: '',
    accountType: 'CHECKING',
    initialBalance: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        bank: account.bank,
        agency: account.agency,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        initialBalance: account.balance
      });
    } else {
      setFormData({
        name: '',
        bank: '',
        agency: '',
        accountNumber: '',
        accountType: 'CHECKING',
        initialBalance: 0
      });
    }
    setErrors({});
  }, [account, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da conta é obrigatório';
    }

    if (!formData.bank.trim()) {
      newErrors.bank = 'Nome do banco é obrigatório';
    }

    if (!formData.agency.trim()) {
      newErrors.agency = 'Agência é obrigatória';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Número da conta é obrigatório';
    }

    if (!formData.accountType) {
      newErrors.accountType = 'Tipo da conta é obrigatório';
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

      if (account) {
        await bankReconciliationService.updateBankAccount(account.id, formData);
        toast({
          title: "Sucesso",
          description: "Conta bancária atualizada com sucesso!",
          variant: "default"
        });
      } else {
        await bankReconciliationService.createBankAccount(formData);
        toast({
          title: "Sucesso",
          description: "Conta bancária criada com sucesso!",
          variant: "default"
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao salvar conta bancária",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateBankAccountRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      'CHECKING': 'Conta Corrente',
      'SAVINGS': 'Poupança',
      'INVESTMENT': 'Investimento'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {account ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {account ? 'Atualize as informações da conta bancária' : 'Cadastre uma nova conta bancária para conciliação'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome da Conta */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-seguranca-lightgray">
                Nome da Conta *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Conta Principal Bradesco"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-red-400 text-sm">{errors.name}</p>
              )}
            </div>

            {/* Banco */}
            <div className="space-y-2">
              <Label htmlFor="bank" className="text-seguranca-lightgray">
                Banco *
              </Label>
              <Input
                id="bank"
                value={formData.bank}
                onChange={(e) => handleInputChange('bank', e.target.value)}
                placeholder="Ex: Banco do Brasil"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                disabled={isLoading}
              />
              {errors.bank && (
                <p className="text-red-400 text-sm">{errors.bank}</p>
              )}
            </div>

            {/* Agência */}
            <div className="space-y-2">
              <Label htmlFor="agency" className="text-seguranca-lightgray">
                Agência *
              </Label>
              <Input
                id="agency"
                value={formData.agency}
                onChange={(e) => handleInputChange('agency', e.target.value)}
                placeholder="Ex: 1234-5"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                disabled={isLoading}
              />
              {errors.agency && (
                <p className="text-red-400 text-sm">{errors.agency}</p>
              )}
            </div>

            {/* Número da Conta */}
            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-seguranca-lightgray">
                Número da Conta *
              </Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                placeholder="Ex: 12345-6"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                disabled={isLoading}
              />
              {errors.accountNumber && (
                <p className="text-red-400 text-sm">{errors.accountNumber}</p>
              )}
            </div>

            {/* Tipo da Conta */}
            <div className="space-y-2">
              <Label htmlFor="accountType" className="text-seguranca-lightgray">
                Tipo da Conta *
              </Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => handleInputChange('accountType', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">Conta Corrente</SelectItem>
                  <SelectItem value="SAVINGS">Poupança</SelectItem>
                  <SelectItem value="INVESTMENT">Investimento</SelectItem>
                </SelectContent>
              </Select>
              {errors.accountType && (
                <p className="text-red-400 text-sm">{errors.accountType}</p>
              )}
            </div>

            {/* Saldo Inicial */}
            <div className="space-y-2">
              <Label htmlFor="initialBalance" className="text-seguranca-lightgray">
                {account ? 'Saldo Atual' : 'Saldo Inicial'}
              </Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                value={formData.initialBalance}
                onChange={(e) => handleInputChange('initialBalance', parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                disabled={isLoading}
              />
            </div>
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
              disabled={isLoading}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Save size={16} className="mr-2" />
              {isLoading ? 'Salvando...' : account ? 'Atualizar' : 'Criar Conta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BankAccountFormModal;