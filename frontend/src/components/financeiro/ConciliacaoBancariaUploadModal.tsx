import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  X, 
  AlertCircle,
  CheckCircle,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bankReconciliationService, BankFile } from '@/services/bankReconciliationService';

interface ConciliacaoBancariaUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (file: BankFile) => void;
}

interface UploadFormData {
  bankName: string;
  accountNumber: string;
  period: string;
  description: string;
  file: File | null;
}

export const ConciliacaoBancariaUploadModal: React.FC<ConciliacaoBancariaUploadModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState<UploadFormData>({
    bankName: '',
    accountNumber: '',
    period: '',
    description: '',
    file: null
  });

  const banks = [
    'Bradesco',
    'Itaú',
    'Santander',
    'Banco do Brasil',
    'Caixa Econômica Federal',
    'Banco Inter',
    'Nubank',
    'Sicoob',
    'Sicredi',
    'Outro'
  ];

  const handleInputChange = (field: keyof UploadFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (file: File) => {
    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Apenas arquivos PDF e CSV são permitidos",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Máximo permitido: 10MB",
        variant: "destructive"
      });
      return;
    }

    handleInputChange('file', file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else if (extension === 'csv') {
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    }
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para upload",
        variant: "destructive"
      });
      return;
    }

    if (!formData.bankName) {
      toast({
        title: "Erro",
        description: "Selecione o banco",
        variant: "destructive"
      });
      return;
    }

    if (!formData.accountNumber) {
      toast({
        title: "Erro",
        description: "Informe o número da conta",
        variant: "destructive"
      });
      return;
    }

    if (!formData.period) {
      toast({
        title: "Erro",
        description: "Informe o período",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Fazer upload do arquivo para o backend
      const newFile = await bankReconciliationService.uploadBankFile({
        file: formData.file,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        period: formData.period,
        description: formData.description
      });

      onSuccess(newFile);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        bankName: '',
        accountNumber: '',
        period: '',
        description: '',
        file: null
      });
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer o upload do arquivo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-seguranca-lightgray">
            <Upload className="text-seguranca-yellow" size={24} />
            Importar Arquivo Bancário
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray">
            Faça upload de arquivos PDF ou CSV para conciliação bancária
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Banco */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-seguranca-lightgray flex items-center gap-2 border-b border-gray-700 pb-2">
              <Building className="text-seguranca-yellow" size={20} />
              Informações do Banco
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Banco *</label>
                <Select value={formData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {banks.map((bank) => (
                      <SelectItem 
                        key={bank} 
                        value={bank}
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Número da Conta *</label>
                <Input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder="Ex: 12345-6"
                  className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Período *</label>
              <Input
                type="text"
                value={formData.period}
                onChange={(e) => handleInputChange('period', e.target.value)}
                placeholder="Ex: Janeiro 2024"
                className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                required
              />
            </div>
          </div>

          {/* Upload de Arquivo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-seguranca-lightgray flex items-center gap-2 border-b border-gray-700 pb-2">
              <Upload className="text-seguranca-yellow" size={20} />
              Arquivo
            </h3>
            
            {!formData.file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-seguranca-yellow bg-seguranca-yellow/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-seguranca-lightgray mb-2">
                  Arraste e solte seu arquivo aqui ou clique para selecionar
                </p>
                <p className="text-sm text-seguranca-lightgray/70 mb-4">
                  Formatos aceitos: PDF, CSV (máximo 10MB)
                </p>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                >
                  Selecionar Arquivo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-gray-600 rounded-lg p-4 bg-seguranca-black/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileTypeIcon(formData.file.name)}
                    <div>
                      <p className="text-sm font-medium text-seguranca-lightgray">
                        {formData.file.name}
                      </p>
                      <p className="text-xs text-seguranca-lightgray/70">
                        {formatFileSize(formData.file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleInputChange('file', null)}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-red-400 hover:bg-red-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-seguranca-lightgray flex items-center gap-2 border-b border-gray-700 pb-2">
              <FileText className="text-seguranca-yellow" size={20} />
              Observações
            </h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Observações sobre o arquivo ou período..."
                className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                rows={3}
              />
            </div>
          </div>

          {/* Informações importantes */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Informações importantes:</p>
                <ul className="space-y-1 text-blue-300/80">
                  <li>• Arquivos PDF devem conter extratos bancários em formato legível</li>
                  <li>• Arquivos CSV devem ter colunas: Data, Descrição, Valor, Saldo</li>
                  <li>• O processamento pode levar alguns minutos</li>
                  <li>• Você receberá notificação quando a conciliação estiver concluída</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
              disabled={loading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Enviando...' : 'Importar Arquivo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
