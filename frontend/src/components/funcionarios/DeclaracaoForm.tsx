import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { FileCheck, Download, Eye, User, Calendar, MapPin, CheckCircle2, Loader2, Building } from 'lucide-react';
import { declaracaoCipaTranspesGenerator, declaracaoFinsEscolaresGenerator } from '@/utils/declaracaoGenerator';
import { employeeService } from '@/services/employeeService';
import { companyService } from '@/services/companyService';
import { Employee } from '@/types/employee';
import { Company } from '@/types/company';

const DeclaracaoForm = () => {
  const [form, setForm] = useState({
    funcionarioId: '',
    empresaId: '',
    dataInicio: '',
    dataFim: '',
    ultimoDiaTrabalho: '',
    cidadeEmissao: 'Contagem',
    dataEmissao: new Date().toISOString().split('T')[0],
    observacoes: '',
    tipoDeclaracao: 'CIPA_TRANSPES', // Default type
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const getPronomeTratamento = (genero?: string) => {
    return genero === 'F' ? 'Sra.' : 'Sr.';
  };

  const formatDateToBrazilian = (dateString?: string) => {
    if (!dateString) return '';
    try {
      // Handle yyyy-mm-dd
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatDateToBrazilianExtended = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} de ${month} de ${year}`;
    } catch {
      return dateString;
    }
  };

  const handlePreview = () => {
    if (!funcionario || !empresa) {
      alert('Selecione funcionário e empresa!');
      return;
    }
    
    // TODO: Implementar preview da declaração
    console.log('Preview da declaração:', form);
  };

  const handleGerarPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionario || !empresa) {
      alert('Selecione funcionário e empresa!');
      return;
    }
    
    setLoading(true);
    try {
      const declaracaoData = {
        funcionario: {
          nome: funcionario.name,
          cpf: funcionario.cpf || '',
          rg: funcionario.rg || '',
          cargo: (funcionario as any).position?.name || '',
          genero: funcionario.gender || 'M',
        },
        empresa: {
          nome: empresa.name,
          cnpj: empresa.cnpj
        },
        declaracao: {
          dataInicio: form.dataInicio ? formatDateToBrazilian(form.dataInicio) : (funcionario.hireDate ? formatDateToBrazilian(funcionario.hireDate) : ''),
          dataFim: form.dataFim ? formatDateToBrazilian(form.dataFim) : (funcionario.terminationDate ? formatDateToBrazilian(funcionario.terminationDate) : ''),
          ultimoDiaTrabalho: form.ultimoDiaTrabalho ? formatDateToBrazilianExtended(form.ultimoDiaTrabalho) : (form.dataFim || funcionario.terminationDate || ''),
          cidadeEmissao: form.cidadeEmissao,
          dataEmissao: formatDateToBrazilian(form.dataEmissao),
          observacoes: form.observacoes,
        }
      };

      if (form.tipoDeclaracao === 'CIPA_TRANSPES') {
        await declaracaoCipaTranspesGenerator.generatePDF(declaracaoData);
      } else if (form.tipoDeclaracao === 'FINS_ESCOLARES') {
        await declaracaoFinsEscolaresGenerator.generatePDF(declaracaoData);
      }
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-t-4 border-t-blue-500 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileCheck className="h-6 w-6 text-blue-500" />
                Declaração de Funcionário
              </CardTitle>
              <CardDescription>
                Emissão de declarações diversas para funcionários (escolar, CIPA, etc).
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
                            {f.cpf && (
                              <span className="text-xs text-muted-foreground">CPF: {f.cpf}</span>
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
                        {funcionario.cpf || '-'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">RG</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                        {funcionario.rg || '-'}
                      </div>
                    </div>
                     <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cargo</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                         {(funcionario as any).position?.name || '-'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Admissão</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                        {funcionario.hireDate ? formatDateToBrazilian(funcionario.hireDate) : '-'}
                      </div>
                    </div>
                     {funcionario.terminationDate && (
                       <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Demissão</Label>
                        <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                           {formatDateToBrazilian(funcionario.terminationDate)}
                        </div>
                      </div>
                     )}
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
                </div>
              </div>
            )}
          </div>
          
          {(funcionario || empresa) && <Separator />}

          {/* Dados da Declaração */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Período e Dados de Emissão</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Data de Início do Período</Label>
                <Input 
                  type="date"
                  value={form.dataInicio} 
                  onChange={(e) => setForm(prev => ({ ...prev, dataInicio: e.target.value }))}
                  className="bg-background h-11"
                />
                <p className="text-xs text-muted-foreground">
                  {funcionario?.hireDate ? `Padrão: ${formatDateToBrazilian(funcionario.hireDate)}` : 'Selecione um funcionário'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Data de Fim do Período</Label>
                <Input 
                  type="date"
                  value={form.dataFim} 
                  onChange={(e) => setForm(prev => ({ ...prev, dataFim: e.target.value }))}
                  className="bg-background h-11"
                />
                <p className="text-xs text-muted-foreground">
                  {funcionario?.terminationDate ? `Padrão: ${formatDateToBrazilian(funcionario.terminationDate)}` : 'Funcionário ainda ativo'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Último Dia de Trabalho</Label>
              <Input 
                type="date"
                value={form.ultimoDiaTrabalho} 
                onChange={(e) => setForm(prev => ({ ...prev, ultimoDiaTrabalho: e.target.value }))}
                className="bg-background h-11"
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para usar a data de fim do período
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Cidade de Emissão</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input 
                    value={form.cidadeEmissao} 
                    onChange={(e) => setForm(prev => ({ ...prev, cidadeEmissao: e.target.value }))}
                    placeholder="Ex: Contagem"
                    className="bg-background h-11 pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Data de Emissão</Label>
                <Input 
                  type="date"
                  value={form.dataEmissao} 
                  onChange={(e) => setForm(prev => ({ ...prev, dataEmissao: e.target.value }))}
                  className="bg-background h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações Adicionais</Label>
              <Textarea 
                value={form.observacoes} 
                onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais sobre a declaração..."
                rows={3}
                className="resize-none bg-background"
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
              disabled={loading || !funcionario || !empresa}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando Preview...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Visualizar Declaração
                </>
              )}
            </Button>
            <Button 
              onClick={handleGerarPDF} 
              className="flex items-center gap-2 w-full sm:w-auto h-11 shadow-md hover:shadow-lg transition-all" 
              disabled={loading || !funcionario || !empresa}
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

export default DeclaracaoForm;