import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { payrollClosureService, PontoImportJob } from '@/services/payrollClosureService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ImportarBatidas: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importJobs, setImportJobs] = useState<PontoImportJob[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadImportJobs();
  }, []);

  const loadImportJobs = async () => {
    try {
      setLoading(true);
      const response = await payrollClosureService.getImportJobs();
      setImportJobs(response.data || response || []);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao carregar histórico de importações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Validar se é JSON
      if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
        toast({
          title: 'Erro',
          description: 'Por favor, selecione um arquivo JSON',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const response = await payrollClosureService.importFromFile(file);
      toast({
        title: 'Sucesso',
        description: 'Arquivo enviado com sucesso. Processamento em andamento...',
      });
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Recarregar lista após um delay
      setTimeout(() => {
        loadImportJobs();
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao importar arquivo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      PENDING: { variant: 'outline', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      PROCESSING: { variant: 'secondary', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      COMPLETED: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      FAILED: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
      CANCELLED: { variant: 'outline', icon: <XCircle className="h-3 w-3" /> },
    };

    const statusConfig = variants[status] || variants.PENDING;
    
    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        {statusConfig.icon}
        {status === 'PENDING' && 'Pendente'}
        {status === 'PROCESSING' && 'Processando'}
        {status === 'COMPLETED' && 'Concluído'}
        {status === 'FAILED' && 'Falhou'}
        {status === 'CANCELLED' && 'Cancelado'}
      </Badge>
    );
  };

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/rh/fechamento-horas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Importar Batidas</h1>
            <p className="text-muted-foreground mt-1">
              Importe arquivos JSON com batidas do ponto eletrônico
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enviar Arquivo</CardTitle>
          <CardDescription>
            Selecione um arquivo JSON contendo as batidas do ponto eletrônico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              id="file-input"
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              disabled={uploading}
              className="flex-1"
            />
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </div>

          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Arquivo selecionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O arquivo JSON deve conter um array de objetos com os seguintes campos:
              <code className="block mt-2 p-2 bg-muted rounded text-sm">
                {`[{ "employeeId": "uuid", "timestamp": "2024-01-15T08:00:00", "tipo": "ENTRADA" }]`}
              </code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Histórico de Importações</CardTitle>
            <CardDescription>Últimas importações realizadas</CardDescription>
          </div>
          <Button variant="outline" onClick={loadImportJobs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : importJobs.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma importação encontrada.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Processados</TableHead>
                  <TableHead>Falhas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Concluído em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {job.fileName || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(job.importedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{job.totalRecords}</TableCell>
                    <TableCell className="text-green-600">
                      {job.processedRecords}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {job.failedRecords}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(job.status)}
                    </TableCell>
                    <TableCell>
                      {job.completedAt 
                        ? format(new Date(job.completedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </StandardLayout>
  );
};

export default ImportarBatidas;





