import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { clientService } from '@/services/clientService';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, RefreshCw, X, Info, Building2, FileText, Bus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ClientObraImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ImportResult {
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export const ClientObraImportModal: React.FC<ClientObraImportModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      toast({
        title: "Formato inválido",
        description: "Selecione um arquivo Excel válido (.xlsx ou .xls).",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione a planilha QUADRO DE OBRAS para importar.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const data = await clientService.importQuadroObras(file);
      setResult(data);

      toast({
        title: "Importação Concluída!",
        description: `Clientes: ${data.inserted}, Atualizados: ${data.updated}, Ignorados: ${data.skipped}.`,
        variant: data.inserted > 0 || data.updated > 0 ? "default" : "destructive"
      });

      if (data.inserted > 0 || data.updated > 0) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao processar planilha.';
      toast({
        title: "Erro na Importação",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-seguranca-graphite border-gray-700 text-seguranca-lightgray max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-seguranca-lightgray flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-seguranca-yellow" />
            Importar Quadro de Obras
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Importe a planilha QUADRO DE OBRAS para cadastrar clientes, veículos e contratos automaticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Informações das Colunas Mapeadas */}
        <Alert className="bg-seguranca-black/60 border-seguranca-yellow/30 text-gray-300 py-3">
          <Info className="h-4 w-4 text-seguranca-yellow" />
          <AlertTitle className="text-seguranca-yellow font-bold text-xs uppercase tracking-wider mb-1">
            Colunas Esperadas na Planilha
          </AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <p>• <strong className="text-white">CLIENTE/OBRA</strong> — Nome do cliente ou obra (obrigatório)</p>
            <p>• <strong className="text-white">QUANTIDADE DE VEÍCULOS</strong> — Número de veículos a alocar</p>
            <p>• <strong className="text-white">DESCRIÇÃO</strong> — Define o tipo de ônibus/veículo</p>
            <p>• <strong className="text-white">TIPOS DE SERVIÇOS</strong> — Descrição dos serviços prestados</p>
            <p>• <strong className="text-white">VALOR POR VEÍCULO</strong> — Valor mensal por veículo (R$)</p>
            <p>• <strong className="text-white">VALOR MENSAL</strong> — Valor total mensal do contrato (R$)</p>
            <p>• <strong className="text-white">VIGÊNCIA</strong> — Período do contrato (ex: 01/2026 a 12/2026)</p>
          </AlertDescription>
        </Alert>

        {/* O que será criado */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-blue-950/40 rounded-lg border border-blue-800/50">
            <Building2 className="h-5 w-5 text-blue-400 mx-auto mb-1" />
            <span className="text-xs text-blue-300 font-medium">Clientes</span>
            <p className="text-[10px] text-gray-500">Cadastrados ou atualizados</p>
          </div>
          <div className="p-2 bg-green-950/40 rounded-lg border border-green-800/50">
            <Bus className="h-5 w-5 text-green-400 mx-auto mb-1" />
            <span className="text-xs text-green-300 font-medium">Veículos</span>
            <p className="text-[10px] text-gray-500">Alocados ao cliente</p>
          </div>
          <div className="p-2 bg-purple-950/40 rounded-lg border border-purple-800/50">
            <FileText className="h-5 w-5 text-purple-400 mx-auto mb-1" />
            <span className="text-xs text-purple-300 font-medium">Contratos</span>
            <p className="text-[10px] text-gray-500">Com valor e vigência</p>
          </div>
        </div>

        {/* Dropzone de Upload */}
        {!result && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-seguranca-yellow bg-seguranca-yellow/10 scale-[1.01]'
                : file
                ? 'border-green-500/50 bg-green-500/5'
                : 'border-gray-600 bg-seguranca-black/40 hover:border-gray-500'
            }`}
          >
            <input
              type="file"
              id="obra-file-input"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />

            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-green-500/20 rounded-full border border-green-500/30 text-green-400">
                  <FileSpreadsheet className="h-10 w-10" />
                </div>
                <div>
                  <p className="font-semibold text-white text-base">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <X className="h-4 w-4 mr-1" /> Remover Arquivo
                </Button>
              </div>
            ) : (
              <label htmlFor="obra-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="p-4 bg-seguranca-yellow/10 rounded-full border border-seguranca-yellow/20 text-seguranca-yellow">
                  <Upload className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-semibold text-seguranca-lightgray text-sm">
                    Arraste a planilha QUADRO DE OBRAS aqui ou <span className="text-seguranca-yellow underline">clique para procurar</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Formatos suportados: .xlsx, .xls</p>
                </div>
              </label>
            )}
          </div>
        )}

        {/* Resultados da Importação */}
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-seguranca-black/60 rounded-lg border border-gray-700">
                <span className="text-xs text-gray-400 block">Linhas Lidas</span>
                <span className="text-lg font-bold text-white">{result.totalRows}</span>
              </div>
              <div className="p-3 bg-green-950/40 rounded-lg border border-green-800/50">
                <span className="text-xs text-green-400 block">Criados</span>
                <span className="text-lg font-bold text-green-400">+{result.inserted}</span>
              </div>
              <div className="p-3 bg-blue-950/40 rounded-lg border border-blue-800/50">
                <span className="text-xs text-blue-400 block">Atualizados</span>
                <span className="text-lg font-bold text-blue-400">{result.updated}</span>
              </div>
              <div className="p-3 bg-yellow-950/40 rounded-lg border border-yellow-800/50">
                <span className="text-xs text-yellow-400 block">Ignorados</span>
                <span className="text-lg font-bold text-yellow-400">{result.skipped}</span>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" /> Avisos / Erros ({result.errors.length}):
                </span>
                <div className="bg-seguranca-black/80 border border-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
                  {result.errors.map((err, idx) => (
                    <p key={idx} className="text-gray-300 leading-relaxed border-b border-gray-800 pb-1 last:border-0">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-gray-700">
          {result ? (
            <div className="flex w-full justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Importar Outro Arquivo
              </Button>
              <Button
                type="button"
                onClick={handleClose}
                className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
              >
                Concluir
              </Button>
            </div>
          ) : (
            <div className="flex w-full justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={!file || loading}
                className="bg-seguranca-yellow hover:bg-yellow-500 text-black font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando Planilha...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Quadro de Obras
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientObraImportModal;
