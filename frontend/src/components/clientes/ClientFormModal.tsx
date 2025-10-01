import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client, ClientFormData, ClientStatus } from '@/types/client';
import { clientService } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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
        cnpj: client.cnpj,
        email: client.email || '',
        phone: client.phone || '',
        mobile: client.mobile || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zipCode || '',
        contactName: client.contactName || '',
        contactEmail: client.contactEmail || '',
        contactPhone: client.contactPhone || '',
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
  }, [client, isOpen]);

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (client) {
        await clientService.updateClient(client.id, formData);
        toast({
          title: "Cliente atualizado",
          description: "Cliente atualizado com sucesso!",
        });
      } else {
        await clientService.createClient(formData);
        toast({
          title: "Cliente criado",
          description: "Cliente criado com sucesso!",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome da empresa"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleInputChange('cnpj', formatCnpj(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@empresa.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                placeholder="(00) 0000-0000"
                maxLength={15}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Celular</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value as ClientStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ClientStatus.ACTIVE}>Ativo</SelectItem>
                  <SelectItem value={ClientStatus.INACTIVE}>Inativo</SelectItem>
                  <SelectItem value={ClientStatus.SUSPENDED}>Suspenso</SelectItem>
                  <SelectItem value={ClientStatus.PENDING}>Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Cidade"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                placeholder="UF"
                maxLength={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', formatZipCode(e.target.value))}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Dados do Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nome do Contato</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="Nome do contato principal"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email do Contato</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefone do Contato</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações sobre o cliente..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (client ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 