import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { FileText, Download, Eye, User, Building, Calendar, Shield, Plus, X, HardHat, Loader2, CheckCircle2, Package } from 'lucide-react';
import { employeeService, Employee } from '@/services/employeeService';
import { companyService } from '@/services/companyService';
import { epiDeliveryFormService } from '@/services/epiDeliveryFormService';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import { caepiService, CAEPIResponse } from '@/services/caepiService';

const epiOptions = [
  'Capacete de Segurança',
  'Óculos de Proteção',
  'Protetor Auditivo',
  'Máscara Respiratória',
  'Luvas de Segurança',
  'Calçado de Segurança',
  'Cinto de Segurança',
  'Avental de Proteção',
  'Protetor Facial',
  'Uniforme de Trabalho',
  'Colete Refletivo',
  'Luminária de Cabeça',
  'Detector de Gás',
  'Protetor Solar',
  'Outros',
];

const uniformePecasOptions = [
  { value: 'CALCA', label: 'Calça' },
  { value: 'CAMISA', label: 'Camisa' },
  { value: 'CAMISA_SOCIAL', label: 'Camisa Social' },
  { value: 'JAQUETA', label: 'Jaqueta' },
  { value: 'SAPATO', label: 'Sapato' },
  { value: 'SAPATA_SOCIAL', label: 'Sapata Social' },
  { value: 'PERNEIRA', label: 'Perneira' },
  { value: 'BLASER', label: 'Blaser' },
  { value: 'LUVA_LATEX', label: 'Luva Latex' },
];

interface FichaEntregaEPIFormProps {
  employeeId?: string;
}

