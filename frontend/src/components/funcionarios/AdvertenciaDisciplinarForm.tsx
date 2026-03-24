import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { FileText, Download, Eye, User, Building, Calendar, AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import { companyService } from '@/services/companyService';
import { documentService } from '@/services/documentService';
import { Employee } from '@/types/employee';
import { Company } from '@/types/company';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

const AdvertenciaDisciplinarForm = () => {
  const [form, setForm] = useState({
    funcionarioId: '',
    empresaId: '',
    motivo: '',
    dataFaltas: '',
    dataRetorno: '',
    observacoes: '',
    dataEmissao: new Date().toISOString().split('T')[0],
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const motivosAdvertencia = [
    'Falta sem justificativa',
    'Atraso frequente',
    'Não cumprimento de normas',
    'Falta de comunicação com supervisão',
    'Comportamento inadequado',
    'Não uso de EPI',
    'Outro motivo',
  ];

  const formatDateToBrazilian = (dateString?: string) => {
    if (!dateString) return '';
    try {
      // Handle "yyyy-mm-dd" which comes from input type="date"
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

  const handlePreview = async () => {
    if (!funcionario || !empresa) {
      alert('Selecione funcionário e empresa!');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        templateName: 'advertencia-disciplinar.html',
        funcionario: funcionario.name,
        cpf: funcionario.cpf || funcionario.document || '',
        cargo: (funcionario as any).position?.name || '',
        empresa: empresa.sigla || empresa.tradeName || empresa.name,
        cnpj: empresa.cnpj || '',
        enderecoEmpresa: empresa.address || '',
        motivo: form.motivo,
        dataFaltas: form.dataFaltas,
        dataRetorno: form.dataRetorno,
        observacoes: form.observacoes,
        dataEmissao: formatDateToBrazilian(form.dataEmissao),
        dataAtual: formatDateToBrazilian(new Date().toISOString().split('T')[0]),
      };

      const blob = await documentService.generatePDF(payload);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowModal(true);
    } catch (err) {
      console.error('Erro ao gerar preview:', err);
      alert('Erro ao gerar preview. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGerarPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionario || !empresa) {
      alert('Selecione funcionário e empresa!');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        templateName: 'advertencia-disciplinar.html',
        funcionario: funcionario.name,
        cpf: funcionario.cpf || funcionario.document || '',
          cargo: (funcionario as any).position?.name || '',
        empresa: empresa.sigla || empresa.tradeName || empresa.name,
        cnpj: empresa.cnpj || '',
        enderecoEmpresa: empresa.address || '',
          motivo: form.motivo,
          dataFaltas: form.dataFaltas,
          dataRetorno: form.dataRetorno,
          observacoes: form.observacoes,
          dataEmissao: formatDateToBrazilian(form.dataEmissao),
        dataAtual: formatDateToBrazilian(new Date().toISOString().split('T')[0]),
      };

      const blob = await documentService.generatePDF(payload);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `advertencia-disciplinar-${funcionario.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Advertência gerada com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFromModal = () => {
    if (!pdfUrl || !funcionario) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `advertencia-disciplinar-${funcionario.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  return (
    <>
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-t-4 border-t-red-500 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                Advertência Disciplinar
              </CardTitle>
              <CardDescription>
                Emissão de comunicado de advertência disciplinar ao funcionário.
              </CardDescription>
            </div>
            {(funcionario && empresa && form.motivo) && (
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
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cargo</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                        {(funcionario as any).position?.name || '-'}
                      </div>
                    </div>
                     <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Admissão</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors">
                         {funcionario.hireDate ? formatDateToBrazilian(funcionario.hireDate) : '-'}
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
                </div>
              </div>
            )}
          </div>
          
          {(funcionario || empresa) && <Separator />}

          {/* Detalhes da Advertência */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Detalhes da Ocorrência</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Motivo da Advertência</Label>
                <Select value={form.motivo} onValueChange={(value) => setForm(prev => ({ ...prev, motivo: value }))}>
                  <SelectTrigger className="bg-background h-11">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {motivosAdvertencia.map(motivo => (
                      <SelectItem key={motivo} value={motivo}>{motivo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Datas das Faltas</Label>
                <Input 
                  value={form.dataFaltas} 
                  onChange={(e) => setForm(prev => ({ ...prev, dataFaltas: e.target.value }))}
                  placeholder="Ex: 29/08 e 03/09/24"
                  className="bg-background h-11"
                />
                <p className="text-xs text-muted-foreground">Informe as datas das faltas separadas por vírgula</p>
              </div>

              <div className="space-y-2">
                <Label>Data de Retorno</Label>
                <Input 
                  value={form.dataRetorno} 
                  onChange={(e) => setForm(prev => ({ ...prev, dataRetorno: e.target.value }))}
                  placeholder="Ex: 24/09/24"
                  className="bg-background h-11"
                />
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
                placeholder="Detalhes adicionais sobre o ocorrido..."
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
                  Visualizar Advertência
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

    {/* Modal de Visualização do PDF */}
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Advertência Disciplinar
              </DialogTitle>
              <DialogDescription>
                Visualize o documento gerado antes de fazer o download
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleCloseModal}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-6 pt-0">
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-[calc(90vh-200px)] border rounded-lg"
              title="Visualização da Advertência Disciplinar"
            />
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button 
            onClick={handleCloseModal}
            variant="outline"
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Fechar
          </Button>
          <Button 
            onClick={handleDownloadFromModal}
            className="gap-2 bg-red-600 hover:bg-red-700"
          >
            <Download className="h-4 w-4" />
            Baixar Advertência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default AdvertenciaDisciplinarForm;