import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Banknote,
  Download,
  Info,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface ImportResult {
  totalRows?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
}

const ImportarDadosBancarios: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroEnabled.12'
      ];
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo CSV ou Excel (.csv, .xlsx, .xls).",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione um arquivo CSV ou Excel.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/api/funcionarios/import-banking', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult({
        totalRows: response.data.totalRows,
        inserted: response.data.inserted,
        updated: response.data.updated,
        skipped: response.data.skipped,
        errors: response.data.errors
      });

      toast({
        title: "Sucesso",
        description: `Importação concluída! ${response.data.updated || 0} funcionários atualizados.`,
      });

      // Limpar arquivo após sucesso
      setSelectedFile(null);
      const fileInput = document.getElementById('banking-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('Erro ao importar:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0] || 'Erro ao processar o arquivo.';
      
      setResult({
        totalRows: error.response?.data?.totalRows || 0,
        inserted: error.response?.data?.inserted || 0,
        updated: error.response?.data?.updated || 0,
        skipped: error.response?.data?.skipped || 0,
        errors: error.response?.data?.errors || [errorMessage]
      });

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Criar template CSV
    const csvContent = "nome,agencia,contaCorrente,banco\nJoão Silva,1234,567890-1,Banco do Brasil\nMaria Santos,5678,987654-3,Caixa Econômica";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_dados_bancarios.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <StandardLayout title="Importar Dados Bancários">
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-seguranca-lightgray">Importar Dados Bancários</h1>
          <p className="text-gray-400 mt-1">
            Importe dados bancários (agência e conta corrente) de funcionários através de arquivo CSV ou Excel
          </p>
        </div>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Banknote className="h-5 w-5 text-seguranca-yellow" />
              Upload de Arquivo
            </CardTitle>
            <CardDescription className="text-gray-400">
              Selecione um arquivo CSV ou Excel (.csv, .xlsx, .xls) contendo os dados bancários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Instruções */}
            <Alert className="bg-seguranca-black/50 border-yellow-600">
              <Info className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-gray-300">
                <div className="space-y-2">
                  <p className="font-semibold text-yellow-400">Formato do arquivo:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>O arquivo deve conter as colunas: <strong>nome</strong>, <strong>agencia</strong>, <strong>contaCorrente</strong> (e opcionalmente <strong>banco</strong>)</li>
                    <li>A primeira linha pode ser o cabeçalho (será ignorada)</li>
                    <li>O sistema buscará o funcionário pelo <strong>nome</strong> (case-insensitive)</li>
                    <li>Se o nome do funcionário for encontrado, os dados bancários serão atualizados</li>
                    <li>Funcionários não encontrados serão ignorados</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* Upload */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="banking-file" className="text-seguranca-lightgray mb-2 block">
                  Selecione o arquivo
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="banking-file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-seguranca-yellow file:text-seguranca-black hover:file:bg-yellow-500"
                    disabled={uploading}
                  />
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="border-gray-600 text-seguranca-lightgray hover:bg-gray-600"
                    disabled={uploading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Template
                  </Button>
                </div>
                {selectedFile && (
                  <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="bg-seguranca-yellow hover:bg-yellow-500 text-seguranca-black font-semibold w-full sm:w-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Dados Bancários
                  </>
                )}
              </Button>
            </div>

            {/* Resultado */}
            {result && (
              <div className="space-y-4">
                <Alert className={result.updated && result.updated > 0 ? "bg-green-900/20 border-green-600" : "bg-yellow-900/20 border-yellow-600"}>
                  {result.updated && result.updated > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className={`font-semibold ${result.updated && result.updated > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                        Importação Concluída
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Total de linhas:</span>
                          <p className="font-semibold text-white">{result.totalRows || 0}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Atualizados:</span>
                          <p className="font-semibold text-green-400">{result.updated || 0}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Ignorados:</span>
                          <p className="font-semibold text-yellow-400">{result.skipped || 0}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Erros:</span>
                          <p className="font-semibold text-red-400">{result.errors?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Lista de erros */}
                {result.errors && result.errors.length > 0 && (
                  <Alert className="bg-red-900/20 border-red-600">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription>
                      <p className="font-semibold text-red-400 mb-2">Erros encontrados:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 max-h-60 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default ImportarDadosBancarios;


































