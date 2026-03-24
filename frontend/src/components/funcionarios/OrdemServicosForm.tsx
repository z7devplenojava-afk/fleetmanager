import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { FileText, Download, Eye, User, Building, Calendar, Clock, MapPin, AlertTriangle, CheckCircle2, Loader2, Briefcase } from 'lucide-react';
import { employeeService, Employee } from '@/services/employeeService';
import { companyService } from '@/services/companyService';
import { clientService, Client } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

const OrdemServicosForm = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    employeeId: '',
    companyId: '',
    clientId: '',
    position: '',
    serviceType: '',
    location: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    description: '',
    priority: '',
    status: '',
    observations: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const funcionario = employees.find(f => f.id === form.employeeId);
  const empresa = companies.find(e => e.id === form.companyId);
  const cliente = clients.find(c => c.id === form.clientId);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [employeesData, companiesData, clientsData] = await Promise.all([
        employeeService.getAllEmployees(),
        companyService.getAllCompanies(),
        clientService.getAllClients()
      ]);
      setEmployees(employeesData);
      setCompanies(companiesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar dados necessários.',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Pre-fill position when employee changes
  useEffect(() => {
    if (funcionario) {
      setForm(prev => ({
        ...prev,
        position: (funcionario as any).position?.name || prev.position
      }));
    }
  }, [funcionario]);

  // Pre-fill location when client changes
  useEffect(() => {
    if (cliente && cliente.address) {
      setForm(prev => ({
        ...prev,
        location: cliente.address || prev.location
      }));
    }
  }, [cliente]);

  const serviceTypes = [
    'Vigilância Patrimonial',
    'Segurança Pessoal',
    'Escolta de Valores',
    'Controle de Acesso',
    'Monitoramento',
    'Ronda',
    'Recepção',
    'Portaria',
    'Eventos',
    'Emergência',
  ];

  const priorityLevels = [
    'Baixa',
    'Média',
    'Alta',
    'Urgente',
  ];

  const statusOptions = [
    'Pendente',
    'Em Andamento',
    'Concluído',
    'Cancelado',
    'Suspenso',
  ];

  const handleGenerateOrder = async () => {
    if (!funcionario || !empresa || !cliente || !form.serviceType || !form.startDate) {
      toast({
        title: 'Atenção',
        description: 'Preencha os campos obrigatórios (Funcionário, Empresa, Cliente, Tipo, Data Início)!',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar dados completos do funcionário
      const fullEmployee = await employeeService.getEmployeeById(funcionario.id);
      if (!fullEmployee) throw new Error('Funcionário não encontrado');

      const payload = {
        templateName: 'ordem-servico.html',
        // Dados do Funcionário
        funcionario: fullEmployee.name,
        cpf: fullEmployee.cpf || fullEmployee.document || '',
        cargo: form.position,
        
        // Dados da Empresa
        empresa: empresa.name,
        cnpj: empresa.cnpj,
        enderecoEmpresa: empresa.address || '',
        
        // Dados do Cliente
        cliente: cliente.name,
        enderecoCliente: cliente.address || '',
        
        // Dados da Ordem
        tipoServico: form.serviceType,
        localServico: form.location,
        dataInicio: new Date(form.startDate).toLocaleDateString('pt-BR'),
        dataFim: form.endDate ? new Date(form.endDate).toLocaleDateString('pt-BR') : '',
        horarioInicio: form.startTime,
        horarioFim: form.endTime,
        prioridade: form.priority,
        status: form.status,
        descricao: form.description,
        observacoes: form.observations,
        dataAtual: new Date().toLocaleDateString('pt-BR')
      };

      const response = await api.post('/api/documents/generate-pdf', payload, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ordem-servico-${fullEmployee.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Sucesso',
        description: 'Ordem de Serviço gerada com sucesso!',
      });
    } catch (err: any) {
      console.error('Erro ao gerar OS:', err);
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao gerar Ordem de Serviço.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewOrder = async () => {
    if (!funcionario || !empresa || !cliente) {
      toast({
        title: 'Atenção',
        description: 'Selecione funcionário, empresa e cliente!',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const fullEmployee = await employeeService.getEmployeeById(funcionario.id);
      
      const payload = {
        templateName: 'ordem-servico.html',
        funcionario: fullEmployee.name,
        cpf: fullEmployee.cpf || fullEmployee.document || '',
        cargo: form.position,
        empresa: empresa.name,
        cnpj: empresa.cnpj,
        enderecoEmpresa: empresa.address || '',
        cliente: cliente.name,
        enderecoCliente: cliente.address || '',
        tipoServico: form.serviceType,
        localServico: form.location,
        dataInicio: form.startDate ? new Date(form.startDate).toLocaleDateString('pt-BR') : '',
        dataFim: form.endDate ? new Date(form.endDate).toLocaleDateString('pt-BR') : '',
        horarioInicio: form.startTime,
        horarioFim: form.endTime,
        prioridade: form.priority,
        status: form.status,
        descricao: form.description,
        observacoes: form.observations,
        dataAtual: new Date().toLocaleDateString('pt-BR')
      };

      const response = await api.post('/api/documents/generate-pdf', payload, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err: any) {
      console.error('Erro ao gerar preview:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar preview.',
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
                <FileText className="h-6 w-6 text-primary" />
                Ordem de Serviço
              </CardTitle>
              <CardDescription>
                Emissão de ordem de serviço para execução de atividades.
              </CardDescription>
            </div>
            {(funcionario && empresa && cliente && form.serviceType) && (
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Empresa</Label>
                <Select 
                  value={form.companyId} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, companyId: value }))}
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

              <div className="space-y-2">
                <Label className="text-base font-semibold">Funcionário</Label>
                <Select 
                  value={form.employeeId} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, employeeId: value }))}
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
                <Label className="text-base font-semibold">Cliente</Label>
                <Select 
                  value={form.clientId} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, clientId: value }))}
                  disabled={loadingData}
                >
                  <SelectTrigger className="h-11 bg-background">
                    <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingData ? (
                      <div className="p-2 text-center text-sm text-gray-500">Carregando clientes...</div>
                    ) : clients.length > 0 ? (
                      clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-base">{c.name}</span>
                            {c.cnpj && (
                              <span className="text-xs text-muted-foreground">CNPJ: {c.cnpj}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">Nenhum cliente encontrado</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações do Funcionário (Read-only) */}
            {funcionario && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4 text-primary" />
                    Dados do Executante
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
                        {form.position || (funcionario as any).position?.name || '-'}
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

            {/* Informações do Cliente (Read-only) */}
            {cliente && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 delay-100">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 font-medium">
                    <Building className="h-4 w-4 text-primary" />
                    Dados do Cliente
                  </div>
                </div>
                <div className="space-y-4">
                   <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Razão Social / Nome</Label>
                    <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                      {cliente.name}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Endereço</Label>
                    <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                      {cliente.address || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {(funcionario || empresa) && <Separator />}

          {/* Detalhes do Serviço */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>Detalhes do Serviço</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tipo de Serviço</Label>
                <Select value={form.serviceType} onValueChange={(value) => setForm(prev => ({ ...prev, serviceType: value }))}>
                  <SelectTrigger className="bg-background h-11">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Local de Serviço</Label>
                <Input 
                  value={form.location} 
                  onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Endereço completo do local de serviço"
                  className="bg-background h-11"
                />
              </div>
            </div>

            {/* Datas e Horários */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input 
                  type="date" 
                  value={form.startDate} 
                  onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data de Término</Label>
                <Input 
                  type="date" 
                  value={form.endDate} 
                  onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Horário de Início</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="time" 
                    value={form.startTime} 
                    onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="bg-background pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Horário de Término</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="time" 
                    value={form.endTime} 
                    onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="bg-background pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Prioridade e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(value) => setForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="bg-background h-11">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityLevels.map(priority => (
                      <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-background h-11">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição do Serviço</Label>
              <Textarea 
                value={form.description} 
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva detalhadamente o serviço a ser prestado..."
                rows={4}
                className="bg-background resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea 
                value={form.observations} 
                onChange={(e) => setForm(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Observações adicionais sobre a ordem de serviço..."
                rows={3}
                className="bg-background resize-none"
              />
            </div>
          </div>

          <Separator />

          {/* Ações */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 justify-end pt-2">
            <Button 
              onClick={handlePreviewOrder} 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto h-11"
              disabled={loading || !funcionario || !empresa || !cliente}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando Preview...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Visualizar Ordem
                </>
              )}
            </Button>
            <Button 
              onClick={handleGenerateOrder} 
              className="flex items-center gap-2 w-full sm:w-auto h-11 shadow-md hover:shadow-lg transition-all"
              disabled={loading || !funcionario || !empresa || !cliente}
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

export default OrdemServicosForm;