const FichaEntregaEPIForm: React.FC<FichaEntregaEPIFormProps> = ({ employeeId }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    funcionarioId: employeeId || '',
    empresaId: '',
    dataEntrega: '',
    responsavelEntrega: '',
    observacoes: '',
  });
  
  // Atualizar funcionarioId quando employeeId mudar
  useEffect(() => {
    if (employeeId) {
      setForm(prev => ({ ...prev, funcionarioId: employeeId }));
    }
  }, [employeeId]);

  const [stockEpis, setStockEpis] = useState<any[]>([]);

  const [epis, setEpis] = useState([
    { 
      nome: '', 
      quantidade: '1', 
      ca: '', // Número do Certificado de Aprovação
      caName: '', // Nome/Descrição do CA
      validade: '',
      observacoes: '',
      uniformeTipo: '', // 'COMPLETO' ou 'INDIVIDUAL'
      uniformePeca: '', // Peça específica se for individual
      stockItemId: '',
      availableStock: undefined as number | undefined
    }
  ]);

  // Estados para autocomplete do CA
  const [caSuggestions, setCaSuggestions] = useState<{ [key: number]: CAEPIResponse[] }>({});
  const [caLoading, setCaLoading] = useState<{ [key: number]: boolean }>({});
  const [caSearchTimeouts, setCaSearchTimeouts] = useState<{ [key: number]: NodeJS.Timeout }>({});
  const [showCaSuggestions, setShowCaSuggestions] = useState<{ [key: number]: boolean }>({});

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const funcionario = employees.find(f => f.id === form.funcionarioId);
  const empresa = companies.find(e => e.id === form.empresaId);
  const responsavel = employees.find(f => f.id === form.responsavelEntregaId);

  // Carregar dados do backend
  useEffect(() => {
    loadData();
  }, []);

  // Carregar EPIs padrão quando empresa for selecionada
  useEffect(() => {
    if (form.empresaId && companies.length > 0) {
      const selectedCompany = companies.find(c => c.id === form.empresaId);
      if (selectedCompany) {
        const companyDefaultEpis = (selectedCompany as any).defaultEpis;
        if (companyDefaultEpis && companyDefaultEpis.length > 0) {
          // Verificar se já não foram carregados (evitar loop)
          const firstEpiName = epis.length > 0 ? epis[0].nome : '';
          const shouldLoad = firstEpiName === '' || firstEpiName !== companyDefaultEpis[0]?.epiName;
          
          if (shouldLoad) {
            const loadedEpis = companyDefaultEpis.map((epi: any) => ({
              nome: epi.epiName || '',
              quantidade: String(epi.quantity || 1),
              ca: epi.caNumber || '',
              validade: epi.validity || '',
              observacoes: epi.observations || '',
              uniformeTipo: '',
              uniformePeca: ''
            }));
            setEpis(loadedEpis);
            toast({
              title: 'EPIs carregados',
              description: `${loadedEpis.length} EPI(s) padrão da empresa foram carregados automaticamente.`,
              variant: 'default'
            });
          }
        } else {
          // Se a empresa não tem EPIs padrão e não há EPIs preenchidos, manter apenas um campo vazio
          if (epis.length === 0 || (epis.length === 1 && epis[0].nome === '')) {
            setEpis([{ nome: '', quantidade: '1', ca: '', validade: '', observacoes: '', uniformeTipo: '', uniformePeca: '' }]);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.empresaId]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [employeesData, companiesData, stockEpisRes] = await Promise.all([
        employeeService.getAllEmployees(),
        companyService.getAllCompanies(),
        api.get('/api/sst/epis/stock-inventory').catch(() => ({ data: [] }))
      ]);
      setEmployees(employeesData);
      setCompanies(companiesData);
      if (stockEpisRes && Array.isArray(stockEpisRes.data)) {
        setStockEpis(stockEpisRes.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar funcionários e empresas.',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleEpiChange = (idx: number, field: string, value: any) => {
    setEpis(prevEpis => {
      const updatedEpis = [...prevEpis];
      updatedEpis[idx] = { ...updatedEpis[idx], [field]: value };
      return updatedEpis;
    });
  };

  // Função para buscar CA quando o usuário digita
  const handleCABlur = async (idx: number, caNumber: string) => {
    if (!caNumber || caNumber.trim().length < 3) {
      setShowCaSuggestions(prev => ({ ...prev, [idx]: false }));
      return;
    }

    try {
      setCaLoading(prev => ({ ...prev, [idx]: true }));
      const caInfo = await caepiService.buscarCA(caNumber);
      
      if (caInfo) {
        handleEpiChange(idx, 'ca', caInfo.numero);
        handleEpiChange(idx, 'caName', caInfo.nome || caInfo.descricao || '');
        toast({
          title: "CA encontrado",
          description: `CA ${caInfo.numero} - ${caInfo.nome}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CA:', error);
    } finally {
      setCaLoading(prev => ({ ...prev, [idx]: false }));
      setShowCaSuggestions(prev => ({ ...prev, [idx]: false }));
    }
  };

  // Função para buscar sugestões de CA enquanto digita
  const handleCASearch = async (idx: number, searchTerm: string) => {
    // Limpar timeout anterior
    if (caSearchTimeouts[idx]) {
      clearTimeout(caSearchTimeouts[idx]);
    }

    if (!searchTerm || searchTerm.trim().length < 3) {
      setCaSuggestions(prev => ({ ...prev, [idx]: [] }));
      setShowCaSuggestions(prev => ({ ...prev, [idx]: false }));
      return;
    }

    // Debounce de 500ms
    const timeout = setTimeout(async () => {
      try {
        setCaLoading(prev => ({ ...prev, [idx]: true }));
        const resultados = await caepiService.buscarCAs(searchTerm);
        setCaSuggestions(prev => ({ ...prev, [idx]: resultados }));
        setShowCaSuggestions(prev => ({ ...prev, [idx]: resultados.length > 0 }));
      } catch (error) {
        console.error('Erro ao buscar sugestões de CA:', error);
      } finally {
        setCaLoading(prev => ({ ...prev, [idx]: false }));
      }
    }, 500);

    setCaSearchTimeouts(prev => ({ ...prev, [idx]: timeout }));
  };

  // Função para selecionar uma sugestão de CA
  const handleCASelect = (idx: number, ca: CAEPIResponse) => {
    handleEpiChange(idx, 'ca', ca.numero);
    handleEpiChange(idx, 'caName', ca.nome || ca.descricao || '');
    setShowCaSuggestions(prev => ({ ...prev, [idx]: false }));
    setCaSuggestions(prev => ({ ...prev, [idx]: [] }));
  };

  const addEpi = () => {
    setEpis([...epis, { 
      nome: '', 
      quantidade: '1', 
      ca: '', 
      caName: '',
      validade: '', 
      observacoes: '',
      uniformeTipo: '',
      uniformePeca: ''
    }]);
  };

  const removeEpi = (idx: number) => {
    if (epis.length > 1) {
      setEpis(epis.filter((_, i) => i !== idx));
    }
  };

  const handlePreview = async () => {
    if (!form.funcionarioId || !form.empresaId || !form.dataEntrega) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios para visualizar a ficha!',
        variant: 'destructive'
      });
      return;
    }

    if (epis.some(epi => !epi.nome)) {
      toast({
        title: 'Atenção',
        description: 'Preencha o nome de todos os EPIs para visualizar a ficha!',
        variant: 'destructive'
      });
      return;
    }
    
    // Validar campos específicos de Uniforme de Trabalho
    if (epis.some(epi => epi.nome === 'Uniforme de Trabalho' && !epi.uniformeTipo)) {
      toast({
        title: 'Atenção',
        description: 'Para Uniforme de Trabalho, é necessário selecionar se é Completo ou Individual!',
        variant: 'destructive'
      });
      return;
    }
    
    if (epis.some(epi => epi.nome === 'Uniforme de Trabalho' && epi.uniformeTipo === 'INDIVIDUAL' && !epi.uniformePeca)) {
      toast({
        title: 'Atenção',
        description: 'Para Uniforme de Trabalho Individual, é necessário selecionar a peça específica!',
        variant: 'destructive'
      });
      return;
    }

    if (!funcionario || !empresa) {
      toast({
        title: 'Atenção',
        description: 'Selecione funcionário e empresa para visualizar a ficha!',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      // Buscar dados completos do funcionário
      const fullEmployee = await employeeService.getEmployeeById(funcionario.id);
      if (!fullEmployee) {
        toast({
          title: 'Erro',
          description: 'Funcionário não encontrado!',
          variant: 'destructive'
        });
        return;
      }

      const payload = {
        templateName: 'ficha-entrega-epi.html',
        funcionario: fullEmployee.name,
        cpf: fullEmployee.cpf || fullEmployee.document || '',
        cargo: (fullEmployee as any).position?.name || '',
        setor: (fullEmployee as any).unit?.name || '',
        empresa: empresa.name,
        cnpj: empresa.cnpj || '',
        dataEntrega: form.dataEntrega,
        responsavelEntrega: responsavel?.name || '',
        epis: epis.map(epi => {
          // Formatar nome do EPI para incluir informações de uniforme se aplicável
          let nomeFormatado = epi.nome;
          if (epi.nome === 'Uniforme de Trabalho') {
            if (epi.uniformeTipo === 'INDIVIDUAL' && epi.uniformePeca) {
              const pecaLabel = uniformePecasOptions.find(p => p.value === epi.uniformePeca)?.label || epi.uniformePeca;
              nomeFormatado = `Uniforme de Trabalho - Individual (${pecaLabel})`;
            } else if (epi.uniformeTipo === 'COMPLETO') {
              nomeFormatado = 'Uniforme de Trabalho - Completo';
            }
          }
          
          return {
            nome: nomeFormatado,
            quantidade: epi.quantidade,
            ca: epi.ca || '',
            validade: epi.validade || '',
            observacoes: epi.observacoes || '',
            uniformeTipo: epi.uniformeTipo || '',
            uniformePeca: epi.uniformePeca || ''
          };
        }),
        observacoes: form.observacoes || '',
        dataAtual: new Date().toLocaleDateString('pt-BR')
      };

      // Gerar PDF para visualização
      const response = await api.post('/api/documents/generate-pdf', payload, {
        responseType: 'blob'
      });

      // Abrir PDF em nova aba para visualização
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Limpar URL após um tempo
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
    } catch (err: any) {
      console.error('Erro ao gerar preview:', err);
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao gerar preview da ficha. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGerarPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.funcionarioId || !form.empresaId || !form.dataEntrega) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios!',
        variant: 'destructive'
      });
      return;
    }

    if (epis.some(epi => !epi.nome)) {
      toast({
        title: 'Atenção',
        description: 'Preencha o nome de todos os EPIs!',
        variant: 'destructive'
      });
      return;
    }

    if (!funcionario || !empresa) {
      toast({
        title: 'Atenção',
        description: 'Selecione funcionário e empresa!',
        variant: 'destructive'
      });
      return;
    }

    for (const epi of epis) {
      const requestedQty = parseInt(epi.quantidade) || 1;
      if (epi.availableStock !== undefined && requestedQty > epi.availableStock) {
        toast({
          title: 'Estoque insuficiente',
          description: `O item "${epi.nome}" possui apenas ${epi.availableStock} un disponíveis em estoque. Não é possível entregar ${requestedQty} un.`,
          variant: 'destructive'
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Buscar dados completos do funcionário
      const fullEmployee = await employeeService.getEmployeeById(funcionario.id);
      if (!fullEmployee) {
        throw new Error('Funcionário não encontrado');
      }

      // Salvar ficha no banco de dados e dar baixa no estoque primeiro
      const formData = {
        employeeId: form.funcionarioId,
        companyId: form.empresaId,
        deliveryDate: form.dataEntrega,
        responsibleEmployeeId: form.responsavelEntregaId || undefined,
        observations: form.observacoes || undefined,
        items: epis.map(epi => ({
          stockItemId: epi.stockItemId || undefined,
          epiName: epi.nome,
          quantity: parseInt(epi.quantidade) || 1,
          ca: epi.ca || undefined,
          caName: epi.caName || undefined,
          validityDate: epi.validade || undefined,
          uniformType: epi.uniformeTipo || undefined,
          uniformPiece: epi.uniformePeca || undefined,
          observations: epi.observacoes || undefined
        }))
      };

      await epiDeliveryFormService.create(formData);
      console.log('✅ Ficha de entrega salva no banco e estoque baixado com sucesso');

      const payload = {
        templateName: 'ficha-entrega-epi.html',
        funcionario: fullEmployee.name,
        cpf: fullEmployee.cpf || fullEmployee.document || '',
        cargo: (fullEmployee as any).position?.name || '',
        setor: (fullEmployee as any).unit?.name || '',
        empresa: empresa.name,
        cnpj: empresa.cnpj || '',
        dataEntrega: form.dataEntrega,
        responsavelEntrega: responsavel?.name || '',
        epis: epis.map(epi => {
          // Formatar nome do EPI para incluir informações de uniforme se aplicável
          let nomeFormatado = epi.nome;
          if (epi.nome === 'Uniforme de Trabalho') {
            if (epi.uniformeTipo === 'INDIVIDUAL' && epi.uniformePeca) {
              const pecaLabel = uniformePecasOptions.find(p => p.value === epi.uniformePeca)?.label || epi.uniformePeca;
              nomeFormatado = `Uniforme de Trabalho - Individual (${pecaLabel})`;
            } else if (epi.uniformeTipo === 'COMPLETO') {
              nomeFormatado = 'Uniforme de Trabalho - Completo';
            }
          }
          
          return {
            nome: nomeFormatado,
            quantidade: epi.quantidade,
            ca: epi.ca || '',
            validade: epi.validade || '',
            observacoes: epi.observacoes || '',
            uniformeTipo: epi.uniformeTipo || '',
            uniformePeca: epi.uniformePeca || ''
          };
        }),
        observacoes: form.observacoes || '',
        dataAtual: new Date().toLocaleDateString('pt-BR')
      };

      // Gerar PDF
      const response = await api.post('/api/documents/generate-pdf', payload, {
        responseType: 'blob'
      });

      // Fazer download do PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ficha-entrega-epi-${fullEmployee.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      // Recarregar dados para atualizar saldos de estoque
      loadData();

      toast({
        title: 'Sucesso',
        description: 'Ficha de Entrega de EPI gerada e salva com sucesso!',
      });
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao gerar PDF. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <HardHat className="h-6 w-6 text-primary" />
                Ficha de Entrega de EPI
              </CardTitle>
              <CardDescription>
                Registre a entrega de Equipamentos de Proteção Individual.
              </CardDescription>
            </div>
            {(funcionario && empresa) && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 px-3 py-1">
                <CheckCircle2 className="h-3 w-3" />
                Pronto para gerar
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Identificação */}
          <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <User className="h-4 w-4" />
              <span>Identificação</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Funcionário</Label>
                <Select 
                  value={form.funcionarioId} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, funcionarioId: value }))}
                  disabled={loadingData}
                >
                  <SelectTrigger className="h-11 bg-background">
                    <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o funcionário"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingData ? (
                      <div className="p-2 text-center text-sm text-gray-500">Carregando funcionários...</div>
                    ) : employees.length > 0 ? (
                      employees.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-base">{f.name}</span>
                            {f.document && (
                              <span className="text-xs text-muted-foreground">CPF: {f.document}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">Nenhum funcionário encontrado</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-base font-semibold">Empresa</Label>
                <Select 
                  value={form.empresaId} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, empresaId: value }))}
                  disabled={loadingData}
                >
                  <SelectTrigger className="h-11 bg-background">
                    <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione a empresa"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingData ? (
                      <div className="p-2 text-center text-sm text-gray-500">Carregando empresas...</div>
                    ) : companies.length > 0 ? (
                      companies.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-base">
                              {e.sigla || e.tradeName || e.name}
                            </span>
                            {(e.sigla || e.tradeName) && e.name && (
                              <span className="text-xs text-muted-foreground">{e.name}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">Nenhuma empresa encontrada</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detalhes do Funcionário */}
            {funcionario && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4 text-primary" />
                    Dados do Funcionário
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nome</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                        {funcionario.name}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">CPF</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors">
                        {funcionario.cpf || funcionario.document || '-'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cargo</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                        {(funcionario as any).position?.name || '-'}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Setor</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                         {(funcionario as any).unit?.name || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detalhes da Empresa */}
            {empresa && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 delay-100">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 font-medium">
                    <Building className="h-4 w-4 text-primary" />
                    Dados da Empresa
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Razão Social</Label>
                    <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                      {empresa.name}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">CNPJ</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors">
                        {empresa.cnpj}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Sigla</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors">
                        {empresa.sigla || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {(funcionario || empresa) && <Separator />}

          {/* Dados da Entrega */}
          <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>Dados da Entrega</span>
            </div>
            
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label className="text-base font-semibold">Data de Entrega</Label>
              <Input 
                type="date" 
                value={form.dataEntrega} 
                onChange={(e) => setForm(prev => ({ ...prev, dataEntrega: e.target.value }))}
                className="h-11 bg-background"
              />
            </div>
            
            <div className="space-y-2">
                <Label className="text-base font-semibold">Responsável pela Entrega</Label>
                <Select 
                  value={form.responsavelEntregaId} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, responsavelEntregaId: value }))}
                  disabled={loadingData}
                >
                  <SelectTrigger className="h-11 bg-background">
                    <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o responsável"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingData ? (
                      <div className="p-2 text-center text-sm text-gray-500">Carregando funcionários...</div>
                    ) : employees.length > 0 ? (
                      employees.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-base">{f.name}</span>
                            {f.document && (
                              <span className="text-xs text-muted-foreground">CPF: {f.document}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">Nenhum funcionário encontrado</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exibir dados do responsável quando selecionado */}
            {responsavel && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 pt-2">
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <User className="h-4 w-4 text-primary" />
                    Dados do Responsável
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nome Completo</Label>
                    <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                      {responsavel.name}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">CPF</Label>
                    <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors">
                      {responsavel.cpf || responsavel.document || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Lista de EPIs */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>EPIs Entregues</span>
              </div>
              <Button type="button" size="sm" onClick={addEpi} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar EPI
              </Button>
            </div>
            
            <div className="space-y-4">
              {epis.map((epi, idx) => (
                <Card key={idx} className="relative overflow-hidden border-l-4 border-l-primary/50">
                  <div className="absolute top-0 right-0 p-2">
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => removeEpi(idx)}
                      disabled={epis.length === 1}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <CardContent className="p-6 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary" className="font-mono">#{idx + 1}</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Primeira linha: Nome do EPI */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2 lg:col-span-2">
                          <Label>Nome do EPI</Label>
                          <Select 
                            value={epi.nome || undefined} 
                            onValueChange={(value) => {
                              const foundStock = stockEpis.find(s => s.name === value || s.id === value || s.uuid === value);
                              if (foundStock) {
                                handleEpiChange(idx, 'nome', foundStock.name);
                                handleEpiChange(idx, 'stockItemId', foundStock.stockItemId || foundStock.uuid || foundStock.id);
                                handleEpiChange(idx, 'availableStock', foundStock.availableQuantity ?? foundStock.quantity ?? 0);
                                if (foundStock.certification) {
                                  handleEpiChange(idx, 'ca', foundStock.certification);
                                }
                                if (foundStock.expiryDate) {
                                  handleEpiChange(idx, 'validade', foundStock.expiryDate);
                                }
                              } else {
                                handleEpiChange(idx, 'nome', value);
                                handleEpiChange(idx, 'stockItemId', '');
                                handleEpiChange(idx, 'availableStock', undefined);
                              }
                              // Limpar campos de uniforme se mudar o EPI
                              if (value !== 'Uniforme de Trabalho') {
                                handleEpiChange(idx, 'uniformeTipo', '');
                                handleEpiChange(idx, 'uniformePeca', '');
                              }
                            }}
                          >
                            <SelectTrigger className="bg-background w-full">
                              <SelectValue placeholder="Selecione o EPI" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[350px]">
                              {stockEpis.length > 0 && (
                                <>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 rounded">
                                    📦 EPIs em Estoque (Almoxarifado)
                                  </div>
                                  {stockEpis.map(stockEpi => (
                                    <SelectItem key={stockEpi.id || stockEpi.uuid || stockEpi.name} value={stockEpi.name}>
                                      <div className="flex items-center justify-between gap-3 w-full py-0.5">
                                        <span className="font-medium">{stockEpi.name}</span>
                                        <div className="flex items-center gap-1.5">
                                          {stockEpi.certification && (
                                            <span className="text-[11px] text-muted-foreground">CA: {stockEpi.certification}</span>
                                          )}
                                          <Badge 
                                            variant="outline" 
                                            className={(stockEpi.availableQuantity ?? stockEpi.quantity ?? 0) > 0 
                                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-300 text-[10px] px-1.5 py-0" 
                                              : "bg-red-500/15 text-red-700 border-red-300 text-[10px] px-1.5 py-0"}
                                          >
                                            Estoque: {stockEpi.availableQuantity ?? stockEpi.quantity ?? 0} un
                                          </Badge>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 rounded mt-2">
                                    📋 Outros / Genéricos
                                  </div>
                                </>
                              )}
                              {epiOptions
                                .filter(opt => !stockEpis.some(s => s.name?.toLowerCase() === opt.toLowerCase()))
                                .map(option => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Campos padrão quando NÃO é Uniforme de Trabalho */}
                        {epi.nome !== 'Uniforme de Trabalho' && (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Quantidade</Label>
                                {epi.availableStock !== undefined && (
                                  <span className={`text-[11px] font-semibold ${parseInt(epi.quantidade) > epi.availableStock ? 'text-red-600' : 'text-emerald-600'}`}>
                                    Disponível: {epi.availableStock} un
                                  </span>
                                )}
                              </div>
                              <Input 
                                type="number" 
                                min="1"
                                value={epi.quantidade} 
                                onChange={(e) => handleEpiChange(idx, 'quantidade', e.target.value)}
                                className={`bg-background ${epi.availableStock !== undefined && parseInt(epi.quantidade) > epi.availableStock ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                              />
                            </div>
                            
                            <div className="space-y-2 relative">
                              <Label>CA</Label>
                              <div className="relative">
                                <Input 
                                  value={epi.ca} 
                                  onChange={(e) => {
                                    handleEpiChange(idx, 'ca', e.target.value);
                                    handleCASearch(idx, e.target.value);
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      if (epi.ca) {
                                        handleCABlur(idx, epi.ca);
                                      }
                                    }, 200);
                                  }}
                                  placeholder="Digite o número do CA"
                                  className="bg-background pr-8"
                                />
                                {caLoading[idx] && (
                                  <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                                )}
                              </div>
                              {epi.caName && (
                                <p className="text-xs text-gray-500 mt-1">{epi.caName}</p>
                              )}
                              {showCaSuggestions[idx] && caSuggestions[idx] && caSuggestions[idx].length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                  {caSuggestions[idx].map((suggestion, sugIdx) => (
                                    <div
                                      key={sugIdx}
                                      onClick={() => handleCASelect(idx, suggestion)}
                                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                    >
                                      <div className="font-medium text-sm">{suggestion.numero}</div>
                                      <div className="text-xs text-gray-500">{suggestion.nome || suggestion.descricao}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Campos específicos para Uniforme de Trabalho */}
                      {epi.nome === 'Uniforme de Trabalho' && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="font-semibold">Tipo de Uniforme *</Label>
                              <Select 
                                value={epi.uniformeTipo} 
                                onValueChange={(value) => {
                                  handleEpiChange(idx, 'uniformeTipo', value);
                                  if (value !== 'INDIVIDUAL') {
                                    handleEpiChange(idx, 'uniformePeca', '');
                                  }
                                }}
                              >
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="COMPLETO">Completo</SelectItem>
                                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Se for Individual, mostrar seleção de peça */}
                            {epi.uniformeTipo === 'INDIVIDUAL' && (
                              <div className="space-y-2">
                                <Label className="font-semibold">Peça do Uniforme *</Label>
                                <Select 
                                  value={epi.uniformePeca} 
                                  onValueChange={(value) => handleEpiChange(idx, 'uniformePeca', value)}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Selecione a peça" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {uniformePecasOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {/* Campos comuns para uniforme */}
                            {epi.uniformeTipo && (
                              <>
                                <div className="space-y-2">
                                  <Label>Quantidade</Label>
                                  <Input 
                                    type="number" 
                                    min="1"
                                    value={epi.quantidade} 
                                    onChange={(e) => handleEpiChange(idx, 'quantidade', e.target.value)}
                                    className="bg-background"
                                  />
                                </div>
                                
                                <div className="space-y-2 relative">
                                  <Label>CA</Label>
                                  <div className="relative">
                                    <Input 
                                      value={epi.ca} 
                                      onChange={(e) => {
                                        handleEpiChange(idx, 'ca', e.target.value);
                                        handleCASearch(idx, e.target.value);
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => {
                                          if (epi.ca) {
                                            handleCABlur(idx, epi.ca);
                                          }
                                        }, 200);
                                      }}
                                      placeholder="Digite o número do CA"
                                      className="bg-background pr-8"
                                    />
                                    {caLoading[idx] && (
                                      <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                                    )}
                                  </div>
                                  {epi.caName && (
                                    <p className="text-xs text-gray-500 mt-1">{epi.caName}</p>
                                  )}
                                  {showCaSuggestions[idx] && caSuggestions[idx] && caSuggestions[idx].length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                      {caSuggestions[idx].map((suggestion, sugIdx) => (
                                        <div
                                          key={sugIdx}
                                          onClick={() => handleCASelect(idx, suggestion)}
                                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                        >
                                          <div className="font-medium text-sm">{suggestion.numero}</div>
                                          <div className="text-xs text-gray-500">{suggestion.nome || suggestion.descricao}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Validade para uniforme */}
                          {epi.uniformeTipo && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Validade</Label>
                                <Input 
                                  type="date" 
                                  value={epi.validade} 
                                  onChange={(e) => handleEpiChange(idx, 'validade', e.target.value)}
                                  className="bg-background"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Validade para EPIs que não são uniforme */}
                      {epi.nome !== 'Uniforme de Trabalho' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Validade</Label>
                            <Input 
                              type="date" 
                              value={epi.validade} 
                              onChange={(e) => handleEpiChange(idx, 'validade', e.target.value)}
                              className="bg-background"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Saldo de Estoque e Alerta */}
                      {epi.availableStock !== undefined && (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-muted-foreground/20 text-xs">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground font-medium">Estoque no Almoxarifado:</span>
                            <Badge variant="outline" className={epi.availableStock > 0 ? "bg-emerald-500/15 text-emerald-700 border-emerald-300 font-semibold" : "bg-red-500/15 text-red-700 border-red-300 font-semibold"}>
                              {epi.availableStock} un disponíveis
                            </Badge>
                          </div>
                          {parseInt(epi.quantidade) > epi.availableStock && (
                            <span className="text-red-600 font-semibold flex items-center gap-1 animate-pulse">
                              ⚠️ Bloqueado: solicitado ({epi.quantidade}) excede o estoque disponível ({epi.availableStock})!
                            </span>
                          )}
                        </div>
                      )}

                      {/* Observações do Item (sempre visível) */}
                      <div className="space-y-2">
                        <Label>Observações do Item</Label>
                        <Input 
                          value={epi.observacoes} 
                          onChange={(e) => handleEpiChange(idx, 'observacoes', e.target.value)}
                          placeholder="Observações específicas..."
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações Gerais</Label>
            <Textarea 
              value={form.observacoes} 
              onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre a entrega dos EPIs..."
              rows={3}
              className="resize-none bg-background"
            />
          </div>

          <Separator />

          {/* Ações */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 justify-end pt-2">
            <Button 
              onClick={handlePreview} 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto h-11"
              disabled={loading || loadingData || !funcionario || !empresa || !form.dataEntrega || epis.some(epi => !epi.nome)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando Preview...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Visualizar Ficha
                </>
              )}
            </Button>
            <Button 
              onClick={handleGerarPDF} 
              className="flex items-center gap-2 w-full sm:w-auto h-11 shadow-md hover:shadow-lg transition-all" 
              disabled={loading || loadingData || !funcionario || !empresa}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Gerar e Baixar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FichaEntregaEPIForm;