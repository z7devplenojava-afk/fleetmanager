import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Eye, 
  Printer, 
  Mail, 
  Settings,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Contract } from '@/services/contractService';
import { companyConfigService, CompanyConfig } from '@/services/companyConfigService';
import { clientService } from '@/services/clientService';

interface ContractGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  onConfigureCompany: () => void;
}

interface ContractData {
  contractNumber: string;
  clientName: string;
  clientDocument: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  description: string;
  value: number;
  startDate: string;
  endDate?: string;
  additionalTerms?: string;
  paymentTerms?: string;
  observations?: string;
}

export const ContractGenerator: React.FC<ContractGeneratorProps> = ({
  open,
  onOpenChange,
  contract,
  onConfigureCompany
}) => {
  const { toast } = useToast();
  const [contractData, setContractData] = useState<ContractData>({
    contractNumber: '',
    clientName: '',
    clientDocument: '',
    clientAddress: '',
    clientPhone: '',
    clientEmail: '',
    description: '',
    value: 0,
    startDate: '',
    endDate: '',
    additionalTerms: '',
    paymentTerms: 'Pagamento mensal até o dia 10 de cada mês',
    observations: ''
  });

  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [step, setStep] = useState<'form' | 'preview' | 'generated'>('form');
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadCompanyConfig();
      loadClients();
      
      // Carregar dados do contrato se fornecido
      if (contract) {
        setContractData({
          contractNumber: contract.contractNumber,
          clientName: contract.clientName,
          clientDocument: '', // Buscar do cliente se necessário
          clientAddress: '',
          clientPhone: '',
          clientEmail: '',
          description: contract.description,
          value: contract.value,
          startDate: contract.startDate,
          endDate: contract.endDate || '',
          additionalTerms: '',
          paymentTerms: 'Pagamento mensal até o dia 10 de cada mês',
          observations: contract.notes || ''
        });
      }
    }
  }, [open, contract]);

  const loadCompanyConfig = async () => {
    setLoadingConfig(true);
    try {
      const activeConfig = await companyConfigService.getActiveConfig();
      setCompanyConfig(activeConfig);
    } catch (error) {
      console.error('Erro ao carregar configuração da empresa:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadClients = async () => {
    setClientsLoading(true);
    try {
      const result = await clientService.getClients({ page: 0, size: 1000 });
      const list = Array.isArray(result) ? result : (result?.content || []);
      setClients(list);
    } catch (e) {
      console.error('Erro ao carregar clientes para o gerador de contrato:', e);
    } finally {
      setClientsLoading(false);
    }
  };

  const handleSelectClient = (clientId: string) => {
    const selected = clients.find((c: any) => c.id === clientId);
    if (!selected) return;
    const composedAddress = [selected.address, selected.city, selected.state, selected.zipCode]
      .filter(Boolean)
      .join(', ');
    setContractData(prev => ({
      ...prev,
      clientName: selected.name || '',
      clientDocument: selected.cnpj || '',
      clientAddress: composedAddress,
      clientPhone: selected.phone || selected.mobile || '',
      clientEmail: selected.email || selected.contactEmail || ''
    }));
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const generateContractHTML = () => {
    if (!companyConfig) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contrato ${contractData.contractNumber}</title>
        <style>
          @page {
            margin: 2cm;
            size: A4;
          }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            color: #000;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            max-height: 100px;
            margin-bottom: 15px;
          }
          .company-info {
            font-size: 11px;
            margin-bottom: 15px;
            line-height: 1.3;
          }
          .contract-title {
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0;
            text-transform: uppercase;
          }
          .content {
            text-align: justify;
            text-indent: 2cm;
          }
          .parties {
            margin: 30px 0;
            background-color: #f9f9f9;
            padding: 15px;
            border: 1px solid #ddd;
          }
          .clause {
            margin: 20px 0;
          }
          .clause-title {
            font-weight: bold;
            margin-bottom: 10px;
          }
          .signature-section {
            margin-top: 60px;
            page-break-inside: avoid;
          }
          .signature-box {
            border: 1px solid #000;
            height: 80px;
            margin: 20px 0;
            position: relative;
          }
          .signature-label {
            position: absolute;
            bottom: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-weight: bold;
            font-size: 10px;
          }
          .footer {
            border-top: 1px solid #000;
            padding-top: 15px;
            margin-top: 50px;
            font-size: 10px;
            text-align: center;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .table th, .table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .highlight {
            background-color: #ffffcc;
            padding: 2px;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${companyConfig.logoUrl ? `<img src="${companyConfig.logoUrl}" alt="Logo da Empresa" class="logo" />` : ''}
          <div class="company-info">
            <strong>${companyConfig.name}</strong><br>
            CNPJ: ${companyConfig.cnpj}<br>
            ${companyConfig.address}<br>
            ${companyConfig.city}/${companyConfig.state} - CEP: ${companyConfig.zipCode}<br>
            Telefone: ${companyConfig.phone}<br>
            Email: ${companyConfig.email}
            ${companyConfig.website ? `<br>Website: ${companyConfig.website}` : ''}
          </div>
          <div class="contract-title">${companyConfig.headerText || 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS'}</div>
        </div>
        
        <div class="content">
          <div class="parties">
            <table class="table">
              <tr>
                <th colspan="2" style="text-align: center; background-color: #e0e0e0;">PARTES CONTRATANTES</th>
              </tr>
              <tr>
                <td style="width: 50%; vertical-align: top;">
                  <strong>CONTRATANTE:</strong><br>
                  <span class="highlight">${contractData.clientName}</span><br>
                  ${contractData.clientDocument ? `CNPJ/CPF: ${contractData.clientDocument}<br>` : ''}
                  ${contractData.clientAddress ? `Endereço: ${contractData.clientAddress}<br>` : ''}
                  ${contractData.clientPhone ? `Telefone: ${contractData.clientPhone}<br>` : ''}
                  ${contractData.clientEmail ? `Email: ${contractData.clientEmail}` : ''}
                </td>
                <td style="width: 50%; vertical-align: top;">
                  <strong>CONTRATADA:</strong><br>
                  <span class="highlight">${companyConfig.name}</span><br>
                  CNPJ: ${companyConfig.cnpj}<br>
                  Endereço: ${companyConfig.address}<br>
                  ${companyConfig.city}/${companyConfig.state} - CEP: ${companyConfig.zipCode}<br>
                  Telefone: ${companyConfig.phone}<br>
                  Email: ${companyConfig.email}
                </td>
              </tr>
            </table>
          </div>

          <div class="clause">
            <div class="clause-title">DADOS DO CONTRATO:</div>
            <table class="table">
              <tr>
                <td><strong>Número do Contrato:</strong></td>
                <td class="highlight">${contractData.contractNumber}</td>
              </tr>
              <tr>
                <td><strong>Valor Total:</strong></td>
                <td class="highlight">${formatCurrency(contractData.value)}</td>
              </tr>
              <tr>
                <td><strong>Data de Início:</strong></td>
                <td class="highlight">${formatDate(contractData.startDate)}</td>
              </tr>
              <tr>
                <td><strong>Data de Término:</strong></td>
                <td class="highlight">${contractData.endDate ? formatDate(contractData.endDate) : 'Prazo Indeterminado'}</td>
              </tr>
              <tr>
                <td><strong>Descrição dos Serviços:</strong></td>
                <td class="highlight">${contractData.description}</td>
              </tr>
            </table>
          </div>

          <div class="clause">
            <div class="clause-title">CLÁUSULA 1ª - DO PAGAMENTO:</div>
            <p>${contractData.paymentTerms}</p>
          </div>

          ${contractData.additionalTerms ? `
          <div class="clause">
            <div class="clause-title">CLÁUSULAS ADICIONAIS:</div>
            <div style="white-space: pre-line;">${contractData.additionalTerms}</div>
          </div>
          ` : ''}

          <div class="clause">
            <div style="white-space: pre-line;">${companyConfig.contractTerms || ''}</div>
          </div>

          ${contractData.observations ? `
          <div class="clause">
            <div class="clause-title">OBSERVAÇÕES:</div>
            <div style="white-space: pre-line;">${contractData.observations}</div>
          </div>
          ` : ''}

          <div class="signature-section">
            <p><strong>LOCAL E DATA:</strong></p>
            <p>${companyConfig.city}/${companyConfig.state}, ${formatDate(new Date().toISOString())}</p>
            
            <div style="display: flex; justify-content: space-between; margin-top: 50px;">
              <div style="width: 45%; position: relative;">
                <div class="signature-box">
                  <div class="signature-label">CONTRATANTE</div>
                </div>
                <p style="text-align: center; margin-top: 30px; font-size: 10px;">
                  ${contractData.clientName}<br>
                  ${contractData.clientDocument || 'CNPJ/CPF'}
                </p>
              </div>
              <div style="width: 45%; position: relative;">
                <div class="signature-box">
                  <div class="signature-label">CONTRATADA</div>
                </div>
                <p style="text-align: center; margin-top: 30px; font-size: 10px;">
                  ${companyConfig.name}<br>
                  CNPJ: ${companyConfig.cnpj}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          ${companyConfig.footerText || 'Este contrato é regido pelas leis brasileiras.'}
        </div>
      </body>
      </html>
    `;
  };

  const handlePreview = () => {
    const htmlContent = generateContractHTML();
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    }
    setStep('preview');
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      // Simular geração de PDF (em produção, seria uma chamada para o backend)
      const htmlContent = generateContractHTML();
      
      // Para um MVP, vamos abrir uma nova janela com o conteúdo formatado para impressão
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }

      toast({
        title: "Contrato Gerado",
        description: "O contrato foi gerado com sucesso. Use Ctrl+P para imprimir ou salvar como PDF.",
      });
      
      setStep('generated');
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o contrato. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendByEmail = () => {
    // TODO: Implementar envio por email
    toast({
      title: "Funcionalidade em Desenvolvimento",
      description: "O envio por email será implementado em breve.",
    });
  };

  if (loadingConfig) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm sm:max-w-md bg-seguranca-graphite border-gray-600 mx-4">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray text-sm sm:text-base">Carregando...</DialogTitle>
            <DialogDescription>Preparando o gerador de contratos...</DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-seguranca-yellow animate-spin" />
            <p className="text-seguranca-lightgray mb-4">
              Carregando configurações da empresa...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!companyConfig) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm sm:max-w-md bg-seguranca-graphite border-gray-600 mx-4">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray text-sm sm:text-base">Configuração Necessária</DialogTitle>
            <DialogDescription>Configure os dados da empresa para continuar</DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <Settings className="h-16 w-16 mx-auto mb-4 text-seguranca-yellow" />
            <p className="text-seguranca-lightgray mb-4">
              Para gerar contratos, é necessário configurar primeiro os dados da empresa no banco de dados.
            </p>
            <Button
              onClick={onConfigureCompany}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar Empresa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-2xl lg:max-w-4xl bg-seguranca-graphite border-gray-600 max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray text-sm sm:text-base lg:text-lg">
            Gerar Contrato Personalizado
          </DialogTitle>
          <DialogDescription>Preencha os dados para gerar um contrato personalizado</DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Dados do Cliente */}
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
                <CardTitle className="text-seguranca-lightgray text-xs sm:text-sm">
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-seguranca-lightgray text-xs sm:text-sm">Cliente (cadastrado)</Label>
                    <Select onValueChange={handleSelectClient} disabled={clientsLoading}>
                      <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray text-xs sm:text-sm mt-1">
                        <SelectValue placeholder={clientsLoading ? 'Carregando...' : 'Selecione um cliente'} />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-graphite border-gray-600">
                        {clients.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} {c.cnpj ? `- ${c.cnpj}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray text-xs sm:text-sm">Nome/Razão Social *</Label>
                    <Input
                      value={contractData.clientName}
                      onChange={(e) => setContractData(prev => ({ ...prev, clientName: e.target.value }))}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray text-xs sm:text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray text-xs sm:text-sm">CNPJ/CPF</Label>
                    <Input
                      value={contractData.clientDocument}
                      onChange={(e) => setContractData(prev => ({ ...prev, clientDocument: e.target.value }))}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray text-xs sm:text-sm mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-seguranca-lightgray">Endereço</Label>
                  <Input
                    value={contractData.clientAddress}
                    onChange={(e) => setContractData(prev => ({ ...prev, clientAddress: e.target.value }))}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-seguranca-lightgray">Telefone</Label>
                    <Input
                      value={contractData.clientPhone}
                      onChange={(e) => setContractData(prev => ({ ...prev, clientPhone: e.target.value }))}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Email</Label>
                    <Input
                      value={contractData.clientEmail}
                      onChange={(e) => setContractData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Termos Adicionais */}
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray text-sm">
                  Termos do Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-seguranca-lightgray">Condições de Pagamento</Label>
                  <Textarea
                    value={contractData.paymentTerms}
                    onChange={(e) => setContractData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                    rows={2}
                  />
                </div>

                <div>
                  <Label className="text-seguranca-lightgray">Cláusulas Adicionais</Label>
                  <Textarea
                    value={contractData.additionalTerms}
                    onChange={(e) => setContractData(prev => ({ ...prev, additionalTerms: e.target.value }))}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                    rows={4}
                    placeholder="Adicione cláusulas específicas para este contrato..."
                  />
                </div>

                <div>
                  <Label className="text-seguranca-lightgray">Observações</Label>
                  <Textarea
                    value={contractData.observations}
                    onChange={(e) => setContractData(prev => ({ ...prev, observations: e.target.value }))}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                onClick={onConfigureCompany}
                variant="outline"
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar Empresa
              </Button>

              <div className="flex gap-3">
                <Button
                  onClick={handlePreview}
                  variant="outline"
                  className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>

                <Button
                  onClick={handleGeneratePDF}
                  disabled={generating || !contractData.clientName}
                  className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
                >
                  {generating ? (
                    <>Gerando...</>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Contrato
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'generated' && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
              Contrato Gerado com Sucesso!
            </h3>
            <p className="text-gray-400 mb-6">
              O contrato {contractData.contractNumber} foi gerado e está pronto.
            </p>

            <div className="flex justify-center gap-4">
              <Button
                onClick={handlePreview}
                variant="outline"
                className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Contrato
              </Button>

              <Button
                onClick={handleSendByEmail}
                variant="outline"
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>

              <Button
                onClick={() => setStep('form')}
                className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Gerar Outro
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
