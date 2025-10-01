import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, 
  Save, 
  X, 
  FileText,
  Globe,
  Phone,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bankAgencyService, Bank, CreateBankRequest } from '@/services/bankAgencyService';

interface BankFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (bank: Bank) => void;
  bank?: Bank | null;
}

export const BankFormModal: React.FC<BankFormModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  bank
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateBankRequest>({
    code: '',
    name: '',
    shortName: '',
    cnpj: '',
    description: '',
    status: 'ACTIVE',
    website: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Reset form when modal opens/closes or bank changes
  useEffect(() => {
    if (open) {
      if (bank) {
        setFormData({
          code: bank.code,
          name: bank.name,
          shortName: bank.shortName || '',
          cnpj: bank.cnpj || '',
          description: bank.description || '',
          status: bank.status,
          website: bank.website || '',
          phone: bank.phone || '',
          address: bank.address || '',
          city: bank.city || '',
          state: bank.state || '',
          zipCode: bank.zipCode || ''
        });
      } else {
        setFormData({
          code: '',
          name: '',
          shortName: '',
          cnpj: '',
          description: '',
          status: 'ACTIVE',
          website: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: ''
        });
      }
    }
  }, [open, bank]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Código e nome são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      let result: Bank;
      
      if (bank) {
        result = await bankAgencyService.updateBank(bank.id, formData);
      } else {
        result = await bankAgencyService.createBank(formData);
      }

      onSuccess(result);
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Erro ao salvar banco:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível salvar o banco",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateBankRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
        <DialogHeader>
          <DialogTitle className="flex items-center text-seguranca-lightgray">
            <Building className="w-5 h-5 mr-2 text-seguranca-yellow" />
            {bank ? 'Editar Banco' : 'Novo Banco'}
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray/70">
            {bank ? 'Atualize as informações do banco' : 'Preencha as informações do novo banco'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-seguranca-lightgray flex items-center">
              <FileText className="w-4 h-4 mr-2 text-seguranca-yellow" />
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code" className="text-seguranca-lightgray">Código do Banco *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="Ex: 001, 237, 341"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="name" className="text-seguranca-lightgray">Nome do Banco *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Banco do Brasil"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shortName" className="text-seguranca-lightgray">Nome Abreviado</Label>
                <Input
                  id="shortName"
                  value={formData.shortName}
                  onChange={(e) => handleInputChange('shortName', e.target.value)}
                  placeholder="Ex: BB, Bradesco, Itaú"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div>
                <Label htmlFor="cnpj" className="text-seguranca-lightgray">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-seguranca-lightgray">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrição adicional sobre o banco"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value as any)}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                  <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-seguranca-lightgray flex items-center">
              <Phone className="w-4 h-4 mr-2 text-seguranca-yellow" />
              Informações de Contato
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website" className="text-seguranca-lightgray">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.banco.com.br"
                    className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-seguranca-lightgray">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 3000-0000"
                    className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-seguranca-lightgray flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-seguranca-yellow" />
              Endereço
            </h3>
            
            <div>
              <Label htmlFor="address" className="text-seguranca-lightgray">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Rua, número, bairro"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="text-seguranca-lightgray">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="São Paulo"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div>
                <Label htmlFor="state" className="text-seguranca-lightgray">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div>
                <Label htmlFor="zipCode" className="text-seguranca-lightgray">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="00000-000"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : (bank ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
