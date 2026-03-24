import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Loader2, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface HoleriteUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

interface Payslip {
  id: number;
  employeeName: string;
  cpf: string;
  month: string;
  year: string;
  fileName: string;
  processedAt: string;
}

const HoleriteUpload: React.FC<HoleriteUploadProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPayslips, setProcessedPayslips] = useState<Payslip[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState<{ status: string; processedPages?: number; totalPages?: number } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um arquivo PDF válido.",
        variant: "destructive"
      });
      return;
    }
    
    if (pdfFiles.length > 3) {
      toast({
        title: "Erro",
        description: "Máximo de 3 arquivos permitidos. Apenas os primeiros 3 serão processados.",
        variant: "destructive"
      });
      setFiles(pdfFiles.slice(0, 3));
    } else {
      setFiles(pdfFiles);
    }
  };

  const processarPDF = async () => {
    if (files.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um arquivo PDF.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessedPayslips([]);
    setShowResults(false);
    setProgress(10); // Start progress at 10%
    setJobStatus({ status: "Enviando arquivo(s) para o servidor..." });

    try {
      // Sanitize file names to remove illegal characters (\r, \n)
      const sanitizedFiles = files.map(f => 
        new File([f], f.name.replace(/[\r\n]+/g, ''), { type: f.type })
      );

      // Usar endpoint síncrono /api/payslips/upload que tem verificação de duplicatas
      const formData = new FormData();
      if (sanitizedFiles.length > 1) {
        sanitizedFiles.forEach(f => formData.append('files', f));
      } else {
        formData.append('file', sanitizedFiles[0]);
      }

      console.log(`[PayslipUpload] Enviando ${sanitizedFiles.length} arquivo(s) para /api/payslips/upload`);
      
      // Update progress to reflect upload completion and start of backend processing
      setProgress(50); 
      setJobStatus({ status: "Processando arquivo(s) no servidor..." });
      
      const response = await api.post('/api/payslips/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutos para processamento
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(Math.min(50, 10 + (percentCompleted * 0.4))); // 10% a 50% durante upload
          }
        }
      });
      
      console.log('[PayslipUpload] Resposta recebida:', response.data);

      // Verificar se há erros na resposta (arquivos já processados)
      if (response.data.errors && Array.isArray(response.data.errors) && response.data.errors.length > 0) {
        const errorMessages = response.data.errors.join('; ');
        const filesBlocked = response.data.filesBlocked || 0;
        const totalPayslips = response.data.totalPayslips || 0;
        const payslipsArray = response.data.payslips || [];
        
        console.log('[PayslipUpload] Verificando erros:', {
          errors: response.data.errors,
          filesBlocked,
          totalPayslips,
          payslipsCount: Array.isArray(payslipsArray) ? payslipsArray.length : 0
        });
        
        // Se todos os arquivos já foram processados (nenhum holerite novo foi processado)
        if (totalPayslips === 0 || (Array.isArray(payslipsArray) && payslipsArray.length === 0)) {
          toast({
            title: "⚠️ Arquivo(s) já processado(s)",
            description: errorMessages + (filesBlocked > 0 ? ` (${filesBlocked} arquivo(s) bloqueado(s))` : ''),
            variant: "destructive",
            duration: 8000,
          });
          
          setIsProcessing(false);
          setProgress(0); // Reset progress on full block
          setTimeout(() => {
            handleClose();
          }, 3000);
          return;
        } else {
          // Alguns arquivos já foram processados, mas outros foram processados com sucesso
          toast({
            title: "⚠️ Alguns arquivos já foram processados",
            description: errorMessages,
            variant: "destructive",
            duration: 6000,
          });
        }
      }

      // Verificar se há payslips processados
      const payslips = response.data.payslips || [];
      const totalPayslips = response.data.totalPayslips || (Array.isArray(payslips) ? payslips.length : 0);
      const totalPages = response.data.totalPages || totalPayslips;
      const filesProcessed = response.data.filesProcessed || 0;
      
      console.log('[PayslipUpload] Estatísticas:', {
        totalPayslips,
        totalPages,
        filesProcessed,
        payslipsCount: Array.isArray(payslips) ? payslips.length : 0,
        errors: response.data.errors
      });

      setProgress(100); // Processing complete
      
      if (totalPayslips > 0) {
        setProcessedPayslips(payslips);
        setShowResults(true);
        
        toast({
          title: "✅ Processamento Concluído!",
          description: `${totalPayslips} holerite(s) processado(s) de ${totalPages} página(s) em ${filesProcessed} arquivo(s).`,
          duration: 5000,
        });
        
        // Recarregar lista após alguns segundos e fechar modal
        setTimeout(() => {
          onUploadSuccess();
          handleClose();
        }, 2000);
      } else {
        toast({
          title: "⚠️ Nenhum holerite processado",
          description: response.data.message || "Nenhum holerite foi extraído dos arquivos.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error('Erro ao processar PDF:', error);
      let errorMessage = 'Erro desconhecido ao processar o arquivo PDF';
      
      if (error.response) {
        // Erro de resposta HTTP
        if (error.response.data) {
          if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
            errorMessage = error.response.data.errors.join('; ');
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          }
        }
        
        if (error.response.status === 400) {
          toast({
            title: "Erro de Validação",
            description: errorMessage,
            variant: "destructive",
            duration: 8000,
          });
        } else if (error.response.status === 409) {
          toast({
            title: "⚠️ Arquivo já processado",
            description: errorMessage,
            variant: "destructive",
            duration: 8000,
          });
        } else {
          toast({
            title: "Erro",
            description: errorMessage,
            variant: "destructive",
            duration: 8000,
          });
        }
      } else if (error.message) {
        errorMessage = error.message;
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
        });
      }
    } finally {
      setIsProcessing(false);
      setProgress(0); // Reset progress bar on completion or error
      setJobStatus(null); // Clear job status
    }
  };

  const handleClose = () => {
    setFiles([]);
    setProcessedPayslips([]);
    setShowResults(false);
    setIsProcessing(false);
    setProgress(0); // Ensure progress is reset when closing
    setJobStatus(null); // Clear job status when closing
    onClose();
  };

  const downloadIndividualPayslip = async (payslip: Payslip) => {
    try {
      const response = await api.get(`/api/payslips/download/${payslip.fileName}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', payslip.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Iniciado",
        description: `Download do holerite de ${payslip.employeeName} iniciado.`
      });
    } catch (error) {
      toast({
        title: "Erro no Download",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[800px] bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray">Upload de Holerites em PDF</DialogTitle>
          <DialogDescription className="text-gray-400">
            Importe holerites em PDF para processamento automático
          </DialogDescription>
        </DialogHeader>
        
        {!showResults ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="arquivo" className="text-seguranca-lightgray">
                Arquivo(s) PDF (até 3 arquivos)
              </label>
              <div className="flex flex-col gap-2">
                <Input
                  id="arquivo"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
                {files.length > 0 && (
                  <div className="bg-seguranca-black p-2 rounded border border-gray-600">
                    <p className="text-sm text-gray-400 mb-1">
                      {files.length} arquivo(s) selecionado(s):
                    </p>
                    <ul className="text-xs text-seguranca-lightgray space-y-1">
                      {files.map((f, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <FileText size={12} />
                          <span>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-seguranca-black p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-seguranca-lightgray">Como funciona:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Você pode enviar até 3 arquivos PDF por vez</li>
                <li>• Os PDFs serão processados no servidor de forma assíncrona</li>
                <li>• Os dados serão extraídos automaticamente de cada página</li>
                <li>• Cada página será salva como um holerite individual</li>
                <li>• Os dados são validados antes de serem salvos no banco</li>
                <li>• Arquivos grandes (100+ páginas) são processados em paralelo para maior velocidade</li>
              </ul>
            </div>
            
            {isProcessing && jobStatus && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Status: {jobStatus.status}</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {jobStatus.processedPages !== undefined && jobStatus.totalPages !== undefined && (
                  <p className="text-xs text-gray-500">
                    Processando página {jobStatus.processedPages} de {jobStatus.totalPages}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline"
                onClick={handleClose} 
                disabled={isProcessing}
                className="border-gray-600 text-seguranca-lightgray"
              >
                Fechar
              </Button>
              <Button 
                onClick={processarPDF} 
                disabled={files.length === 0 || isProcessing}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    Processar PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
              <div className="p-2 bg-green-500/30 rounded-full">
                <CheckCircle size={24} className="text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-green-400 font-bold text-lg">
                  ✅ Processamento Finalizado!
                </h3>
                <p className="text-gray-300 text-sm mt-1">
                  O processamento do PDF foi concluído com sucesso. {processedPayslips.length} holerite(s) foi/foram extraído(s) e processado(s) corretamente.
                </p>
              </div>
            </div>
            
            <div className="bg-seguranca-black p-4 rounded-lg">
              <h4 className="font-medium mb-3 text-seguranca-lightgray">
                Holerites Processados ({processedPayslips.length})
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {processedPayslips.map((payslip, index) => (
                  <div key={payslip.id} className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700">
                    <div className="flex-1">
                      <div className="text-seguranca-lightgray font-bold text-lg">{payslip.employeeName}</div>
                      <div className="text-gray-400 text-sm">
                        <span className="font-semibold text-seguranca-red">CPF/Código:</span> <span className="font-mono text-white">{payslip.cpf}</span> |
                        <span className="font-semibold text-seguranca-red ml-2">Período:</span> <span className="font-mono text-white">{String(payslip.month).padStart(2, '0')}/{payslip.year}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => downloadIndividualPayslip(payslip)}
                      className="bg-seguranca-red hover:bg-seguranca-darkred"
                    >
                      <Download size={14} className="mr-1" />
                      Baixar
                    </Button>
                    <span
                      className="ml-4 text-xs text-gray-400 font-mono max-w-xs truncate inline-block align-middle"
                      title={payslip.fileName.split(/[\\/]/).pop()}
                      style={{ maxWidth: 250, verticalAlign: 'middle' }}
                    >
                      {payslip.fileName.split(/[\\/]/).pop()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                disabled={false}
                className="border-gray-600 text-seguranca-lightgray"
              >
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setShowResults(false);
                  setFiles([]);
                  setProcessedPayslips([]);
                }}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                <Upload size={16} className="mr-2" />
                Novo Upload
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HoleriteUpload;
