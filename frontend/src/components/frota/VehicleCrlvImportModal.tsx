import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import fleetService, { CrlvImportResult } from '@/services/fleetService';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  X,
  Info,
  Car,
  ShieldCheck,
  PlusCircle,
  FileCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VehicleCrlvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const VehicleCrlvImportModal: React.FC<VehicleCrlvImportModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrlvImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const addFiles = (newFiles: File[]) => {
    const validPdfs = newFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (validPdfs.length < newFiles.length) {
      toast({
        title: 'Formato não suportado',
        description: 'Alguns arquivos foram ignorados pois apenas arquivos PDF de CRLV são aceitos.',
        variant: 'destructive'
      });
    }

    if (validPdfs.length === 0) return;

    // Evita duplicatas pelo nome
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const filtered = validPdfs.filter(f => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
    setResult(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleImport = async () => {
    if (files.length === 0) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Selecione ao menos um arquivo PDF de CRLV.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const data = await fleetService.importCrlvBatch(files);
      setResult(data);

      toast({
        title: 'Processamento de CRLVs Concluído!',
        description: `Finalizado: ${data.updated} atualizado(s), ${data.inserted} novo(s) cadastrado(s), ${data.skipped} ignorado(s).`,
        variant: data.inserted > 0 || data.updated > 0 ? 'default' : 'destructive'
      });

      if (data.inserted > 0 || data.updated > 0) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao processar arquivos de CRLV.';
      toast({
        title: 'Erro na Importação',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-seguranca-darkgray border-gray-700 text-white max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                Importação Inteligente de CRLV / DUT (PDF)
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Envie um ou múltiplos arquivos PDF de CRLV-e para sincronizar e preencher automaticamente os dados da frota.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Caixa de Arrastar e Soltar */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 bg-seguranca-black/40 hover:border-gray-500'
            }`}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="crlv-file-input"
            />
            <label htmlFor="crlv-file-input" className="cursor-pointer block">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-gray-800 rounded-full text-blue-400 border border-gray-700">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="font-semibold text-gray-200">
                  Clique para selecionar ou arraste arquivos PDF de CRLV aqui
                </div>
                <div className="text-xs text-gray-400 max-w-md">
                  Suporta múltiplos arquivos simultâneos. Se a placa já existir no sistema, os campos em branco (Chassi, RENAVAM, Modelo, Ano, etc.) serão preenchidos. Se a placa for nova, o veículo será cadastrado automaticamente.
                </div>
              </div>
            </label>
          </div>

          {/* Lista de Arquivos Selecionados */}
          {files.length > 0 && !result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">
                  Arquivos selecionados ({files.length})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFiles}
                  className="text-xs text-red-400 hover:text-red-300 h-7 px-2"
                >
                  Limpar todos
                </Button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-gray-700/60 rounded-lg p-2 bg-seguranca-black/30">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-gray-800/60 border border-gray-700/40 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-red-400 shrink-0" />
                      <span className="text-gray-200 truncate">{file.name}</span>
                      <span className="text-gray-500 shrink-0">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-gray-400 hover:text-red-400 p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cards de Resumo após Processamento */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-800/40 border border-gray-700 p-3 rounded-lg text-center">
                  <span className="text-xs text-gray-400">Total Analisado</span>
                  <p className="text-xl font-bold text-white mt-0.5">{result.totalFiles}</p>
                </div>
                <div className="bg-blue-900/20 border border-blue-700/40 p-3 rounded-lg text-center">
                  <span className="text-xs text-blue-400">Atualizados</span>
                  <p className="text-xl font-bold text-blue-300 mt-0.5">{result.updated}</p>
                </div>
                <div className="bg-green-900/20 border border-green-700/40 p-3 rounded-lg text-center">
                  <span className="text-xs text-green-400">Novos Criados</span>
                  <p className="text-xl font-bold text-green-300 mt-0.5">{result.inserted}</p>
                </div>
                <div className="bg-amber-900/20 border border-amber-700/40 p-3 rounded-lg text-center">
                  <span className="text-xs text-amber-400">Ignorados / Sem alt.</span>
                  <p className="text-xl font-bold text-amber-300 mt-0.5">{result.skipped}</p>
                </div>
              </div>

              {/* Tabela de Itens Processados */}
              <div className="border border-gray-700 rounded-lg overflow-hidden bg-seguranca-black/40">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-gray-800/80 text-gray-400 font-semibold sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Arquivo</th>
                        <th className="px-3 py-2">Placa</th>
                        <th className="px-3 py-2">Modelo / Marca</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {result.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-800/30">
                          <td className="px-3 py-2 font-mono text-gray-400 truncate max-w-[150px]">
                            {item.fileName}
                          </td>
                          <td className="px-3 py-2 font-bold text-white">
                            {item.plate || '-'}
                          </td>
                          <td className="px-3 py-2">
                            {item.brand ? `${item.brand} ${item.model || ''}` : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {item.action === 'CREATED' && (
                              <Badge className="bg-green-900/50 text-green-300 border-green-700 text-[10px]">
                                Novo Cadastrado
                              </Badge>
                            )}
                            {item.action === 'UPDATED' && (
                              <Badge className="bg-blue-900/50 text-blue-300 border-blue-700 text-[10px]">
                                Atualizado
                              </Badge>
                            )}
                            {item.action === 'SKIPPED' && (
                              <Badge className="bg-gray-800 text-gray-400 border-gray-600 text-[10px]">
                                Já completo
                              </Badge>
                            )}
                            {item.action === 'ERROR' && (
                              <Badge className="bg-red-900/50 text-red-300 border-red-700 text-[10px]">
                                Erro
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-300">
                            {item.updatedFields && item.updatedFields.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.updatedFields.map((f, fi) => (
                                  <span
                                    key={fi}
                                    className="bg-blue-950/60 text-blue-300 border border-blue-800/60 rounded px-1.5 py-0.5 text-[9px]"
                                  >
                                    +{f}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">{item.message}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-700 pt-4 flex items-center justify-between sm:justify-between w-full">
          <div>
            {result && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFiles}
                className="bg-gray-800 border-gray-600 text-gray-300 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Importar outros arquivos
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-gray-800 border-gray-600 text-gray-300"
            >
              {result ? 'Fechar' : 'Cancelar'}
            </Button>
            {!result && (
              <Button
                type="button"
                onClick={handleImport}
                disabled={loading || files.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando CRLVs...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Processar {files.length > 0 ? `(${files.length})` : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
