import React, { useState, useEffect, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Building,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Globe,
  LayoutGrid,
  List,
  AlertTriangle,
  Power,
  ShieldAlert,
  Archive,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { CompanyFormModal } from '@/components/comercial/CompanyFormModal';
import { CompanyViewModal } from '@/components/comercial/CompanyViewModal';
import { Company360Dashboard } from '@/components/empresa/Company360Dashboard';
import { companyService } from '@/services/companyService';
import { Company } from '@/types/company';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/environment';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';
import { Sparkles, PieChart as PieChartIcon } from 'lucide-react';

export const Empresas: React.FC = () => {
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState<'empresas' | 'overview360'>('empresas');
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [actionType, setActionType] = useState<'DEACTIVATE' | 'DELETE'>('DEACTIVATE');
  const [confirmationText, setConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<Company | null>(null);

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const list = await companyService.getAllCompanies();
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast({
        title: 'Erro ao carregar empresas',
        description: e?.response?.data?.message || 'Não foi possível buscar a lista de empresas.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const formatCnpj = (value?: string) => {
    if (!value) return '-';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 14) {
      return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const getLogoUrl = (logoUrl?: string) => {
    return resolveCompanyLogoUrl(logoUrl);
  };

  const handleToggleStatus = async (company: Company) => {
    setTogglingStatusId(company.id);
    try {
      await companyService.toggleCompanyStatus(company.id, company.status);
      toast({
        title: 'Status atualizado',
        description: `Empresa ${company.name} agora está ${company.status === 'ACTIVE' ? 'INATIVA' : 'ATIVA'}.`,
        className: 'bg-emerald-600 text-white'
      });
      await loadCompanies();
    } catch (e: any) {
      toast({
        title: 'Erro ao alterar status',
        description: e?.response?.data?.message || 'Não foi possível alterar o status da empresa.',
        variant: 'destructive'
      });
    } finally {
      setTogglingStatusId(null);
    }
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    setDeleting(true);
    try {
      await companyService.deleteCompany(companyToDelete.id);
      toast({
        title: 'Empresa excluída com sucesso',
        description: `O registro de ${companyToDelete.name} foi removido permanentemente.`,
        className: 'bg-emerald-600 text-white'
      });
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      setConfirmationText('');
      await loadCompanies();
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Erro ao excluir empresa.';
      toast({
        title: 'Não foi possível excluir definitivamente',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (company: Company) => {
    setCompanyToDelete(company);
    setActionType(company.status === 'ACTIVE' ? 'DEACTIVATE' : 'DELETE');
    setConfirmationText('');
    setDeleteDialogOpen(true);
  };

  const filteredItems = useMemo(() => {
    return items.filter((c) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sigla?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cnpj?.replace(/\D/g, '').includes(searchQuery.replace(/\D/g, '')) ||
        c.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && c.status === 'ACTIVE') ||
        (statusFilter === 'INACTIVE' && c.status !== 'ACTIVE');

      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.status === 'ACTIVE').length;
    const inactive = total - active;
    const withCnpj = items.filter((i) => i.cnpj && i.cnpj.trim().length > 0).length;
    return { total, active, inactive, withCnpj };
  }, [items]);

  const modalLogo = companyToDelete ? getLogoUrl(companyToDelete.logoUrl) : null;

  return (
    <StandardLayout
      title="Empresas & Governança Corporativa"
      subtitle="Gerenciamento corporativo, matrizes, filiais, visão holística 360° e parâmetros contratuais."
    >
      <div className="space-y-6 pb-12">
        {/* Main Tab Selector */}
        <div className="flex items-center gap-2 p-1.5 bg-seguranca-black/60 border border-gray-800 rounded-2xl w-fit backdrop-blur-md shadow-lg">
          <Button
            variant={mainTab === 'empresas' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMainTab('empresas')}
            className={`rounded-xl font-bold text-xs gap-2 transition-all ${
              mainTab === 'empresas'
                ? 'bg-seguranca-red text-white shadow-lg shadow-seguranca-red/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Cadastro & Gestão de Empresas
          </Button>

          <Button
            variant={mainTab === 'overview360' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMainTab('overview360')}
            className={`rounded-xl font-bold text-xs gap-2 transition-all ${
              mainTab === 'overview360'
                ? 'bg-gradient-to-r from-orange-500 to-seguranca-yellow text-seguranca-black font-black shadow-lg shadow-orange-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Visão Executiva 360° & Governança
          </Button>
        </div>

        {mainTab === 'overview360' ? (
          <Company360Dashboard />
        ) : (
          <>
            {/* Top Header Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border hover:border-primary/40 transition-all shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Cadastradas</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{stats.total}</h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

          <Card className="bg-card border-border hover:border-emerald-500/40 transition-all shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Empresas Ativas</p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-amber-500/40 transition-all shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Inativas / Suspensas</p>
                <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.inactive}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                <XCircle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-purple-500/40 transition-all shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">CNPJ Regular</p>
                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.withCnpj}</h3>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/20">
                <Building className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar & Controls */}
        <Card className="bg-card border-border p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search and Filters */}
            <div className="flex flex-1 flex-col sm:flex-row gap-3 items-center">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, sigla, CNPJ ou cidade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex bg-muted/60 p-1 rounded-lg border border-border w-full sm:w-auto">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === 'ALL'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                  }`}
                >
                  Todas ({stats.total})
                </button>
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-background/80'
                  }`}
                >
                  Ativas ({stats.active})
                </button>
                <button
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-background/80'
                  }`}
                >
                  Inativas ({stats.inactive})
                </button>
              </div>
            </div>

            {/* View Mode & Actions */}
            <div className="flex items-center gap-2">
              <div className="flex bg-muted/60 p-1 rounded-lg border border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`h-8 px-2.5 rounded-md ${
                    viewMode === 'table' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                  title="Visualização em Lista/Tabela"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 px-2.5 rounded-md ${
                    viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                  title="Visualização em Cards"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadCompanies}
                disabled={loading}
                className="h-10 border-border bg-background hover:bg-accent text-foreground shadow-sm"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                className="h-10 bg-gradient-to-r from-seguranca-red to-red-600 hover:from-red-600 hover:to-seguranca-darkred text-white shadow-md shadow-red-950/20"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus className="mr-1.5 w-4 h-4" /> Nova Empresa
              </Button>
            </div>
          </div>
        </Card>

        {/* Content View */}
        {loading && items.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando dados das empresas...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="bg-card border-border p-12 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Nenhuma empresa encontrada</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'Nenhum resultado corresponde aos filtros aplicados.'
                : 'Você ainda não possui empresas cadastradas no sistema.'}
            </p>
            {!searchQuery && (
              <Button
                className="mt-6 bg-seguranca-red hover:bg-seguranca-darkred text-white shadow"
                onClick={() => setOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Cadastrar Primeira Empresa
              </Button>
            )}
          </Card>
        ) : viewMode === 'table' ? (
          /* Table View */
          <Card className="bg-card border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3.5 px-4">Empresa</th>
                    <th className="py-3.5 px-4">CNPJ / Documento</th>
                    <th className="py-3.5 px-4">Localização</th>
                    <th className="py-3.5 px-4">Contato</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {filteredItems.map((c) => {
                    const logo = getLogoUrl(c.logoUrl);
                    const isActive = c.status === 'ACTIVE';

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-muted/40 transition-colors group"
                      >
                        {/* Empresa Name & Logo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                              {logo ? (
                                <img
                                  src={logo}
                                  alt={c.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="text-xs font-bold text-red-600 dark:text-red-400 tracking-wider">
                                  {c.sigla || c.name.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                {c.name}
                                {c.sigla && (
                                  <Badge
                                    variant="outline"
                                    className="bg-muted border-border text-[10px] text-muted-foreground uppercase px-1.5 py-0"
                                  >
                                    {c.sigla}
                                  </Badge>
                                )}
                              </div>
                              {c.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                                  {c.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* CNPJ */}
                        <td className="py-3 px-4 font-mono text-xs text-foreground/80">
                          {formatCnpj(c.cnpj)}
                        </td>

                        {/* Localização */}
                        <td className="py-3 px-4">
                          {c.city || c.state ? (
                            <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span>
                                {c.city || '-'} {c.state ? `/ ${c.state}` : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>

                        {/* Contato */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5 text-xs">
                            {c.email && (
                              <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                <span className="truncate max-w-[160px]">{c.email}</span>
                              </div>
                            )}
                            {c.phone && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                <span>{c.phone}</span>
                              </div>
                            )}
                            {!c.email && !c.phone && <span className="text-muted-foreground">-</span>}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`cursor-pointer select-none transition-all ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 hover:bg-red-500/25'
                            }`}
                            onClick={() => handleToggleStatus(c)}
                            title="Clique para alternar o status"
                          >
                            {togglingStatusId === c.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                            ) : isActive ? (
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400 inline" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1 text-red-600 dark:text-red-400 inline" />
                            )}
                            {isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                              title="Visualizar Detalhes"
                              onClick={() => {
                                setViewing(c);
                                setViewOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-500/10 rounded-lg"
                              title="Editar Empresa"
                              onClick={() => {
                                setEditing(c);
                                setOpen(true);
                              }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10 rounded-lg"
                              title={isActive ? 'Desativar Empresa' : 'Ativar Empresa'}
                              onClick={() => handleToggleStatus(c)}
                              disabled={togglingStatusId === c.id}
                            >
                              <Power className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-500/10 rounded-lg"
                              title="Gerenciar Exclusão / Desativação"
                              onClick={() => openDeleteModal(c)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* Grid Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((c) => {
              const logo = getLogoUrl(c.logoUrl);
              const isActive = c.status === 'ACTIVE';

              return (
                <Card
                  key={c.id}
                  className="bg-card border-border hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                          {logo ? (
                            <img
                              src={logo}
                              alt={c.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-sm font-bold text-red-600 dark:text-red-400 tracking-wider">
                              {c.sigla || c.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-base leading-snug line-clamp-1">
                            {c.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {c.sigla && (
                              <Badge
                                variant="outline"
                                className="bg-muted border-border text-[10px] text-muted-foreground uppercase px-1.5 py-0"
                              >
                                {c.sigla}
                              </Badge>
                            )}
                            <span className="text-xs font-mono text-muted-foreground">
                              {formatCnpj(c.cnpj)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        className={`cursor-pointer select-none text-[11px] ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                        }`}
                        onClick={() => handleToggleStatus(c)}
                      >
                        {isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>

                    {/* Description */}
                    {c.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-2.5 rounded-lg border border-border">
                        {c.description}
                      </p>
                    )}

                    {/* Metadata Items */}
                    <div className="space-y-1.5 pt-1 text-xs border-t border-border">
                      {(c.city || c.state) && (
                        <div className="flex items-center gap-2 text-foreground/80">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span>
                            {c.city || ''} {c.state ? `(${c.state})` : ''} {c.address ? `• ${c.address}` : ''}
                          </span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-2 text-foreground/80">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-2 text-foreground/80">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {c.website && (
                        <div className="flex items-center gap-2 text-primary hover:underline">
                          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                          <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="truncate">
                            {c.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 bg-background border-border hover:bg-accent text-xs text-foreground"
                      onClick={() => {
                        setViewing(c);
                        setViewOpen(true);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Detalhes
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-border bg-background hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs px-2.5"
                      onClick={() => {
                        setEditing(c);
                        setOpen(true);
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-border bg-background hover:bg-red-500/10 text-red-600 dark:text-red-400 text-xs px-2.5"
                      onClick={() => openDeleteModal(c)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </>
    )}

        {/* Modal Formulário Criar / Editar */}
        <CompanyFormModal
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
          onSuccess={async () => {
            await loadCompanies();
          }}
          initialData={editing}
        />

        {/* Modal Visualização */}
        <CompanyViewModal
          open={viewOpen}
          onOpenChange={(o) => {
            setViewOpen(o);
            if (!o) setViewing(null);
          }}
          company={viewing}
        />

        {/* ─── MODAL PREMIUM DE EXCLUSÃO & DESATIVAÇÃO DE EMPRESA ─── */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground max-w-xl p-0 overflow-hidden shadow-2xl rounded-2xl">
            {/* Modal Header Banner */}
            <DialogHeader className="bg-gradient-to-r from-red-500/15 via-muted/60 to-muted/20 p-6 border-b border-red-500/20 text-left">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
                    Gerenciar Remoção da Empresa
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-1">
                    Escolha entre a desativação segura (recomendada) ou a exclusão permanente do cadastro.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-5">
              {/* Company Identity Badge */}
              {companyToDelete && (
                <div className="bg-muted/40 border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                      {modalLogo ? (
                        <img
                          src={modalLogo}
                          alt={companyToDelete.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          {companyToDelete.sigla || companyToDelete.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-sm truncate">
                        {companyToDelete.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        {companyToDelete.sigla && (
                          <Badge variant="outline" className="bg-muted border-border text-[10px] text-muted-foreground">
                            {companyToDelete.sigla}
                          </Badge>
                        )}
                        <span className="font-mono">{formatCnpj(companyToDelete.cnpj)}</span>
                        {companyToDelete.city && (
                          <span>• {companyToDelete.city}/{companyToDelete.state || ''}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge
                    className={
                      companyToDelete.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                    }
                  >
                    {companyToDelete.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              )}

              {/* Action Selection Cards */}
              <div className="grid grid-cols-1 gap-3">
                {/* Option 1: Desativação Segura */}
                <div
                  onClick={() => setActionType('DEACTIVATE')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 relative ${
                    actionType === 'DEACTIVATE'
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-muted/20 border-border hover:border-muted-foreground/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                    actionType === 'DEACTIVATE'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}>
                    <Archive className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {companyToDelete?.status === 'ACTIVE' ? 'Desativar Empresa' : 'Reativar Empresa'}
                      </span>
                      <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">
                        Recomendado
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {companyToDelete?.status === 'ACTIVE'
                        ? 'Oculta a empresa das operações ativas, mas preserva todo o histórico financeiro, contratos, funcionários e relatórios intactos.'
                        : 'Reativa a empresa para que possa ser utilizada novamente em contratos e alocações.'}
                    </p>
                  </div>
                  <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center mt-1">
                    {actionType === 'DEACTIVATE' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                  </div>
                </div>

                {/* Option 2: Exclusão Permanente */}
                <div
                  onClick={() => setActionType('DELETE')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 relative ${
                    actionType === 'DELETE'
                      ? 'bg-red-500/10 border-red-500/40 shadow-sm'
                      : 'bg-muted/20 border-border hover:border-muted-foreground/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                    actionType === 'DELETE'
                      ? 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}>
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">Exclusão Permanente</span>
                      <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30 text-[10px]">
                        Apenas sem vínculos
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Remove o registro definitivamente do banco de dados. <span className="text-red-600 dark:text-red-400 font-medium">Atenção:</span> Falhará se houver funcionários, veículos ou contratos associados à empresa.
                    </p>
                  </div>
                  <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center mt-1">
                    {actionType === 'DELETE' && <div className="w-2 h-2 rounded-full bg-red-600" />}
                  </div>
                </div>
              </div>

              {/* Informative Guidance */}
              {actionType === 'DELETE' ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex items-start gap-3 text-xs text-foreground">
                  <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground">Confirmação de Segurança:</strong>
                    <p className="mt-0.5 text-muted-foreground">
                      Para evitar exclusões acidentais, digite o nome da empresa <strong className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">{companyToDelete?.name}</strong> abaixo:
                    </p>
                    <Input
                      placeholder="Digite o nome exato da empresa..."
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      className="mt-2.5 bg-background border-input text-foreground placeholder:text-muted-foreground h-9 text-xs focus-visible:ring-red-500/30"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-2.5 text-xs text-foreground">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    A desativação é 100% reversível e garante que relatórios de auditoria e folhas passadas não percam referências.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-muted/40 p-4 border-t border-border flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setCompanyToDelete(null);
                }}
                disabled={deleting}
              >
                Cancelar
              </Button>

              <div className="flex items-center gap-2">
                {actionType === 'DEACTIVATE' ? (
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                    onClick={async () => {
                      if (companyToDelete) {
                        setDeleting(true);
                        await handleToggleStatus(companyToDelete);
                        setDeleting(false);
                        setDeleteDialogOpen(false);
                        setCompanyToDelete(null);
                      }
                    }}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Processando...
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-1.5" />
                        {companyToDelete?.status === 'ACTIVE' ? 'Confirmar Desativação' : 'Confirmar Reativação'}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    onClick={handleDelete}
                    disabled={
                      deleting ||
                      confirmationText.trim().toLowerCase() !==
                        (companyToDelete?.name?.trim().toLowerCase() || '')
                    }
                  >
                    {deleting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1.5" /> Excluir Permanentemente
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
};

export default Empresas;