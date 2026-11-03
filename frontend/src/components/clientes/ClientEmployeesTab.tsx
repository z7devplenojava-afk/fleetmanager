import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, UserPlus, FileSpreadsheet, Search, Edit2, Trash2, 
  CheckCircle2, XCircle, AlertCircle, Download, Upload, 
  Accessibility, Calendar, Phone, Hash, ShieldAlert, Loader2,
  KeyRound, ShieldCheck, Bus, Send, Mail, MessageSquare, RefreshCw,
  MapPin, Home, Navigation
} from 'lucide-react';
import axios from '@/lib/axios';
import * as XLSX from 'xlsx';
import { Passenger } from '@/types/passenger';
import { useAuth } from '@/contexts/AuthContext';
import { routeService, Route, RoutePoint } from '@/services/routeService';

interface ClientEmployeesTabProps {
  clientId: string;
  clientName: string;
}

interface NewPassengerForm {
  id?: string;
  name: string;
  registration: string;
  cpf: string;
  phone: string;
  email: string;
  admissionDate: string;
  dismissalDate: string;
  isPcd: boolean;
  disabilityType: string;
  status: string;
  routeId: string;
  boardingPointId: string;
  returnRouteId: string;
  // Endereço Residencial
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  // Endereço de Embarque
  boardingCep: string;
  boardingStreet: string;
  boardingNumber: string;
  boardingNeighborhood: string;
  boardingCity: string;
  boardingState: string;
  // Segurança / 2FA
  twoFactorEnabled: boolean;
  twoFactorChannel: 'WHATSAPP' | 'EMAIL';
  initialPassword?: string;
}

const emptyForm: NewPassengerForm = {
  name: '',
  registration: '',
  cpf: '',
  phone: '',
  email: '',
  admissionDate: '',
  dismissalDate: '',
  isPcd: false,
  disabilityType: '',
  status: 'ATIVO',
  routeId: '',
  boardingPointId: '',
  returnRouteId: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  boardingCep: '',
  boardingStreet: '',
  boardingNumber: '',
  boardingNeighborhood: '',
  boardingCity: '',
  boardingState: '',
  twoFactorEnabled: false,
  twoFactorChannel: 'WHATSAPP',
  initialPassword: ''
};

