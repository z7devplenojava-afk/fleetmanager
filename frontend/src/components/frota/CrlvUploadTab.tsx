import React, { useState } from 'react';
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
  FileCheck,
  ShieldCheck,
  Search,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CrlvUploadTabProps {
  onSuccess: () => void;
}

export const CrlvUploadTab: React.FC<CrlvUploadTabProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrlvImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filterAction, setFilterAction] = useState<'ALL' | 'UPDATED' | 'CREATED' | 'ERROR'>('ALL');

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
        description: 'Apenas arquivos em formato PDF (CRLV / DUT Digital) são suportados.',
        variant: 'destructive'
      });
    }

    if (validPdfs.length === 0) return;

    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const filtered = validPdfs.filter(f => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
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

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({
        title: 'Nenhum arquivo',
        description: 'Selecione ou arraste ao menos um arquivo PDF de CRLV para importar.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const data = await fleetService.importCrlvBatch(files);
      setResult(data);

      toast({
        title: 'Importação Finalizada!',
        description: `${data.updated} veículo(s) atualizado(s) e ${data.inserted} novo(s) cadastrado(s).`,
        variant: data.inserted > 0 || data.updated > 0 ? 'default' : 'destructive'
      });

      if (data.inserted > 0 || data.updated > 0) {
        onSuccess();
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Falha ao processar arquivos.';
      toast({
        title: 'Erro no processamento',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = React.useMemo(() => {
    if (!result?.items) return [];
    if (filterAction === 'ALL') return result.items;
    return result.items.filter(item => item.action === filterAction);
  }, [result, filterAction]);

  return (
    <div className="space-y-6">
      {/* Banner Principal */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-seguranca-darkgray border border-blue-700/40 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400">
              <FileCheck className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Upload e Enriquecimento Automático via CRLV / DUT
                <Badge className="bg-blue-600/30 text-blue-300 border-blue-500 text-[10px]">
                  IA & OCR Nativo
                </Badge>
              </h2>
              <p className="text-gray-300 text-sm mt-1 max-w-3xl leading-relaxed">
                Envie os certificados digitais (CRLV-e / DUT) emitidos pelo DETRAN / Gov.br em formato PDF.
                O sistema lê a placa do veículo: se ela já existir na frota, preenche com precisão os dados que estiverem em branco (Chassi, RENAVAM, Marca, Modelo, Ano, Cor, Capacidade, Potência, etc.) sem alterar o que já foi preenchido manualmente. Se a placa for nova, cadastra o veículo automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Área de Upload e Pré-visualização */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dropzone Principal */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                : 'border-gray-600 bg-seguranca-black/50 hover:border-blue-400/60'
            }`}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="crlv-tab-input"
            />
            <label htmlFor="crlv-tab-input" className="cursor-pointer block">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-gray-800 rounded-full text-blue-400 border border-gray-700 shadow-lg">
                  <Upload className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-semibold text-white text-base">
                    Clique para selecionar ou arraste seus arquivos PDF de CRLV
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Suporta upload de dezenas de CRLVs simultaneamente em lote (.pdf)
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Lista de Arquivos Prontos para Processamento */}
          {files.length > 0 && (
            <div className="bg-seguranca-graphite border border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  Arquivos prontos para análise ({files.length})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    disabled={loading}
                    className="text-xs text-red-400 hover:text-red-300 h-8"
                  >
                    Remover todos
                  </Button>
                  <Button
                    type="button"
                    onClick={handleProcess}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-4 flex items-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processando ({files.length})...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Processar e Importar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-gray-800/80 border border-gray-700 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="h-4 w-4 text-red-400 shrink-0" />
                      <span className="text-white font-medium truncate">{file.name}</span>
                      <span className="text-gray-400 shrink-0">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    {!loading && (
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-gray-400 hover:text-red-400 p-1 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Guia de Campos Extraídos */}
        <div className="bg-seguranca-graphite border border-gray-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Info className="h-4 w-4 text-blue-400" />
            <span>Campos Extraídos do CRLV-e</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            O motor de extração analisa os campos oficiais do documento e realiza o preenchimento automático inteligente:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-gray-800/50 rounded border border-gray-700/60">
              <span className="text-gray-400 block text-[10px]">Chave Primária</span>
              <strong className="text-white">Placa do Veículo</strong>
            </div>
            <div className="p-2 bg-gray-800/50 rounded border border-gray-700/60">
              <span className="text-gray-400 block text-[10px]">Documentação</span>
              <strong className="text-white">RENAVAM & Chassi</strong>
            </div>
            <div className="p-2 bg-gray-800/50 rounded border border-gray-700/60">
              <span className="text-gray-400 block text-[10px]">Identificação</span>
              <strong className="text-white">Marca / Modelo</strong>
            </div>
            <div className="p-2 bg-gray-800/50 rounded border border-gray-700/60">
              <span className="text-gray-400 block text-[10px]">Cronologia</span>
              <strong className="text-white">Ano Fab. / Ano Mod.</strong>
            </div>
            <div className="p-2 bg-gray-800/50 rounded border border-gray-700/60">
              <span className="text-gray-400 block text-[10px]">Especificações</span>
              <strong className="text-white">Combustível / Cor</strong>
            </div>
            <div className="p-2 bg-gray-800/50 rounded border border-gray-700/60">
              <span className="text-gray-400 block text-[10px]">Técnico</span>
              <strong className="text-white">Capacidade / Lotação</strong>
            </div>
            <div className="p-2 bg-gray-800/50 rounded border border-gray-700/60">
              <span className="text-gray-400 block text-[10px]">Mecânica</span>
              <strong className="text-white">Potência CV / Peso PBT</strong>
            </div>
            <div className="p-2 bg-gray-800/50 rounded border border-gray-700/60">
              <span className="text-gray-400 block text-[10px]">Estrutura</span>
              <strong className="text-white">Eixos / Nº Motor</strong>
            </div>
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-lg text-[11px] text-blue-200">
            🔒 <strong>Garantia de Não Sobrescrita:</strong> Dados manuais já preenchidos por você são 100% preservados. O importador apenas preenche os campos vazios.
          </div>
        </div>
      </div>

      {/* Relatório de Resultados */}
      {result && (
        <div className="space-y-4 pt-4 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                Resultado do Processamento
              </h3>
              <p className="text-xs text-gray-400">
                Resumo da importação dos {result.totalFiles} arquivo(s) analisados.
              </p>
            </div>

            {/* Filtros de Ação */}
            <div className="flex items-center gap-1.5 bg-gray-900/60 p-1 rounded-lg border border-gray-700">
              <Button
                type="button"
                size="sm"
                variant={filterAction === 'ALL' ? 'default' : 'ghost'}
                onClick={() => setFilterAction('ALL')}
                className="text-xs h-7 px-2.5"
              >
                Todos ({result.items.length})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filterAction === 'UPDATED' ? 'default' : 'ghost'}
                onClick={() => setFilterAction('UPDATED')}
                className="text-xs h-7 px-2.5 text-blue-300"
              >
                Atualizados ({result.updated})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filterAction === 'CREATED' ? 'default' : 'ghost'}
                onClick={() => setFilterAction('CREATED')}
                className="text-xs h-7 px-2.5 text-green-300"
              >
                Novos ({result.inserted})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filterAction === 'ERROR' ? 'default' : 'ghost'}
                onClick={() => setFilterAction('ERROR')}
                className="text-xs h-7 px-2.5 text-red-300"
              >
                Erros ({result.errors.length})
              </Button>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-800/40 border border-gray-700 p-4 rounded-xl">
              <span className="text-xs text-gray-400">Total Processado</span>
              <p className="text-2xl font-bold text-white mt-1">{result.totalFiles}</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-700/40 p-4 rounded-xl">
              <span className="text-xs text-blue-400">Veículos Atualizados</span>
              <p className="text-2xl font-bold text-blue-300 mt-1">{result.updated}</p>
            </div>
            <div className="bg-green-900/20 border border-green-700/40 p-4 rounded-xl">
              <span className="text-xs text-green-400">Novos Cadastrados</span>
              <p className="text-2xl font-bold text-green-300 mt-1">{result.inserted}</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-700/40 p-4 rounded-xl">
              <span className="text-xs text-amber-400">Sem Alterações / Ignorados</span>
              <p className="text-2xl font-bold text-amber-300 mt-1">{result.skipped}</p>
            </div>
          </div>

          {/* Tabela Detalhada */}
          <div className="border border-gray-700 rounded-xl overflow-hidden bg-seguranca-graphite shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-800/90 text-gray-400 uppercase font-semibold text-[11px] border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3">Arquivo</th>
                    <th className="px-4 py-3">Placa</th>
                    <th className="px-4 py-3">Modelo / Marca</th>
                    <th className="px-4 py-3">Chassi / RENAVAM</th>
                    <th className="px-4 py-3 text-center">Ação Realizada</th>
                    <th className="px-4 py-3">Campos Preenchidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/60">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-gray-300 truncate max-w-[180px]">
                          {item.fileName}
                        </td>
                        <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                          {item.plate || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {item.brand ? (
                            <div>
                              <span className="font-semibold text-white">{item.brand}</span>
                              <div className="text-[11px] text-gray-400">{item.model}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">
                          {item.chassisNumber && <div>Chassi: {item.chassisNumber}</div>}
                          {item.renavam && <div>RENAVAM: {item.renavam}</div>}
                          {!item.chassisNumber && !item.renavam && '-'}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {item.action === 'CREATED' && (
                            <Badge className="bg-green-900/60 text-green-300 border-green-700 text-xs px-2 py-0.5">
                              Novo Veículo Criado
                            </Badge>
                          )}
                          {item.action === 'UPDATED' && (
                            <Badge className="bg-blue-900/60 text-blue-300 border-blue-700 text-xs px-2 py-0.5">
                              Veículo Atualizado
                            </Badge>
                          )}
                          {item.action === 'SKIPPED' && (
                            <Badge className="bg-gray-800 text-gray-400 border-gray-600 text-xs px-2 py-0.5">
                              Já Preenchido
                            </Badge>
                          )}
                          {item.action === 'ERROR' && (
                            <Badge className="bg-red-900/60 text-red-300 border-red-700 text-xs px-2 py-0.5">
                              Erro de Extração
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.updatedFields && item.updatedFields.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.updatedFields.map((f, fi) => (
                                <span
                                  key={fi}
                                  className="bg-blue-950/70 text-blue-300 border border-blue-800 rounded px-1.5 py-0.5 text-[10px]"
                                >
                                  +{f}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[11px]">{item.message}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                        Nenhum registro para o filtro selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
