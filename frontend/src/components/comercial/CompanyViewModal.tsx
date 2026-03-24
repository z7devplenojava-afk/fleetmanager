import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin, Phone, Mail, Globe, FileText, Calendar } from 'lucide-react';
import { Company } from '@/types/company';
import { getApiUrl } from '@/config/environment';

interface CompanyViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
}

export const CompanyViewModal: React.FC<CompanyViewModalProps> = ({ open, onOpenChange, company }) => {
  if (!company) return null;

  // Construir URL do logo
  const getLogoUrl = () => {
    if (!company.logoUrl) return null;
    
    const baseUrl = getApiUrl().replace('/api', '');
    let logoUrl = company.logoUrl;
    const normalizedLogo = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl;
    } else if (normalizedLogo.startsWith('/api/uploads/')) {
      return `${baseUrl}${normalizedLogo}`;
    } else if (normalizedLogo.startsWith('/uploads/')) {
      return `${baseUrl}/api${normalizedLogo}`;
    } else if (normalizedLogo.includes('/uploads/companies/logos/')) {
      return `${baseUrl}/api${normalizedLogo}`;
    } else {
      return `${baseUrl}/api/uploads/companies/logos/${logoUrl}`;
    }
  };

  const logoUrl = getLogoUrl();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-4 sm:p-6 -m-4 sm:-m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            {company.name}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-xs sm:text-sm">
            Visualização completa dos dados da empresa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Logo da Empresa */}
          {logoUrl && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                  </div>
                  Logomarca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <img
                    src={logoUrl}
                    alt={`Logo ${company.name}`}
                    className="max-w-full h-auto max-h-48 sm:max-h-64 object-contain border border-gray-600 rounded-lg bg-white p-2 sm:p-4"
                    onError={(e) => {
                      console.error('Erro ao carregar logo:', logoUrl);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dados Básicos */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                Dados Básicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400 mb-1">Nome</p>
                  <p className="text-sm sm:text-base text-seguranca-lightgray font-medium">{company.name}</p>
                </div>
                {company.sigla && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Sigla</p>
                    <p className="text-sm sm:text-base text-seguranca-lightgray font-medium">{company.sigla.toUpperCase()}</p>
                  </div>
                )}
                {company.cnpj && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">CNPJ</p>
                    <p className="text-sm sm:text-base text-seguranca-lightgray font-medium">{company.cnpj}</p>
                  </div>
                )}
                {company.status && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Status</p>
                    <p className="text-sm sm:text-base text-seguranca-lightgray font-medium">{company.status}</p>
                  </div>
                )}
              </div>
              {company.description && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-400 mb-1">Descrição</p>
                  <p className="text-sm sm:text-base text-seguranca-lightgray">{company.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Telefone</p>
                      <p className="text-sm sm:text-base text-seguranca-lightgray">{company.phone}</p>
                    </div>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">E-mail</p>
                      <p className="text-sm sm:text-base text-seguranca-lightgray">{company.email}</p>
                    </div>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Website</p>
                      <p className="text-sm sm:text-base text-seguranca-lightgray">{company.website}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          {(company.address || company.city || company.state) && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                  </div>
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {company.address && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Endereço Completo</p>
                    <p className="text-sm sm:text-base text-seguranca-lightgray">{company.address}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {company.enderecoRua && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Rua</p>
                      <p className="text-sm sm:text-base text-seguranca-lightgray">{company.enderecoRua}</p>
                    </div>
                  )}
                  {company.enderecoNumero && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Número</p>
                      <p className="text-sm sm:text-base text-seguranca-lightgray">{company.enderecoNumero}</p>
                    </div>
                  )}
                  {company.enderecoBairro && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Bairro</p>
                      <p className="text-sm sm:text-base text-seguranca-lightgray">{company.enderecoBairro}</p>
                    </div>
                  )}
                  {company.city && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Cidade</p>
                      <p className="text-sm sm:text-base text-seguranca-lightgray">{company.city}</p>
                    </div>
                  )}
                  {company.state && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Estado</p>
                      <p className="text-sm sm:text-base text-seguranca-lightgray">{company.state}</p>
                    </div>
                  )}
                  {company.zipCode && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">CEP</p>
                      <p className="text-sm sm:text-base text-seguranca-lightgray">{company.zipCode}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais */}
          {(company.createdAt || company.updatedAt) && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                  </div>
                  Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {company.createdAt && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Data de Criação</p>
                    <p className="text-sm sm:text-base text-seguranca-lightgray">
                      {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                {company.updatedAt && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Última Atualização</p>
                    <p className="text-sm sm:text-base text-seguranca-lightgray">
                      {new Date(company.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

