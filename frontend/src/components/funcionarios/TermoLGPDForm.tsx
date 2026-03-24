import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useToast } from '../../hooks/use-toast';
import { FileText, Download, Printer, Eye, User, Building, Calendar, FileCheck, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import { companyService } from '@/services/companyService';
import { Employee } from '@/types/employee';
import { Company } from '@/types/company';
import api from '@/lib/axios';

const TermoLGPDForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    funcionarioId: '',
    empresaId: '',
    consentTypes: [] as string[],
    dataUsage: '',
    dataRetention: '',
    additionalInfo: '',
    consentDate: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

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
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados.',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const funcionario = employees.find(f => f.id === formData.funcionarioId);
  const empresa = companies.find(e => e.id === formData.empresaId);

  const consentOptions = [
    { id: 'data_processing', label: 'Processamento de Dados Pessoais' },
    { id: 'data_sharing', label: 'Compartilhamento de Dados' },
    { id: 'marketing', label: 'Marketing e Comunicações' },
    { id: 'third_party', label: 'Transferência para Terceiros' },
    { id: 'automated_processing', label: 'Processamento Automatizado' },
  ];

  const handleConsentChange = (consentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      consentTypes: checked 
        ? [...prev.consentTypes, consentId]
        : prev.consentTypes.filter(id => id !== consentId)
    }));
  };

  const handleGenerateDocument = async () => {
    if (!funcionario || !empresa || formData.consentTypes.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios e selecione pelo menos um tipo de consentimento.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const addressValue = typeof funcionario.address === 'string' 
          ? funcionario.address 
          : funcionario.address 
            ? `${funcionario.address.street}, ${funcionario.address.number || ''}` 
            : '';

      const payload = {
        templateName: 'termo-consentimento-lgpd.html',
        funcionario: funcionario.name,
        cpf: funcionario.cpf || funcionario.document || '',
        cargo: funcionario.position?.name,
        departamento: funcionario.unit?.name || funcionario.position?.name,
        endereco: addressValue,
        empresa: empresa.name,
        cnpj: empresa.cnpj,
        enderecoEmpresa: empresa.address && empresa.address.street
          ? [empresa.address.street, empresa.address.number, empresa.address.neighborhood, empresa.address.city]
              .filter(Boolean)
              .join(', ')
          : '',
        tiposConsentimento: formData.consentTypes.map(id => consentOptions.find(opt => opt.id === id)?.label).join(', '),
        finalidadeUso: formData.dataUsage,
        prazoRetencao: formData.dataRetention,
        informacoesAdicionais: formData.additionalInfo,
        dataConsentimento: new Date(formData.consentDate).toLocaleDateString('pt-BR'),
        dataAtual: new Date().toLocaleDateString('pt-BR')
      };

      const response = await api.post('/api/documents/generate-pdf', payload, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `termo-lgpd-${funcionario.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "Termo LGPD gerado com sucesso!",
      });

    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o documento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!funcionario || !empresa) {
        toast({
          title: 'Atenção',
          description: 'Selecione funcionário e empresa para visualizar o termo!',
          variant: 'destructive'
        });
        return;
    }

    setLoading(true);
    try {
        const addressValue = typeof funcionario.address === 'string' 
          ? funcionario.address 
          : funcionario.address 
            ? `${funcionario.address.street}, ${funcionario.address.number || ''}` 
            : '';

        const payload = {
            templateName: 'termo-consentimento-lgpd.html',
            funcionario: funcionario.name,
            cpf: funcionario.cpf || funcionario.document || '',
            cargo: funcionario.position?.name,
            departamento: funcionario.unit?.name || funcionario.position?.name,
            endereco: addressValue,
            empresa: empresa.name,
            cnpj: empresa.cnpj,
            enderecoEmpresa: empresa.address && empresa.address.street
              ? [empresa.address.street, empresa.address.number, empresa.address.neighborhood, empresa.address.city]
                  .filter(Boolean)
                  .join(', ')
              : '',
            tiposConsentimento: formData.consentTypes.map(id => consentOptions.find(opt => opt.id === id)?.label).join(', '),
            finalidadeUso: formData.dataUsage,
            prazoRetencao: formData.dataRetention,
            informacoesAdicionais: formData.additionalInfo,
            dataConsentimento: new Date(formData.consentDate).toLocaleDateString('pt-BR'),
            dataAtual: new Date().toLocaleDateString('pt-BR')
        };

        const response = await api.post('/api/documents/generate-pdf', payload, {
            responseType: 'blob'
        });

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        setTimeout(() => window.URL.revokeObjectURL(url), 100);

    } catch (error) {
        console.error('Erro ao gerar preview:', error);
        toast({
            title: "Erro",
            description: "Erro ao gerar preview. Tente novamente.",
            variant: "destructive"
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
                <FileCheck className="h-6 w-6 text-primary" />
                Termo de Consentimento LGPD
              </CardTitle>
              <CardDescription>
                Geração de termo de consentimento para tratamento de dados pessoais (Lei Geral de Proteção de Dados).
              </CardDescription>
            </div>
            {(funcionario && empresa && formData.consentTypes.length > 0) && (
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
              <span>Identificação das Partes</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Funcionário (Titular dos Dados)</Label>
                <Select 
                  value={formData.funcionarioId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, funcionarioId: value }))}
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
                <Label className="text-base font-semibold">Empresa (Controladora)</Label>
                <Select 
                  value={formData.empresaId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, empresaId: value }))}
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
                    Dados do Titular
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
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Departamento</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                         {funcionario.unit?.name || funcionario.position?.name || '-'}
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
                    Dados da Controladora
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

          {/* Tipos de Consentimento */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Escopo do Consentimento</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {consentOptions.map((option) => (
                <div key={option.id} className={`flex items-start space-x-3 p-4 rounded-lg border transition-all ${
                  formData.consentTypes.includes(option.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}>
                  <Checkbox
                    id={option.id}
                    checked={formData.consentTypes.includes(option.id)}
                    onCheckedChange={(checked) => handleConsentChange(option.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={option.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />

          {/* Configurações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <Label>Finalidade do Uso dos Dados</Label>
              <Textarea
                value={formData.dataUsage}
                onChange={(e) => setFormData(prev => ({ ...prev, dataUsage: e.target.value }))}
                className="bg-background resize-none"
                placeholder="Descreva a finalidade específica..."
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Prazo de Retenção</Label>
                <Select
                  value={formData.dataRetention}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dataRetention: value }))}
                >
                  <SelectTrigger className="bg-background h-11">
                    <SelectValue placeholder="Selecione o prazo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_ano">1 ano</SelectItem>
                    <SelectItem value="2_anos">2 anos</SelectItem>
                    <SelectItem value="3_anos">3 anos</SelectItem>
                    <SelectItem value="5_anos">5 anos</SelectItem>
                    <SelectItem value="10_anos">10 anos</SelectItem>
                    <SelectItem value="indefinido">Indefinido (até rescisão)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-2">
                <Label>Data do Consentimento</Label>
                <Input
                  type="date"
                  value={formData.consentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, consentDate: e.target.value }))}
                  className="bg-background h-11"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Informações Adicionais</Label>
            <Textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              className="bg-background resize-none"
              placeholder="Outras observações relevantes..."
              rows={3}
            />
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
              <Eye className="h-4 w-4" />
              Visualizar
            </Button>
            <Button
              onClick={handleGenerateDocument}
              className="flex items-center gap-2 w-full sm:w-auto h-11 shadow-md hover:shadow-lg transition-all"
              disabled={loading || !funcionario || !empresa || formData.consentTypes.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
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

export default TermoLGPDForm;