import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, FileText, Download, Eye, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { pdfMergeService, PdfMergeResult } from '@/services/pdfMergeService';
import { useToast } from '@/hooks/use-toast';

interface MergeDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: PdfMergeResult) => void;
}

const MergeDocumentsModal: React.FC<MergeDocumentsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'upload' | 'config' | 'processing' | 'result'>('upload');
  const [payslipFile, setPayslipFile] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergeResult, setMergeResult] = useState<PdfMergeResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  const payslipInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const handleFileSelect = (file: File, type: 'payslip' | 'receipt') => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Erro",
        description: "Apenas arquivos PDF são aceitos",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: "Erro",
        description: "Arquivo muito grande (máximo 10MB)",
        variant: "destructive"
      });
      return;
    }

    if (type === 'payslip') {
      setPayslipFile(file);
    } else {
      setReceiptFile(file);
    }
  };

  const handleNextStep = () => {
    if (step === 'upload') {
      if (!payslipFile || !receiptFile) {
        toast({
          title: "Erro",
          description: "Selecione tanto o holerite quanto o comprovante",
          variant: "destructive"
        });
        return;
      }
      setStep('config');
    } else if (step === 'config') {
      if (!employeeName.trim()) {
        toast({
          title: "Erro",
          description: "Digite o nome do funcionário",
          variant: "destructive"
        });
        return;
      }
      setStep('processing');
      handleMerge();
    }
  };

  const handleMerge = async () => {
    if (!payslipFile || !receiptFile) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      const result = await pdfMergeService.mergePayslipAndReceipt({
        payslipFile,
        receiptFile,
        employeeName,
        month,
        year
      });

      setMergeResult(result);
      setStep('result');

      toast({
        title: "Sucesso",
        description: "Holerite e comprovante unidos com sucesso!",
      });

      if (onSuccess) {
        onSuccess(result);
      }

    } catch (error) {
      console.error('Erro ao unir documentos:', error);
      setErrors([error instanceof Error ? error.message : 'Erro desconhecido']);
      
      toast({
        title: "Erro",
        description: "Falha ao unir documentos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!mergeResult) return;

    try {
      await pdfMergeService.downloadFile(mergeResult.fileName);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao fazer download do arquivo",
        variant: "destructive"
      });
    }
  };

  const handleView = () => {
    if (!mergeResult) return;
    window.open(pdfMergeService.getViewUrl(mergeResult.fileName), '_blank');
  };

  const handleReset = () => {
    setStep('upload');
    setPayslipFile(null);
    setReceiptFile(null);
    setEmployeeName('');
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setIsProcessing(false);
    setMergeResult(null);
    setErrors([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Unir Holerite e Comprovante
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600">Selecione o holerite e o comprovante para unir em um único documento</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Holerite */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Holerite
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Input
                      ref={payslipInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'payslip');
                      }}
                      className="hidden"
                    />
                    
                    <Button
                      variant="outline"
                      onClick={() => payslipInputRef.current?.click()}
                      className="w-full"
                    >
                      {payslipFile ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="truncate">{payslipFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar Holerite
                        </>
                      )}
                    </Button>

                    {payslipFile && (
                      <div className="text-xs text-gray-500">
                        <p>Tamanho: {pdfMergeService.formatFileSize(payslipFile.size)}</p>
                        <p>Tipo: {payslipFile.type}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upload Comprovante */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Comprovante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Input
                      ref={receiptInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'receipt');
                      }}
                      className="hidden"
                    />
                    
                    <Button
                      variant="outline"
                      onClick={() => receiptInputRef.current?.click()}
                      className="w-full"
                    >
                      {receiptFile ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="truncate">{receiptFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar Comprovante
                        </>
                      )}
                    </Button>

                    {receiptFile && (
                      <div className="text-xs text-gray-500">
                        <p>Tamanho: {pdfMergeService.formatFileSize(receiptFile.size)}</p>
                        <p>Tipo: {receiptFile.type}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleNextStep}>
                Próximo
              </Button>
            </div>
          </div>
        )}

        {step === 'config' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600">Configure as informações do documento unificado</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Nome do Funcionário *</Label>
                <Input
                  id="employeeName"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Digite o nome do funcionário"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">Mês *</Label>
                <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Ano *</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min="2020"
                  max="2030"
                />
              </div>
            </div>

            {/* Resumo dos arquivos */}
            <div className="space-y-3">
              <h4 className="font-medium">Arquivos selecionados:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{payslipFile?.name}</span>
                  <Badge variant="secondary">Holerite</Badge>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{receiptFile?.name}</span>
                  <Badge variant="secondary">Comprovante</Badge>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Voltar
              </Button>
              <Button onClick={handleNextStep}>
                Unir Documentos
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Unindo documentos...</h3>
              <p className="text-gray-600">Aguarde enquanto processamos os arquivos</p>
            </div>
          </div>
        )}

        {step === 'result' && mergeResult && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-600">Documentos unidos com sucesso!</h3>
              <p className="text-gray-600">O arquivo foi criado e está pronto para download</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{mergeResult.fileName}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Funcionário:</strong> {mergeResult.employeeName}</p>
                      <p><strong>Período:</strong> {month}/{year}</p>
                    </div>
                    <div>
                      <p><strong>Tamanho:</strong> {pdfMergeService.formatFileSize(mergeResult.fileSize)}</p>
                      <p><strong>Status:</strong> <Badge variant="secondary">{mergeResult.status}</Badge></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleView}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleReset}>
                Unir Outros Documentos
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MergeDocumentsModal;
