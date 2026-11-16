import React, { useState, useEffect } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Building, Shield, Calendar, Users, FileSpreadsheet, Loader2 } from 'lucide-react';
import { userService } from '@/services/userService';
import companyService from '@/services/companyService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_ROLES = [
  { value: 'ALL', label: 'Todos os Perfis' },
  { value: 'SUPER_ADMIN', label: 'Super Administrador' },
  { value: 'COMPANY_ADMIN', label: 'Admin da Empresa (Tenant)' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'MOTORISTA', label: 'Motorista' },
  { value: 'RH', label: 'Recursos Humanos' },
  { value: 'MECANICO', label: 'Mecânico / Manutenção' },
  { value: 'OPERADOR', label: 'Operador' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'USUARIO', label: 'Usuário Comum' }
];

const AVAILABLE_STATUSES = [
  { value: 'ALL', label: 'Todos os Status' },
  { value: 'ACTIVE', label: 'Ativos' },
  { value: 'BLOCKED', label: 'Bloqueados' },
  { value: 'INACTIVE', label: 'Inativos' }
];

export const UserReportModal: React.FC<UserReportModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const isSuperAdmin = currentUser?.roles?.some(r =>
    ['ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_FLEX_ADMIN', 'FLEX_ADMIN'].includes(r)
  ) || false;

  useEffect(() => {
    if (!isOpen) return;

    if (isSuperAdmin) {
      const loadCompanies = async () => {
        try {
          setLoadingCompanies(true);
          const data = await companyService.getAllCompanies();
          const normalized = Array.isArray(data) ? data.map((c: any) => ({
            id: c.id,
            name: c.name || c.companyName || 'Empresa'
          })) : [];
          setCompanies(normalized);
        } catch (error) {
          console.error('Erro ao carregar empresas:', error);
        } finally {
          setLoadingCompanies(false);
        }
      };
      loadCompanies();
    } else {
      // Tenant admin: empresa fixa
      if (currentUser?.companyId) {
        setSelectedCompanyId(currentUser.companyId);
      }
    }
  }, [isOpen, isSuperAdmin, currentUser]);

  const handleExportPDF = async () => {
    try {
      setIsGeneratingPdf(true);

      const filters = {
        companyId: isSuperAdmin && selectedCompanyId !== 'all' ? selectedCompanyId : (currentUser?.companyId || undefined),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      };

      const blob = await userService.exportUsersReportPDF(filters);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      link.download = `relatorio_usuarios_${timestamp}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Relatório PDF gerado!",
        description: "O relatório de usuários foi baixado com sucesso.",
        variant: "default",
      });
      onClose();
    } catch (error: any) {
      console.error('Erro ao gerar relatório PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error?.response?.data?.message || error?.message || "Não foi possível gerar o relatório PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsGeneratingExcel(true);

      const filters = {
        companyId: isSuperAdmin && selectedCompanyId !== 'all' ? selectedCompanyId : (currentUser?.companyId || undefined),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      };

      const blob = await userService.exportUsersReportExcel(filters);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      link.download = `relatorio_usuarios_${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Relatório Excel gerado!",
        description: "A planilha de usuários foi baixada com sucesso.",
        variant: "default",
      });
      onClose();
    } catch (error: any) {
      console.error('Erro ao gerar relatório Excel:', error);
      toast({
        title: "Erro ao gerar Excel",
        description: error?.response?.data?.message || error?.message || "Não foi possível gerar a planilha Excel.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedCompanyId(isSuperAdmin ? 'all' : (currentUser?.companyId || 'all'));
    setStartDate('');
    setEndDate('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <ResponsiveDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Relatório de Usuários"
      description="Exporte relatórios analíticos em PDF e Excel com filtros por empresa, período e perfil de acesso."
      icon={<FileText className="h-5 w-5 text-red-500" />}
      size="default"
    >
      <div className="space-y-5 py-2">
        {/* Filtro de Empresa */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-muted-foreground" />
            Empresa
          </Label>
          {isSuperAdmin ? (
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
              disabled={loadingCompanies}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Selecione a empresa..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas (Relatório Geral)</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 px-3 border border-border/70 rounded-md flex items-center bg-muted/40 text-xs font-medium text-foreground">
              {currentUser?.companyName || 'Sua Empresa Vinculada'}
            </div>
          )}
        </div>

        {/* Filtro de Período */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Data Cadastro Inicial
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Data Cadastro Final
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Filtro de Perfil / Role */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            Perfil / Função (Role)
          </Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Selecione o perfil..." />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Status */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            Status da Conta
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Selecione o status..." />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Informações adicionais */}
        <div className="p-3 bg-muted/30 border border-border/60 rounded-lg text-[11px] text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Layout Corporativo:</p>
          <p>• O <strong>PDF</strong> inclui logotipo da empresa selecionada, resumo de métricas e lista analítica.</p>
          <p>• O <strong>Excel</strong> inclui aba analítica completa com CPF, WhatsApp e datas, além de aba de resumo executivo.</p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            onClick={handleResetFilters}
            className="sm:mr-auto text-xs h-9"
          >
            Limpar Filtros
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleExportExcel}
            disabled={isGeneratingExcel || isGeneratingPdf}
            className="h-9 text-xs font-medium border-emerald-600/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:text-emerald-400"
          >
            {isGeneratingExcel ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
            )}
            Exportar Excel
          </Button>

          <Button
            type="button"
            onClick={handleExportPDF}
            disabled={isGeneratingPdf || isGeneratingExcel}
            className="h-9 text-xs font-medium bg-red-600 hover:bg-red-700 text-white shadow-xs"
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5 mr-1.5" />
            )}
            Exportar PDF
          </Button>
        </div>
      </div>
    </ResponsiveDrawer>
  );
};

export default UserReportModal;
