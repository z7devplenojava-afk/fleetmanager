import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, UserPlus, ExternalLink, Eye, FileText, Send, Mail, Calendar, Shield, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FuncionarioNovoModal from '@/components/funcionarios/FuncionarioNovoModal';
import { employeeService, SimpleEmployee } from '@/services/employeeService';
import { companyService } from '@/services/companyService';
import { unitService } from '@/services/unitService';
import { positionService } from '@/services/positionService';
import { clientService, Client } from '@/services/clientService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { Company } from '@/types/company';
import { Unit } from '@/types/unit';
import { Position } from '@/services/positionService';
import { admissionRequestService, AdmissionRequest } from '@/services/admissionRequestService';
import { useToast } from '@/hooks/use-toast';

interface AdmissaoDemissaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  request?: AdmissionRequest | null;
}

// Removido mocks - agora usando dados reais da API

const AdmissaoDemissaoFormModal: React.FC<AdmissaoDemissaoFormModalProps> = ({ isOpen, onClose, onSuccess, request }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    tipo: 'admissao',
    funcionario: '',
    data: '',
    solicitante: '',
    empresa: '',
    unidade: '',
    cliente: '',
    posto: '',
    motivo: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showFuncionarioModal, setShowFuncionarioModal] = useState(false);
  const [funcionarios, setFuncionarios] = useState<SimpleEmployee[]>([]);
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false);
  const [empresas, setEmpresas] = useState<Company[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [clientes, setClientes] = useState<Client[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [postos, setPostos] = useState<WorkPost[]>([]);
  const [loadingPostos, setLoadingPostos] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [defaultEpis, setDefaultEpis] = useState<Array<{ epiName: string; quantity: string; caNumber: string; validity: string; observations: string }>>([
    { epiName: '', quantity: '1', caNumber: '', validity: '', observations: '' }
  ]);

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      // Limpar formulário primeiro
      if (!request) {
        setForm({ 
          tipo: 'admissao', 
          funcionario: '', 
          data: '', 
          solicitante: '', 
          empresa: '', 
          unidade: '', 
          cliente: '', 
          posto: '', 
          motivo: '' 
        });
      }
      // Carregar dados
      loadFuncionarios();
      loadEmpresas();
      loadUnidades();
      loadClientes();
      loadPostos();
    }
  }, [isOpen]);
  
  // Preencher formulário quando os dados e o request estiverem disponíveis
  useEffect(() => {
    if (isOpen && request && funcionarios.length > 0 && empresas.length > 0 && unidades.length > 0) {
      fillFormFromRequest(request);
    }
  }, [isOpen, request, funcionarios, empresas, unidades]);

  // Carregar EPIs padrão quando empresa for selecionada e for admissão
  useEffect(() => {
    if (form.empresa && form.tipo === 'admissao' && empresas.length > 0) {
      const selectedCompany = empresas.find(c => c.id === form.empresa);
      if (selectedCompany && selectedCompany.defaultEpis && selectedCompany.defaultEpis.length > 0) {
        setDefaultEpis(selectedCompany.defaultEpis.map(epi => ({
          epiName: epi.epiName || '',
          quantity: String(epi.quantity || 1),
          caNumber: epi.caNumber || '',
          validity: epi.validity || '',
          observations: epi.observations || ''
        })));
      } else {
        setDefaultEpis([{ epiName: '', quantity: '1', caNumber: '', validity: '', observations: '' }]);
      }
    } else if (form.tipo !== 'admissao') {
      setDefaultEpis([{ epiName: '', quantity: '1', caNumber: '', validity: '', observations: '' }]);
    }
  }, [form.empresa, form.tipo, empresas]);
  
  // Função para preencher formulário a partir do request
  const fillFormFromRequest = (req: AdmissionRequest) => {
    console.log('📝 Preenchendo formulário com dados do request:', req);
    console.log('📋 Funcionários disponíveis:', funcionarios.length);
    console.log('📋 Empresas disponíveis:', empresas.length);
    console.log('📋 Unidades disponíveis:', unidades.length);
    
    // Buscar funcionário pelo nome ou CPF
    const funcionario = funcionarios.find(f => 
      f.name === req.employeeName || 
      f.cpf === req.employeeCpf ||
      (req.employeeCpf && f.cpf?.replace(/\D/g, '') === req.employeeCpf.replace(/\D/g, ''))
    );
    
    console.log('👤 Funcionário encontrado:', funcionario);
    
    // Buscar empresa - pode estar relacionada à unidade
    let empresaEncontrada = empresas.find(e => e.id === req.unitId);
    if (!empresaEncontrada && req.unitName) {
      empresaEncontrada = empresas.find(e => e.name === req.unitName || e.sigla === req.unitName);
    }
    
    // Buscar unidade
    const unidade = unidades.find(u => 
      u.id === req.unitId || 
      u.name === req.unitName
    );
    
    console.log('🏢 Empresa encontrada:', empresaEncontrada);
    console.log('🏛️ Unidade encontrada:', unidade);
    
    // Formatar data - usar startDate para admissão, endDate para demissão
    let dataFormatada = '';
    if (req.type === 'ADMISSION' && req.startDate) {
      dataFormatada = req.startDate.split('T')[0];
    } else if (req.type === 'DISMISSAL' && req.endDate) {
      dataFormatada = req.endDate.split('T')[0];
    } else if (req.requestDate) {
      dataFormatada = req.requestDate.split('T')[0];
    }
    
    const formData = {
      tipo: req.type === 'ADMISSION' ? 'admissao' : 'demissao',
      funcionario: funcionario?.id || '',
      data: dataFormatada,
      solicitante: req.requesterName || '',
      empresa: empresaEncontrada?.id || '',
      unidade: unidade?.id || req.unitId || '',
      cliente: '', // Não temos cliente no request
      posto: '', // Não temos posto no request
      motivo: req.reason || req.justification || req.notes || ''
    };
    
    console.log('✅ Formulário preenchido:', formData);
    setForm(formData);
    
    // Se houver unidade, tentar buscar cliente relacionado
    if (unidade && clientes.length > 0) {
      // Tentar encontrar cliente relacionado (pode precisar de lógica adicional)
      // Por enquanto, deixamos vazio
    }
  };

  const loadFuncionarios = async () => {
    setLoadingFuncionarios(true);
    try {
      // Buscar todos os funcionários independente do tipo de solicitação
      const response = await employeeService.getAllEmployees();
      // Converter para SimpleEmployee se necessário
      const simpleEmployees = response.map(emp => ({
        id: emp.id,
        name: emp.name,
        cpf: emp.cpf || '',
        email: emp.email || '',
        phone: emp.phone || '',
        registrationNumber: emp.registrationNumber || '',
        positionName: emp.position?.name,
        unitName: emp.unit?.name
      }));
      setFuncionarios(simpleEmployees);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      setFuncionarios([]);
    } finally {
      setLoadingFuncionarios(false);
    }
  };

  const loadEmpresas = async (): Promise<void> => {
    setLoadingEmpresas(true);
    try {
      const response = await companyService.getAllCompanies();
      setEmpresas(response);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setEmpresas([]);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const loadUnidades = async (): Promise<void> => {
    setLoadingUnidades(true);
    try {
      const response = await unitService.getAllUnits();
      setUnidades(response);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      setUnidades([]);
    } finally {
      setLoadingUnidades(false);
    }
  };

  const loadClientes = async (): Promise<void> => {
    setLoadingClientes(true);
    try {
      const response = await clientService.getAllClients();
      setClientes(response);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  };

  const loadPostos = async (clientId?: string): Promise<void> => {
    setLoadingPostos(true);
    try {
      let response: WorkPost[];
      if (clientId) {
        response = await workPostService.getWorkPostsByClient(clientId);
      } else {
        response = await workPostService.getAllWorkPosts();
      }
      setPostos(response);
    } catch (error) {
      console.error('Erro ao carregar postos:', error);
      setPostos([]);
    } finally {
      setLoadingPostos(false);
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!form.tipo) errs.tipo = 'Selecione o tipo.';
    if (!form.funcionario) errs.funcionario = 'Selecione o funcionário.';
    if (!form.data) errs.data = 'Informe a data.';
    if (!form.solicitante.trim()) errs.solicitante = 'Informe o solicitante.';
    if (!form.empresa) errs.empresa = 'Selecione a empresa.';
    if (!form.unidade) errs.unidade = 'Selecione a unidade.';
    if (!form.cliente) errs.cliente = 'Selecione o cliente.';
    if (!form.posto) errs.posto = 'Selecione o posto de trabalho.';
    if (!form.motivo.trim()) errs.motivo = 'Informe o motivo.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        type: form.tipo === 'admissao' ? 'ADMISSION' : 'DISMISSAL' as 'ADMISSION' | 'DISMISSAL',
        employeeName: funcionarios.find(f => f.id === form.funcionario)?.name || form.funcionario,
        employeeCpf: funcionarios.find(f => f.id === form.funcionario)?.cpf,
        employeeEmail: funcionarios.find(f => f.id === form.funcionario)?.email,
        position: funcionarios.find(f => f.id === form.funcionario)?.positionName,
        unitId: form.unidade,
        startDate: form.tipo === 'admissao' ? form.data : undefined,
        endDate: form.tipo === 'demissao' ? form.data : undefined,
        reason: form.motivo,
        justification: form.motivo,
        requesterName: form.solicitante,
        priority: 'MEDIUM' as const,
        notes: form.motivo
      };
      
      if (request) {
        // Modo de edição
        await admissionRequestService.updateAdmissionRequest(request.id, { ...payload, id: request.id });
      } else {
        // Modo de criação
        await admissionRequestService.createAdmissionRequest(payload);
      }
      
      onSuccess(form);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
      setErrors({ submit: 'Erro ao salvar solicitação. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToNewEmployee = () => {
    setShowFuncionarioModal(true); // Abre o modal de novo funcionário
  };

  const handleFuncionarioCreated = () => {
    // Recarregar a lista de funcionários após criar um novo
    loadFuncionarios();
  };

  const handleEpiChange = (idx: number, field: string, value: string) => {
    setDefaultEpis(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const addEpi = () => {
    setDefaultEpis([...defaultEpis, { epiName: '', quantity: '1', caNumber: '', validity: '', observations: '' }]);
  };

  const removeEpi = (idx: number) => {
    if (defaultEpis.length > 1) {
      setDefaultEpis(defaultEpis.filter((_, i) => i !== idx));
    }
  };

  const handlePreview = () => {
    if (!validate()) return;
    setShowPreview(true);
  };

  const handleGeneratePDF = async () => {
    // Se estiver editando e houver um request salvo, gerar PDF do request
    if (request && request.id) {
      try {
        setLoading(true);
        const blob = await admissionRequestService.generatePDF(request.id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `solicitacao-${request.requestNumber || request.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast({
          title: 'PDF gerado!',
          description: 'O PDF foi baixado com sucesso.',
        });
      } catch (error: any) {
        console.error('Erro ao gerar PDF:', error);
        toast({
          title: 'Erro ao gerar PDF',
          description: error.message || 'Não foi possível gerar o PDF.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Se não houver request salvo, mostrar mensagem
      toast({
        title: 'Aviso',
        description: 'Salve a solicitação primeiro para gerar o PDF.',
        variant: 'default',
      });
    }
  };

  const handleSendEmail = () => {
    if (!validate()) return;
    setEmailData({
      to: '',
      subject: `Solicitação de ${form.tipo === 'admissao' ? 'Admissão' : 'Demissão'} - ${funcionarios.find(f => f.id === form.funcionario)?.name || 'Funcionário'}`,
      message: `Prezado(a),\n\nSegue em anexo a solicitação de ${form.tipo === 'admissao' ? 'admissão' : 'demissão'} para análise.\n\nDetalhes:\n- Funcionário: ${funcionarios.find(f => f.id === form.funcionario)?.name || 'N/A'}\n- Data: ${form.data}\n- Solicitante: ${form.solicitante}\n- Motivo: ${form.motivo}\n\nAtenciosamente,\nSistema de RH`
    });
    setShowEmailModal(true);
  };

  const handleSendEmailSubmit = () => {
    // Aqui seria implementado o envio do email
    console.log('Enviando email:', emailData);
    alert('Email enviado com sucesso!');
    setShowEmailModal(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-gradient-to-br from-seguranca-graphite to-gray-800 text-seguranca-lightgray rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden relative animate-fadeIn border border-gray-600">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-600 bg-gradient-to-r from-seguranca-graphite to-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-seguranca-yellow rounded-lg flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-black" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {request ? 'Editar Solicitação' : 'Nova Solicitação'}
            </h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="h-8 w-8 p-0 hover:bg-gray-600 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Formulário */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            {/* Seção Principal */}
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-600">
                <h3 className="text-sm font-semibold text-seguranca-yellow mb-4 flex items-center">
                  <div className="w-2 h-2 bg-seguranca-yellow rounded-full mr-2"></div>
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tipo */}
                  <div className="space-y-2">
                    <Label htmlFor="tipo" className="text-sm font-medium text-gray-200">Tipo *</Label>
                    <select
                      id="tipo"
                      className={`w-full rounded-lg bg-gray-700 text-white border-2 transition-all duration-200 focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow p-3 ${errors.tipo ? 'border-red-500' : 'border-gray-600'}`}
                      value={form.tipo}
                      onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    >
                      <option value="admissao">Admissão</option>
                      <option value="demissao">Demissão</option>
                    </select>
                    {errors.tipo && <span className="text-xs text-red-400 flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-1"></span>
                      {errors.tipo}
                    </span>}
                  </div>
                  {/* Funcionário */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="funcionario" className="text-sm font-medium text-gray-200">Funcionário *</Label>
                      {form.tipo === 'admissao' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleNavigateToNewEmployee}
                          className="text-seguranca-yellow hover:text-yellow-400 text-xs px-2 py-1 h-auto bg-yellow-500/10 hover:bg-yellow-500/20 rounded-md transition-all duration-200"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Novo Funcionário
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                    <select
                      id="funcionario"
                      className={`w-full rounded-lg bg-gray-700 text-white border-2 transition-all duration-200 focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow p-3 ${errors.funcionario ? 'border-red-500' : 'border-gray-600'}`}
                      value={form.funcionario}
                      onChange={e => setForm(f => ({ ...f, funcionario: e.target.value }))}
                      disabled={loadingFuncionarios}
                    >
                      <option value="">
                        {loadingFuncionarios ? 'Carregando funcionários...' : 'Selecione...'}
                      </option>
                      {funcionarios.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} {f.registrationNumber ? `(${f.registrationNumber})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.funcionario && <span className="text-xs text-red-400 flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-1"></span>
                      {errors.funcionario}
                    </span>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {/* Data */}
                  <div className="space-y-2">
                    <Label htmlFor="data" className="text-sm font-medium text-gray-200">Data *</Label>
                    <div className="relative">
                      <Input
                        id="data"
                        type="date"
                        value={form.data}
                        onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                        className={`w-full rounded-lg bg-gray-700 text-white border-2 transition-all duration-200 focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow p-3 pr-10 ${errors.data ? 'border-red-500' : 'border-gray-600'}`}
                        style={{
                          colorScheme: 'dark',
                          WebkitAppearance: 'none',
                          MozAppearance: 'textfield'
                        }}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    {errors.data && <span className="text-xs text-red-400 flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-1"></span>
                      {errors.data}
                    </span>}
                  </div>
                  
                  {/* Solicitante */}
                  <div className="space-y-2">
                    <Label htmlFor="solicitante" className="text-sm font-medium text-gray-200">Solicitante *</Label>
                    <Input
                      id="solicitante"
                      type="text"
                      value={form.solicitante}
                      onChange={e => setForm(f => ({ ...f, solicitante: e.target.value }))}
                      className={`w-full rounded-lg bg-gray-700 text-white border-2 transition-all duration-200 focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow p-3 ${errors.solicitante ? 'border-red-500' : 'border-gray-600'}`}
                      placeholder="Nome do solicitante"
                    />
                    {errors.solicitante && <span className="text-xs text-red-400 flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-1"></span>
                      {errors.solicitante}
                    </span>}
                  </div>
                </div>
              </div>
              
              {/* Informações Organizacionais */}
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-600">
                <h3 className="text-sm font-semibold text-seguranca-yellow mb-4 flex items-center">
                  <div className="w-2 h-2 bg-seguranca-yellow rounded-full mr-2"></div>
                  Informações Organizacionais
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Empresa */}
                  <div className="space-y-2">
                    <Label htmlFor="empresa" className="text-sm font-medium text-gray-200">Empresa *</Label>
                    <select
                      id="empresa"
                      className={`w-full rounded-lg bg-gray-700 text-white border-2 transition-all duration-200 focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow p-3 ${errors.empresa ? 'border-red-500' : 'border-gray-600'}`}
                      value={form.empresa}
                      onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                      disabled={loadingEmpresas}
                    >
                      <option value="">
                        {loadingEmpresas ? 'Carregando empresas...' : 'Selecione a empresa...'}
                      </option>
                      {empresas.map(empresa => (
                        <option key={empresa.id} value={empresa.id}>
                          {empresa.name} {empresa.sigla ? `(${empresa.sigla})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.empresa && <span className="text-xs text-red-400 flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-1"></span>
                      {errors.empresa}
                    </span>}
                  </div>
                  
                  {/* Unidade */}
                  <div className="space-y-2">
                    <Label htmlFor="unidade" className="text-sm font-medium text-gray-200">Unidade *</Label>
                    <select
                      id="unidade"
                      className={`w-full rounded-lg bg-gray-700 text-white border-2 transition-all duration-200 focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow p-3 ${errors.unidade ? 'border-red-500' : 'border-gray-600'}`}
                      value={form.unidade}
                      onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}
                      disabled={loadingUnidades}
                    >
                      <option value="">
                        {loadingUnidades ? 'Carregando unidades...' : 'Selecione a unidade...'}
                      </option>
                      {unidades.map(unidade => (
                        <option key={unidade.id} value={unidade.id}>
                          {unidade.name}
                        </option>
                      ))}
                    </select>
                    {errors.unidade && <span className="text-xs text-red-400 flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-1"></span>
                      {errors.unidade}
                    </span>}
                  </div>
                  
                  {/* Cliente */}
                  <div className="space-y-2">
                    <Label htmlFor="cliente" className="text-sm font-medium text-gray-200">Cliente *</Label>
                    <select
                      id="cliente"
                      className={`w-full rounded-lg bg-gray-700 text-white border-2 transition-all duration-200 focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow p-3 ${errors.cliente ? 'border-red-500' : 'border-gray-600'}`}
                      value={form.cliente}
                      onChange={e => {
                        setForm(f => ({ ...f, cliente: e.target.value, posto: '' }));
                        // Carregar postos do cliente selecionado
                        if (e.target.value) {
                          loadPostos(e.target.value);
                        } else {
                          loadPostos();
                        }
                      }}
                      disabled={loadingClientes}
                    >
                      <option value="">
                        {loadingClientes ? 'Carregando clientes...' : 'Selecione o cliente...'}
                      </option>
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.name}
                        </option>
                      ))}
                    </select>
                    {errors.cliente && <span className="text-xs text-red-400 flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-1"></span>
                      {errors.cliente}
                    </span>}
                  </div>
                </div>
                
                <div className="mt-4">
                  {/* Posto de Trabalho Atual */}
                  <div className="space-y-2">
                    <Label htmlFor="posto" className="text-sm font-medium text-gray-200">Posto de Trabalho Atual *</Label>
                    <select
                      id="posto"
                      className={`w-full rounded-lg bg-gray-700 text-white border-2 transition-all duration-200 focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow p-3 ${errors.posto ? 'border-red-500' : 'border-gray-600'}`}
                      value={form.posto}
                      onChange={e => setForm(f => ({ ...f, posto: e.target.value }))}
                      disabled={loadingPostos}
                    >
                      <option value="">
                        {loadingPostos ? 'Carregando postos...' : 'Selecione o posto...'}
                      </option>
                      {postos.map(posto => (
                        <option key={posto.id} value={posto.id}>
                          {posto.name} {posto.postCode ? `(${posto.postCode})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.posto && <span className="text-xs text-red-400 flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-1"></span>
                      {errors.posto}
                    </span>}
                  </div>
                </div>
              </div>
              
              {/* Seção: EPIs da Primeira Entrega (apenas para admissão) */}
              {form.tipo === 'admissao' && (
                <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-600">
                  <h3 className="text-sm sm:text-base font-semibold text-seguranca-yellow border-b border-gray-600 pb-2 mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                    EPIs da Primeira Entrega
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 mb-4">Configure os equipamentos padrão que serão incluídos automaticamente na ficha de entrega de EPI</p>
                  
                  {defaultEpis.map((epi, idx) => (
                    <div key={idx} className="space-y-2 p-3 sm:p-4 bg-gray-700/50 rounded-lg border border-gray-600 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs sm:text-sm font-medium text-gray-200">
                          EPI {idx + 1}
                        </Label>
                        {defaultEpis.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEpi(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-medium text-gray-200">Nome do EPI *</Label>
                          <Input
                            value={epi.epiName}
                            onChange={(e) => handleEpiChange(idx, 'epiName', e.target.value)}
                            className="h-9 sm:h-10 text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                            placeholder="Ex: Capacete, Óculos de Proteção, etc."
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                          <div className="space-y-1.5 sm:space-y-2">
                            <Label className="text-xs sm:text-sm font-medium text-gray-200">Quantidade</Label>
                            <Input
                              type="number"
                              min="1"
                              value={epi.quantity}
                              onChange={(e) => handleEpiChange(idx, 'quantity', e.target.value)}
                              className="h-9 sm:h-10 text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                              placeholder="1"
                            />
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            <Label className="text-xs sm:text-sm font-medium text-gray-200">CA (Certificado de Aprovação)</Label>
                            <Input
                              value={epi.caNumber}
                              onChange={(e) => handleEpiChange(idx, 'caNumber', e.target.value)}
                              className="h-9 sm:h-10 text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                              placeholder="Nº do CA"
                            />
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            <Label className="text-xs sm:text-sm font-medium text-gray-200">Validade</Label>
                            <Input
                              value={epi.validity}
                              onChange={(e) => handleEpiChange(idx, 'validity', e.target.value)}
                              className="h-9 sm:h-10 text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                              placeholder="Ex: 12 meses"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-medium text-gray-200">Observações</Label>
                          <Input
                            value={epi.observations}
                            onChange={(e) => handleEpiChange(idx, 'observations', e.target.value)}
                            className="h-9 sm:h-10 text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                            placeholder="Observações adicionais (opcional)"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addEpi}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-xs sm:text-sm transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar EPI
                  </button>
                </div>
              )}
              
              {/* Motivo da Solicitação */}
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-600">
                <h3 className="text-sm font-semibold text-seguranca-yellow mb-4 flex items-center">
                  <div className="w-2 h-2 bg-seguranca-yellow rounded-full mr-2"></div>
                  Motivo da Solicitação
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="motivo" className="text-sm font-medium text-gray-200">Descrição do Motivo *</Label>
                  <Textarea
                    id="motivo"
                    value={form.motivo}
                    onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                    rows={4}
                    className={`w-full rounded-lg bg-gray-700 text-white border-2 transition-all duration-200 focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow p-3 resize-none ${errors.motivo ? 'border-red-500' : 'border-gray-600'}`}
                    placeholder="Descreva detalhadamente o motivo da solicitação..."
                  />
                  {errors.motivo && <span className="text-xs text-red-400 flex items-center mt-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full mr-1"></span>
                    {errors.motivo}
                  </span>}
                </div>
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="pt-6 border-t border-gray-600 bg-gray-800/30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
              {/* Botões de Ação Secundários */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePreview}
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600/10 text-blue-400 border-blue-600/30 hover:bg-blue-600/20 hover:text-blue-300 transition-all duration-200"
                >
                  <Eye className="h-4 w-4" />
                  Visualizar
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGeneratePDF}
                  disabled={loading}
                  className="flex items-center gap-2 bg-green-600/10 text-green-400 border-green-600/30 hover:bg-green-600/20 hover:text-green-300 transition-all duration-200"
                >
                  <FileText className="h-4 w-4" />
                  Gerar PDF
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="flex items-center gap-2 bg-purple-600/10 text-purple-400 border-purple-600/30 hover:bg-purple-600/20 hover:text-purple-300 transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                  Enviar por Email
                </Button>
              </div>
              
              {/* Botões Principais */}
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={loading}
                  className="w-full sm:w-auto bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600 hover:text-white transition-all duration-200"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Solicitação
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Novo Funcionário */}
      <FuncionarioNovoModal
        open={showFuncionarioModal}
        onClose={() => setShowFuncionarioModal(false)}
        onCreated={handleFuncionarioCreated}
      />

      {/* Modal de Visualização */}
      {showPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-600">
            <div className="flex items-center justify-between p-6 border-b border-gray-600 bg-gradient-to-r from-gray-800 to-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">Visualização da Solicitação</h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPreview(false)} 
                className="h-8 w-8 p-0 hover:bg-gray-600 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                {/* Cabeçalho */}
                <div className="text-center border-b border-gray-600 pb-4">
                  <h3 className="text-xl font-bold text-seguranca-yellow">SOLICITAÇÃO DE {form.tipo === 'admissao' ? 'ADMISSÃO' : 'DEMISSÃO'}</h3>
                  <p className="text-gray-400 mt-2">Sistema de Recursos Humanos</p>
                </div>

                {/* Informações da Solicitação */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Tipo de Solicitação</label>
                      <p className="text-white font-semibold">{form.tipo === 'admissao' ? 'Admissão' : 'Demissão'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Funcionário</label>
                      <p className="text-white">{funcionarios.find(f => f.id === form.funcionario)?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Data</label>
                      <p className="text-white">{form.data}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Solicitante</label>
                      <p className="text-white">{form.solicitante}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Empresa</label>
                      <p className="text-white">{empresas.find(e => e.id === form.empresa)?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Unidade</label>
                      <p className="text-white">{unidades.find(u => u.id === form.unidade)?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Posto de Trabalho</label>
                      <p className="text-white">{postos.find(p => p.id === form.posto)?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Motivo */}
                <div>
                  <label className="text-sm font-medium text-gray-400">Motivo da Solicitação</label>
                  <div className="mt-2 p-4 bg-gray-700 rounded-lg">
                    <p className="text-white whitespace-pre-wrap">{form.motivo}</p>
                  </div>
                </div>

                {/* Rodapé */}
                <div className="border-t border-gray-600 pt-4 text-center">
                  <p className="text-gray-400 text-sm">Documento gerado automaticamente pelo sistema</p>
                  <p className="text-gray-500 text-xs mt-1">{new Date().toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Envio por Email */}
      {showEmailModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-600">
            <div className="flex items-center justify-between p-6 border-b border-gray-600 bg-gradient-to-r from-gray-800 to-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">Enviar por Email</h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowEmailModal(false)} 
                className="h-8 w-8 p-0 hover:bg-gray-600 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="email-to" className="text-sm font-medium text-gray-200">Destinatário *</Label>
                <Input
                  id="email-to"
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-3"
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="email-subject" className="text-sm font-medium text-gray-200">Assunto</Label>
                <Input
                  id="email-subject"
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-3"
                />
              </div>
              
              <div>
                <Label htmlFor="email-message" className="text-sm font-medium text-gray-200">Mensagem</Label>
                <Textarea
                  id="email-message"
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  rows={6}
                  className="w-full rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-3 resize-none"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600"
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSendEmailSubmit}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissaoDemissaoFormModal; 