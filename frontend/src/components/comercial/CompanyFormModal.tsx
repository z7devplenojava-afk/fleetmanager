import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { companyService, CreateCompanyRequest } from '@/services/companyService';
import api from '@/lib/axios';
import { getApiUrl } from '@/config/environment';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface CompanyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (company: any) => void;
  initialData?: Partial<CreateCompanyRequest> | null;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({ open, onOpenChange, onSuccess, initialData }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const isEditMode = Boolean((initialData as any)?.id);
  const [form, setForm] = useState<CreateCompanyRequest>({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    enderecoRua: '',
    enderecoNumero: '',
    enderecoComplemento: '',
    enderecoBairro: '',
    city: '',
    state: '',
    zipCode: '',
    sigla: '',
    description: '',
    website: '',
    status: 'ACTIVE',
    logoUrl: ''
  });

  React.useEffect(() => {
    if (open && initialData) {
      const normalizedLogoUrl = (() => {
        if (!initialData.logoUrl) return '';
        if (initialData.logoUrl.startsWith('http://') || initialData.logoUrl.startsWith('https://')) {
          try {
            const url = new URL(initialData.logoUrl);
            return url.pathname;
          } catch {
            return initialData.logoUrl;
          }
        }
        return initialData.logoUrl;
      })();

      setForm(prev => ({
        ...prev,
        ...initialData,
        logoUrl: normalizedLogoUrl
      } as CreateCompanyRequest));
      if (initialData.logoUrl) {
        // Se for uma URL relativa, construir URL completa
        const baseUrl = getApiUrl().replace('/api', '');
        let logoUrl = normalizedLogoUrl || initialData.logoUrl;
        let finalUrl = '';
        
        // Se já for URL completa (http/https), usar como está
        if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
          finalUrl = logoUrl;
        } 
        // Se começar com /api/uploads, usar diretamente com baseUrl
        else if (logoUrl.startsWith('/api/uploads/')) {
          finalUrl = `${baseUrl}${logoUrl}`;
        }
        // Se começar com /uploads, adicionar /api
        else if (logoUrl.startsWith('/uploads/')) {
          finalUrl = `${baseUrl}/api${logoUrl}`;
        }
        // Se não começar com /, assumir que é relativo ao endpoint de uploads
        else {
          finalUrl = `${baseUrl}/api/uploads/companies/logos/${logoUrl}`;
        }
        
        console.log('🔍 Construindo URL do logo:', { 
          original: logoUrl, 
          baseUrl, 
          finalUrl 
        });
        setLogoPreview(finalUrl);
      }
    } else if (open) {
      // Reset form when opening for new company
      setForm({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        enderecoRua: '',
        enderecoNumero: '',
        enderecoComplemento: '',
        enderecoBairro: '',
        city: '',
        state: '',
        zipCode: '',
        sigla: '',
        description: '',
        website: '',
        status: 'ACTIVE',
        logoUrl: ''
      });
      setLogoFile(null);
      setLogoPreview(null);
    }
  }, [open, initialData]);

  // Função para aplicar máscara de CEP
  const aplicarMascaraCep = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d{0,3})/, '$1-$2');
  };

  // Função para buscar CEP via API ViaCEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        const enderecoCompleto = `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}, ${cepLimpo}`;
        setForm(prev => ({
          ...prev,
          enderecoRua: data.logradouro || '',
          enderecoBairro: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          zipCode: cepLimpo,
          address: enderecoCompleto // Manter compatibilidade com campo antigo
        }));
        toast({
          title: "CEP encontrado",
          description: "Endereço preenchido automaticamente.",
          variant: "default"
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar o CEP.",
        variant: "destructive"
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const handleChange = (key: keyof CreateCompanyRequest, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Apenas arquivos PNG, JPG e JPEG são permitidos.',
        variant: 'destructive'
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 5MB.',
        variant: 'destructive'
      });
      return;
    }

    setLogoFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Fazer upload do logo
    await uploadLogo(file);
  };

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/uploads/companies/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Backend retorna: /api/uploads/companies/logos/{filename}
      const logoUrl = response.data.url;
      
      // Construir URL completa apenas para preview
      const baseUrl = getApiUrl().replace('/api', '');
      let fullLogoUrl = logoUrl;
      
      // Se já for URL completa (http/https), usar como está
      if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
        fullLogoUrl = logoUrl;
      } 
      // Se começar com /api/uploads, usar diretamente com baseUrl
      else if (logoUrl.startsWith('/api/uploads/')) {
        fullLogoUrl = `${baseUrl}${logoUrl}`;
      }
      // Se começar com /uploads, adicionar /api
      else if (logoUrl.startsWith('/uploads/')) {
        fullLogoUrl = `${baseUrl}/api${logoUrl}`;
      }
      // Se não começar com /, assumir que é relativo ao endpoint de uploads
      else {
        fullLogoUrl = `${baseUrl}/api/uploads/companies/logos/${logoUrl}`;
      }
      
      // IMPORTANTE: Salvar apenas o caminho relativo no banco (/api/uploads/companies/logos/{filename})
      // A URL completa será construída quando necessário (exibição)
      setForm(prev => ({ ...prev, logoUrl: logoUrl }));
      setLogoPreview(fullLogoUrl);
      toast({
        title: 'Logo enviado',
        description: 'Logo enviado com sucesso.'
      });
    } catch (err: any) {
      console.error('Erro ao fazer upload do logo:', err);
      toast({
        title: 'Erro ao enviar logo',
        description: err.response?.data?.error || 'Não foi possível enviar o logo.',
        variant: 'destructive'
      });
      setLogoFile(null);
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setForm(prev => ({ ...prev, logoUrl: '' }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.cnpj) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha Nome e CNPJ.', variant: 'destructive' });
      return;
    }
    if (uploadingLogo) {
      toast({ title: 'Aguarde o upload', description: 'Finalize o envio da logomarca antes de salvar.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const formData = {
        ...form
      };
      
      let saved;
      if ((initialData as any)?.id) {
        saved = await companyService.updateCompany((initialData as any).id, formData);
      } else {
        saved = await companyService.createCompany(formData);
      }
      toast({
        title: isEditMode ? 'Empresa atualizada' : 'Empresa criada',
        description: isEditMode ? 'Alterações salvas com sucesso.' : 'Cadastro realizado com sucesso.'
      });
      onSuccess?.(saved);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.response?.data?.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl w-full p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[90vh] bg-seguranca-graphite border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-seguranca-yellow">
            {isEditMode ? 'Editar Empresa' : 'Nova Empresa'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-300">
            {isEditMode
              ? 'Atualize os dados da empresa e salve as alterações.'
              : 'Preencha os dados mínimos: Nome e CNPJ. Campos adicionais são opcionais.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Seção: Dados Básicos */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-seguranca-yellow border-b border-gray-600 pb-2">Dados Básicos</h3>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Nome da Empresa *</Label>
              <Input value={form.name} onChange={e => handleChange('name', e.target.value)} className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" placeholder="Razão Social" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">CNPJ *</Label>
                <Input value={form.cnpj} onChange={e => handleChange('cnpj', e.target.value)} className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Sigla</Label>
                <Input value={form.sigla} onChange={e => handleChange('sigla', e.target.value.toUpperCase())} maxLength={8} className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" placeholder="ADM, TERC, VIG..." />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Status</Label>
                <select
                  value={form.status}
                  onChange={e => handleChange('status', e.target.value as any)}
                  className="w-full h-9 sm:h-10 text-xs sm:text-sm rounded-md bg-white border border-gray-300 text-black px-3 py-2 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                >
                  <option value="ACTIVE">Ativa</option>
                  <option value="PENDING">Pendente</option>
                  <option value="INACTIVE">Inativa</option>
                  <option value="SUSPENDED">Suspensa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção: Contato */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-seguranca-yellow border-b border-gray-600 pb-2">Contato</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Email</Label>
                <Input value={form.email} onChange={e => handleChange('email', e.target.value)} className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" placeholder="email@empresa.com" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Telefone</Label>
                <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" placeholder="(00) 0000-0000" />
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Website</Label>
              <Input value={form.website} onChange={e => handleChange('website', e.target.value)} className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" placeholder="https://suaempresa.com" />
            </div>
          </div>

          {/* Seção: Endereço */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-seguranca-yellow border-b border-gray-600 pb-2">Endereço</h3>
            
            {/* CEP, Número, Estado - 3 colunas (campos pequenos) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">CEP</Label>
                <div className="relative">
                  <Input 
                    value={aplicarMascaraCep(form.zipCode || '')} 
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '');
                      setForm(prev => ({ ...prev, zipCode: valor }));
                      if (valor.length === 8) {
                        buscarCep(valor);
                      }
                    }}
                    onBlur={(e) => {
                      const valor = e.target.value.replace(/\D/g, '');
                      if (valor.length === 8) {
                        buscarCep(valor);
                      }
                    }}
                    className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" 
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {loadingCep && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-seguranca-yellow"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Número</Label>
                <Input 
                  value={form.enderecoNumero || ''} 
                  onChange={e => handleChange('enderecoNumero', e.target.value)} 
                  className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" 
                  placeholder="123" 
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Estado (UF)</Label>
                <Input 
                  value={form.state || ''} 
                  onChange={e => handleChange('state', e.target.value.toUpperCase())} 
                  className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" 
                  placeholder="MG" 
                  maxLength={2}
                />
              </div>
            </div>

            {/* Rua - largura total */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Rua</Label>
              <Input 
                value={form.enderecoRua || ''} 
                onChange={e => handleChange('enderecoRua', e.target.value)} 
                className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" 
                placeholder="Nome da rua" 
              />
            </div>

            {/* Complemento e Bairro - 2 colunas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Complemento</Label>
                <Input 
                  value={form.enderecoComplemento || ''} 
                  onChange={e => handleChange('enderecoComplemento', e.target.value)} 
                  className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" 
                  placeholder="Apto, Bloco, etc." 
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Bairro</Label>
                <Input 
                  value={form.enderecoBairro || ''} 
                  onChange={e => handleChange('enderecoBairro', e.target.value)} 
                  className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" 
                  placeholder="Nome do bairro" 
                />
              </div>
            </div>

            {/* Cidade - largura total */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Cidade</Label>
              <Input 
                value={form.city || ''} 
                onChange={e => handleChange('city', e.target.value)} 
                className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow" 
                placeholder="Nome da cidade" 
              />
            </div>
          </div>

          {/* Seção: Informações Adicionais */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-seguranca-yellow border-b border-gray-600 pb-2">Informações Adicionais</h3>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Logo da Empresa</Label>
              <div className="space-y-2">
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 sm:w-32 sm:h-32 object-contain border border-gray-600 rounded-md bg-white p-2"
                      onError={(e) => {
                        console.error('Erro ao carregar imagem do logo:', logoPreview);
                        // Se falhar ao carregar, limpar o preview e mostrar área de upload
                        setLogoPreview(null);
                        setForm(prev => ({ ...prev, logoUrl: '' }));
                        toast({
                          title: 'Erro ao carregar logo',
                          description: 'Não foi possível carregar a imagem. Por favor, faça upload novamente.',
                          variant: 'destructive'
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-3 sm:pt-5 pb-4 sm:pb-6">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-gray-400" />
                      <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-gray-400">
                        <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG ou JPEG (máx. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleLogoChange}
                      disabled={uploadingLogo}
                    />
                  </label>
                )}
                {uploadingLogo && (
                  <p className="text-xs text-gray-400">Enviando logo...</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-600">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base border-gray-600 text-white hover:bg-seguranca-black">Cancelar</Button>
            <Button
              type="submit"
              disabled={loading || uploadingLogo}
              className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {loading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Salvar Empresa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyFormModal;

