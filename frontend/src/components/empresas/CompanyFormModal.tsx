import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Company, CompanyStatus, CompanyStatusLabels } from '@/types/company';
import { useToast } from '@/hooks/use-toast';
import { X, Save, Building2, MapPin, Phone, Mail, Globe, Users, DollarSign } from 'lucide-react';

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Partial<Company>) => Promise<void>;
  company?: Company;
}

const companyTypes = [
  'LTDA', 'ME', 'EIRELI', 'S.A', 'S.A.S', 'S.C', 'S.C.P', 'S.C.L', 'S.C.P.A'
];

const companySectors = [
  'Tecnologia', 'Saúde', 'Educação', 'Financeiro', 'Varejo', 'Indústria',
  'Serviços', 'Construção', 'Transporte', 'Alimentação', 'Moda', 'Automotivo',
  'Energia', 'Telecomunicações', 'Imobiliário', 'Consultoria', 'Marketing',
  'Jurídico', 'Contabilidade', 'Segurança', 'Limpeza', 'Manutenção', 'Outros'
];

const companySizes = ['Pequena', 'Média', 'Grande'];

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  company
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    tradeName: '',
    cnpj: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    description: '',
    status: CompanyStatus.ACTIVE,
    type: '',
    sector: '',
    size: '',
    annualRevenue: undefined,
    employeeCount: undefined,
    notes: ''
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        tradeName: company.tradeName,
        cnpj: company.cnpj,
        inscricaoEstadual: company.inscricaoEstadual,
        inscricaoMunicipal: company.inscricaoMunicipal,
        address: company.address,
        city: company.city,
        state: company.state,
        zipCode: company.zipCode,
        phone: company.phone,
        email: company.email,
        website: company.website,
        contactPerson: company.contactPerson,
        contactPhone: company.contactPhone,
        contactEmail: company.contactEmail,
        description: company.description,
        status: company.status,
        type: company.type,
        sector: company.sector,
        size: company.size,
        annualRevenue: company.annualRevenue,
        employeeCount: company.employeeCount,
        notes: company.notes
      });
    } else {
      setFormData({
        name: '',
        tradeName: '',
        cnpj: '',
        inscricaoEstadual: '',
        inscricaoMunicipal: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
        website: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
        description: '',
        status: CompanyStatus.ACTIVE,
        type: '',
        sector: '',
        size: '',
        annualRevenue: undefined,
        employeeCount: undefined,
        notes: ''
      });
    }
  }, [company]);

  const handleInputChange = (field: keyof Company, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Erro",
        description: "Nome da empresa é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      toast({
        title: "Sucesso",
        description: company ? "Empresa atualizada com sucesso!" : "Empresa criada com sucesso!",
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar empresa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      tradeName: '',
      cnpj: '',
      inscricaoEstadual: '',
      inscricaoMunicipal: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      website: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      description: '',
      status: CompanyStatus.ACTIVE,
      type: '',
      sector: '',
      size: '',
      annualRevenue: undefined,
      employeeCount: undefined,
      notes: ''
    });
    onClose();
  };

  const isFormValid = formData.name && formData.name.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-seguranca-red" />
            {company ? 'Editar Empresa' : 'Nova Empresa'}
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray">
            Preencha as informações da empresa. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-seguranca-lightgray">
                    Nome da Empresa *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Nome da empresa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tradeName" className="text-seguranca-lightgray">
                    Nome Fantasia
                  </Label>
                  <Input
                    id="tradeName"
                    value={formData.tradeName || ''}
                    onChange={(e) => handleInputChange('tradeName', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Nome fantasia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-seguranca-lightgray">
                    CNPJ
                  </Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj || ''}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-seguranca-lightgray">
                    Status
                  </Label>
                  <Select
                    value={formData.status || CompanyStatus.ACTIVE}
                    onValueChange={(value) => handleInputChange('status', value as CompanyStatus)}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CompanyStatusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-seguranca-lightgray">
                    Tipo
                  </Label>
                  <Select
                    value={formData.type || ''}
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector" className="text-seguranca-lightgray">
                    Setor
                  </Label>
                  <Select
                    value={formData.sector || ''}
                    onValueChange={(value) => handleInputChange('sector', value)}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySectors.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size" className="text-seguranca-lightgray">
                    Tamanho
                  </Label>
                  <Select
                    value={formData.size || ''}
                    onValueChange={(value) => handleInputChange('size', value)}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-seguranca-lightgray">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Descrição da empresa"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inscrições */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Inscrições
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inscricaoEstadual" className="text-seguranca-lightgray">
                    Inscrição Estadual
                  </Label>
                  <Input
                    id="inscricaoEstadual"
                    value={formData.inscricaoEstadual || ''}
                    onChange={(e) => handleInputChange('inscricaoEstadual', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Inscrição estadual"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inscricaoMunicipal" className="text-seguranca-lightgray">
                    Inscrição Municipal
                  </Label>
                  <Input
                    id="inscricaoMunicipal"
                    value={formData.inscricaoMunicipal || ''}
                    onChange={(e) => handleInputChange('inscricaoMunicipal', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Inscrição municipal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-seguranca-lightgray">
                    Endereço Completo
                  </Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Endereço completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-seguranca-lightgray">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-seguranca-lightgray">
                    Estado
                  </Label>
                  <Select
                    value={formData.state || ''}
                    onValueChange={(value) => handleInputChange('state', value)}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-seguranca-lightgray">
                    CEP
                  </Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode || ''}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-seguranca-lightgray">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="(00) 0000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-seguranca-lightgray">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="email@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-seguranca-lightgray">
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="https://www.empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="text-seguranca-lightgray">
                    Pessoa de Contato
                  </Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson || ''}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Nome do contato"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-seguranca-lightgray">
                    Telefone de Contato
                  </Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone || ''}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-seguranca-lightgray">
                    Email de Contato
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualRevenue" className="text-seguranca-lightgray">
                    Receita Anual
                  </Label>
                  <Input
                    id="annualRevenue"
                    type="number"
                    step="0.01"
                    value={formData.annualRevenue || ''}
                    onChange={(e) => handleInputChange('annualRevenue', parseFloat(e.target.value) || undefined)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeCount" className="text-seguranca-lightgray">
                    Número de Funcionários
                  </Label>
                  <Input
                    id="employeeCount"
                    type="number"
                    value={formData.employeeCount || ''}
                    onChange={(e) => handleInputChange('employeeCount', parseInt(e.target.value) || undefined)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="notes" className="text-seguranca-lightgray">
                    Observações
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Observações adicionais"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className="bg-seguranca-red hover:bg-seguranca-darkred"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : (company ? 'Atualizar Empresa' : 'Criar Empresa')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 