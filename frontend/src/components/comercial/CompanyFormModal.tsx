import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { companyService, CreateCompanyRequest } from '@/services/companyService';
import api from '@/lib/axios';
import { getApiUrl } from '@/config/environment';
import { resolveCompanyLogoUrl, resolveCompanyBannerUrl } from '@/utils/logoUtils';
import { Upload, X, Image as ImageIcon, Building2, CheckCircle2, Sparkles, Images, Trash2, ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';

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
  const [uploadingBanners, setUploadingBanners] = useState(false);
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
    logoUrl: '',
    bannerUrls: []
  });

  React.useEffect(() => {
    if (open && initialData) {
      const initialLogo = initialData.logoUrl || '';
      const initialBanners = (initialData as any).bannerUrls || [];
      setForm(prev => ({
        ...prev,
        ...initialData,
        logoUrl: initialLogo,
        bannerUrls: Array.isArray(initialBanners) ? initialBanners : []
      } as CreateCompanyRequest));
      setLogoFile(null);
      if (initialLogo) {
        setLogoPreview(resolveCompanyLogoUrl(initialLogo));
      } else {
        setLogoPreview(null);
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
        logoUrl: '',
        bannerUrls: []
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

    // Reset input value to allow selecting the same file again
    e.target.value = '';

    // Validar tipo de arquivo
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

    // Criar preview local imediato
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Fazer upload do ícone da empresa
    await uploadLogo(file);
  };

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true);
    try {
      const data = await companyService.uploadLogo(file);
      const logoUrl = data.url;
      setForm(prev => ({ ...prev, logoUrl }));
      setLogoPreview(resolveCompanyLogoUrl(logoUrl));
      toast({
        title: 'Ícone enviado com sucesso',
        description: 'O ícone da empresa foi carregado e salvo.',
        className: 'bg-emerald-600 text-white'
      });
    } catch (err: any) {
      console.error('Erro ao fazer upload do ícone:', err);
      toast({
        title: 'Erro ao enviar ícone',
        description: err.response?.data?.error || err.response?.data?.message || 'Não foi possível enviar o ícone da empresa.',
        variant: 'destructive'
      });
      setLogoFile(null);
      // Se já existia logo salvo no banco, restaura o preview da logo original
      if (form.logoUrl) {
        setLogoPreview(resolveCompanyLogoUrl(form.logoUrl));
      } else {
        setLogoPreview(null);
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLogoFile(null);
    setLogoPreview(null);
    setForm(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileList = Array.from(files);
    e.target.value = '';

    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const validFiles = fileList.filter(f => {
      const hasValidExt = validExtensions.some(ext => f.name.toLowerCase().endsWith(ext));
      const hasValidMime = f.type.startsWith('image/');
      const hasValidSize = f.size <= 10 * 1024 * 1024;
      return (hasValidMime || hasValidExt) && hasValidSize;
    });

    if (validFiles.length === 0) {
      toast({
        title: 'Arquivos inválidos',
        description: 'Selecione imagens válidas (PNG, JPG, JPEG, WEBP) de até 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploadingBanners(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of validFiles) {
        const res = await companyService.uploadBanner(file);
        if (res?.url) {
          uploadedUrls.push(res.url);
        }
      }

      setForm(prev => ({
        ...prev,
        bannerUrls: [...(prev.bannerUrls || []), ...uploadedUrls]
      }));

      toast({
        title: `${uploadedUrls.length} banner(s) adicionado(s)`,
        description: 'Banners carregados com sucesso. Lembre-se de salvar a empresa.',
        className: 'bg-emerald-600 text-white'
      });
    } catch (err: any) {
      console.error('Erro ao fazer upload de banners:', err);
      toast({
        title: 'Erro no envio dos banners',
        description: err.response?.data?.message || 'Não foi possível enviar os banners.',
        variant: 'destructive'
      });
    } finally {
      setUploadingBanners(false);
    }
  };

  const removeBanner = (indexToRemove: number) => {
    setForm(prev => ({
      ...prev,
      bannerUrls: (prev.bannerUrls || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const moveBanner = (index: number, direction: 'left' | 'right') => {
    setForm(prev => {
      const current = [...(prev.bannerUrls || [])];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return prev;
      const [item] = current.splice(index, 1);
      current.splice(targetIndex, 0, item);
      return { ...prev, bannerUrls: current };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.cnpj) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha Nome e CNPJ.', variant: 'destructive' });
      return;
    }
    if (uploadingLogo || uploadingBanners) {
      toast({ title: 'Aguarde o upload', description: 'Finalize o envio das imagens antes de salvar.', variant: 'destructive' });
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
          {/* Seção: Ícone & Logomarca da Empresa */}
          <div className="p-4 rounded-xl bg-gray-800/90 border border-gray-700 shadow-md">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Preview Box do Ícone */}
              <div className="relative flex-shrink-0 group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-900 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-seguranca-yellow transition-all p-2">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Ícone da empresa"
                      className="w-full h-full object-contain rounded-xl"
                      onError={() => {
                        console.warn('⚠️ Erro ao carregar preview do ícone');
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center text-gray-400 p-1">
                      {form.sigla || form.name ? (
                        <span className="text-xl sm:text-2xl font-black text-seguranca-yellow tracking-wider">
                          {(form.sigla || form.name.slice(0, 3)).toUpperCase()}
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

              {/* Upload Controls & Details */}
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
                      : 'bg-seguranca-red hover:bg-seguranca-darkred text-white hover:shadow-md hover:shadow-red-900/30'
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

          {/* Seção: Banners Motivacionais do Dashboard */}
          <div className="p-4 rounded-xl bg-gray-800/90 border border-gray-700 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-700/80 pb-3">
              <div>
                <Label className="text-sm font-semibold text-seguranca-yellow flex items-center gap-1.5">
                  <Images className="w-4 h-4 text-amber-400" />
                  Banners Motivacionais do Dashboard
                </Label>
                <p className="text-xs text-gray-300 mt-0.5">
                  Imagens que rotacionam no topo do Dashboard para engajar e motivar a equipe. Recomendado formato widescreen (16:9).
                </p>
              </div>

              <label className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all shadow-sm flex-shrink-0 ${
                uploadingBanners
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold hover:shadow-md hover:shadow-amber-500/20 active:scale-95'
              }`}>
                {uploadingBanners ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    <span>Enviando banners...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-black" />
                    <span>Adicionar Banners</span>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.webp"
                  multiple
                  onChange={handleBannerUpload}
                  disabled={uploadingBanners}
                />
              </label>
            </div>

            {/* Grade de Banners */}
            {(!form.bannerUrls || form.bannerUrls.length === 0) ? (
              <div className="p-4 rounded-xl border border-dashed border-gray-600 bg-gray-900/40 text-center space-y-1">
                <Images className="w-8 h-8 text-gray-500 mx-auto mb-1" />
                <p className="text-xs text-gray-400 font-medium">Nenhum banner cadastrado para esta empresa.</p>
                <p className="text-[11px] text-gray-500">
                  Clique em "Adicionar Banners" para carregar imagens motivacionais da equipe.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {form.bannerUrls.map((bannerUrl, index) => {
                  const resolvedUrl = resolveCompanyBannerUrl(bannerUrl) || bannerUrl;
                  return (
                    <div 
                      key={`${bannerUrl}-${index}`}
                      className="group relative rounded-xl border border-gray-700 bg-gray-900/80 overflow-hidden shadow-sm hover:border-amber-500/60 transition-all flex flex-col"
                    >
                      {/* Imagem do Banner */}
                      <div className="relative aspect-video w-full overflow-hidden bg-black/50">
                        <img 
                          src={resolvedUrl} 
                          alt={`Banner motivacional ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0.4';
                          }}
                        />
                        {/* Badge de Ordem */}
                        <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-amber-400 text-[11px] font-black px-2 py-0.5 rounded-md border border-amber-500/30 shadow">
                          {index + 1}º Banner
                        </span>

                        {/* Botão Excluir */}
                        <button
                          type="button"
                          onClick={() => removeBanner(index)}
                          className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white rounded-full p-1.5 shadow transition-all hover:scale-110"
                          title="Remover este banner"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Controles de Reordenação */}
                      <div className="p-2 flex items-center justify-between bg-gray-950/60 border-t border-gray-800 text-xs">
                        <span className="text-[11px] text-gray-400 font-medium">Ordem de exibição</span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={index === 0}
                            onClick={() => moveBanner(index, 'left')}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white disabled:opacity-30"
                            title="Mover para frente"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={index === form.bannerUrls!.length - 1}
                            onClick={() => moveBanner(index, 'right')}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white disabled:opacity-30"
                            title="Mover para trás"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-seguranca-lightgray">Descrição da Empresa</Label>
              <Input
                value={form.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                className="h-9 sm:h-10 text-xs sm:text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                placeholder="Breve descrição ou ramo de atuação"
              />
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

