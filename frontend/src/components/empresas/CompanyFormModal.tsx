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
import { X, Save, Building2, MapPin, Phone, Mail, Globe, Users, DollarSign, Upload, Image as ImageIcon, CheckCircle2, Sparkles } from 'lucide-react';
import { companyService } from '@/services/companyService';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';

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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    tradeName: '',
    cnpj: '',
    logoUrl: '',
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
        notes: company.notes,
        logoUrl: company.logoUrl || ''
      });
      setLogoPreview(company.logoUrl ? resolveCompanyLogoUrl(company.logoUrl) : null);
    } else {
      setFormData({
        name: '',
        tradeName: '',
        cnpj: '',
        logoUrl: '',
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
      setLogoPreview(null);
    }
  }, [company]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const validExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!file.type.startsWith('image/') && !hasValidExt) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Apenas arquivos de imagem (PNG, JPG, JPEG, SVG, WEBP, ICO) são permitidos.',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 5MB.',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingLogo(true);
    try {
      const data = await companyService.uploadLogo(file);
      setFormData(prev => ({ ...prev, logoUrl: data.url }));
      setLogoPreview(resolveCompanyLogoUrl(data.url));
      toast({
        title: 'Ícone enviado',
        description: 'Ícone da empresa enviado com sucesso.',
        className: 'bg-emerald-600 text-white'
      });
    } catch (err: any) {
      toast({
        title: 'Erro no envio',
        description: err.response?.data?.error || 'Erro ao enviar ícone.',
        variant: 'destructive'
      });
      if (formData.logoUrl) {
        setLogoPreview(resolveCompanyLogoUrl(formData.logoUrl));
      } else {
        setLogoPreview(null);
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

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
          {/* Seção: Ícone & Logomarca da Empresa */}
          <div className="p-4 rounded-xl bg-seguranca-graphite border border-gray-600 shadow-md">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative flex-shrink-0 group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-seguranca-black border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-seguranca-yellow transition-all p-2">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Ícone da empresa"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center text-gray-400 p-1">
                      {formData.tradeName || formData.name ? (
                        <span className="text-xl sm:text-2xl font-black text-seguranca-yellow tracking-wider">
                          {(formData.tradeName || formData.name?.slice(0, 3) || '').toUpperCase()}
                        </span>
                      ) : (
                        <Building2 className="w-10 h-10 text-gray-500 mb-1" />
                      )}
                      <span className="text-[10px] text-gray-400 font-medium">Sem Ícone</span>
                    </div>
                  )}
                </div>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg transition-transform hover:scale-110"
                    title="Remover ícone"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-2 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <Label className="text-sm font-semibold text-seguranca-yellow flex items-center justify-center sm:justify-start gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    Ícone / Logomarca da Empresa
                  </Label>
                  {logoPreview ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full w-fit mx-auto sm:mx-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Ícone configurado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full w-fit mx-auto sm:mx-0">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Recomendado
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-300">
                  O ícone será exibido na listagem de empresas, cabeçalhos de ordens de serviço, relatórios e dashboards.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <label className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all shadow-sm ${
                    uploadingLogo 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-seguranca-red hover:bg-seguranca-darkred text-white hover:shadow-md'
                  }`}>
                    {uploadingLogo ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                        <span>Enviando ícone...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{logoPreview ? 'Substituir Ícone' : 'Fazer Upload do Ícone'}</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.svg,.webp,.ico"
                      onChange={handleLogoChange}
                      disabled={uploadingLogo}
                    />
                  </label>

                  {logoPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeLogo}
                      className="h-8 text-xs border-gray-600 text-gray-300 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10"
                    >
                      Remover
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">
                  Formatos aceitos: PNG, JPG, JPEG, SVG, WEBP ou ICO (máx. 5MB).
                </p>
              </div>
            </div>
          </div>

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