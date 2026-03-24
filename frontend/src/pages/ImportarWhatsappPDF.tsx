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
  Users,
  Download,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface ImportResult {
  success: boolean;
  message: string;
  totalProcessed?: number;
  totalSuccess?: number;
  totalErrors?: number;
  errors?: string[];
}

const ImportarWhatsappPDF: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo PDF válido.",
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
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/employees/import/whatsapp-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult({
        success: true,
        message: response.data.message || 'Importação realizada com sucesso!',
        totalProcessed: response.data.totalProcessed,
        totalSuccess: response.data.totalSuccess,
        totalErrors: response.data.totalErrors,
        errors: response.data.errors
      });

      toast({
        title: "Sucesso",
        description: "Funcionários importados com sucesso!",
      });

      // Limpar arquivo após sucesso
      setSelectedFile(null);
      const fileInput = document.getElementById('pdf-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('Erro ao importar:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao processar o arquivo PDF.';
      
      setResult({
        success: false,
        message: errorMessage,
        errors: error.response?.data?.errors
      });

      toast({
        title: "Erro na importação",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Template de exemplo - ajustar conforme necessário
    toast({
      title: "Download de Template",
      description: "Funcionalidade em desenvolvimento. Use um PDF de conversa do WhatsApp exportado.",
    });
  };

  return (
    <StandardLayout
      title="Importar Funcionários via WhatsApp (PDF)"
      subtitle="Importe dados de funcionários através de conversas exportadas do WhatsApp"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Instruções */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Como usar esta funcionalidade:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                <li>Exporte a conversa do WhatsApp contendo os dados dos funcionários em formato PDF</li>
                <li>Selecione o arquivo PDF exportado</li>
                <li>Clique em "Processar Importação"</li>
                <li>Aguarde o processamento e verifique os resultados</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        {/* Card de Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-seguranca-yellow" />
              Upload de Arquivo PDF
            </CardTitle>
            <CardDescription>
              Selecione o arquivo PDF da conversa do WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-file">Arquivo PDF</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  disabled={uploading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exemplo
                </Button>
              </div>
              {selectedFile && (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-black"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Processar Importação
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado da Importação */}
        {result && (
          <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Importação Concluída
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Erro na Importação
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className={result.success ? 'border-green-500' : 'border-red-500'}>
                <AlertDescription>
                  {result.message}
                </AlertDescription>
              </Alert>

              {result.totalProcessed !== undefined && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-seguranca-graphite p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Total Processados</p>
                    <p className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {result.totalProcessed}
                    </p>
                  </div>
                  <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/30">
                    <p className="text-sm text-gray-400">Sucesso</p>
                    <p className="text-2xl font-bold text-green-500 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      {result.totalSuccess}
                    </p>
                  </div>
                  <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30">
                    <p className="text-sm text-gray-400">Erros</p>
                    <p className="text-2xl font-bold text-red-500 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      {result.totalErrors}
                    </p>
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-red-500">Erros Encontrados:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Informações Adicionais */}
        <Card className="bg-seguranca-graphite">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-400">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-seguranca-yellow flex-shrink-0" />
              <p>O PDF deve ser exportado diretamente do WhatsApp (Configurações → Exportar conversa)</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-seguranca-yellow flex-shrink-0" />
              <p>As mensagens devem seguir um formato específico para que os dados sejam extraídos corretamente</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-seguranca-yellow flex-shrink-0" />
              <p>Funcionários já cadastrados serão atualizados se houver correspondência por CPF</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-seguranca-yellow flex-shrink-0" />
              <p>Após a importação, revise os dados cadastrados na lista de funcionários</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default ImportarWhatsappPDF;

