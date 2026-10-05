import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Proposal } from '@/services/proposalService';
import { companyConfigService, CompanyConfig } from '@/services/companyConfigService';
import { companyService } from '@/services/companyService';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';
import { clientService, Client } from '@/services/clientService';
import leadService, { Lead } from '@/services/leadService';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Printer,
  FileDown,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Truck,
  Fuel,
  CheckCircle2,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

interface ProposalDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal?: Proposal | null;
  onGenerateContract?: (proposal: Proposal) => void;
}

export const ProposalDocumentModal: React.FC<ProposalDocumentModalProps> = ({
  open,
  onOpenChange,
  proposal,
  onGenerateContract
}) => {
  const { user, empresa } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [userCompany, setUserCompany] = useState<any | null>(null);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
  const [imgError, setImgError] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedRecipientType, setSelectedRecipientType] = useState<'client' | 'lead'>('client');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [customClientName, setCustomClientName] = useState<string>('');
  const [customClientDoc, setCustomClientDoc] = useState<string>('');
  const [customClientContact, setCustomClientContact] = useState<string>('');

  useEffect(() => {
    if (open) {
      setImgError(false);
      let isMounted = true;

      // 🏢 Identificar e carregar dinamicamente a empresa a qual o usuário pertence
      const loadUserCompany = async () => {
        // 1. Tentar endpoint da empresa do usuário logado
        try {
          const myComp = await companyService.getMyCompany();
          if (myComp && isMounted) {
            setUserCompany(myComp);
            return;
          }
        } catch {}

        // 2. Tentar por ID da empresa vinculada no token/contexto
        const companyId = (user as any)?.companyId || (user as any)?.company?.id || empresa?.id;
        if (companyId) {
          try {
            const comp = await companyService.getCompanyById(companyId);
            if (comp && isMounted) {
              setUserCompany(comp);
              return;
            }
          } catch {}
        }

        // 3. Tentar encontrar por nome entre as empresas cadastradas
        try {
          const companies = await companyService.getAllCompanies();
          const targetName = empresa?.nome || (user as any)?.companyName || (user as any)?.company?.name;
          if (Array.isArray(companies) && targetName) {
            const match = companies.find(
              (c: any) =>
                (c.name && c.name.toLowerCase() === targetName.toLowerCase()) ||
                (c.sigla && targetName.toLowerCase().includes(c.sigla.toLowerCase()))
            );
            if (match && isMounted) {
              setUserCompany(match);
              return;
            }
          }
        } catch {}

        // 4. Fallback de configuração ativa do sistema
        companyConfigService.getActiveConfig().then((cfg) => {
          if (cfg && isMounted) setCompanyConfig(cfg);
        }).catch(() => {});
      };

      loadUserCompany();

      // Carregar lista de clientes para seleção dinâmica
      clientService.getAllClients().then((data: any) => {
        const list = Array.isArray(data) ? data : data?.content || [];
        if (isMounted) setClients(list);
      }).catch(() => {});

      // Carregar lista de leads
      leadService.getAllLeads().then((data: any) => {
        const list = Array.isArray(data) ? data : data?.content || [];
        if (isMounted) setLeads(list);
      }).catch(() => {});

      return () => {
        isMounted = false;
      };
    }
  }, [open, user, empresa]);

  // Inicializar destinatário com dados da proposta
  useEffect(() => {
    if (proposal) {
      setCustomClientName(proposal.clientName || proposal.client?.name || proposal.leadName || 'Cliente Corporativo');
      setCustomClientDoc(proposal.client?.cnpj || '');
      setCustomClientContact(proposal.leadName || '');
    }
  }, [proposal]);

  if (!proposal) return null;

  // Resolução dinâmica dos dados da Empresa a qual o usuário pertence
  const companyName =
    userCompany?.name ||
    empresa?.nome ||
    (user as any)?.company?.name ||
    (user as any)?.companyName ||
    companyConfig?.name ||
    'EMPRESA CONTRATADA';

  const companySigla =
    userCompany?.sigla ||
    empresa?.sigla ||
    (user as any)?.company?.sigla ||
    (companyName && companyName !== 'EMPRESA CONTRATADA'
      ? companyName
          .split(' ')
          .filter((w: string) => w.length > 2)
          .map((w: string) => w[0])
          .join('')
          .slice(0, 4)
          .toUpperCase()
      : 'EMP');

  const rawCompanyLogo =
    userCompany?.logoUrl ||
    empresa?.logoUrl ||
    (user as any)?.company?.logoUrl ||
    (user as any)?.companyLogo ||
    (user as any)?.companyLogoUrl ||
    companyConfig?.logoUrl ||
    null;

  const companyLogo = resolveCompanyLogoUrl(rawCompanyLogo);

  const formatCnpj = (cnpjRaw?: string) => {
    if (!cnpjRaw) return '';
    const clean = cnpjRaw.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cnpjRaw;
  };

  const companyCnpj = formatCnpj(
    userCompany?.cnpj ||
    (user as any)?.company?.cnpj ||
    companyConfig?.cnpj ||
    ''
  );

  const buildCompanyAddress = () => {
    if (userCompany) {
      const parts: string[] = [];
      const street = userCompany.enderecoRua || userCompany.address;
      if (street) {
        let st = street;
        if (userCompany.enderecoNumero) st += `, ${userCompany.enderecoNumero}`;
        if (userCompany.enderecoComplemento) st += ` - ${userCompany.enderecoComplemento}`;
        parts.push(st);
      }
      if (userCompany.enderecoBairro) parts.push(userCompany.enderecoBairro);
      const cityState = [userCompany.city, userCompany.state].filter(Boolean).join('/');
      if (cityState) parts.push(cityState);
      if (userCompany.zipCode) parts.push(`CEP: ${userCompany.zipCode}`);
      if (parts.length > 0) return parts.join(' · ');
    }
    if (companyConfig?.address) {
      const parts = [companyConfig.address];
      const cityState = [companyConfig.city, companyConfig.state].filter(Boolean).join(' - ');
      if (cityState) parts.push(cityState);
      if (companyConfig.zipCode) parts.push(`CEP: ${companyConfig.zipCode}`);
      return parts.join(' · ');
    }
    return '';
  };

  const companyAddress = buildCompanyAddress();

  const companyContact = (() => {
    const phone = userCompany?.phone || companyConfig?.phone;
    const email = userCompany?.email || companyConfig?.email;
    return [phone, email].filter(Boolean).join(' · ');
  })();

  const handleSelectClient = (clientId: string) => {
    setSelectedRecipientId(clientId);
    const found = clients.find((c) => String(c.id) === clientId);
    if (found) {
      setCustomClientName(found.name);
      setCustomClientDoc(found.cnpj || '');
      setCustomClientContact(found.contactName || found.phone || '');
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedRecipientId(leadId);
    const found = leads.find((l) => String(l.id) === leadId);
    if (found) {
      setCustomClientName(found.company || found.name);
      setCustomClientDoc(found.cnpj || '');
      setCustomClientContact(found.name + (found.phone ? ` (${found.phone})` : ''));
    }
  };

  const formatCurrency = (value?: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:p-0 print:m-0 print:shadow-none print:bg-white print:text-black">
        {/* Estilo Dedicado para Impressão / PDF A4 com Paginação Completa */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-proposal-doc, #printable-proposal-doc * {
              visibility: visible !important;
            }
            #printable-proposal-doc {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              display: block !important;
              box-shadow: none !important;
              border: none !important;
              overflow: visible !important;
              max-height: none !important;
            }
            @page {
              size: A4 portrait;
              margin: 12mm 15mm 15mm 15mm;
            }
          }
        `}</style>

        <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Proposta Comercial Oficial</span>
                <Badge variant="outline" className="border-red-500/40 text-red-400 font-mono text-xs">
                  {proposal.proposalNumber || 'PROPOSTA-PRD'}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Emitida por <strong className="text-slate-200">{companyName}</strong> para <strong className="text-slate-200">{customClientName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-slate-700 text-slate-200 hover:bg-slate-800 h-9 rounded-xl text-xs gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Barra de Seleção / Alteração Dinâmica de Cliente / Lead (Oculta na Impressão) */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden text-xs">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-red-400" />
            <span className="font-semibold text-slate-200">Destinatário da Proposta:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex rounded-lg border border-slate-700 p-0.5 bg-slate-950">
              <button
                type="button"
                onClick={() => setSelectedRecipientType('client')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedRecipientType === 'client' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Clientes ({clients.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecipientType('lead')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedRecipientType === 'lead' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Leads ({leads.length})
              </button>
            </div>

            {selectedRecipientType === 'client' ? (
              <Select value={selectedRecipientId} onValueChange={handleSelectClient}>
                <SelectTrigger className="w-52 h-8 text-xs bg-slate-950 border-slate-700">
                  <SelectValue placeholder="Selecionar Cliente..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-xs">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      {c.name} {c.cnpj ? `(${c.cnpj})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={selectedRecipientId} onValueChange={handleSelectLead}>
                <SelectTrigger className="w-52 h-8 text-xs bg-slate-950 border-slate-700">
                  <SelectValue placeholder="Selecionar Lead..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-xs">
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)} className="text-xs">
                      {l.company || l.name} {l.name ? `· ${l.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Folha Oficial da Proposta (Área de Impressão) */}
        <div
          ref={printRef}
          id="printable-proposal-doc"
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-200 print:bg-white print:text-black print:p-0 print:border-0"
        >
          {/* Cabeçalho da Empresa Emitente (Dinâmico: Empresa a qual o usuário pertence) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-800 print:border-black/30 gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {companyLogo && !imgError ? (
                <div className="shrink-0 flex items-center justify-center p-1 bg-white/5 rounded-xl border border-slate-800/60 print:border-none print:p-0 print:bg-transparent">
                  <img
                    src={companyLogo}
                    alt={`${companyName} Logo`}
                    className="h-12 sm:h-14 w-auto max-w-[170px] object-contain print:h-12"
                    onError={() => setImgError(true)}
                  />
                </div>
              ) : (
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-red-600 to-red-800 border border-red-500/40 flex items-center justify-center text-white font-extrabold text-sm sm:text-base shadow-md print:bg-white print:border-2 print:border-black print:text-black shrink-0">
                  {companySigla || <Building2 className="h-6 w-6" />}
                </div>
              )}
              <div className="border-l-2 border-red-600 pl-3.5 print:border-black/50 min-w-0">
                <h3 className="font-extrabold text-base sm:text-lg text-white print:text-black uppercase tracking-tight leading-tight">
                  {companyName}
                </h3>
                {companyCnpj && (
                  <p className="text-xs text-slate-400 print:text-gray-800 font-medium mt-0.5">
                    CNPJ: <strong>{companyCnpj}</strong>
                  </p>
                )}
                {companyAddress && (
                  <p className="text-[11px] text-slate-400 print:text-gray-600 leading-snug mt-0.5">
                    {companyAddress}
                  </p>
                )}
                {companyContact && (
                  <p className="text-[10px] text-slate-400 print:text-gray-500 mt-0.5">
                    {companyContact}
                  </p>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-400 print:text-gray-700 space-y-0.5 shrink-0 min-w-[210px] print:min-w-0">
              <p>Data de Emissão: <strong className="text-slate-200 print:text-black">{formatDate(proposal.createdAt || new Date().toISOString())}</strong></p>
              <p>Validade da Proposta: <strong className="text-amber-400 print:text-black">{formatDate(proposal.validUntil) || '30 dias'}</strong></p>
              <p>Status: <strong className="text-emerald-400 print:text-black">{proposal.status || 'EMITIDA'}</strong></p>
            </div>
          </div>

          {/* Dados do Cliente / Proponente & Objeto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 print:bg-gray-50 print:border-gray-300">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 print:text-black flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> CLIENTE / PROPONENTE
              </span>
              <p className="text-base font-bold text-white print:text-black">
                {customClientName}
              </p>
              {customClientDoc && (
                <p className="text-xs text-slate-400 print:text-gray-700">
                  CNPJ/CPF: <strong>{customClientDoc}</strong>
                </p>
              )}
              {customClientContact && (
                <p className="text-xs text-slate-400 print:text-gray-700">
                  A/C / Contato: <strong>{customClientContact}</strong>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 print:text-gray-600 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> OBJETO DA PROPOSTA
              </span>
              <p className="text-sm font-semibold text-slate-200 print:text-black">
                {proposal.title || 'Prestação de Serviços de Transporte e Fretamento de Passageiros'}
              </p>
              <p className="text-xs text-slate-400 print:text-gray-600">
                Modelo Operacional: Veículo Dedicado com Motorista, Combustível e Manutenção Integral
              </p>
            </div>
          </div>

          {/* Tabela Paramétrica de Preços / Composição de Frota */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white print:text-black flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400 print:text-black" />
                {proposal.fleetItems && proposal.fleetItems.length > 0
                  ? 'Composição da Frota & Resumo Econômico Consolidado'
                  : 'Resumo Econômico & Composição Paramétrica'}
              </h4>
              <span className="text-xs text-slate-400 print:text-gray-600">
                Regime Operacional: 22 a 26 dias úteis / mês
              </span>
            </div>

            {proposal.fleetItems && proposal.fleetItems.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-300">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 print:bg-gray-100 print:text-black">
                    <tr>
                      <th className="py-2.5 px-3">Item / Rota & Veículo</th>
                      <th className="py-2.5 px-3 text-center">Qtd</th>
                      <th className="py-2.5 px-3 text-right">Franquia/Veíc.</th>
                      <th className="py-2.5 px-3 text-right">Diária Unit.</th>
                      <th className="py-2.5 px-3 text-right">Diária Linha</th>
                      <th className="py-2.5 px-3 text-right">Mensal Estimado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                    {proposal.fleetItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white print:text-black">{item.name}</div>
                          <div className="text-[11px] text-slate-400 print:text-gray-600">
                            {item.vehicleCategory || 'Veículo Comercial'} · {item.excessKmRate ? `KM Excedente: ${formatCurrency(item.excessKmRate)}/km` : 'Sob medição'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-white print:text-black">
                          {item.quantity} un.
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300 print:text-gray-800">
                          {item.franchiseKm ? `${item.franchiseKm.toLocaleString('pt-BR')} km` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300 print:text-gray-800">
                          {formatCurrency(item.dailyRate)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-200 print:text-black">
                          {formatCurrency((item.dailyRate || 0) * item.quantity)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400 print:text-black">
                          {formatCurrency(item.totalMonthly || ((item.dailyRate || 0) * (item.operatingDays || 22) * item.quantity))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950/90 font-bold border-t-2 border-slate-800 print:bg-gray-100">
                    <tr>
                      <td className="py-3 px-3 text-white print:text-black">
                        TOTAL CONSOLIDADO DA FROTA:
                      </td>
                      <td className="py-3 px-3 text-center text-white print:text-black text-sm">
                        {proposal.fleetItems.reduce((sum, it) => sum + it.quantity, 0)} veículo(s)
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300 print:text-black">
                        {proposal.fleetItems.reduce((sum, it) => sum + ((it.franchiseKm || 0) * it.quantity), 0).toLocaleString('pt-BR')} km/mês
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-right text-slate-300 print:text-black">
                        Diária Frota: {formatCurrency(proposal.fleetItems.reduce((sum, it) => sum + ((it.dailyRate || 0) * it.quantity), 0))}
                      </td>
                      <td className="py-3 px-3 text-right text-base text-emerald-400 print:text-black">
                        {formatCurrency(proposal.totalValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-300">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 print:bg-gray-100 print:text-black">
                    <tr>
                      <th className="py-2.5 px-3">Item / Descrição</th>
                      <th className="py-2.5 px-3 text-center">Unidade</th>
                      <th className="py-2.5 px-3 text-right">Valor Unitário</th>
                      <th className="py-2.5 px-3 text-right">Faturamento Estimado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-white print:text-black">
                        Locação Operacional com Condutor & Combustível
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 print:text-gray-700">Mês</td>
                      <td className="py-2.5 px-3 text-right text-slate-300 print:text-black">
                        {formatCurrency(proposal.totalValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400 print:text-black">
                        {formatCurrency(proposal.totalValue)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-slate-300 print:text-gray-800">
                        Tarifa de Quilômetro Excedente à Franquia
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 print:text-gray-700">R$ / KM</td>
                      <td className="py-2.5 px-3 text-right text-slate-300 print:text-black">
                        Conforme Ficha
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 print:text-gray-700">
                        Sob Medição
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-slate-300 print:text-gray-800">
                        Tabela de Viagens Extras (Diária + 15% Margem Operacional)
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 print:text-gray-700">Evento</td>
                      <td className="py-2.5 px-3 text-right text-slate-300 print:text-black">
                        Tabela Anexa
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 print:text-gray-700">
                        Sob Demanda
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-950/80 font-bold border-t border-slate-800 print:bg-gray-100">
                    <tr>
                      <td colSpan={3} className="py-3 px-3 text-right text-slate-300 print:text-black">
                        VALOR TOTAL MENSAL ESTIMADO:
                      </td>
                      <td className="py-3 px-3 text-right text-lg text-emerald-400 print:text-black">
                        {formatCurrency(proposal.totalValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Cláusulas Contratuais Obrigatórias (PRD Módulo 2) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-white print:text-black flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary print:text-black" />
              Cláusulas & Condições Obrigatórias de Faturamento
            </h4>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 text-xs text-slate-300 space-y-2 leading-relaxed print:bg-white print:border-gray-300 print:text-gray-800">
              <p>
                <strong>1. Ciclo de Medição:</strong> O fechamento do Boletim de Medição (BM) ocorrerá mensalmente compreendendo o período do dia <strong>21 do mês anterior ao dia 20 do mês corrente</strong>, com aprovação em até 5 dias úteis e vencimento em 30 dias via boleto bancário.
              </p>
              <p>
                <strong>2. Gatilho do Óleo Diesel:</strong> Fica assegurado o reequilíbrio econômico-financeiro automático do contrato sempre que a variação acumulada do preço do diesel ultrapassar <strong>5% (cinco por cento)</strong> em relação à cotação base da proposta.
              </p>
              <p>
                <strong>3. Retenção Técnica de Caução:</strong> Fica prevista a retenção de <strong>3% (três por cento)</strong> sobre o valor faturado a título de garantia contratual, liberada conforme o cronograma e CNDs vigentes.
              </p>
              <p>
                <strong>4. Manutenção Preventiva Programada (PMP):</strong> Não haverá desconto de diária por paradas destinadas a revisões preventivas programadas conforme o plano do fabricante.
              </p>
            </div>
          </div>

          {/* Descrição Detalhada / Observações */}
          {proposal.description && (
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold uppercase text-slate-400 print:text-gray-600">
                Memória de Cálculo e Detalhes da Operação
              </span>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-xs text-slate-300 whitespace-pre-line print:bg-gray-50 print:border-gray-200">
                {proposal.description}
              </div>
            </div>
          )}

          {/* Assinaturas */}
          <div className="pt-8 border-t border-slate-800 print:border-black/30 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-2">
              <div className="border-b border-slate-700 print:border-black w-3/4 mx-auto pb-6"></div>
              <p className="font-bold text-slate-200 print:text-black uppercase">{companyName}</p>
              <p className="text-slate-400 print:text-gray-600">Representante Legal / Comercial</p>
            </div>

            <div className="space-y-2">
              <div className="border-b border-slate-700 print:border-black w-3/4 mx-auto pb-6"></div>
              <p className="font-bold text-slate-200 print:text-black uppercase">{customClientName || 'DE ACORDO CLIENTE'}</p>
              <p className="text-slate-400 print:text-gray-600">Aceite da Proposta Comercial</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between pt-4 border-t border-slate-800 print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs"
          >
            Fechar
          </Button>

          <div className="flex items-center gap-2">
            {onGenerateContract && (
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onGenerateContract({
                    ...proposal,
                    clientName: customClientName,
                  });
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/20 active:scale-95 transition-all text-xs"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Gerar Minuta Contratual
              </Button>
            )}
            <Button
              type="button"
              onClick={handlePrint}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all text-xs"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Imprimir Proposta (PDF)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalDocumentModal;