export const ClientEmployeesTab: React.FC<ClientEmployeesTabProps> = ({ clientId, clientName }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [employees, setEmployees] = useState<Passenger[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<NewPassengerForm>(emptyForm);

  // CEP Lookups
  const [loadingCepResidencial, setLoadingCepResidencial] = useState(false);
  const [loadingCepEmbarque, setLoadingCepEmbarque] = useState(false);

  // Estados de Segurança / Reset de Senha / 2FA
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [notifyPasswordVia, setNotifyPasswordVia] = useState<'WHATSAPP' | 'EMAIL' | 'NONE'>('WHATSAPP');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSending2FA, setIsSending2FA] = useState(false);
  
  // Importação
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Carregar lista de rotas ativas para atribuição
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const allRoutes = await routeService.findAllRoutes();
        setRoutes(allRoutes || []);
      } catch (e) {
        console.warn('Não foi possível carregar lista de rotas:', e);
      }
    };
    fetchRoutes();
  }, []);

  // Carregar lista de colaboradores do cliente
  const fetchEmployees = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      let data: Passenger[] = [];
      try {
        const response = await axios.get(`/passengers/client/${clientId}`);
        data = response.data || [];
      } catch (err: any) {
        if (err.response?.status === 404) {
          try {
            const fallback = await axios.get('/passengers');
            data = (fallback.data || []).filter((p: Passenger) => p.clientId === clientId);
          } catch {
            data = [];
          }
        } else {
          data = [];
        }
      }
      setEmployees(data);
    } catch (error) {
      console.warn('Aguardando inicialização dos endpoints de passageiros no backend:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Pontos de parada da rota de ida selecionada no form
  const selectedRoutePoints = useMemo(() => {
    if (!form.routeId) return [];
    const r = routes.find(route => route.id === form.routeId);
    return r?.points || [];
  }, [form.routeId, routes]);

  // Filtragem
  const filteredEmployees = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(emp => {
      const nameMatch = emp.name?.toLowerCase().includes(q);
      const regMatch = emp.registration?.includes(q);
      const cpfMatch = emp.cpf?.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
      return nameMatch || regMatch || cpfMatch;
    });
  }, [employees, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status !== 'DEMITIDO' && e.status !== 'BLOQUEADO' && e.active !== false).length;
    const dismissed = total - active;
    const pcd = employees.filter(e => e.isPcd).length;
    return { total, active, dismissed, pcd };
  }, [employees]);

  // Sanitizador de Matrícula: estritamente números
  const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericOnly = e.target.value.replace(/\D/g, '');
    setForm(prev => ({ ...prev, registration: numericOnly }));
  };

  // Máscara de CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    setForm(prev => ({ ...prev, cpf: v }));
  };

  // Máscara de Telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    setForm(prev => ({ ...prev, phone: v }));
  };

  // Busca de CEP Residencial
  const handleCepResidencialChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = raw.length > 5 ? raw.replace(/(\d{5})(\d{1,3})/, '$1-$2') : raw;
    setForm(prev => ({ ...prev, cep: formatted }));

    if (raw.length === 8) {
      setLoadingCepResidencial(true);
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await resp.json();
        if (data && !data.erro) {
          setForm(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
          toast({ title: 'Endereço residencial preenchido pelo CEP!' });
        }
      } catch (err) {
        console.warn('Erro ao consultar ViaCEP:', err);
      } finally {
        setLoadingCepResidencial(false);
      }
    }
  };

  // Busca de CEP de Embarque
  const handleCepEmbarqueChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = raw.length > 5 ? raw.replace(/(\d{5})(\d{1,3})/, '$1-$2') : raw;
    setForm(prev => ({ ...prev, boardingCep: formatted }));

    if (raw.length === 8) {
      setLoadingCepEmbarque(true);
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await resp.json();
        if (data && !data.erro) {
          setForm(prev => ({
            ...prev,
            boardingStreet: data.logradouro || prev.boardingStreet,
            boardingNeighborhood: data.bairro || prev.boardingNeighborhood,
            boardingCity: data.localidade || prev.boardingCity,
            boardingState: data.uf || prev.boardingState
          }));
          toast({ title: 'Local de embarque preenchido pelo CEP!' });
        }
      } catch (err) {
        console.warn('Erro ao consultar ViaCEP embarque:', err);
      } finally {
        setLoadingCepEmbarque(false);
      }
    }
  };

  // Gerador de senha forte aleatória
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res + '2026';
  };

  // Abrir Modal de Edição
  const handleEdit = (emp: Passenger) => {
    setForm({
      id: emp.id,
      name: emp.name || '',
      registration: (emp.registration || '').replace(/\D/g, ''),
      cpf: emp.cpf || '',
      phone: emp.phone || '',
      email: emp.email || '',
      admissionDate: emp.admissionDate ? emp.admissionDate.split('T')[0] : '',
      dismissalDate: emp.dismissalDate ? emp.dismissalDate.split('T')[0] : '',
      isPcd: Boolean(emp.isPcd),
      disabilityType: emp.disabilityType || '',
      status: emp.status || (emp.active ? 'ATIVO' : 'DEMITIDO'),
      routeId: emp.routeId || '',
      boardingPointId: emp.boardingPointId || '',
      returnRouteId: emp.returnRouteId || '',
      cep: emp.cep || '',
      street: emp.street || '',
      number: emp.number || '',
      complement: emp.complement || '',
      neighborhood: emp.neighborhood || '',
      city: emp.city || '',
      state: emp.state || '',
      boardingCep: emp.boardingCep || '',
      boardingStreet: emp.boardingStreet || '',
      boardingNumber: emp.boardingNumber || '',
      boardingNeighborhood: emp.boardingNeighborhood || '',
      boardingCity: emp.boardingCity || '',
      boardingState: emp.boardingState || '',
      twoFactorEnabled: Boolean(emp.twoFactorEnabled),
      twoFactorChannel: emp.twoFactorChannel || 'WHATSAPP',
      initialPassword: ''
    });
    setShowPasswordReset(false);
    setNewPasswordValue('');
    setIsFormOpen(true);
  };

  // Resetar Senha Diretamente
  const handleExecuteResetPassword = async () => {
    if (!form.id) {
      toast({ title: 'Salve o colaborador antes de redefinir a senha', variant: 'destructive' });
      return;
    }
    const pwd = newPasswordValue.trim() || generateRandomPassword();
    setIsResettingPassword(true);
    try {
      await axios.post(`/passengers/${form.id}/reset-password`, {
        newPassword: pwd,
        notifyVia: notifyPasswordVia
      });
      toast({
        title: 'Senha redefinida com sucesso!',
        description: `Nova senha: ${pwd} ${notifyPasswordVia !== 'NONE' ? `(Notificação via ${notifyPasswordVia})` : ''}`,
      });
      setNewPasswordValue(pwd);
      setShowPasswordReset(false);
    } catch (err: any) {
      toast({
        title: 'Erro ao redefinir senha',
        description: err.response?.data?.message || 'Falha ao comunicar com o servidor.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Habilitar / Desabilitar 2FA com Envio de Código
  const handleToggle2FA = async (enable: boolean, sendCodeNow: boolean = false) => {
    if (!form.id) {
      setForm(prev => ({ ...prev, twoFactorEnabled: enable }));
      return;
    }

    if (enable && form.twoFactorChannel === 'WHATSAPP' && !form.phone) {
      toast({ title: 'Informe o Telefone / WhatsApp para habilitar 2FA via WhatsApp', variant: 'destructive' });
      return;
    }
    if (enable && form.twoFactorChannel === 'EMAIL' && !form.email) {
      toast({ title: 'Informe o E-mail para habilitar 2FA via E-mail', variant: 'destructive' });
      return;
    }

    setIsSending2FA(true);
    try {
      await axios.post(`/passengers/${form.id}/toggle-2fa`, {
        enabled: enable,
        channel: form.twoFactorChannel,
        sendCode: sendCodeNow
      });
      setForm(prev => ({ ...prev, twoFactorEnabled: enable }));
      toast({
        title: enable ? '2FA Habilitado' : '2FA Desabilitado',
        description: sendCodeNow 
          ? `Código de validação enviado com sucesso via ${form.twoFactorChannel}!` 
          : `Preferência de autenticação atualizada.`,
      });
      fetchEmployees();
    } catch (err: any) {
      toast({
        title: 'Erro ao configurar 2FA',
        description: err.response?.data?.message || 'Falha ao enviar código 2FA.',
        variant: 'destructive',
      });
    } finally {
      setIsSending2FA(false);
    }
  };

  // Alternar Demissão / Ativo
  const handleToggleStatus = async (emp: Passenger) => {
    const isCurrentlyDismissed = emp.status === 'DEMITIDO' || emp.active === false;
    const newStatus = isCurrentlyDismissed ? 'ATIVO' : 'DEMITIDO';
    const confirmMsg = isCurrentlyDismissed 
      ? `Reativar o colaborador ${emp.name}?` 
      : `Deseja marcar ${emp.name} como DEMITIDO? Isso revogará o acesso ao crachá e viagens.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await axios.put(`/passengers/${emp.id}`, {
        ...emp,
        status: newStatus,
        active: newStatus === 'ATIVO',
        dismissalDate: newStatus === 'DEMITIDO' ? new Date().toISOString().split('T')[0] : null
      });
      toast({
        title: 'Status atualizado',
        description: `Colaborador marcado como ${newStatus}.`,
      });
      fetchEmployees();
    } catch (err) {
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar a situação do colaborador.',
        variant: 'destructive',
      });
    }
  };

  // Excluir
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cadastro do colaborador ${name}?`)) return;
    try {
      await axios.delete(`/passengers/${id}`);
      toast({ title: 'Colaborador removido com sucesso' });
      fetchEmployees();
    } catch (err) {
      toast({
        title: 'Erro ao excluir colaborador',
        variant: 'destructive',
      });
    }
  };

  // Salvar Formulário (Criar ou Atualizar)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    const sanitizedReg = form.registration.replace(/\D/g, '');
    if (!sanitizedReg) {
      toast({ title: 'Matrícula numérica é obrigatória', description: 'Digite apenas números.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Passenger> = {
        name: form.name.trim(),
        registration: sanitizedReg,
        cpf: form.cpf,
        phone: form.phone,
        email: form.email || undefined,
        clientId: clientId,
        companyId: user?.companyId || undefined,
        admissionDate: form.admissionDate || undefined,
        dismissalDate: form.dismissalDate || undefined,
        isPcd: form.isPcd,
        disabilityType: form.isPcd ? form.disabilityType : undefined,
        status: form.dismissalDate ? 'DEMITIDO' : form.status,
        active: !form.dismissalDate && form.status === 'ATIVO',
        routeId: form.routeId || undefined,
        boardingPointId: form.boardingPointId || undefined,
        returnRouteId: form.returnRouteId || undefined,
        cep: form.cep || undefined,
        street: form.street || undefined,
        number: form.number || undefined,
        complement: form.complement || undefined,
        neighborhood: form.neighborhood || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        boardingCep: form.boardingCep || undefined,
        boardingStreet: form.boardingStreet || undefined,
        boardingNumber: form.boardingNumber || undefined,
        boardingNeighborhood: form.boardingNeighborhood || undefined,
        boardingCity: form.boardingCity || undefined,
        boardingState: form.boardingState || undefined,
        twoFactorEnabled: form.twoFactorEnabled,
        twoFactorChannel: form.twoFactorChannel
      };

      if (form.id) {
        await axios.put(`/passengers/${form.id}`, payload);
        toast({ title: 'Colaborador atualizado com sucesso!' });
      } else {
        const res = await axios.post('/passengers', payload);
        const createdId = res.data?.id;

        if (createdId && form.initialPassword?.trim()) {
          try {
            await axios.post(`/passengers/${createdId}/reset-password`, {
              newPassword: form.initialPassword.trim(),
              notifyVia: notifyPasswordVia
            });
          } catch (pwdErr) {
            console.warn('Erro ao definir senha inicial:', pwdErr);
          }
        }
        toast({ title: 'Colaborador cadastrado com sucesso!' });
      }
      setIsFormOpen(false);
      setForm(emptyForm);
      fetchEmployees();
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar colaborador',
        description: err.response?.data?.message || err.message || 'Verifique se a matrícula já está em uso.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Leitura da Planilha .xlsx / .csv
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const parsed = rawJson.map((row, idx) => {
          const keys = Object.keys(row);
          const findVal = (terms: string[]) => {
            const k = keys.find(key => terms.some(t => key.toLowerCase().replace(/[\s_-]/g, '').includes(t)));
            return k ? String(row[k]).trim() : '';
          };

          const name = findVal(['nome', 'colaborador', 'funcionario', 'name', 'employee']);
          const rawMatricula = findVal(['matricula', 'registro', 're', 'chapa', 'registration', 'code']);
          const registration = rawMatricula.replace(/\D/g, ''); // Regra estrita: apenas números
          const cpf = findVal(['cpf', 'documento']);
          const phone = findVal(['telefone', 'celular', 'phone', 'tel', 'mobile']);
          const email = findVal(['email', 'e-mail', 'mail']);
          const admissionDate = findVal(['admissao', 'admissão', 'admission', 'dtadmissao']);
          const dismissalDate = findVal(['demissao', 'demissão', 'dismissal', 'dtdemissao']);
          const pcdRaw = findVal(['pcd', 'deficiencia', 'deficiência', 'especial']);
          const isPcd = ['sim', 's', 'true', '1', 'yes'].includes(pcdRaw.toLowerCase());

          return {
            rowNumber: idx + 2,
            name,
            registration,
            rawMatricula,
            cpf,
            phone,
            email,
            admissionDate,
            dismissalDate,
            isPcd,
            isValid: Boolean(name && registration)
          };
        });

        setImportPreview(parsed);
      } catch (err) {
        toast({
          title: 'Erro ao processar arquivo',
          description: 'Certifique-se de enviar uma planilha .xlsx ou .csv válida.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  // Download do Modelo de Planilha
  const handleDownloadTemplate = () => {
    const wsData = [
      ['Nome Completo', 'Matricula (somente numeros)', 'CPF', 'Telefone', 'Email', 'Data Admissao', 'Data Demissao', 'PCD (Sim/Nao)'],
      ['Carlos Eduardo Silva', '10452', '123.456.789-00', '(31) 98765-4321', 'carlos@empresa.com.br', '2024-01-15', '', 'Nao'],
      ['Ana Paula de Souza', '10453', '987.654.321-11', '(31) 99876-5432', 'ana.souza@empresa.com.br', '2023-05-10', '', 'Sim']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');
    XLSX.writeFile(wb, `modelo_colaboradores_${clientName.replace(/\s+/g, '_')}.xlsx`);
  };

  // Executar Importação em Lote
  const handleExecuteImport = async () => {
    const validRows = importPreview.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast({
        title: 'Nenhum registro válido para importar',
        description: 'Verifique se todas as linhas têm Nome e Matrícula numérica preenchidos.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of validRows) {
      try {
        await axios.post('/passengers', {
          name: row.name,
          registration: row.registration,
          cpf: row.cpf || undefined,
          phone: row.phone || undefined,
          email: row.email || undefined,
          admissionDate: row.admissionDate || undefined,
          dismissalDate: row.dismissalDate || undefined,
          isPcd: row.isPcd,
          clientId: clientId,
          companyId: user?.companyId || undefined,
          status: row.dismissalDate ? 'DEMITIDO' : 'ATIVO',
          active: !row.dismissalDate
        });
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    setIsImporting(false);
    setIsImportOpen(false);
    setImportFile(null);
    setImportPreview([]);

    toast({
      title: 'Importação concluída',
      description: `${successCount} colaborador(es) importado(s) com sucesso.${failCount > 0 ? ` ${failCount} com falha/duplicados.` : ''}`,
    });

    fetchEmployees();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total de Colaboradores</p>
              <p className="text-xl font-bold text-white">{stats.total}</p>
            </div>
            <Users className="h-6 w-6 text-cyan-400 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Ativos / Embarque Ok</p>
              <p className="text-xl font-bold text-emerald-400">{stats.active}</p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-400 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Demitidos / Inativos</p>
              <p className="text-xl font-bold text-rose-400">{stats.dismissed}</p>
            </div>
            <XCircle className="h-6 w-6 text-rose-400 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">PCD / Acessibilidade</p>
              <p className="text-xl font-bold text-blue-400">{stats.pcd}</p>
            </div>
            <Accessibility className="h-6 w-6 text-blue-400 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Action Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por nome, matrícula numérica ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-900/60 border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="border-slate-700 hover:bg-slate-800 text-slate-200"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-400" />
            Importar Planilha
          </Button>

          <Button 
            onClick={() => {
              setForm({
                ...emptyForm,
                initialPassword: generateRandomPassword()
              });
              setShowPasswordReset(false);
              setNewPasswordValue('');
              setIsFormOpen(true);
            }}
            className="bg-seguranca-red hover:bg-red-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Colaborador
          </Button>
        </div>
      </div>

      {/* Employees Table */}
      <Card className="bg-slate-900/40 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Matrícula</th>
                <th className="py-3 px-4">Nome do Colaborador</th>
                <th className="py-3 px-4">CPF / Contato</th>
                <th className="py-3 px-4">Rota Atribuída</th>
                <th className="py-3 px-4">Segurança (2FA)</th>
                <th className="py-3 px-4">Admissão / Demissão</th>
                <th className="py-3 px-4">PCD</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-seguranca-red" />
                    Carregando funcionários do cliente...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Nenhum colaborador encontrado para este cliente.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isDismissed = emp.status === 'DEMITIDO' || emp.active === false;
                  const numericReg = (emp.registration || '').replace(/\D/g, '');
                  const assignedRoute = routes.find(r => r.id === emp.routeId);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isDismissed ? (
                          <Badge variant="destructive" className="bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Demitido
                          </Badge>
                        ) : emp.status === 'BLOQUEADO' ? (
                          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Bloqueado
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Ativo
                          </Badge>
                        )}
                      </td>

                      {/* Matrícula Numérica */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {numericReg || '---'}
                        </span>
                      </td>

                      {/* Nome */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-white">{emp.name}</span>
                        {emp.email && <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{emp.email}</div>}
                      </td>

                      {/* CPF / Contato */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400">
                        <div>CPF: <span className="text-slate-200 font-mono">{emp.cpf || '---'}</span></div>
                        <div>Tel: <span className="text-slate-200 font-mono">{emp.phone || '---'}</span></div>
                      </td>

                      {/* Rota Atribuída */}
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {assignedRoute || emp.routeName ? (
                          <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
                            <Bus className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[160px]">{assignedRoute?.name || emp.routeName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic flex items-center gap-1">
                            <Bus className="h-3 w-3 opacity-40" /> Sem rota
                          </span>
                        )}
                      </td>

                      {/* Segurança 2FA */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {emp.twoFactorEnabled ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] flex items-center gap-1 w-fit">
                            <ShieldCheck className="h-3 w-3" /> 2FA Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px] w-fit">
                            2FA Desativado
                          </Badge>
                        )}
                      </td>

                      {/* Admissão / Demissão */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400">
                        <div>Adm: <span className="text-slate-200">{emp.admissionDate ? new Date(emp.admissionDate).toLocaleDateString('pt-BR') : '---'}</span></div>
                        {emp.dismissalDate && (
                          <div className="text-rose-400">Dem: {new Date(emp.dismissalDate).toLocaleDateString('pt-BR')}</div>
                        )}
                      </td>

                      {/* PCD */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {emp.isPcd ? (
                          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1 w-fit">
                            <Accessibility className="h-3 w-3" /> PCD
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-xs">Não</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(emp)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                            title="Editar Colaborador / Rota / Senha"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(emp)}
                            className={`h-8 w-8 p-0 ${isDismissed ? 'text-emerald-400 hover:text-emerald-300' : 'text-rose-400 hover:text-rose-300'}`}
                            title={isDismissed ? 'Reativar' : 'Marcar como Demitido'}
                          >
                            {isDismissed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(emp.id, emp.name)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-rose-500"
                            title="Excluir Colaborador"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Cadastro / Edição com ENDEREÇOS (Residencial + Embarque), ROTA, RESET DE SENHA e 2FA */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-seguranca-red" />
                <span>{form.id ? 'Editar Colaborador' : 'Novo Colaborador'}</span>
              </div>
              {form.id && (
                <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono text-xs">
                  ID: {form.registration}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4">
            {/* Bloco 1: Dados Pessoais */}
            <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Dados do Colaborador</h4>
              
              <div>
                <Label className="text-xs text-slate-300">Nome Completo *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo da Silva"
                  className="bg-slate-800 border-slate-700 text-white mt-1 h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-300 flex items-center justify-between">
                    <span>Matrícula *</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Somente números</span>
                  </Label>
                  <Input
                    required
                    value={form.registration}
                    onChange={handleRegistrationChange}
                    placeholder="Ex: 7695"
                    className="bg-slate-800 border-slate-700 text-white font-mono mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-300">CPF</Label>
                  <Input
                    value={form.cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    className="bg-slate-800 border-slate-700 text-white font-mono mt-1 h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-300">Telefone / WhatsApp</Label>
                  <Input
                    value={form.phone}
                    onChange={handlePhoneChange}
                    placeholder="(00) 00000-0000"
                    className="bg-slate-800 border-slate-700 text-white font-mono mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-300">E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="colaborador@empresa.com.br"
                    className="bg-slate-800 border-slate-700 text-white mt-1 h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-300">Data de Admissão</Label>
                  <Input
                    type="date"
                    value={form.admissionDate}
                    onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-300">Data de Demissão (Opcional)</Label>
                  <Input
                    type="date"
                    value={form.dismissalDate}
                    onChange={(e) => setForm({ ...form, dismissalDate: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1 h-9"
                  />
                </div>
              </div>

              {/* PCD */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPcd}
                    onChange={(e) => setForm({ ...form, isPcd: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-800 text-seguranca-red focus:ring-0"
                  />
                  <span className="text-xs font-medium text-slate-200">Colaborador PCD (Pessoa com Deficiência)</span>
                </label>

                {form.isPcd && (
                  <div className="mt-2">
                    <Input
                      placeholder="Tipo de deficiência / necessidade especial..."
                      value={form.disabilityType}
                      onChange={(e) => setForm({ ...form, disabilityType: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Endereço Residencial (Com busca automática por CEP) */}
            <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Endereço Residencial</h4>
                </div>
                {loadingCepResidencial && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" /> Buscando CEP...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-slate-300 flex items-center justify-between">
                    <span>CEP Residencial</span>
                    <span className="text-[10px] text-emerald-400 font-normal">Preenche automático</span>
                  </Label>
                  <Input
                    value={form.cep}
                    onChange={handleCepResidencialChange}
                    placeholder="00000-000"
                    className="bg-slate-800 border-slate-700 text-white font-mono mt-1 h-9"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-300">Logradouro / Rua</Label>
                  <Input
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Rua, Avenida, Praça..."
                    className="bg-slate-800 border-slate-700 text-white mt-1 h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-slate-300">Número</Label>
                  <Input
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="123"
                    className="bg-slate-800 border-slate-700 text-white mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-300">Complemento</Label>
                  <Input
                    value={form.complement}
                    onChange={(e) => setForm({ ...form, complement: e.target.value })}
                    placeholder="Apto, Bloco..."
                    className="bg-slate-800 border-slate-700 text-white mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-300">Bairro</Label>
                  <Input
                    value={form.neighborhood}
                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    placeholder="Bairro"
                    className="bg-slate-800 border-slate-700 text-white mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-300">Cidade - UF</Label>
                  <div className="flex gap-1 mt-1">
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Cidade"
                      className="bg-slate-800 border-slate-700 text-white h-9 flex-1 text-xs"
                    />
                    <Input
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                      className="bg-slate-800 border-slate-700 text-white h-9 w-12 text-center uppercase text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3: Endereço de Embarque (Com busca automática por CEP) */}
            <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Local de Embarque (Parada)</h4>
                </div>
                {loadingCepEmbarque && (
                  <span className="text-[10px] text-cyan-400 flex items-center gap-1 animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" /> Buscando CEP...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-slate-300 flex items-center justify-between">
                    <span>CEP de Embarque</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Preenche automático</span>
                  </Label>
                  <Input
                    value={form.boardingCep}
                    onChange={handleCepEmbarqueChange}
                    placeholder="00000-000"
                    className="bg-slate-800 border-slate-700 text-white font-mono mt-1 h-9"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-300">Ponto / Endereço de Embarque</Label>
                  <Input
                    value={form.boardingStreet}
                    onChange={(e) => setForm({ ...form, boardingStreet: e.target.value })}
                    placeholder="Rua, ponto de ônibus ou referência..."
                    className="bg-slate-800 border-slate-700 text-white mt-1 h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-slate-300">Número / Referência</Label>
                  <Input
                    value={form.boardingNumber}
                    onChange={(e) => setForm({ ...form, boardingNumber: e.target.value })}
                    placeholder="Ex: Em frente ao 120"
                    className="bg-slate-800 border-slate-700 text-white mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-300">Bairro</Label>
                  <Input
                    value={form.boardingNeighborhood}
                    onChange={(e) => setForm({ ...form, boardingNeighborhood: e.target.value })}
                    placeholder="Bairro"
                    className="bg-slate-800 border-slate-700 text-white mt-1 h-9"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-300">Cidade - UF</Label>
                  <div className="flex gap-1 mt-1">
                    <Input
                      value={form.boardingCity}
                      onChange={(e) => setForm({ ...form, boardingCity: e.target.value })}
                      placeholder="Cidade"
                      className="bg-slate-800 border-slate-700 text-white h-9 flex-1 text-xs"
                    />
                    <Input
                      value={form.boardingState}
                      onChange={(e) => setForm({ ...form, boardingState: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                      className="bg-slate-800 border-slate-700 text-white h-9 w-12 text-center uppercase text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 4: Transporte & Rota Vinculada */}
            <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Rota & Transporte Atribuído
                  </h4>
                </div>
                {form.routeId && (
                  <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px]">
                    Rota Ativa
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-300">Rota de Ida</Label>
                  <select
                    value={form.routeId}
                    onChange={(e) => setForm({ ...form, routeId: e.target.value, boardingPointId: '' })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-md p-2 h-9 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="">(Nenhuma rota atribuída)</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.shift ? `(${r.shift})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-slate-300">Ponto de Parada Cadastrado na Rota</Label>
                  <select
                    value={form.boardingPointId}
                    onChange={(e) => setForm({ ...form, boardingPointId: e.target.value })}
                    disabled={!form.routeId}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-md p-2 h-9 disabled:opacity-50 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="">{form.routeId ? '(Selecione o ponto)' : '(Selecione a rota primeiro)'}</option>
                    {selectedRoutePoints.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.order + 1}. {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-300">Rota de Retorno (Volta - Opcional)</Label>
                <select
                  value={form.returnRouteId}
                  onChange={(e) => setForm({ ...form, returnRouteId: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-md p-2 h-9 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="">(Mesma rota da ida ou nenhuma)</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.shift ? `(${r.shift})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bloco 5: Segurança, Senha de Acesso & 2FA */}
            <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Acesso & Autenticação em 2 Fatores (2FA)
                  </h4>
                </div>
                {form.twoFactorEnabled ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                    2FA Habilitado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                    2FA Desativado
                  </Badge>
                )}
              </div>

              {/* Seção Resetar Senha */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    {form.id ? 'Gerenciamento de Senha do Colaborador' : 'Definir Senha Inicial'}
                  </span>
                  {form.id && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordReset(!showPasswordReset);
                        if (!newPasswordValue) setNewPasswordValue(generateRandomPassword());
                      }}
                      className="h-7 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                    >
                      <KeyRound className="h-3.5 w-3.5 mr-1" />
                      {showPasswordReset ? 'Ocultar Reset' : 'Resetar Senha de Acesso'}
                    </Button>
                  )}
                </div>

                {!form.id && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-400">Senha Inicial para Acesso ao Portal</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm({ ...form, initialPassword: generateRandomPassword() })}
                        className="h-6 text-[11px] text-cyan-400 hover:text-cyan-300"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" /> Gerar Automática
                      </Button>
                    </div>
                    <Input
                      value={form.initialPassword}
                      onChange={(e) => setForm({ ...form, initialPassword: e.target.value })}
                      placeholder="Ex: Colab@2026"
                      className="bg-slate-800 border-slate-700 text-white font-mono text-xs h-8"
                    />
                  </div>
                )}

                {form.id && showPasswordReset && (
                  <div className="pt-2 border-t border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Input
                        value={newPasswordValue}
                        onChange={(e) => setNewPasswordValue(e.target.value)}
                        placeholder="Digite a nova senha segura..."
                        className="bg-slate-800 border-slate-700 text-white font-mono text-xs h-8 flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setNewPasswordValue(generateRandomPassword())}
                        className="h-8 text-xs border-slate-700 text-slate-300"
                        title="Gerar Senha Aleatória"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Enviar via:</span>
                        <select
                          value={notifyPasswordVia}
                          onChange={(e: any) => setNotifyPasswordVia(e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1 h-7"
                        >
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="EMAIL">E-mail</option>
                          <option value="NONE">Não Notificar</option>
                        </select>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        disabled={isResettingPassword || !newPasswordValue.trim()}
                        onClick={handleExecuteResetPassword}
                        className="h-8 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                      >
                        {isResettingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <KeyRound className="h-3.5 w-3.5 mr-1" />}
                        Confirmar Nova Senha
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 2FA com Envio de Código */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-200">Autenticação em Dois Fatores (2FA)</p>
                    <p className="text-[11px] text-slate-400">Exige código de verificação para login no Portal do Passageiro.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.twoFactorEnabled}
                      onChange={(e) => handleToggle2FA(e.target.checked, false)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, twoFactorChannel: 'WHATSAPP' })}
                    className={`p-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      form.twoFactorChannel === 'WHATSAPP'
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 font-semibold'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, twoFactorChannel: 'EMAIL' })}
                    className={`p-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      form.twoFactorChannel === 'EMAIL'
                        ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300 font-semibold'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5 text-cyan-400" />
                    <span>E-mail</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">
                    Destino: <strong className="text-white font-mono">{form.twoFactorChannel === 'WHATSAPP' ? (form.phone || 'Sem WhatsApp') : (form.email || 'Sem E-mail')}</strong>
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isSending2FA || !form.id}
                    onClick={() => handleToggle2FA(true, true)}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    title={!form.id ? 'Cadastre o colaborador primeiro' : 'Enviar código de verificação 2FA agora'}
                  >
                    {isSending2FA ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                    Enviar Código 2FA Agora
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-slate-700 text-slate-300">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-seguranca-red hover:bg-red-700 text-white font-semibold">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {form.id ? 'Salvar Alterações' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Importação de Planilha */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              Importar Colaboradores do Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Precisa de um modelo pronto?</p>
                <p className="text-xs text-slate-400">Baixe a planilha de exemplo com as colunas pré-formatadas.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="border-slate-600 hover:bg-slate-700 text-slate-200"
              >
                <Download className="h-4 w-4 mr-2 text-cyan-400" />
                Baixar Modelo (.xlsx)
              </Button>
            </div>

            {/* Input Arquivo */}
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-slate-500 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-300 font-medium">Selecione ou arraste sua planilha (.xlsx ou .csv)</p>
              <p className="text-xs text-slate-500 mt-1">Reconhecimento automático de colunas (Nome, Matrícula, CPF, etc.)</p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-import-input"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-import-input')?.click()}
                className="mt-4 border-slate-600"
              >
                Escolher Arquivo
              </Button>
              {importFile && (
                <p className="text-xs text-emerald-400 mt-2 font-mono">{importFile.name}</p>
              )}
            </div>

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Pré-visualização: {importPreview.length} linha(s) encontrada(s)</span>
                  <span className="text-emerald-400 font-medium">
                    {importPreview.filter(r => r.isValid).length} válida(s)
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded bg-slate-950/60 p-2 text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800 pb-1">
                        <th className="p-1">Linha</th>
                        <th className="p-1">Matrícula (Números)</th>
                        <th className="p-1">Nome</th>
                        <th className="p-1">CPF</th>
                        <th className="p-1">PCD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {importPreview.slice(0, 10).map((r, i) => (
                        <tr key={i} className={r.isValid ? 'text-slate-300' : 'text-rose-400'}>
                          <td className="p-1 font-mono">{r.rowNumber}</td>
                          <td className="p-1 font-mono font-bold">{r.registration || 'INVÁLIDO'}</td>
                          <td className="p-1 truncate max-w-[150px]">{r.name || 'SEM NOME'}</td>
                          <td className="p-1 font-mono">{r.cpf || '-'}</td>
                          <td className="p-1">{r.isPcd ? 'Sim' : 'Não'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.length > 10 && (
                    <p className="text-center text-[11px] text-slate-500 mt-2">
                      ... mais {importPreview.length - 10} linhas
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" onClick={() => setIsImportOpen(false)} className="border-slate-700 text-slate-300">
                Cancelar
              </Button>
              <Button
                disabled={isImporting || importPreview.filter(r => r.isValid).length === 0}
                onClick={handleExecuteImport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar Importação ({importPreview.filter(r => r.isValid).length})
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientEmployeesTab;
