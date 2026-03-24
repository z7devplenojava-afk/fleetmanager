import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { FileText, Download, Eye, User, Building, Calendar, MapPin, Phone, Mail, Shield, Settings, Monitor, Smartphone, Radio, Car, Motorcycle, Loader2, CheckCircle2 } from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import { companyService } from '@/services/companyService';
import { Employee } from '@/types/employee';
import { Company } from '@/types/company';

const equipamentosOptions = [
  'Notebook',
  'Desktop',
  'Tablet',
  'Smartphone',
  'Rádio Comunicador',
  'Rádio Motorola',
  'Viatura',
  'Motocicleta',
  'Uniforme',
  'Equipamento de Segurança',
  'Ferramentas',
  'Equipamento de Comunicação',
  'GPS',
  'Câmera',
  'Detector de Metais',
  'Outros',
  'Vale-Transporte',
];

const TermoResponsabilidadeEquipamentoForm = () => {
  const [form, setForm] = useState({
    funcionarioId: '',
    empresaId: '',
    equipamento: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    patrimonio: '',
    dataEntrega: '',
    dataDevolucao: '',
    responsavelEntrega: '',
    condicoes: '',
    observacoes: '',
    estadoEquipamento: '',
  });

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [employeesData, companiesData] = await Promise.all([
          employeeService.getAllEmployees(),
          companyService.getAllCompanies(),
        ]);
        setEmployees(employeesData as unknown as Employee[]);
        setCompanies(companiesData);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const funcionario = employees.find(f => f.id === form.funcionarioId);
  const empresa = companies.find(e => e.id === form.empresaId);
  const responsavel = employees.find(f => f.id === form.responsavelEntregaId);

  const estadosEquipamento = [
    'Novo',
    'Excelente',
    'Bom',
    'Regular',
    'Precisa Manutenção',
    'Defeituoso',
  ];

  const handlePreview = () => {
    // TODO: Implementar preview do termo
    console.log('Preview do termo:', form);
  };

  const handleGerarPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!funcionario || !empresa || !form.equipamento || !form.numeroSerie || !form.dataEntrega) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        templateName: 'termo-responsabilidade-equipamento.html',
        // Dados do Funcionário
        funcionario: funcionario.name,
        cpf: funcionario.cpf || funcionario.document || '',
        cargo: funcionario.position?.name || '',
        setor: funcionario.unit?.name || '', // Buscar o Posto de Trabalho (unit)
        telefone: funcionario.phone,
        email: funcionario.email,
        endereco: typeof funcionario.address === 'string' 
          ? funcionario.address 
          : funcionario.address 
            ? `${funcionario.address.street}, ${funcionario.address.number || ''}, ${funcionario.address.neighborhood || ''}, ${funcionario.address.city || ''}/${funcionario.address.state || ''}` 
            : '',
        // Dados da Empresa
        empresa: empresa.name,
        cnpj: empresa.cnpj,
        enderecoEmpresa: empresa.address && empresa.address.street
          ? [
              empresa.address.street,
              empresa.address.number,
              empresa.address.neighborhood,
              `${empresa.address.city || ''}/${empresa.address.state || ''}`
            ].filter(Boolean).join(', ')
          : '',
        // Dados do Equipamento
        equipamento: form.equipamento,
        marca: form.marca,
        modelo: form.modelo,
        numeroSerie: form.numeroSerie,
        patrimonio: form.patrimonio,
        estadoEquipamento: form.estadoEquipamento,
        // Dados da Entrega
        dataEntrega: form.dataEntrega,
        dataDevolucao: form.dataDevolucao,
        responsavelEntrega: responsavel?.name || '',
        condicoes: form.condicoes,
        observacoes: form.observacoes,
        dataAtual: new Date().toLocaleDateString('pt-BR')
      };

      const response = await fetch('/api/documents/generate-pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro ao gerar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `termo-responsabilidade-${funcionario.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF. Tente novamente.');
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
                <Shield className="h-6 w-6 text-primary" />
                Termo de Responsabilidade de Equipamento
              </CardTitle>
              <CardDescription>
                Emissão de termo de responsabilidade para entrega ou devolução de equipamentos.
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
                            {(f.cpf || f.document) && (
                              <span className="text-xs text-muted-foreground">CPF: {f.cpf || f.document}</span>
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
            {/* Informações do Funcionário */}
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
                        {funcionario.position?.name || '-'}
                      </div>
                    </div>
                     <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Setor (Posto de Trabalho)</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                         {funcionario.unit?.name || '-'}
                      </div>
                    </div>
                  </div>

                   <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Endereço</Label>
                    <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                       {typeof funcionario.address === 'string' 
                          ? funcionario.address 
                          : funcionario.address 
                            ? `${funcionario.address.street}, ${funcionario.address.number || ''}` 
                            : '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
  
            {/* Informações da Empresa */}
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

                   <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Endereço</Label>
                    <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                      {empresa.address && empresa.address.street
                        ? [empresa.address.street, empresa.address.number, empresa.address.neighborhood, empresa.address.city]
                            .filter(Boolean)
                            .join(', ')
                        : '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {(funcionario || empresa) && <Separator />}

          {/* Informações do Equipamento */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>Informações do Equipamento</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Tipo de Equipamento</Label>
                <Select value={form.equipamento} onValueChange={(value) => setForm(prev => ({ ...prev, equipamento: value }))}>
                  <SelectTrigger className="bg-background h-11">
                    <SelectValue placeholder="Selecione o equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipamentosOptions.map(equip => (
                      <SelectItem key={equip} value={equip}>{equip}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input 
                  value={form.marca} 
                  onChange={(e) => setForm(prev => ({ ...prev, marca: e.target.value }))}
                  placeholder="Ex: Dell, Motorola, Toyota"
                  className="bg-background h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input 
                  value={form.modelo} 
                  onChange={(e) => setForm(prev => ({ ...prev, modelo: e.target.value }))}
                  placeholder="Ex: Latitude 5520"
                  className="bg-background h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Número de Série</Label>
                <Input 
                  value={form.numeroSerie} 
                  onChange={(e) => setForm(prev => ({ ...prev, numeroSerie: e.target.value }))}
                  placeholder="Ex: SN123456789"
                  className="bg-background h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Patrimônio</Label>
                <Input 
                  value={form.patrimonio} 
                  onChange={(e) => setForm(prev => ({ ...prev, patrimonio: e.target.value }))}
                  placeholder="Ex: PAT001234"
                  className="bg-background h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Estado do Equipamento</Label>
                <Select value={form.estadoEquipamento} onValueChange={(value) => setForm(prev => ({ ...prev, estadoEquipamento: value }))}>
                  <SelectTrigger className="bg-background h-11">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosEquipamento.map(estado => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Datas e Responsável */}
          <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>Datas e Responsável</span>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <Label className="text-base font-semibold">Data de Entrega</Label>
              <Input 
                type="date" 
                value={form.dataEntrega} 
                onChange={(e) => setForm(prev => ({ ...prev, dataEntrega: e.target.value }))}
                className="bg-background h-11"
              />
            </div>
            
            <div className="space-y-2">
                <Label className="text-base font-semibold">Data de Devolução</Label>
              <Input 
                type="date" 
                value={form.dataDevolucao} 
                onChange={(e) => setForm(prev => ({ ...prev, dataDevolucao: e.target.value }))}
                className="bg-background h-11"
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
                            {(f.cpf || f.document) && (
                              <span className="text-xs text-muted-foreground">CPF: {f.cpf || f.document}</span>
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
                    Dados do Responsável pela Entrega
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

          {/* Condições e Observações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Condições de Uso</Label>
              <Textarea 
                value={form.condicoes} 
                onChange={(e) => setForm(prev => ({ ...prev, condicoes: e.target.value }))}
                placeholder="Descreva as condições de uso e responsabilidades..."
                rows={4}
                className="bg-background resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea 
                value={form.observacoes} 
                onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais sobre o equipamento..."
                rows={4}
                className="bg-background resize-none"
              />
            </div>
          </div>

          <Separator />

          {/* Ações */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 justify-end pt-2">
            <Button 
              onClick={handlePreview} 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto h-11"
            >
              <Eye className="h-4 w-4" />
              Visualizar Termo
            </Button>
            <Button 
              onClick={handleGerarPDF} 
              className="flex items-center gap-2 w-full sm:w-auto h-11 shadow-md hover:shadow-lg transition-all" 
              disabled={loading}
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

export default TermoResponsabilidadeEquipamentoForm;