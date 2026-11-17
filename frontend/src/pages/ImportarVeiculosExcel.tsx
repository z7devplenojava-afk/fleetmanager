import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Bus, 
  Building2, 
  RefreshCw, 
  X, 
  Info,
  ArrowRight,
  ShieldAlert,
  Car
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { companyService } from '@/services/companyService';
import fleetService from '@/services/fleetService';
import { useNavigate } from 'react-router-dom';

interface ImportResult {
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export const ImportarVeiculosExcel: React.FC = () => {
  const { toast } = useToast();
  const { user, empresa, hasRole } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Seleção Multi-Empresa
  const isSuperAdmin = hasRole('SUPER_ADMIN') || hasRole('FLEX_ADMIN');
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(user?.companyId || empresa?.id || '');

  useEffect(() => {
    const compId = user?.companyId || empresa?.id || '';
    if (isSuperAdmin) {
      loadCompanies();
    } else if (compId) {
      setSelectedCompanyId(compId);
      if (!empresa?.nome && !user?.companyName) {
        companyService.getCompanyById(compId).then((comp) => {
          if (comp?.name || comp?.nome) {
            setCompanies([{ id: compId, name: comp.name || comp.nome }]);
          }
        }).catch(() => {});
      }
    }
  }, [isSuperAdmin, user?.companyId, empresa?.id, empresa?.nome, user?.companyName]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const data = await companyService.getAllCompanies();
      setCompanies(data || []);
      const targetCompId = selectedCompanyId || user?.companyId || empresa?.id;
      if (data && data.length > 0) {
        const defaultComp = (targetCompId && data.find((c: any) => c.id === targetCompId)) || data[0];
        if (defaultComp) {
          setSelectedCompanyId(defaultComp.id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar lista de empresas:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
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

    if (isSuperAdmin && !selectedCompanyId) {
      toast({
        title: "Selecione uma Empresa",
        description: "Selecione a empresa/cliente de destino para vincular os veículos importados.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const targetCompanyId = selectedCompanyId || user?.companyId || empresa?.id || undefined;
      const data = await fleetService.importVehiclesExcel(file, targetCompanyId);
      setResult(data);

      toast({
        title: "Importação Concluída com Sucesso!",
        description: `Processados: ${data.totalRows} | Inseridos: ${data.inserted} | Atualizados: ${data.updated} | Ignorados: ${data.skipped}.`,
        variant: data.inserted > 0 || data.updated > 0 ? "default" : "destructive"
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao processar planilha de veículos.';
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

  const currentCompanyName =
    companies.find(c => c.id === selectedCompanyId)?.name ||
    empresa?.nome ||
    user?.companyName ||
    (user as any)?.company?.name ||
    'Sua Empresa';

  return (
    <StandardLayout
      title="Importação de Veículos (Excel / XLSB)"
      subtitle="Importação e atualização em lote de frotas com identificação inteligente de categorias e suporte multi-empresa."
    >
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Card Principal de Configuração */}
        <Card className="bg-seguranca-graphite border-gray-700 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2.5">
              <Bus className="h-6 w-6 text-seguranca-yellow" />
              Mapeamento e Vínculo de Frota
            </CardTitle>
            <CardDescription className="text-gray-400">
              O motor de importação lê automaticamente planilhas com formato de patrimônio (ex: <code>PATRIMÔNIO VSS - FROTA</code>), categorizando veículos por seção e atualizando cadastros já existentes.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            
            {/* Seletor de Empresa / Cliente */}
            <div className="bg-seguranca-black/60 border border-gray-700 rounded-xl p-4 space-y-2.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-seguranca-yellow" />
                Empresa / Cliente Destino
              </label>

              {isSuperAdmin ? (
                <div className="space-y-1.5">
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    disabled={loading || loadingCompanies}
                    className="w-full bg-seguranca-graphite border border-gray-600 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-seguranca-yellow transition-colors"
                  >
                    <option value="">Selecione a empresa cliente...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400">
                    Como Super Administrador, você pode direcionar a frota para qualquer empresa (ex: <strong>Viação São Silvestre</strong>, <strong>FluxBus</strong> ou outro cliente).
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-seguranca-graphite/80 px-4 py-3 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-semibold text-white">{currentCompanyName}</span>
                  </div>
                  <span className="text-xs text-seguranca-yellow bg-seguranca-yellow/10 border border-seguranca-yellow/30 px-2.5 py-1 rounded-md font-medium">
                    Sua Empresa
                  </span>
                </div>
              )}
            </div>

            {/* Banner com as Regras de Negócio e Seções Identificadas */}
            <Alert className="bg-seguranca-black/80 border-seguranca-yellow/40 text-gray-300 py-3.5">
              <Info className="h-5 w-5 text-seguranca-yellow shrink-0 mt-0.5" />
              <div className="ml-2 space-y-2">
                <AlertTitle className="text-seguranca-yellow font-bold text-xs uppercase tracking-wider">
                  Colunas & Categorias Mapeadas
                </AlertTitle>
                <AlertDescription className="text-xs space-y-1.5 leading-relaxed">
                  <p>
                    • <strong>Colunas Técnicas:</strong> <code className="text-seguranca-yellow font-bold">PATRIMÔNIO (Placa)</code>, <code className="text-seguranca-yellow">CHASSI</code>, <code className="text-seguranca-yellow">RENAVAM</code>, <code className="text-seguranca-yellow">MODELO</code>, <code className="text-seguranca-yellow">ANO/MOD.</code>
                  </p>
                  <p>
                    • <strong>Categorias Reconhecidas por Seção:</strong> Ônibus Rodoviários, Ônibus Luxo Turismo (Double Decker), Vans, Micro Ônibus, Ônibus Urbanos, Carros Utilitários e Veículos Agregados/Locados.
                  </p>
                  <p>
                    • <strong>Política de Atualização (Opção A):</strong> Se o veículo com a mesma placa já existir na empresa, seus dados cadastrais são atualizados e o status é reativado automaticamente.
                  </p>
                </AlertDescription>
              </div>
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
                  id="excel-file-page-input"
                  accept=".xlsx, .xls, .xlsb"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />

                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3.5 bg-green-500/20 rounded-full border border-green-500/30 text-green-400">
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
                      className="text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 mt-1"
                    >
                      <X className="h-4 w-4 mr-1" /> Remover Arquivo
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="excel-file-page-input" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="p-4 bg-seguranca-yellow/10 rounded-full border border-seguranca-yellow/20 text-seguranca-yellow">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-seguranca-lightgray text-sm">
                        Arraste a planilha de frota aqui ou <span className="text-seguranca-yellow underline font-bold">clique para procurar</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Formatos aceitos: Excel (.xlsx, .xls, .xlsb binário)</p>
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* Painel de Resultados */}
            {result && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-4 bg-seguranca-black/70 rounded-xl border border-gray-700">
                    <span className="text-xs text-gray-400 block font-medium">Total Lido</span>
                    <span className="text-2xl font-bold text-white mt-1 block">{result.totalRows}</span>
                  </div>
                  <div className="p-4 bg-green-950/40 rounded-xl border border-green-800/60">
                    <span className="text-xs text-green-400 block font-medium">Inseridos</span>
                    <span className="text-2xl font-bold text-green-400 mt-1 block">+{result.inserted}</span>
                  </div>
                  <div className="p-4 bg-blue-950/40 rounded-xl border border-blue-800/60">
                    <span className="text-xs text-blue-400 block font-medium">Atualizados</span>
                    <span className="text-2xl font-bold text-blue-400 mt-1 block">{result.updated}</span>
                  </div>
                  <div className="p-4 bg-yellow-950/40 rounded-xl border border-yellow-800/60">
                    <span className="text-xs text-yellow-400 block font-medium">Ignorados</span>
                    <span className="text-2xl font-bold text-yellow-400 mt-1 block">{result.skipped}</span>
                  </div>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-yellow-500" /> Detalhes dos Avisos / Linhas ({result.errors.length}):
                    </span>
                    <div className="bg-seguranca-black/90 border border-gray-700 rounded-xl p-3.5 max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
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

            {/* Ações / Botões */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-700">
              {result ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Importar Outra Planilha
                  </Button>
                  <Button
                    type="button"
                    onClick={() => navigate('/frota')}
                    className="w-full sm:w-auto bg-seguranca-yellow hover:bg-yellow-500 text-black font-bold"
                  >
                    Ver Frota Atualizada <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImport}
                    disabled={!file || loading}
                    className="w-full sm:w-auto bg-seguranca-yellow hover:bg-yellow-500 text-black font-bold h-10 px-6 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando Importação...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Iniciar Importação de Veículos
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

          </CardContent>
        </Card>

      </div>
    </StandardLayout>
  );
};

export default ImportarVeiculosExcel;
