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
  Accessibility, Calendar, Phone, Hash, ShieldAlert, Loader2 
} from 'lucide-react';
import axios from '@/lib/axios';
import * as XLSX from 'xlsx';
import { Passenger } from '@/types/passenger';
import { useAuth } from '@/contexts/AuthContext';

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
  admissionDate: string;
  dismissalDate: string;
  isPcd: boolean;
  disabilityType: string;
  status: string;
}

const emptyForm: NewPassengerForm = {
  name: '',
  registration: '',
  cpf: '',
  phone: '',
  admissionDate: '',
  dismissalDate: '',
  isPcd: false,
  disabilityType: '',
  status: 'ATIVO'
};

export const ClientEmployeesTab: React.FC<ClientEmployeesTabProps> = ({ clientId, clientName }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [employees, setEmployees] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<NewPassengerForm>(emptyForm);
  
  // Importação
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

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
          // Fallback gracioso
          const fallback = await axios.get('/passengers');
          data = (fallback.data || []).filter((p: Passenger) => p.clientId === clientId);
        } else {
          throw err;
        }
      }
      setEmployees(data);
    } catch (error) {
      console.error('Erro ao buscar colaboradores do cliente:', error);
      toast({
        title: 'Erro ao carregar colaboradores',
        description: 'Não foi possível carregar a lista de funcionários deste cliente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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

  // Abrir Modal de Edição
  const handleEdit = (emp: Passenger) => {
    setForm({
      id: emp.id,
      name: emp.name || '',
      registration: (emp.registration || '').replace(/\D/g, ''),
      cpf: emp.cpf || '',
      phone: emp.phone || '',
      admissionDate: emp.admissionDate ? emp.admissionDate.split('T')[0] : '',
      dismissalDate: emp.dismissalDate ? emp.dismissalDate.split('T')[0] : '',
      isPcd: Boolean(emp.isPcd),
      disabilityType: emp.disabilityType || '',
      status: emp.status || (emp.active ? 'ATIVO' : 'DEMITIDO')
    });
    setIsFormOpen(true);
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
        clientId: clientId,
        companyId: user?.companyId || undefined,
        admissionDate: form.admissionDate || undefined,
        dismissalDate: form.dismissalDate || undefined,
        isPcd: form.isPcd,
        disabilityType: form.isPcd ? form.disabilityType : undefined,
        status: form.dismissalDate ? 'DEMITIDO' : form.status,
        active: !form.dismissalDate && form.status === 'ATIVO'
      };

      if (form.id) {
        await axios.put(`/passengers/${form.id}`, payload);
        toast({ title: 'Colaborador atualizado com sucesso!' });
      } else {
        await axios.post('/passengers', payload);
        toast({ title: 'Colaborador cadastrado com sucesso!' });
      }
      setIsFormOpen(false);
      setForm(emptyForm);
      fetchEmployees();
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar colaborador',
        description: err.response?.data?.message || 'Verifique se a matrícula já está em uso.',
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

        // Normalização flexível das colunas
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
      ['Nome Completo', 'Matricula (somente numeros)', 'CPF', 'Telefone', 'Data Admissao', 'Data Demissao', 'PCD (Sim/Nao)'],
      ['Carlos Eduardo Silva', '10452', '123.456.789-00', '(31) 98765-4321', '2024-01-15', '', 'Nao'],
      ['Ana Paula de Souza', '10453', '987.654.321-11', '(31) 99876-5432', '2023-05-10', '', 'Sim'],
      ['Roberto Alves', '10454', '456.789.012-22', '(31) 97654-3210', '2022-08-01', '2026-02-01', 'Nao']
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
              setForm(emptyForm);
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
                <th className="py-3 px-4">CPF / Telefone</th>
                <th className="py-3 px-4">Admissão / Demissão</th>
                <th className="py-3 px-4">PCD</th>
                <th className="py-3 px-4">Rota Atual</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-seguranca-red" />
                    Carregando funcionários do cliente...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhum colaborador encontrado para este cliente.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isDismissed = emp.status === 'DEMITIDO' || emp.active === false;
                  const numericReg = (emp.registration || '').replace(/\D/g, '');

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
                      </td>

                      {/* CPF / Telefone */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400">
                        <div>CPF: <span className="text-slate-200 font-mono">{emp.cpf || '---'}</span></div>
                        <div>Tel: <span className="text-slate-200 font-mono">{emp.phone || '---'}</span></div>
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

                      {/* Rota */}
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {emp.routeName ? (
                          <span className="text-cyan-400 font-medium">{emp.routeName}</span>
                        ) : (
                          <span className="text-slate-500 italic">Sem rota</span>
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
                            title="Editar Colaborador"
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

      {/* Modal Cadastro / Edição */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-seguranca-red" />
              {form.id ? 'Editar Colaborador' : 'Novo Colaborador'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4">
            <div>
              <Label className="text-xs text-slate-300">Nome Completo *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Carlos Eduardo da Silva"
                className="bg-slate-800 border-slate-700 text-white mt-1"
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
                  className="bg-slate-800 border-slate-700 text-white font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-300">CPF</Label>
                <Input
                  value={form.cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="bg-slate-800 border-slate-700 text-white font-mono mt-1"
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
                  className="bg-slate-800 border-slate-700 text-white font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-300">Data de Admissão</Label>
                <Input
                  type="date"
                  value={form.admissionDate}
                  onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-300 flex items-center justify-between">
                <span>Data de Demissão (Opcional)</span>
                {form.dismissalDate && (
                  <span className="text-[10px] text-rose-400">Bloqueará embarques imediatamente</span>
                )}
              </Label>
              <Input
                type="date"
                value={form.dismissalDate}
                onChange={(e) => setForm({ ...form, dismissalDate: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            {/* PCD */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPcd}
                  onChange={(e) => setForm({ ...form, isPcd: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-seguranca-red focus:ring-0"
                />
                <span className="text-sm font-medium text-slate-200">Colaborador PCD (Pessoa com Deficiência)</span>
              </label>

              {form.isPcd && (
                <div className="mt-2 pl-6">
                  <Input
                    placeholder="Tipo de deficiência / Necessidade especial..."
                    value={form.disabilityType}
                    onChange={(e) => setForm({ ...form, disabilityType: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white text-xs"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-slate-700">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-seguranca-red hover:bg-red-700 text-white">
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
              <Button variant="outline" onClick={() => setIsImportOpen(false)} className="border-slate-700">
                Cancelar
              </Button>
              <Button
                disabled={isImporting || importPreview.filter(r => r.isValid).length === 0}
                onClick={handleExecuteImport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
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

