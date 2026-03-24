import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, Mail, Phone, MapPin, User, Hash, 
  FileText, Save, X, Smartphone, Home, CreditCard 
} from 'lucide-react';
import { Client, ClientFormData, ClientStatus } from '@/types/client';
import { clientService } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';

// Funções de máscara
const formatCNPJ = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara do CNPJ: 00.000.000/0000-00
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  } else {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  }
};

const formatPhone = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara do telefone: (00) 0000-0000 ou (00) 00000-0000
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
};

const formatZipCode = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara do CEP: 00000-000
  if (numbers.length <= 5) {
    return numbers;
  } else {
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  }
};

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdClient?: Client) => void;
  client?: Client;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  client
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dados-basicos');
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    status: ClientStatus.ACTIVE,
    notes: ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        cnpj: formatCNPJ(client.cnpj), // Aplicar máscara ao CNPJ
        email: client.email || '',
        phone: client.phone ? formatPhone(client.phone) : '',
        mobile: client.mobile ? formatPhone(client.mobile) : '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zipCode ? formatZipCode(client.zipCode) : '',
        contactName: client.contactName || '',
        contactEmail: client.contactEmail || '',
        contactPhone: client.contactPhone ? formatPhone(client.contactPhone) : '',
        status: client.status,
        notes: client.notes || ''
      });
    } else {
      setFormData({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        status: ClientStatus.ACTIVE,
        notes: ''
      });
    }
    setActiveTab('dados-basicos');
  }, [client, isOpen]);

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    let formattedValue = value;
    
    // Aplicar máscaras específicas
    if (field === 'cnpj') {
      formattedValue = formatCNPJ(value);
    } else if (field === 'phone' || field === 'mobile' || field === 'contactPhone') {
      formattedValue = formatPhone(value);
    } else if (field === 'zipCode') {
      formattedValue = formatZipCode(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('[DEBUG] ClientFormModal - Dados do formulário:', formData);
      
      if (client) {
        // Limpar campos vazios e remover máscaras antes de enviar
        const cleanData = {
          ...formData,
          cnpj: formData.cnpj.replace(/\D/g, ''), // Remove todos os caracteres não numéricos
          email: formData.email?.trim() || undefined,
          contactEmail: formData.contactEmail?.trim() || undefined,
          phone: formData.phone?.replace(/\D/g, '') || undefined,
          mobile: formData.mobile?.replace(/\D/g, '') || undefined,
          address: formData.address?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          state: formData.state?.trim() || undefined,
          zipCode: formData.zipCode?.replace(/\D/g, '') || undefined,
          contactName: formData.contactName?.trim() || undefined,
          contactPhone: formData.contactPhone?.replace(/\D/g, '') || undefined,
          notes: formData.notes?.trim() || undefined
        };
        
        const saved = await clientService.updateClient(client.id, cleanData);
        toast({
          title: "✅ Cliente atualizado",
          description: "As informações do cliente foram atualizadas com sucesso!",
        });
        onSuccess();
      } else {
        console.log('[DEBUG] ClientFormModal - Criando novo cliente com dados:', formData);
        
        // Limpar campos vazios e remover máscaras antes de enviar
        const cleanData = {
          ...formData,
          cnpj: formData.cnpj.replace(/\D/g, ''), // Remove todos os caracteres não numéricos
          email: formData.email?.trim() || undefined,
          contactEmail: formData.contactEmail?.trim() || undefined,
          phone: formData.phone?.replace(/\D/g, '') || undefined,
          mobile: formData.mobile?.replace(/\D/g, '') || undefined,
          address: formData.address?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          state: formData.state?.trim() || undefined,
          zipCode: formData.zipCode?.replace(/\D/g, '') || undefined,
          contactName: formData.contactName?.trim() || undefined,
          contactPhone: formData.contactPhone?.replace(/\D/g, '') || undefined,
          notes: formData.notes?.trim() || undefined
        };
        
        console.log('[DEBUG] ClientFormModal - Dados limpos:', cleanData);
        const saved = await clientService.createClient(cleanData);
        console.log('[DEBUG] ClientFormModal - Cliente criado com sucesso:', saved);
        toast({
          title: "✅ Cliente criado",
          description: `Cliente ${formData.name} foi criado com sucesso!`,
        });
        onSuccess(saved);
      }
      
      onClose();
    } catch (error: any) {
      console.error('[ERROR] ClientFormModal - Erro ao salvar cliente:', error);
      console.error('[ERROR] ClientFormModal - Response data:', error.response?.data);
      toast({
        title: "❌ Erro",
        description: error.response?.data?.message || "Erro ao salvar cliente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return numbers;
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-2 border-gray-600/50 text-white p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-600/30 bg-seguranca-black/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-seguranca-red/20 border border-seguranca-red/30">
              <Building2 className="h-6 w-6 text-seguranca-red" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                {client ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
              <p className="text-sm text-gray-400 mt-1">
                {client ? 'Atualize as informações do cliente' : 'Preencha os dados do novo cliente'}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-seguranca-black/50 border border-gray-600/30 p-1">
                <TabsTrigger 
                  value="dados-basicos"
                  className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white text-gray-400"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Dados Básicos
                </TabsTrigger>
                <TabsTrigger 
                  value="endereco"
                  className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white text-gray-400"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Endereço
                </TabsTrigger>
                <TabsTrigger 
                  value="contato"
                  className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white text-gray-400"
                >
                  <User className="h-4 w-4 mr-2" />
                  Contato
                </TabsTrigger>
              </TabsList>

              {/* Dados Básicos */}
              <TabsContent value="dados-basicos" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name" className="text-seguranca-lightgray flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Nome da Empresa <span className="text-seguranca-red">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex: Empresa XYZ Ltda"
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj" className="text-seguranca-lightgray flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      CNPJ <span className="text-seguranca-red">*</span>
                    </Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange('cnpj', formatCnpj(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 font-mono h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-seguranca-lightgray flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value as ClientStatus)}
                    >
                      <SelectTrigger className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        <SelectItem value={ClientStatus.ACTIVE} className="text-green-300 hover:bg-seguranca-graphite">
                          ✅ Ativo
                        </SelectItem>
                        <SelectItem value={ClientStatus.INACTIVE} className="text-gray-300 hover:bg-seguranca-graphite">
                          ⭕ Inativo
                        </SelectItem>
                        <SelectItem value={ClientStatus.SUSPENDED} className="text-red-300 hover:bg-seguranca-graphite">
                          🚫 Suspenso
                        </SelectItem>
                        <SelectItem value={ClientStatus.PENDING} className="text-yellow-300 hover:bg-seguranca-graphite">
                          ⏳ Pendente
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-seguranca-lightgray flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contato@empresa.com"
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-seguranca-lightgray flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                      placeholder="(00) 0000-0000"
                      maxLength={15}
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 h-11"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes" className="text-seguranca-lightgray flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Observações
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Informações adicionais sobre o cliente..."
                      rows={4}
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 resize-none"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Endereço */}
              <TabsContent value="endereco" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="text-seguranca-lightgray flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Endereço Completo
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Rua, Avenida, Número, Complemento"
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-seguranca-lightgray flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Cidade
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="São Paulo"
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-seguranca-lightgray flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Estado (UF)
                    </Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                      placeholder="SP"
                      maxLength={2}
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 uppercase h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-seguranca-lightgray flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      CEP
                    </Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', formatZipCode(e.target.value))}
                      placeholder="00000-000"
                      maxLength={9}
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 font-mono h-11"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Contato */}
              <TabsContent value="contato" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="contactName" className="text-seguranca-lightgray flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nome do Contato Principal
                    </Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      placeholder="João da Silva"
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-seguranca-lightgray flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email do Contato
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="contato@empresa.com"
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-seguranca-lightgray flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Telefone do Contato
                    </Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-seguranca-lightgray flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Celular Adicional
                    </Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 h-11"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-600/30 bg-seguranca-black/50">
            <div className="flex justify-between items-center gap-4">
              <p className="text-sm text-gray-400">
                <span className="text-seguranca-red">*</span> Campos obrigatórios
              </p>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  className="border-gray-600 text-white hover:bg-seguranca-black hover:text-white px-6"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="bg-seguranca-red hover:bg-seguranca-darkred px-6 shadow-lg shadow-seguranca-red/20"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : (client ? 'Atualizar Cliente' : 'Criar Cliente')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
