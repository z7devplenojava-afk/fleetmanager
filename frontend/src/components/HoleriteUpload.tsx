import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPayslips, setProcessedPayslips] = useState<Payslip[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF válido.",
        variant: "destructive"
      });
    }
  };

  const processarPDF = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessedPayslips([]);
    setShowResults(false);

    try {
      const formData = new FormData();
      // Sanitize file name to remove illegal characters (\r, \n)
      const sanitizedFile = new File([file], file.name.replace(/[\r\n]+/g, ''), { type: file.type });
      formData.append('file', sanitizedFile);

      const response = await api.post('/payslips/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const payslips: Payslip[] = response.data;
      setProcessedPayslips(payslips);
      setShowResults(true);

      toast({
        title: "Sucesso",
        description: `PDF processado com sucesso! ${payslips.length} holerites extraídos.`
      });

      onUploadSuccess();
    } catch (error: any) {
      console.error('Erro ao processar PDF:', error);
      let errorMessage = 'Erro desconhecido ao processar o arquivo PDF';
      if (error.response?.status === 409 && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setProcessedPayslips([]);
    setShowResults(false);
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray">Upload de Holerites em PDF</DialogTitle>
        </DialogHeader>
        
        {!showResults ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="arquivo" className="text-seguranca-lightgray">Arquivo PDF com Múltiplas Páginas</label>
              <div className="flex items-center gap-2">
                <Input
                  id="arquivo"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
                <Button variant="outline" size="sm" disabled={!file || isProcessing} className="border-gray-600 text-seguranca-lightgray">
                  <FileText size={16} className="mr-1" />
                  {file ? file.name.substring(0, 20) + (file.name.length > 20 ? '...' : '') : 'Nenhum arquivo'}
                </Button>
              </div>
            </div>
            
            <div className="bg-seguranca-black p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-seguranca-lightgray">Como funciona:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• O PDF será processado no servidor</li>
                <li>• Os dados serão extraídos automaticamente de cada página</li>
                <li>• Cada página será salva como um holerite individual</li>
                <li>• Os dados são validados antes de serem salvos no banco</li>
              </ul>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleClose} disabled={isProcessing} className="border-gray-600 text-seguranca-lightgray">
                Cancelar
              </Button>
              <Button 
                onClick={processarPDF} 
                disabled={!file || isProcessing}
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
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle size={20} />
              <span className="text-seguranca-lightgray font-medium">
                Processamento concluído com sucesso!
              </span>
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
              <Button variant="outline" onClick={handleClose} className="border-gray-600 text-seguranca-lightgray">
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setShowResults(false);
                  setFile(null);
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
