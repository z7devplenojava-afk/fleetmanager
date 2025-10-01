import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import bankReconciliationService from '@/services/bankReconciliationService';

interface ImportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountId: string;
}

const ImportStatementModal: React.FC<ImportStatementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accountId
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'CSV' | 'OFX' | 'EXCEL'>('CSV');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para importar",
        variant: "destructive"
      });
      return;
    }

    if (!accountId) {
      toast({
        title: "Erro",
        description: "Conta bancária não selecionada",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await bankReconciliationService.importBankStatement({
        accountId,
        file: selectedFile,
        format
      });

      toast({
        title: "Sucesso",
        description: `${result.imported} registros importados com sucesso!`,
        variant: "default"
      });

      if (result.errors.length > 0) {
        toast({
          title: "Atenção",
          description: `${result.errors.length} erros encontrados durante a importação`,
          variant: "destructive"
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao importar extrato",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFormat('CSV');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Extrato Bancário
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Importe um arquivo de extrato bancário para conciliação
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Formato do Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="format" className="text-seguranca-lightgray">
              Formato do Arquivo
            </Label>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSV">CSV (Comma Separated Values)</SelectItem>
                <SelectItem value="EXCEL">Excel (.xlsx)</SelectItem>
                <SelectItem value="OFX">OFX (Open Financial Exchange)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seleção do Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="file" className="text-seguranca-lightgray">
              Arquivo do Extrato
            </Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls,.ofx"
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              disabled={isLoading}
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-seguranca-lightgray">
                <FileText className="h-4 w-4" />
                <span>{selectedFile.name}</span>
                <span className="text-gray-400">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>

          {/* Informações sobre o formato */}
          <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-seguranca-yellow mt-0.5" />
              <div className="text-sm">
                <p className="text-seguranca-lightgray font-medium mb-2">
                  Formato esperado para CSV:
                </p>
                <ul className="text-gray-400 space-y-1">
                  <li>• Data, Descrição, Valor, Tipo (DEBIT/CREDIT)</li>
                  <li>• Separador: vírgula (,)</li>
                  <li>• Formato de data: DD/MM/AAAA</li>
                  <li>• Valores decimais com ponto (.)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedFile}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Upload size={16} className="mr-2" />
              {isLoading ? 'Importando...' : 'Importar Extrato'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImportStatementModal;