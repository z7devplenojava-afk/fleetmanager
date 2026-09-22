import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  QrCode, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Smartphone,
  Wifi,
  WifiOff,
  Phone
} from 'lucide-react';
import api from '@/lib/axios';

interface ConnectionStatus {
  connected: boolean;
  instance: string;
  state?: string;
  phoneNumber?: string;
  lastConnected?: string;
}

const WhatsAppConnection: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    instance: 'fluxbus'
  });
  const [instanceName, setInstanceName] = useState('fluxbus');
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Verificar status da conexão
  const checkConnection = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/whatsapp/connection/status/${instanceName}`);
      
      if (response.data) {
        setConnectionStatus({
          connected: response.data.state === 'open' || response.data.connected,
          instance: instanceName,
          state: response.data.state,
          phoneNumber: response.data.phoneNumber,
          lastConnected: response.data.lastConnected
        });
        
        if (response.data.state === 'open' || response.data.connected) {
          toast({
            title: "✅ WhatsApp Conectado",
            description: `Número: ${response.data.phoneNumber || 'N/A'}`,
          });
        }
      }
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
      setConnectionStatus({
        connected: false,
        instance: instanceName
      });
    } finally {
      setLoading(false);
    }
  };

  // Limpar sessão (forçar logout)
  const clearSession = async () => {
    try {
      setLoading(true);
      
      toast({
        title: "🔄 Limpando sessão",
        description: "Removendo sessão anterior...",
      });

      await api.post('/whatsapp/logout');
      
      toast({
        title: "✅ Sessão limpa",
        description: "Aguarde alguns segundos e gere um novo QR Code",
      });
      
      setQrCode('');
      setConnectionStatus({
        connected: false,
        instance: instanceName
      });
    } catch (error: any) {
      console.error('Erro ao limpar sessão:', error);
      toast({
        title: "⚠️ Aviso",
        description: "Erro ao limpar sessão, mas você pode tentar gerar um novo QR Code",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar QR Code para conexão
  const generateQRCode = async () => {
    try {
      setLoading(true);
      setQrCode('');
      
      toast({
        title: "🔄 Gerando QR Code",
        description: "Aguarde...",
      });

      // Criar/conectar instância usando o endpoint do backend
      const createResponse = await api.post('/whatsapp/connection/create', {
        instanceName: instanceName,
        qrcode: true
      });

      console.log('📥 Resposta recebida:', createResponse.data);

      if (createResponse.data.success && createResponse.data.qrcode && createResponse.data.qrcode.base64) {
        const qrData = createResponse.data.qrcode.base64;
        console.log('📸 QR Code recebido. Tamanho:', qrData.length);
        
        setQrCode(qrData);
        
        toast({
          title: "✅ QR Code Gerado",
          description: "Escaneie com seu WhatsApp",
        });

        // Iniciar verificação periódica de conexão
        startConnectionPolling();
      } else if (!createResponse.data.success) {
        // Backend retornou erro mas com status 200
        console.error('❌ Erro do backend:', createResponse.data.error);
        toast({
          title: "⚠️ Erro ao gerar QR Code",
          description: createResponse.data.error || "Serviço WhatsApp indisponível. Verifique se o container está rodando.",
          variant: "destructive",
        });
      } else {
        console.error('❌ Resposta sem QR Code:', createResponse.data);
        toast({
          title: "⚠️ QR Code não disponível",
          description: "O serviço está conectando ao WhatsApp. Aguarde alguns segundos e tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('💥 Erro ao gerar QR Code:', error);
      console.error('📊 Detalhes:', error.response?.data);
      
      let errorMessage = "Erro ao gerar QR Code";
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = "Serviço WhatsApp não está acessível. Verifique se o backend e o container WhatsApp estão rodando.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "❌ Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Polling para verificar conexão
  const startConnectionPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/whatsapp/connection/status/${instanceName}`);
        
        if (response.data.state === 'open') {
          setConnectionStatus({
            connected: true,
            instance: instanceName,
            state: response.data.state,
            phoneNumber: response.data.phoneNumber
          });
          setQrCode(''); // Limpar QR Code
          clearInterval(interval);
          
          toast({
            title: "🎉 WhatsApp Conectado!",
            description: `Número: ${response.data.phoneNumber}`,
          });
        }
      } catch (error) {
        // Continua tentando
      }
    }, 3000); // Verificar a cada 3 segundos

    // Parar após 2 minutos
    setTimeout(() => clearInterval(interval), 120000);
  };

  // Desconectar WhatsApp
  const disconnect = async () => {
    try {
      setLoading(true);
      
      await api.delete(`/whatsapp/connection/disconnect/${instanceName}`);
      
      setConnectionStatus({
        connected: false,
        instance: instanceName
      });
      setQrCode('');
      
      toast({
        title: "✅ Desconectado",
        description: "WhatsApp desconectado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao desconectar WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensagem de teste
  const sendTestMessage = async () => {
    if (!testPhone.trim()) {
      toast({
        title: "⚠️ Atenção",
        description: "Digite um número de telefone",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingTest(true);
      
      // Usar o endpoint do WhatsAppTestController que já existe
      await api.post('/whatsapp/send-test', {
        telefone: testPhone,
        mensagem: "✅ Teste FluxBus - WhatsApp conectado e funcionando!"
      });
      
      toast({
        title: "✅ Mensagem Enviada",
        description: `Teste enviado para ${testPhone}`,
      });
      
      setTestPhone('');
    } catch (error: any) {
      console.error('Erro ao enviar teste:', error);
      toast({
        title: "❌ Erro",
        description: error.response?.data?.message || "Erro ao enviar mensagem de teste",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Verificar conexão ao montar
  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <StandardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-seguranca-lightgray flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-seguranca-yellow" />
            Conexão WhatsApp
          </h1>
          <p className="text-gray-400 mt-2">
            Conecte seu WhatsApp Business para enviar holerites e mensagens automáticas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Status e Conexão */}
          <div className="space-y-6">
            {/* Card de Status */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  {connectionStatus.connected ? (
                    <Wifi className="h-5 w-5 text-green-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-500" />
                  )}
                  Status da Conexão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status:</span>
                  <Badge className={connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'}>
                    {connectionStatus.connected ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Conectado</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Desconectado</>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Instância:</span>
                  <span className="text-white font-mono">{connectionStatus.instance}</span>
                </div>

                {connectionStatus.phoneNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Número:</span>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-seguranca-yellow" />
                      <span className="text-white font-mono">{connectionStatus.phoneNumber}</span>
                    </div>
                  </div>
                )}

                {connectionStatus.state && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Estado:</span>
                    <span className="text-white">{connectionStatus.state}</span>
                  </div>
                )}

                <div className="pt-4 flex gap-2">
                  <Button
                    onClick={checkConnection}
                    disabled={loading}
                    variant="outline"
                    className="flex-1 border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Verificar Status
                  </Button>

                  {connectionStatus.connected && (
                    <Button
                      onClick={disconnect}
                      disabled={loading}
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Desconectar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card de Teste */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-seguranca-yellow" />
                  Testar Envio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Número de Teste (com DDD e DDI)
                  </label>
                  <Input
                    placeholder="Ex: 5511999999999"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-white"
                    disabled={!connectionStatus.connected}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: 55 (país) + 11 (DDD) + 999999999 (número)
                  </p>
                </div>

                <Button
                  onClick={sendTestMessage}
                  disabled={!connectionStatus.connected || sendingTest || !testPhone.trim()}
                  className="w-full bg-seguranca-yellow hover:bg-yellow-600 text-black"
                >
                  {sendingTest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4 mr-2" />
                  )}
                  Enviar Teste
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: QR Code */}
          <div className="space-y-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-seguranca-yellow" />
                  QR Code de Conexão
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!connectionStatus.connected && (
                  <div className="space-y-6">
                    {/* Nome da Instância */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        Nome da Instância
                      </label>
                      <Input
                        placeholder="fluxbus"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        className="bg-seguranca-black border-gray-600 text-white"
                      />
                    </div>

                    {/* Botões de ação */}
                    <div className="space-y-2">
                      <Button
                        onClick={generateQRCode}
                        disabled={loading || !instanceName.trim()}
                        className="w-full bg-seguranca-red hover:bg-seguranca-darkred"
                        size="lg"
                      >
                        {loading ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <QrCode className="h-5 w-5 mr-2" />
                        )}
                        Gerar QR Code
                      </Button>
                      
                      <Button
                        onClick={clearSession}
                        disabled={loading}
                        variant="outline"
                        className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Limpar Sessão e Reconectar
                      </Button>
                      
                      <p className="text-xs text-gray-400 text-center">
                        Se o QR Code não aparecer, clique em "Limpar Sessão" primeiro
                      </p>
                    </div>

                    {/* Exibir QR Code */}
                    {qrCode && (
                      <div className="space-y-4">
                        <div className="bg-white p-6 rounded-lg flex items-center justify-center">
                          <img 
                            src={qrCode} 
                            alt="QR Code WhatsApp" 
                            className="max-w-full h-auto"
                            style={{ maxWidth: '300px' }}
                          />
                        </div>
                        
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                          <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            Como escanear:
                          </h3>
                          <ol className="text-sm text-gray-300 space-y-2">
                            <li>1. Abra o <strong>WhatsApp</strong> no celular</li>
                            <li>2. Toque no menu <strong>⋮</strong> (três pontos)</li>
                            <li>3. Selecione <strong>"Aparelhos conectados"</strong></li>
                            <li>4. Toque em <strong>"Conectar um aparelho"</strong></li>
                            <li>5. Aponte a câmera para o <strong>QR Code acima</strong></li>
                          </ol>
                        </div>

                        <div className="flex items-center gap-2 text-yellow-500 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Aguardando escaneamento do QR Code...
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quando já está conectado */}
                {connectionStatus.connected && (
                  <div className="space-y-6">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-green-400 mb-2">
                        WhatsApp Conectado!
                      </h3>
                      <p className="text-gray-300">
                        Seu WhatsApp está conectado e pronto para enviar mensagens
                      </p>
                      {connectionStatus.phoneNumber && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <Phone className="h-4 w-4 text-seguranca-yellow" />
                          <span className="text-white font-mono text-lg">
                            {connectionStatus.phoneNumber}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3">✅ O que você pode fazer agora:</h4>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li>• Enviar holerites via WhatsApp automaticamente</li>
                        <li>• Enviar mensagens para funcionários</li>
                        <li>• Enviar notificações de grupo</li>
                        <li>• Enviar documentos unificados</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Informações Adicionais */}
        <Card className="bg-seguranca-graphite border-gray-600 mt-6">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">
              📋 Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🔒 Segurança</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Use um número exclusivo para a empresa</li>
                  <li>• Não compartilhe o QR Code</li>
                  <li>• Mantenha a conexão sempre ativa</li>
                </ul>
              </div>

              <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">⚠️ Importante</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• A conexão pode cair se o celular ficar offline</li>
                  <li>• Reconecte caso perca a conexão</li>
                  <li>• Use WhatsApp Business (recomendado)</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="text-yellow-400 font-semibold mb-2">💡 Dica</h4>
              <p className="text-sm text-gray-300">
                Para melhor desempenho, use um celular dedicado apenas para o sistema, 
                com WhatsApp Business instalado e sempre conectado à internet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default WhatsAppConnection;

