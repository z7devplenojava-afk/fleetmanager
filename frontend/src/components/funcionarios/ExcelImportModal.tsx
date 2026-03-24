import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { employeeService } from '@/services/employeeService';
import { Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    created: number;
    updated: number;
    errors: string[];
    warnings: string[];
    message: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de arquivo
      const validExtensions = ['.xlsx', '.xls'];
      const fileName = selectedFile.name.toLowerCase();
      const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

      if (!isValidExtension) {
        toast({
          title: "Erro",
          description: "Apenas arquivos Excel (.xlsx ou .xls) são aceitos",
          variant: "destructive"
        });
        return;
      }

      // Validar tamanho (máximo 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Máximo 50MB",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo Excel para importar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const importResult = await employeeService.importEmployeesFromExcel(file);

      setResult(importResult);

      if (importResult.success) {
        toast({
          title: "Sucesso",
          description: `Importação concluída! ${importResult.created} criados, ${importResult.updated} atualizados.`,
        });

        // Fechar modal após 3 segundos se não houver erros críticos
        if (importResult.errors.length === 0) {
          setTimeout(() => {
            handleClose();
            onSuccess();
          }, 3000);
        }
      } else {
        toast({
          title: "Importação concluída com erros",
          description: importResult.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar importação. Verifique o arquivo e tente novamente.",
        variant: "destructive"
      });
      setResult({
        success: false,
        created: 0,
        updated: 0,
        errors: [error.message || "Erro desconhecido"],
        warnings: [],
        message: "Erro ao processar importação"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#2a2a2a] border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-400" />
            Importar Funcionários do Excel
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Selecione uma planilha Excel (.xlsx ou .xls) com os dados dos funcionários.
            A planilha deve conter uma coluna "CNPJ Empresa" para vincular os funcionários à empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instruções */}
          <Alert className="bg-blue-900/20 border-blue-600/50">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertTitle className="text-blue-300">Requisitos da Planilha</AlertTitle>
            <AlertDescription className="text-gray-300 text-sm mt-2">
              <ul className="list-disc list-inside space-y-1">
                <li>A planilha deve ter uma coluna <strong>"CNPJ Empresa"</strong> na primeira linha</li>
                <li>A empresa deve estar cadastrada no sistema</li>
                <li>Os funcionários serão vinculados à empresa encontrada pelo CNPJ</li>
                <li>Colunas reconhecidas: Nome, CPF, Email, Telefone, Data Nascimento, Sexo, Município/Estado Nascimento, Grau Instrução, Matrícula eSocial, Endereço completo, etc.</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Upload de arquivo */}
          <div className="space-y-2">
            <Label className="text-gray-200">Arquivo Excel</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
                className="text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{file.name}</span>
                <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          {/* Resultado da importação */}
          {result && (
            <div className="space-y-3">
              <Alert className={result.success && result.errors.length === 0 ? "bg-green-900/20 border-green-600/50" : "bg-yellow-900/20 border-yellow-600/50"}>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertTitle className={result.success && result.errors.length === 0 ? "text-green-300" : "text-yellow-300"}>
                  Resumo da Importação
                </AlertTitle>
                <AlertDescription className="text-gray-300 text-sm mt-2">
                  <div className="space-y-1">
                    <p><strong>Criados:</strong> {result.created}</p>
                    <p><strong>Atualizados:</strong> {result.updated}</p>
                    {result.warnings.length > 0 && (
                      <p><strong>Avisos:</strong> {result.warnings.length}</p>
                    )}
                    {result.errors.length > 0 && (
                      <p><strong>Erros:</strong> {result.errors.length}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Avisos */}
              {result.warnings.length > 0 && (
                <Alert className="bg-yellow-900/20 border-yellow-600/50">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertTitle className="text-yellow-300">Avisos</AlertTitle>
                  <AlertDescription className="text-gray-300 text-sm mt-2">
                    <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Erros */}
              {result.errors.length > 0 && (
                <Alert className="bg-red-900/20 border-red-600/50">
                  <X className="h-4 w-4 text-red-400" />
                  <AlertTitle className="text-red-300">Erros</AlertTitle>
                  <AlertDescription className="text-gray-300 text-sm mt-2">
                    <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="border-gray-600 text-gray-200 hover:bg-gray-700"
          >
            {result && result.success && result.errors.length === 0 ? 'Fechar' : 'Cancelar'}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImportModal;
