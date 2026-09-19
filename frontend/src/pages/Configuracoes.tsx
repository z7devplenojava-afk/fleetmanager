import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell,
  Cloud, 
  CreditCard, 
  Lock, 
  Mail, 
  MessageSquare, 
  Save, 
  Shield, 
  Users,
  AlertTriangle,
  CheckCircle,
  Building2,
  Loader2,
  RefreshCw,
  Edit,
  Power,
  Trash2,
  MoreHorizontal,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { companyService } from '@/services/companyService';
import { userService, User } from '@/services/userService';
import { securitySettingsService, SecuritySettings } from '@/services/securitySettingsService';
import { notificationSettingsService, NotificationSettings } from '@/services/notificationSettingsService';
import UserFormModal from '@/components/UserFormModal';
import api from '@/lib/axios';

const Configuracoes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSecurity, setLoadingSecurity] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create');
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  
  // Estados para teste de email
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [loadingEmailConfig, setLoadingEmailConfig] = useState(false);

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
  const [empresaForm, setEmpresaForm] = useState({
    id: '',
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    website: '',
    sigla: '',
    description: '',
    logoUrl: '',
    status: 'ACTIVE'
  });

  // Carregar dados da empresa, usuários, configurações de segurança e notificações ao montar o componente
  useEffect(() => {
    loadCompanyData();
    loadUsers();
    loadSecuritySettings();
    loadNotificationSettings();
  }, []);

  const loadCompaniesList = async () => {
    try {
      const companies = await companyService.getAllCompanies();
      setEmpresas(companies || []);
      
      // Se houver empresas e nenhuma selecionada, selecionar a primeira
      if (companies && companies.length > 0 && !selectedEmpresaId) {
        setSelectedEmpresaId(companies[0].id);
        await loadCompanyById(companies[0].id);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar lista de empresas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de empresas.",
        variant: "destructive"
      });
    }
  };

  const loadCompanyById = async (companyId: string) => {
    try {
      setLoadingCompany(true);
      console.log('🔍 DEBUG: Carregando dados da empresa ID:', companyId);
      
      const company = await companyService.getCompanyById(companyId);
      console.log('🔍 DEBUG: Empresa carregada:', company);
      
      setEmpresaForm({
        id: company.id || '',
        name: company.name || '',
        cnpj: company.cnpj || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        zipCode: company.zipCode || '',
        website: company.website || '',
        sigla: company.sigla || '',
        description: company.description || '',
        logoUrl: company.logoUrl || '',
        status: company.status || 'ACTIVE'
      });
      
      toast({
        title: "Dados carregados",
        description: `Informações de ${company.name} carregadas com sucesso.`,
      });
    } catch (error) {
      console.error('❌ Erro ao carregar dados da empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa.",
        variant: "destructive"
      });
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleEmpresaSelect = async (companyId: string) => {
    setSelectedEmpresaId(companyId);
    await loadCompanyById(companyId);
  };

  const loadCompanyData = async () => {
    await loadCompaniesList();
  };

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleEmpresaChange = (field: string, value: string) => {
    setEmpresaForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingLogo(true);
    try {
      const data = await companyService.uploadLogo(file);
      setEmpresaForm(prev => ({ ...prev, logoUrl: data.url }));
      toast({
        title: 'Ícone enviado',
        description: 'Ícone da empresa atualizado com sucesso.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro no envio',
        description: err.response?.data?.error || 'Não foi possível enviar o ícone.',
        variant: 'destructive'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveEmpresa = async () => {
    try {
      setLoading(true);
      
      if (!empresaForm.name || !empresaForm.cnpj) {
        toast({
          title: "Erro",
          description: "Nome da empresa e CNPJ são obrigatórios.",
          variant: "destructive"
        });
        return;
      }

      if (empresaForm.id) {
        // Atualizar empresa existente
        await companyService.updateCompany(empresaForm.id, {
          name: empresaForm.name,
          cnpj: empresaForm.cnpj,
          email: empresaForm.email,
          phone: empresaForm.phone,
          address: empresaForm.address,
          website: empresaForm.website,
          sigla: empresaForm.sigla,
          description: empresaForm.description,
          logoUrl: empresaForm.logoUrl,
          status: empresaForm.status as any
        });
        
        toast({
          title: "Sucesso",
          description: "Dados da empresa atualizados com sucesso.",
        });
      } else {
        // Criar nova empresa
        await companyService.createCompany({
          name: empresaForm.name,
          cnpj: empresaForm.cnpj,
          email: empresaForm.email,
          phone: empresaForm.phone,
          address: empresaForm.address,
          website: empresaForm.website,
          sigla: empresaForm.sigla,
          description: empresaForm.description,
          logoUrl: empresaForm.logoUrl,
          status: empresaForm.status as any
        });
        
        toast({
          title: "Sucesso",
          description: "Empresa criada com sucesso.",
        });
        
        // Recarregar dados após criação
        await loadCompanyData();
      }
    } catch (error) {
      console.error('❌ Erro ao salvar empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dados da empresa.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Funções para gerenciar configurações de segurança
  const loadSecuritySettings = async () => {
    try {
      setLoadingSecurity(true);
      console.log('🔍 DEBUG: Carregando configurações de segurança...');
      
      // Usar a primeira empresa como padrão (ou implementar lógica para escolher empresa principal)
      const companies = await companyService.getAllCompanies();
      if (companies && companies.length > 0) {
        const companyId = companies[0].id;
        const settings = await securitySettingsService.getSecuritySettings(companyId);
        console.log('🔍 DEBUG: Configurações de segurança recebidas:', settings);
        
        setSecuritySettings(settings);
        
    toast({
          title: "Configurações carregadas",
          description: "Configurações de segurança carregadas com sucesso.",
        });
      } else {
        toast({
          title: "Aviso",
          description: "Nenhuma empresa encontrada para carregar configurações.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações de segurança:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de segurança.",
        variant: "destructive"
      });
    } finally {
      setLoadingSecurity(false);
    }
  };

  const handleSaveSeguranca = async () => {
    if (!securitySettings) {
    toast({
        title: "Erro",
        description: "Configurações de segurança não carregadas.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      await securitySettingsService.updateSecuritySettings(securitySettings.companyId, {
        twoFactorEnabled: securitySettings.twoFactorEnabled,
        twoFactorMethod: securitySettings.twoFactorMethod,
        passwordExpiryEnabled: securitySettings.passwordExpiryEnabled,
        passwordExpiryDays: securitySettings.passwordExpiryDays,
        passwordMinLength: securitySettings.passwordMinLength,
        passwordRequireUppercase: securitySettings.passwordRequireUppercase,
        passwordRequireLowercase: securitySettings.passwordRequireLowercase,
        passwordRequireNumbers: securitySettings.passwordRequireNumbers,
        passwordRequireSymbols: securitySettings.passwordRequireSymbols,
        accountLockoutEnabled: securitySettings.accountLockoutEnabled,
        maxFailedAttempts: securitySettings.maxFailedAttempts,
        lockoutDurationMinutes: securitySettings.lockoutDurationMinutes,
        sessionTimeoutMinutes: securitySettings.sessionTimeoutMinutes,
        ipWhitelistEnabled: securitySettings.ipWhitelistEnabled,
        ipWhitelist: securitySettings.ipWhitelist,
        auditLogEnabled: securitySettings.auditLogEnabled
      });
      
      toast({
        title: "Sucesso",
        description: "Configurações de segurança salvas com sucesso.",
      });
      
      // Recarregar configurações após salvar
      await loadSecuritySettings();
    } catch (error) {
      console.error('❌ Erro ao salvar configurações de segurança:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de segurança.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySettingChange = (field: keyof SecuritySettings, value: any) => {
    if (securitySettings) {
      setSecuritySettings(prev => ({
        ...prev!,
        [field]: value
      }));
    }
  };

  // Funções para gerenciar configurações de notificações
  const loadNotificationSettings = async () => {
    try {
      setLoadingNotifications(true);
      console.log('🔍 DEBUG: Carregando configurações de notificações...');
      
      const companies = await companyService.getAllCompanies();
      if (companies && companies.length > 0) {
        const companyId = companies[0].id;
        const settings = await notificationSettingsService.getCompanyNotificationSettings(companyId);
        console.log('🔍 DEBUG: Configurações de notificações recebidas:', settings);
        
        setNotificationSettings(settings);
        
        toast({
          title: "Configurações carregadas",
          description: "Configurações de notificações carregadas com sucesso.",
        });
      } else {
        toast({
          title: "Aviso",
          description: "Nenhuma empresa encontrada para carregar configurações.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações de notificações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de notificações.",
        variant: "destructive"
      });
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleSaveNotificacoes = async () => {
    if (!notificationSettings) {
      toast({
        title: "Erro",
        description: "Configurações de notificações não carregadas.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      await notificationSettingsService.updateCompanyNotificationSettings(notificationSettings.companyId, {
        emailEnabled: notificationSettings.emailEnabled,
        emailContractUpdates: notificationSettings.emailContractUpdates,
        emailPaymentReceived: notificationSettings.emailPaymentReceived,
        emailScheduleChanges: notificationSettings.emailScheduleChanges,
        emailDailySummary: notificationSettings.emailDailySummary,
        emailWeeklyReport: notificationSettings.emailWeeklyReport,
        emailSystemAlerts: notificationSettings.emailSystemAlerts,
        smtpEnabled: notificationSettings.smtpEnabled,
        smtpHost: notificationSettings.smtpHost,
        smtpPort: notificationSettings.smtpPort,
        smtpUsername: notificationSettings.smtpUsername,
        smtpPassword: notificationSettings.smtpPassword,
        smtpFromEmail: notificationSettings.smtpFromEmail,
        smtpFromName: notificationSettings.smtpFromName,
        smtpUseTls: notificationSettings.smtpUseTls,
        smtpUseSsl: notificationSettings.smtpUseSsl,
        pushEnabled: notificationSettings.pushEnabled,
        pushContractUpdates: notificationSettings.pushContractUpdates,
        pushPaymentReceived: notificationSettings.pushPaymentReceived,
        pushScheduleChanges: notificationSettings.pushScheduleChanges,
        pushSystemAlerts: notificationSettings.pushSystemAlerts,
        smsEnabled: notificationSettings.smsEnabled,
        smsUrgentOnly: notificationSettings.smsUrgentOnly,
        whatsappEnabled: notificationSettings.whatsappEnabled,
        whatsappContractUpdates: notificationSettings.whatsappContractUpdates,
        whatsappPaymentReceived: notificationSettings.whatsappPaymentReceived,
        whatsappScheduleChanges: notificationSettings.whatsappScheduleChanges,
        quietHoursEnabled: notificationSettings.quietHoursEnabled,
        quietHoursStart: notificationSettings.quietHoursStart,
        quietHoursEnd: notificationSettings.quietHoursEnd
      });
      
      toast({
        title: "Sucesso",
        description: "Preferências de notificação salvas com sucesso.",
      });
      
      await loadNotificationSettings();
    } catch (error) {
      console.error('❌ Erro ao salvar configurações de notificações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de notificações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSettingChange = (field: keyof NotificationSettings, value: any) => {
    if (notificationSettings) {
      setNotificationSettings(prev => ({
        ...prev!,
        [field]: value
      }));
    }
  };

  const handleSaveIntegracoes = () => {
    toast({
      title: "Integrações salvas",
      description: "As configurações de integração foram atualizadas com sucesso.",
    });
  };

  const handleSaveOperacional = () => {
    toast({
      title: "Configurações operacionais salvas",
      description: "As configurações operacionais foram atualizadas com sucesso.",
    });
  };

  // Funções para teste de email
  const loadEmailConfig = async () => {
    try {
      setLoadingEmailConfig(true);
      const response = await api.get('/api/email/config');
      setEmailConfig(response.data);
      // Não mostrar toast ao carregar automaticamente
    } catch (error: any) {
      console.error('❌ Erro ao carregar configuração de email:', error);
      setEmailConfig(null);
    } finally {
      setLoadingEmailConfig(false);
    }
  };


  const handleTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      toast({
        title: "Email inválido",
        description: "Por favor, digite um endereço de email válido.",
        variant: "destructive"
      });
      return;
    }

    try {
      setTestingEmail(true);
      const response = await api.post(`/api/email/test?toEmail=${encodeURIComponent(testEmailAddress)}`);

      if (response.data.success) {
        toast({
          title: "Email enviado com sucesso!",
          description: `Email de teste enviado para ${testEmailAddress}. Verifique sua caixa de entrada.`,
        });
      } else {
        toast({
          title: "Falha no envio",
          description: response.data.message || "Não foi possível enviar o email de teste.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar email de teste:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.response?.data?.message || "Não foi possível enviar o email de teste. Verifique os logs do backend.",
        variant: "destructive"
      });
    } finally {
      setTestingEmail(false);
    }
  };

  // Funções para gerenciar usuários
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log('🔍 DEBUG: Carregando usuários...');
      
      const usersData = await userService.getAllUsers();
      console.log('🔍 DEBUG: Usuários recebidos:', usersData);
      
      setUsers(usersData);
      
      toast({
        title: "Usuários carregados",
        description: `${usersData.length} usuários carregados com sucesso.`,
      });
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSearchUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await userService.searchUsers(searchQuery);
      setUsers(usersData);
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar os usuários.",
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserModalMode('create');
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserModalMode('edit');
    setShowUserModal(true);
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      setLoading(true);
      await userService.toggleUserStatus(user.id, !user.active);
      
      toast({
        title: "Sucesso",
        description: `Usuário ${user.active ? 'desativado' : 'ativado'} com sucesso.`,
      });
      
      // Recarregar lista de usuários
      await loadUsers();
    } catch (error) {
      console.error('❌ Erro ao alterar status do usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do usuário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await userService.deleteUser(user.id);
      
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso.",
      });
      
      // Recarregar lista de usuários
      await loadUsers();
    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserModalSuccess = () => {
    loadUsers();
  };

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Alertas no topo da página */}
        <div className="space-y-3">
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Atenção:</strong> Sistema de notificações por email habilitado. Verifique suas configurações de SMTP.
            </AlertDescription>
          </Alert>
          
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <Bell className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Novidade:</strong> Sistema de alertas operacionais está ativo. Configure suas preferências na aba Operacional.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Configurações</h1>
            <p className="text-gray-400 mt-1">Gerencie as configurações do sistema</p>
          </div>
        </div>

        <Tabs defaultValue="empresa" className="w-full" onValueChange={(value) => {
          if (value === 'testes' && !emailConfig && !loadingEmailConfig) {
            loadEmailConfig();
          }
        }}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 w-full bg-seguranca-graphite border-gray-600 p-1 rounded-lg">
            <TabsTrigger value="empresa" className="text-sm sm:text-base rounded-md data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">Empresa</TabsTrigger>
            <TabsTrigger value="usuarios" className="text-sm sm:text-base rounded-md data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">Usuários</TabsTrigger>
            <TabsTrigger value="seguranca" className="text-sm sm:text-base rounded-md data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">Segurança</TabsTrigger>
            <TabsTrigger value="notificacoes" className="text-sm sm:text-base rounded-md data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">Notificações</TabsTrigger>
            <TabsTrigger value="integracao" className="text-sm sm:text-base rounded-md data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">Integrações</TabsTrigger>
            <TabsTrigger value="operacional" className="text-sm sm:text-base rounded-md data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">Operacional</TabsTrigger>
            <TabsTrigger value="testes" className="text-sm sm:text-base rounded-md data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">Testes</TabsTrigger>
          </TabsList>
          
          {/* Aba Dados da Empresa */}
          <TabsContent value="empresa" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados da Empresa
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Informações gerais sobre a empresa e contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Seletor de Empresas */}
                <div className="space-y-2">
                  <Label htmlFor="empresa-select" className="text-seguranca-lightgray flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Selecionar Empresa
                  </Label>
                  <Select
                    value={selectedEmpresaId}
                    onValueChange={handleEmpresaSelect}
                    disabled={loadingCompany || empresas.length === 0}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                      <SelectValue placeholder={empresas.length === 0 ? "Nenhuma empresa encontrada" : "Selecione uma empresa"} />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      {empresas.map((empresa) => (
                        <SelectItem 
                          key={empresa.id} 
                          value={empresa.id}
                          className="text-seguranca-lightgray focus:bg-seguranca-graphite focus:text-seguranca-yellow"
                        >
                          {empresa.sigla ? `${empresa.sigla} - ${empresa.name}` : empresa.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {empresas.length === 0 && (
                    <p className="text-xs text-gray-400">Nenhuma empresa cadastrada no sistema.</p>
                  )}
                </div>

                {/* Logo da Empresa */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-seguranca-lightgray flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-seguranca-yellow" />
                      Ícone / Logomarca da Empresa
                    </Label>
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                      uploadingLogo 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-seguranca-red hover:bg-seguranca-darkred text-white'
                    }`}>
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>{empresaForm.logoUrl ? 'Alterar Ícone' : 'Fazer Upload do Ícone'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept=".png,.jpg,.jpeg,.svg,.webp,.ico"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>

                  {empresaForm.logoUrl ? (
                    <div className="flex items-start gap-4 p-4 bg-seguranca-black/50 rounded-lg border border-gray-700">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={resolveCompanyLogoUrl(empresaForm.logoUrl) || empresaForm.logoUrl} 
                          alt={`Logo ${empresaForm.name || 'Empresa'}`}
                          className="max-h-28 max-w-28 object-contain rounded-lg border border-gray-600 bg-gray-900 p-2"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const errorMsg = target.nextElementSibling as HTMLElement;
                            if (errorMsg) errorMsg.style.display = 'block';
                          }}
                        />
                        <p className="text-xs text-red-400 mt-2 hidden">Erro ao carregar imagem</p>
                        <button
                          type="button"
                          onClick={() => setEmpresaForm(prev => ({ ...prev, logoUrl: '' }))}
                          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md"
                          title="Remover ícone"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-emerald-400 font-medium mb-1">Ícone carregado</p>
                        <p className="text-xs text-gray-400 font-mono break-all">{empresaForm.logoUrl}</p>
                        <p className="text-[11px] text-gray-500 mt-2">Formatos suportados: PNG, JPG, SVG, WEBP, ICO (máx. 5MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-seguranca-black/30 rounded-lg border border-dashed border-gray-600 text-center flex flex-col items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                      <p className="text-sm text-gray-300 font-medium">Nenhum ícone cadastrado</p>
                      <p className="text-xs text-gray-500 mt-1">Clique no botão acima para selecionar um arquivo PNG, JPG, SVG, WEBP ou ICO.</p>
                    </div>
                  )}
                </div>

                {loadingCompany ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-seguranca-yellow mr-2" />
                    <span className="text-seguranca-lightgray">Carregando dados da empresa...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-seguranca-lightgray flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Nome da Empresa *
                        </Label>
                        <Input 
                          id="name" 
                          value={empresaForm.name} 
                          onChange={(e) => handleEmpresaChange('name', e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                          placeholder="Ex: Empresa XYZ Ltda"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj" className="text-seguranca-lightgray flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          CNPJ *
                        </Label>
                        <Input 
                          id="cnpj" 
                          value={empresaForm.cnpj} 
                          onChange={(e) => handleEmpresaChange('cnpj', e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                          placeholder="00.000.000/0000-00"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sigla" className="text-seguranca-lightgray">Sigla da Empresa</Label>
                        <Input 
                          id="sigla" 
                          value={empresaForm.sigla} 
                          onChange={(e) => handleEmpresaChange('sigla', e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                          placeholder="Ex: XYZ"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-seguranca-lightgray">Website</Label>
                        <Input 
                          id="website" 
                          value={empresaForm.website} 
                          onChange={(e) => handleEmpresaChange('website', e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                          placeholder="www.exemplo.com.br"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-seguranca-lightgray">Endereço</Label>
                      <Input 
                        id="address" 
                        value={empresaForm.address} 
                        onChange={(e) => handleEmpresaChange('address', e.target.value)}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                        placeholder="Rua, número, bairro"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-seguranca-lightgray">Cidade</Label>
                        <Input 
                          id="city" 
                          value={empresaForm.city} 
                          onChange={(e) => handleEmpresaChange('city', e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                          placeholder="São Paulo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-seguranca-lightgray">Estado</Label>
                        <Input 
                          id="state" 
                          value={empresaForm.state} 
                          onChange={(e) => handleEmpresaChange('state', e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                          placeholder="SP"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode" className="text-seguranca-lightgray">CEP</Label>
                        <Input 
                          id="zipCode" 
                          value={empresaForm.zipCode} 
                          onChange={(e) => handleEmpresaChange('zipCode', e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                          placeholder="00000-000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-seguranca-lightgray">Telefone</Label>
                        <Input 
                          id="phone" 
                          value={empresaForm.phone} 
                          onChange={(e) => handleEmpresaChange('phone', e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-seguranca-lightgray">Email</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={empresaForm.email} 
                          onChange={(e) => handleEmpresaChange('email', e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                          placeholder="contato@empresa.com.br"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-seguranca-lightgray">Descrição</Label>
                      <Input 
                        id="description" 
                        value={empresaForm.description} 
                        onChange={(e) => handleEmpresaChange('description', e.target.value)}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                        placeholder="Breve descrição da empresa"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logoUrl" className="text-seguranca-lightgray">URL da Logo</Label>
                      <Input 
                        id="logoUrl" 
                        value={empresaForm.logoUrl} 
                        onChange={(e) => handleEmpresaChange('logoUrl', e.target.value)}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                        placeholder="https://exemplo.com/logo.png ou data:image/png;base64,..."
                      />
                      <p className="text-xs text-gray-400">URL da imagem ou base64 da logo da empresa</p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={handleSaveEmpresa}
                        disabled={loading}
                        className="bg-seguranca-red hover:bg-seguranca-darkred"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {empresaForm.id ? 'Atualizar' : 'Salvar'} Dados da Empresa
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Usuários */}
          <TabsContent value="usuarios" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Gerenciamento de Usuários</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie os usuários que têm acesso ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div className="w-full sm:flex-1 flex gap-2">
                    <Input 
                      placeholder="Pesquisar usuários..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:max-w-sm bg-seguranca-black border-gray-600 text-seguranca-lightgray" 
                    />
                    <Button 
                      onClick={handleSearchUsers}
                      variant="outline"
                      className="border-gray-600 text-seguranca-lightgray"
                    >
                      Buscar
                    </Button>
                  </div>
                  <Button 
                    onClick={handleCreateUser}
                    className="bg-seguranca-red hover:bg-seguranca-darkred w-full sm:w-auto"
                  >
                    <Users className="h-4 w-4 mr-2" /> Adicionar Usuário
                  </Button>
                </div>

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-seguranca-yellow mr-2" />
                    <span className="text-seguranca-lightgray">Carregando usuários...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-600">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-seguranca-lightgray w-[200px]">Nome</TableHead>
                      <TableHead className="text-seguranca-lightgray w-[220px]">Email</TableHead>
                        <TableHead className="text-seguranca-lightgray w-[130px]">Usuário</TableHead>
                        <TableHead className="text-seguranca-lightgray w-[140px]">Funções</TableHead>
                      <TableHead className="text-seguranca-lightgray w-[90px] text-center">Status</TableHead>
                      <TableHead className="text-seguranca-lightgray w-[140px] text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {users.length === 0 ? (
                    <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                            Nenhum usuário encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((userItem) => (
                          <TableRow key={userItem.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-seguranca-red/20 flex items-center justify-center text-seguranca-darkred flex-shrink-0">
                                  {userItem.name.charAt(0).toUpperCase()}
                          </div>
                                <span className="text-seguranca-lightgray truncate max-w-[140px]" title={userItem.name}>{userItem.name}</span>
                        </div>
                      </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              <div className="truncate max-w-[200px]" title={userItem.email}>
                                {userItem.email}
                              </div>
                            </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              <div className="truncate max-w-[110px]" title={userItem.username}>
                                {userItem.username}
                              </div>
                            </TableCell>
                            <TableCell className="text-seguranca-lightgray">
                              <div className="flex flex-wrap gap-1">
                                {userItem.roles.map((role) => (
                                  <span 
                                    key={role}
                                    className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap"
                                  >
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                      <TableCell className="text-center">
                              <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap inline-block ${
                                userItem.active 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {userItem.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                              <div className="flex gap-1 justify-center">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditUser(userItem)}
                                  className="h-8 w-8 text-seguranca-lightgray hover:bg-gray-700 hover:text-seguranca-yellow"
                                  title="Editar usuário"
                                >
                                  <Edit className="h-4 w-4" />
                        </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleToggleUserStatus(userItem)}
                                  className={`h-8 w-8 ${
                                    userItem.active 
                                      ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                                      : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                  }`}
                                  title={userItem.active ? 'Desativar usuário' : 'Ativar usuário'}
                                >
                                  <Power className="h-4 w-4" />
                        </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteUser(userItem)}
                                  className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Excluir usuário"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                      </TableCell>
                    </TableRow>
                        ))
                      )}
                  </TableBody>
                </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Segurança */}
          <TabsContent value="seguranca" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Configurações de Segurança</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie as configurações de segurança do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingSecurity ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-seguranca-yellow mr-2" />
                    <span className="text-seguranca-lightgray">Carregando configurações de segurança...</span>
                  </div>
                ) : securitySettings ? (
                  <>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-seguranca-lightgray">
                    <Lock className="h-5 w-5" /> Autenticação
                  </h3>
                  
                  <div className="flex items-start space-x-3 pl-2">
                        <Checkbox 
                          id="two_factor" 
                          checked={securitySettings.twoFactorEnabled}
                          onCheckedChange={(checked) => handleSecuritySettingChange('twoFactorEnabled', checked)}
                        />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="two_factor" className="text-seguranca-lightgray">
                        Habilitar autenticação de dois fatores (2FA)
                      </Label>
                      <p className="text-sm text-gray-400">
                        Requer uma verificação adicional ao fazer login
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-seguranca-lightgray">
                    <Shield className="h-5 w-5" /> Políticas de Senha
                  </h3>
                  
                  <div className="grid gap-3 pl-2">
                    <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="password_expiry" 
                            checked={securitySettings.passwordExpiryEnabled}
                            onCheckedChange={(checked) => handleSecuritySettingChange('passwordExpiryEnabled', checked)}
                          />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="password_expiry" className="text-seguranca-lightgray">
                              Expirar senhas a cada {securitySettings.passwordExpiryDays} dias
                        </Label>
                        <p className="text-sm text-gray-400">
                          Os usuários serão solicitados a redefinir suas senhas
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="password_requirements" 
                            checked={securitySettings.passwordRequireUppercase && securitySettings.passwordRequireLowercase && securitySettings.passwordRequireNumbers}
                            onCheckedChange={(checked) => {
                              handleSecuritySettingChange('passwordRequireUppercase', checked);
                              handleSecuritySettingChange('passwordRequireLowercase', checked);
                              handleSecuritySettingChange('passwordRequireNumbers', checked);
                            }}
                          />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="password_requirements" className="text-seguranca-lightgray">
                          Requisitos de senha forte
                        </Label>
                        <p className="text-sm text-gray-400">
                              Mínimo {securitySettings.passwordMinLength} caracteres, incluindo letras maiúsculas, minúsculas e números
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="failed_attempts" 
                            checked={securitySettings.accountLockoutEnabled}
                            onCheckedChange={(checked) => handleSecuritySettingChange('accountLockoutEnabled', checked)}
                          />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="failed_attempts" className="text-seguranca-lightgray">
                              Bloquear conta após {securitySettings.maxFailedAttempts} tentativas falhas
                        </Label>
                        <p className="text-sm text-gray-400">
                              A conta será bloqueada por {securitySettings.lockoutDurationMinutes} minutos após múltiplas tentativas falhas
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2 text-seguranca-lightgray">
                        <Shield className="h-5 w-5" /> Configurações Avançadas
                      </h3>
                      
                      <div className="grid gap-3 pl-2">
                        <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="audit_log" 
                            checked={securitySettings.auditLogEnabled}
                            onCheckedChange={(checked) => handleSecuritySettingChange('auditLogEnabled', checked)}
                          />
                          <div className="space-y-1 leading-none">
                            <Label htmlFor="audit_log" className="text-seguranca-lightgray">
                              Habilitar log de auditoria
                            </Label>
                            <p className="text-sm text-gray-400">
                              Registra todas as ações importantes do sistema para auditoria
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="ip_whitelist" 
                            checked={securitySettings.ipWhitelistEnabled}
                            onCheckedChange={(checked) => handleSecuritySettingChange('ipWhitelistEnabled', checked)}
                          />
                          <div className="space-y-1 leading-none">
                            <Label htmlFor="ip_whitelist" className="text-seguranca-lightgray">
                              Habilitar whitelist de IP
                            </Label>
                            <p className="text-sm text-gray-400">
                              Restringe acesso apenas a IPs autorizados
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveSeguranca}
                        disabled={loading}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Configurações
                          </>
                        )}
                  </Button>
                </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Erro ao carregar configurações de segurança
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Notificações */}
          <TabsContent value="notificacoes" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Configurações de Notificações</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie como e quando você recebe notificações por email e alertas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingNotifications ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-seguranca-yellow mr-2" />
                    <span className="text-seguranca-lightgray">Carregando configurações de notificações...</span>
                  </div>
                ) : notificationSettings ? (
                  <>
                {/* Sistema de Email */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-seguranca-lightgray">
                    <Mail className="h-5 w-5" /> Sistema de Email
                  </h3>
                  
                      <Alert className={`${notificationSettings.smtpEnabled ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'}`}>
                        {notificationSettings.smtpEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                        <AlertDescription className={notificationSettings.smtpEnabled ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}>
                          <strong>Status:</strong> {notificationSettings.smtpEnabled ? 'Servidor SMTP configurado e funcionando corretamente.' : 'Servidor SMTP não configurado.'}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid gap-4 pl-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="contract_updates" 
                            checked={notificationSettings.emailContractUpdates}
                            onCheckedChange={(checked) => handleNotificationSettingChange('emailContractUpdates', checked)}
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="contract_updates" className="text-seguranca-lightgray">
                          Atualizações de contratos
                        </Label>
                        <p className="text-sm text-gray-400">
                          Receba notificações quando contratos forem criados, atualizados ou expirarem
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="payment_received" 
                            checked={notificationSettings.emailPaymentReceived}
                            onCheckedChange={(checked) => handleNotificationSettingChange('emailPaymentReceived', checked)}
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="payment_received" className="text-seguranca-lightgray">
                          Pagamentos recebidos
                        </Label>
                        <p className="text-sm text-gray-400">
                          Notificações sobre pagamentos confirmados e recebidos
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="schedule_changes" 
                            checked={notificationSettings.emailScheduleChanges}
                            onCheckedChange={(checked) => handleNotificationSettingChange('emailScheduleChanges', checked)}
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="schedule_changes" className="text-seguranca-lightgray">
                          Mudanças de escala
                        </Label>
                        <p className="text-sm text-gray-400">
                          Alertas sobre alterações em escalas e horários
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="daily_summary" 
                            checked={notificationSettings.emailDailySummary}
                            onCheckedChange={(checked) => handleNotificationSettingChange('emailDailySummary', checked)}
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="daily_summary" className="text-seguranca-lightgray">
                          Resumo diário
                        </Label>
                        <p className="text-sm text-gray-400">
                          Receba um resumo diário das atividades do sistema
                        </p>
                      </div>
                    </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="system_alerts" 
                            checked={notificationSettings.emailSystemAlerts}
                            onCheckedChange={(checked) => handleNotificationSettingChange('emailSystemAlerts', checked)}
                          />
                          <div className="space-y-1 leading-none">
                            <Label htmlFor="system_alerts" className="text-seguranca-lightgray">
                              Alertas do sistema
                            </Label>
                            <p className="text-sm text-gray-400">
                              Receba alertas importantes sobre o sistema
                            </p>
                          </div>
                        </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveNotificacoes}
                        disabled={loading}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Preferências
                          </>
                        )}
                  </Button>
                </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Erro ao carregar configurações de notificações
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Integrações */}
          <TabsContent value="integracao" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Integrações</CardTitle>
                <CardDescription className="text-gray-400">
                  Conecte o sistema com outros serviços
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-md bg-blue-100 flex items-center justify-center">
                      <Cloud className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium text-seguranca-lightgray">API de Integração</h3>
                      <p className="text-sm text-gray-400">
                        Conecte seus sistemas externos
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">Configurar</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-md bg-green-100 flex items-center justify-center">
                      <CreditCard className="text-green-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium text-seguranca-lightgray">Gateway de Pagamento</h3>
                      <p className="text-sm text-gray-400">
                        Integre com seu provedor de pagamentos
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">Conectar</Button>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveIntegracoes}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                    <Save className="h-4 w-4 mr-2" /> Salvar Integrações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Operacional */}
          <TabsContent value="operacional" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Configurações Operacionais</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie alertas e configurações operacionais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Alertas Operacionais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-seguranca-lightgray">
                    <Bell className="h-5 w-5" /> Alertas Operacionais
                  </h3>
                  
                  <div className="grid gap-3 pl-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox id="late_arrival" defaultChecked />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="late_arrival" className="text-seguranca-lightgray">
                          Atraso de funcionários
                        </Label>
                        <p className="text-sm text-gray-400">
                          Alertar quando funcionários chegarem atrasados aos postos
                        </p>
                      </div>
                    </div>
                    
                                        <div className="flex items-start space-x-3">
                      <Checkbox id="contract_expiry" defaultChecked />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="contract_expiry" className="text-seguranca-lightgray">
                          Vencimento de contratos
                        </Label>
                        <p className="text-sm text-gray-400">
                          Alertar sobre contratos próximos ao vencimento (30 dias)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox id="vehicle_maintenance" defaultChecked />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="vehicle_maintenance" className="text-seguranca-lightgray">
                          Manutenção de veículos
                        </Label>
                        <p className="text-sm text-gray-400">
                          Notificar sobre manutenções preventivas agendadas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox id="equipment_check" />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="equipment_check" className="text-seguranca-lightgray">
                          Verificação de equipamentos
                        </Label>
                        <p className="text-sm text-gray-400">
                          Alertar sobre equipamentos que precisam de verificação
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configurações de Horário */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-seguranca-lightgray">
                    <MessageSquare className="h-5 w-5" /> Configurações de Horário
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 pl-2">
                    <div className="space-y-2">
                      <Label className="text-seguranca-lightgray">Horário de início do expediente</Label>
                      <Input 
                        type="time" 
                        defaultValue="08:00"
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-seguranca-lightgray">Horário de fim do expediente</Label>
                      <Input 
                        type="time" 
                        defaultValue="18:00"
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveOperacional}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                    <Save className="h-4 w-4 mr-2" /> Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Testes */}
          <TabsContent value="testes" className="mt-6">
            <div className="space-y-6">
              {/* Teste de Email */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Teste de Envio de Email
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Teste a configuração SMTP enviando um email de teste
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Configuração Atual */}
                  <div className="bg-seguranca-black/50 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-seguranca-lightgray">Configuração Atual</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadEmailConfig}
                        disabled={loadingEmailConfig}
                        className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                      >
                        {loadingEmailConfig ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Atualizar
                          </>
                        )}
                      </Button>
                    </div>
                    {loadingEmailConfig ? (
                      <div className="flex items-center gap-2 text-gray-400 py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando configuração...</span>
                      </div>
                    ) : emailConfig ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-400 min-w-[100px]">Servidor SMTP:</span>
                          <span className="ml-2 text-seguranca-lightgray font-mono">{emailConfig.host}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-400 min-w-[100px]">Porta:</span>
                          <span className="ml-2 text-seguranca-lightgray font-mono">{emailConfig.port}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-400 min-w-[100px]">Usuário:</span>
                          <span className="ml-2 text-seguranca-lightgray font-mono break-all">{emailConfig.username}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-400 min-w-[100px]">SSL/TLS:</span>
                          <span className={`ml-2 font-semibold ${emailConfig.ssl === 'true' || emailConfig.starttls === 'true' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {emailConfig.sslTlsStatus || (emailConfig.ssl === 'true' ? 'Habilitado (SSL)' : emailConfig.starttls === 'true' ? 'Habilitado (STARTTLS)' : 'Desabilitado')}
                          </span>
                        </div>
                        {emailConfig.activeProfile && (
                          <div className="flex items-center md:col-span-2">
                            <span className="text-gray-400 min-w-[100px]">Perfil Ativo:</span>
                            <span className="ml-2 text-seguranca-lightgray font-mono">{emailConfig.activeProfile}</span>
                            <span className="ml-2 text-xs text-gray-500">({emailConfig.source || 'properties'})</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-4">
                        <p className="text-gray-400 text-sm mb-2">Nenhuma configuração carregada.</p>
                        <p className="text-xs text-gray-500">Clique em "Atualizar" para carregar a configuração atual do servidor.</p>
                      </div>
                    )}
                  </div>

                  {/* Formulário de Teste */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="testEmail" className="text-seguranca-lightgray">
                        Email de Destino
                      </Label>
                      <Input
                        id="testEmail"
                        type="email"
                        placeholder="seu-email@exemplo.com"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        className="mt-2 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                        disabled={testingEmail}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Digite o endereço de email onde deseja receber o email de teste
                      </p>
                    </div>

                    <Button
                      onClick={handleTestEmail}
                      disabled={!testEmailAddress || testingEmail}
                      className="bg-seguranca-red hover:bg-seguranca-darkred w-full sm:w-auto"
                    >
                      {testingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar Email de Teste
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Resultado do Teste */}
                  {emailConfig && (
                    <Alert className={`border ${emailConfig.configured ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                      <div className="flex items-start gap-3">
                        {emailConfig.configured ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div>
                          <AlertDescription className={emailConfig.configured ? 'text-green-200' : 'text-red-200'}>
                            {emailConfig.configured 
                              ? 'Configuração de email detectada e pronta para uso'
                              : 'Configuração de email não encontrada ou incompleta'}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de Usuário */}
        <UserFormModal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          onSuccess={handleUserModalSuccess}
          user={selectedUser}
          mode={userModalMode}
        />
      </div>
    </StandardLayout>
  );
};

export default Configuracoes;
