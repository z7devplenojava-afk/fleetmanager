import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import {
  Database, Server, HardDrive, Clock, Save, TestTube, 
  PlayCircle, Trash2, CheckCircle, XCircle, Loader2, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEO from '@/components/SEO';

interface BackupConfig {
  id?: string;
  name: string;
  type: 'LOCAL' | 'REMOTE';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  enabled: boolean;
  autoBackup: boolean;
  schedule: string;
  retentionDays: number;
  compressBackup: boolean;
  lastBackupDate?: string;
  lastBackupStatus?: string;
}

interface BackupHistory {
  id: string;
  backupDate: string;
  status: string;
  message: string;
  backupSizeBytes: number;
  durationSeconds: number;
}

interface GoogleDriveConfig {
  enabled: boolean;
  folderId: string;
  description: string;
}

const ConfiguracaoBackup: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  // Configurações
  const [localConfig, setLocalConfig] = useState<BackupConfig>({
    name: 'local',
    type: 'LOCAL',
    host: 'localhost',
    port: 5432,
    database: 'fluxbus_backup',
    username: 'postgres',
    password: '',
    enabled: true,
    autoBackup: true,
    schedule: '0 0 2 * * ?',
    retentionDays: 30,
    compressBackup: true,
  });

  const [vpsConfig, setVpsConfig] = useState<BackupConfig>({
    name: 'vps',
    type: 'REMOTE',
    host: '',
    port: 5432,
    database: 'vps_fluxbus_backup',
    username: '',
    password: '',
    enabled: true,
    autoBackup: true,
    schedule: '0 0 3 * * ?',
    retentionDays: 90,
    compressBackup: true,
  });

  const [googleDriveConfig, setGoogleDriveConfig] = useState<GoogleDriveConfig>({
    enabled: true,
    // Pasta compartilhada enviada pelo usuário
    folderId: '1QJrZ9Xk0wtJhOVZN_HEo61lKa9cfvwiS',
    description: 'Pasta padrão de backup no Google Drive',
  });

  const [history, setHistory] = useState<BackupHistory[]>([]);

  useEffect(() => {
    loadConfigurations();
    loadHistory();
  }, []);

  const loadConfigurations = async () => {
    try {
      const response = await api.get('/api/backup/configurations');
      const configs = response.data;

      const local = configs.find((c: any) => c.type === 'LOCAL');
      const remote = configs.find((c: any) => c.type === 'REMOTE');

      if (local) setLocalConfig(local);
      if (remote) setVpsConfig(remote);

    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleTestGoogleDrive = async () => {
    setTesting('GDRIVE');
    try {
      const response = await api.post('/api/backup/google-drive/test', googleDriveConfig);

      if (response.data.success) {
        toast({
          title: 'Configuração OK!',
          description: response.data.message || 'Teste de envio para Google Drive simulado com sucesso.',
        });
      } else {
        toast({
          title: 'Falha no teste do Google Drive',
          description: response.data.message || 'Não foi possível testar o envio para o Google Drive.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao testar Google Drive',
        variant: 'destructive',
      });
    } finally {
      setTesting(null);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get('/api/backup/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const handleTestConnection = async (type: 'LOCAL' | 'REMOTE') => {
    const config = type === 'LOCAL' ? localConfig : vpsConfig;
    setTesting(type);

    try {
      const response = await api.post('/api/backup/test-connection', config);
      
      if (response.data.success) {
        toast({
          title: "Conexão OK!",
          description: `Conexão com banco ${type === 'LOCAL' ? 'local' : 'VPS'} testada com sucesso.`,
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Falha ao testar conexão",
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  const handleSaveConfig = async (type: 'LOCAL' | 'REMOTE') => {
    const config = type === 'LOCAL' ? localConfig : vpsConfig;
    setLoading(true);

    try {
      await api.post('/api/backup/configurations', config);
      
      toast({
        title: "Sucesso!",
        description: `Configuração de backup ${type === 'LOCAL' ? 'local' : 'VPS'} salva.`,
      });

      loadConfigurations();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao salvar configuração",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteBackup = async (configId: string, type: string) => {
    setExecuting(type);

    try {
      const response = await api.post(`/api/backup/execute/${configId}`);
      
      if (response.data.success) {
        toast({
          title: "Backup Iniciado!",
          description: response.data.message,
        });
        
        // Recarregar histórico após 5 segundos
        setTimeout(() => loadHistory(), 5000);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao executar backup",
        variant: "destructive",
      });
    } finally {
      setExecuting(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <StandardLayout>
      <SEO
        title="Configuracao de Backup"
        description="Configure backups automaticos do banco de dados"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
            <Database className="h-8 w-8 text-seguranca-yellow" />
            Configuracao de Backup
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure backups automaticos em servidor local e VPS
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="local" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-seguranca-graphite">
            <TabsTrigger value="local">
              <HardDrive className="h-4 w-4 mr-2" />
              Backup Local
            </TabsTrigger>
            <TabsTrigger value="vps">
              <Server className="h-4 w-4 mr-2" />
              Backup VPS
            </TabsTrigger>
            <TabsTrigger value="gdrive">
              <Database className="h-4 w-4 mr-2" />
              Google Drive
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              Historico
            </TabsTrigger>
          </TabsList>

          {/* Backup Local */}
          <TabsContent value="local" className="space-y-4">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-blue-400" />
                  Backup Local
                </CardTitle>
                <CardDescription>
                  Backup no proprio servidor (fluxbus_backup)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Host</Label>
                    <Input
                      value={localConfig.host}
                      onChange={(e) => setLocalConfig({...localConfig, host: e.target.value})}
                      placeholder="localhost"
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Porta</Label>
                    <Input
                      type="number"
                      value={localConfig.port}
                      onChange={(e) => setLocalConfig({...localConfig, port: parseInt(e.target.value)})}
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nome do Banco</Label>
                    <Input
                      value={localConfig.database}
                      onChange={(e) => setLocalConfig({...localConfig, database: e.target.value})}
                      placeholder="fluxbus_backup"
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Usuario</Label>
                    <Input
                      value={localConfig.username}
                      onChange={(e) => setLocalConfig({...localConfig, username: e.target.value})}
                      placeholder="postgres"
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      value={localConfig.password}
                      onChange={(e) => setLocalConfig({...localConfig, password: e.target.value})}
                      placeholder="Digite a senha"
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Retencao (dias)</Label>
                    <Input
                      type="number"
                      value={localConfig.retentionDays}
                      onChange={(e) => setLocalConfig({...localConfig, retentionDays: parseInt(e.target.value)})}
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleTestConnection('LOCAL')}
                    disabled={testing === 'LOCAL'}
                    variant="outline"
                    className="flex-1"
                  >
                    {testing === 'LOCAL' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testando...</>
                    ) : (
                      <><TestTube className="h-4 w-4 mr-2" /> Testar Conexao</>
                    )}
                  </Button>

                  <Button
                    onClick={() => handleSaveConfig('LOCAL')}
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configuracao
                  </Button>

                  {localConfig.id && (
                    <Button
                      onClick={() => handleExecuteBackup(localConfig.id!, 'LOCAL')}
                      disabled={executing === 'LOCAL'}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {executing === 'LOCAL' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Executando...</>
                      ) : (
                        <><PlayCircle className="h-4 w-4 mr-2" /> Executar Agora</>
                      )}
                    </Button>
                  )}
                </div>

                {localConfig.lastBackupDate && (
                  <Alert className={localConfig.lastBackupStatus === 'SUCCESS' ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}>
                    <AlertDescription className="flex items-center gap-2">
                      {localConfig.lastBackupStatus === 'SUCCESS' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span>
                        Ultimo backup: {new Date(localConfig.lastBackupDate).toLocaleString('pt-BR')}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup VPS */}
          <TabsContent value="vps" className="space-y-4">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-purple-400" />
                  Backup VPS (Remoto)
                </CardTitle>
                <CardDescription>
                  Backup em servidor externo (vps_fluxbus_backup)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>IP da VPS</Label>
                    <Input
                      value={vpsConfig.host}
                      onChange={(e) => setVpsConfig({...vpsConfig, host: e.target.value})}
                      placeholder="192.168.1.100"
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Porta</Label>
                    <Input
                      type="number"
                      value={vpsConfig.port}
                      onChange={(e) => setVpsConfig({...vpsConfig, port: parseInt(e.target.value)})}
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nome do Banco</Label>
                    <Input
                      value={vpsConfig.database}
                      onChange={(e) => setVpsConfig({...vpsConfig, database: e.target.value})}
                      placeholder="vps_fluxbus_backup"
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Usuario</Label>
                    <Input
                      value={vpsConfig.username}
                      onChange={(e) => setVpsConfig({...vpsConfig, username: e.target.value})}
                      placeholder="postgres"
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      value={vpsConfig.password}
                      onChange={(e) => setVpsConfig({...vpsConfig, password: e.target.value})}
                      placeholder="Senha da VPS"
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Retencao (dias)</Label>
                    <Input
                      type="number"
                      value={vpsConfig.retentionDays}
                      onChange={(e) => setVpsConfig({...vpsConfig, retentionDays: parseInt(e.target.value)})}
                      className="bg-seguranca-black border-gray-600"
                    />
                  </div>
                </div>

                <Alert className="bg-yellow-900/20 border-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-sm">
                    Importante: Certifique-se de que o banco vps_fluxbus_backup ja esta criado na VPS
                    e que o usuario tem permissoes de escrita.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleTestConnection('REMOTE')}
                    disabled={testing === 'REMOTE'}
                    variant="outline"
                    className="flex-1"
                  >
                    {testing === 'REMOTE' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testando...</>
                    ) : (
                      <><TestTube className="h-4 w-4 mr-2" /> Testar Conexao VPS</>
                    )}
                  </Button>

                  <Button
                    onClick={() => handleSaveConfig('REMOTE')}
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configuracao
                  </Button>

                  {vpsConfig.id && (
                    <Button
                      onClick={() => handleExecuteBackup(vpsConfig.id!, 'REMOTE')}
                      disabled={executing === 'REMOTE'}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {executing === 'REMOTE' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Executando...</>
                      ) : (
                        <><PlayCircle className="h-4 w-4 mr-2" /> Executar Agora</>
                      )}
                    </Button>
                  )}
                </div>

                {vpsConfig.lastBackupDate && (
                  <Alert className={vpsConfig.lastBackupStatus === 'SUCCESS' ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}>
                    <AlertDescription className="flex items-center gap-2">
                      {vpsConfig.lastBackupStatus === 'SUCCESS' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span>
                        Ultimo backup: {new Date(vpsConfig.lastBackupDate).toLocaleString('pt-BR')}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Google Drive */}
          <TabsContent value="gdrive" className="space-y-4">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-400" />
                  Envio para Google Drive
                </CardTitle>
                <CardDescription>
                  Configure o envio automático dos arquivos de backup para uma pasta do Google Drive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pasta do Google Drive (Folder ID)</Label>
                  <Input
                    value={googleDriveConfig.folderId}
                    onChange={(e) =>
                      setGoogleDriveConfig({
                        ...googleDriveConfig,
                        folderId: e.target.value,
                      })
                    }
                    placeholder="ID da pasta no Google Drive"
                    className="bg-seguranca-black border-gray-600"
                  />
                  <p className="text-xs text-gray-400">
                    Exemplo de link: https://drive.google.com/drive/folders/
                    <span className="text-seguranca-yellow font-mono">
                      1QJrZ9Xk0wtJhOVZN_HEo61lKa9cfvwiS
                    </span>
                    . Use apenas o ID da pasta.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={googleDriveConfig.description}
                    onChange={(e) =>
                      setGoogleDriveConfig({
                        ...googleDriveConfig,
                        description: e.target.value,
                      })
                    }
                    placeholder="Ex.: Backup diário para Google Drive"
                    className="bg-seguranca-black border-gray-600"
                  />
                </div>

                <Alert className="bg-yellow-900/20 border-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-sm">
                    A integração real com o Google Drive será feita no servidor usando uma conta de serviço.
                    Esta tela salva apenas a configuração básica (ID da pasta e descrição) para uso pelo backend.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    onClick={handleTestGoogleDrive}
                    disabled={testing === 'GDRIVE'}
                    variant="outline"
                    className="flex-1"
                  >
                    {testing === 'GDRIVE' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testando...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" /> Testar Configuração
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const response = await api.post(
                          '/api/backup/google-drive/config',
                          googleDriveConfig
                        );
                        toast({
                          title: 'Configuração salva!',
                          description:
                            response.data?.message ||
                            'Configuração de envio para Google Drive salva com sucesso.',
                        });
                      } catch (error: any) {
                        toast({
                          title: 'Erro',
                          description:
                            error.response?.data?.message ||
                            'Erro ao salvar configuração do Google Drive',
                          variant: 'destructive',
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configuração
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle>Historico de Backups</CardTitle>
                <CardDescription>Ultimos backups executados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">
                      Nenhum backup executado ainda
                    </p>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="border border-gray-600 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {new Date(item.backupDate).toLocaleString('pt-BR')}
                          </span>
                          <Badge className={
                            item.status === 'SUCCESS' ? 'bg-green-600' : 
                            item.status === 'FAILED' ? 'bg-red-600' : 'bg-yellow-600'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-400 space-y-1">
                          {item.backupSizeBytes && (
                            <div>Tamanho: {formatBytes(item.backupSizeBytes)}</div>
                          )}
                          {item.durationSeconds && (
                            <div>Duracao: {formatDuration(item.durationSeconds)}</div>
                          )}
                          {item.message && (
                            <div>Mensagem: {item.message}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default ConfiguracaoBackup;

