import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import { companyService } from '@/services/companyService';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, RefreshCw, X, Info, Building2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VehicleImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialCompanyId?: string;
}

interface ImportResult {
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export const VehicleImportModal: React.FC<VehicleImportModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  initialCompanyId
}) => {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Seleção de Empresa para Super Admin / Flex Admin
  const canSelectCompany = hasRole('SUPER_ADMIN') || hasRole('FLEX_ADMIN');
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(initialCompanyId || user?.companyId || '');

  useEffect(() => {
    if (open) {
      if (initialCompanyId) {
        setSelectedCompanyId(initialCompanyId);
      } else if (!canSelectCompany && user?.companyId) {
        setSelectedCompanyId(user.companyId);
      }

      if (canSelectCompany) {
        loadCompanies();
      }
    }
  }, [open, initialCompanyId, canSelectCompany, user?.companyId]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const data = await companyService.getAllCompanies();
      setCompanies(data || []);
      if (!selectedCompanyId && data && data.length > 0) {
        // Pre-selecionar empresa atual se encontrada, senão a primeira
        const defaultComp = data.find((c: any) => c.id === user?.companyId) || data[0];
        setSelectedCompanyId(defaultComp.id);
      }
    } catch (err) {
      console.error('Erro ao carregar empresas para importação:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls', '.xlsb'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      toast({
        title: "Formato inválido",
        description: "Selecione um arquivo Excel válido (.xlsx, .xls ou .xlsb).",
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
        description: "Selecione uma planilha Excel para importar.",
        variant: "destructive"
      });
      return;
    }

    if (canSelectCompany && !selectedCompanyId) {
      toast({
        title: "Selecione uma Empresa",
        description: "É obrigatório selecionar a empresa/cliente de destino para importar os veículos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const data = await fleetService.importVehiclesExcel(file, selectedCompanyId || undefined);
      setResult(data);

      toast({
        title: "Importação Concluída!",
        description: `Processamento finalizado. Inseridos: ${data.inserted}, Atualizados: ${data.updated}, Ignorados: ${data.skipped}.`,
        variant: data.inserted > 0 || data.updated > 0 ? "default" : "destructive"
      });

      if (data.inserted > 0 || data.updated > 0) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao processar arquivo Excel.';
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

  const selectedCompanyName = companies.find(c => c.id === selectedCompanyId)?.name || user?.companyName || 'Empresa Atual';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-seguranca-graphite border-gray-700 text-seguranca-lightgray max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-seguranca-lightgray flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-seguranca-yellow" />
            Importação de Veículos por Excel
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Envie sua planilha de veículos (.xlsx / .xls / .xlsb). O sistema analisa abas de patrimônio da frota com divisão por categorias.
          </DialogDescription>
        </DialogHeader>

        {/* Seletor de Empresa / Cliente */}
        <div className="bg-seguranca-black/70 border border-gray-700/80 rounded-xl p-4 space-y-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="h-4 w-4 text-seguranca-yellow" />
            Empresa / Cliente de Destino
          </label>
          {canSelectCompany ? (
            <div className="space-y-1">
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                disabled={loading || loadingCompanies}
                className="w-full bg-seguranca-graphite border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-seguranca-yellow transition-colors"
              >
                <option value="">Selecione uma empresa...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400">
                Como Super Administrador, os veículos importados serão vinculados exclusivamente à empresa selecionada acima.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-seguranca-graphite/80 px-3 py-2.5 rounded-lg border border-gray-700">
              <span className="text-sm font-medium text-white">{selectedCompanyName}</span>
              <span className="text-xs text-seguranca-yellow bg-seguranca-yellow/10 border border-seguranca-yellow/30 px-2 py-0.5 rounded">
                Sua Empresa
              </span>
            </div>
          )}
        </div>

        {/* Informações das Colunas Mapeadas */}
        <Alert className="bg-seguranca-black/60 border-seguranca-yellow/30 text-gray-300 py-3">
          <Info className="h-4 w-4 text-seguranca-yellow" />
          <AlertTitle className="text-seguranca-yellow font-bold text-xs uppercase tracking-wider mb-1">
            Regras de Mapeamento Automático
          </AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <p>• <strong>Placa / Patrimônio:</strong> Coluna <code className="text-seguranca-yellow">PATRIMÔNIO</code> ou <code className="text-seguranca-yellow">Placa</code>.</p>
            <p>• <strong>Campos Técnicos:</strong> <code className="text-seguranca-yellow">Chassi</code>, <code className="text-seguranca-yellow">Renavam</code>, <code className="text-seguranca-yellow">Modelo</code>, <code className="text-seguranca-yellow">Ano/Mod</code>.</p>
            <p>• <strong>Categorias Reconhecidas por Seção:</strong> Ônibus Rodoviários, Ônibus Luxo Turismo (Double Decker), Vans, Micro Ônibus, Ônibus Urbanos, Carros Utilitários e Agregados.</p>
            <p>• <strong>Atualização Resiliente:</strong> Veículos existentes terão seus dados atualizados e reativados automaticamente.</p>
          </AlertDescription>
        </Alert>

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
              id="excel-file-input"
              accept=".xlsx, .xls, .xlsb"
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
              <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="p-4 bg-seguranca-yellow/10 rounded-full border border-seguranca-yellow/20 text-seguranca-yellow">
                  <Upload className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-semibold text-seguranca-lightgray text-sm">
                    Arraste a planilha de veículos aqui ou <span className="text-seguranca-yellow underline">clique para procurar</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Formatos suportados: .xlsx, .xls, .xlsb</p>
                </div>
              </label>
            )}
          </div>
        )}

        {/* Exibição de Resultados da Importação */}
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-seguranca-black/60 rounded-lg border border-gray-700">
                <span className="text-xs text-gray-400 block">Total Lido</span>
                <span className="text-lg font-bold text-white">{result.totalRows}</span>
              </div>
              <div className="p-3 bg-green-950/40 rounded-lg border border-green-800/50">
                <span className="text-xs text-green-400 block">Inseridos</span>
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
                  <AlertTriangle className="h-4 w-4 text-yellow-500" /> Detalhes dos Avisos / Erros ({result.errors.length}):
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
                    Processar Importação
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

export default VehicleImportModal;
                  <p className="font-semibold text-seguranca-lightgray text-sm">
                    Arraste a planilha de veículos aqui ou <span className="text-seguranca-yellow underline">clique para procurar</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Formatos suportados: .xlsx, .xls, .xlsb</p>
                </div>
              </label>
            )}
          </div>
        )}

        {/* Exibição de Resultados da Importação */}
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-seguranca-black/60 rounded-lg border border-gray-700">
                <span className="text-xs text-gray-400 block">Total Lido</span>
                <span className="text-lg font-bold text-white">{result.totalRows}</span>
              </div>
              <div className="p-3 bg-green-950/40 rounded-lg border border-green-800/50">
                <span className="text-xs text-green-400 block">Inseridos</span>
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
                  <AlertTriangle className="h-4 w-4 text-yellow-500" /> Detalhes dos Avisos / Erros ({result.errors.length}):
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
                    Processar Importação
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

export default VehicleImportModal;
