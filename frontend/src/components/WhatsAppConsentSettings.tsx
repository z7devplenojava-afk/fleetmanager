import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CheckCircle2, XCircle, Calendar, MapPin, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import { WhatsAppConsentModal } from './WhatsAppConsentModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhatsAppConsentSettingsProps {
  userId: string;
  userName: string;
}

interface ConsentStatus {
  userId: string;
  username: string;
  name: string;
  whatsappNumber: string;
  hasConsent: boolean;
  consentDate: string;
  consentIp: string;
  message: string;
}

export const WhatsAppConsentSettings: React.FC<WhatsAppConsentSettingsProps> = ({
  userId,
  userName
}) => {
  const { toast } = useToast();
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const loadConsentStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/whatsapp-consent/status/${userId}`);
      setConsentStatus(response.data);
    } catch (error) {
      console.error('Erro ao carregar status de consentimento:', error);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível carregar o status do consentimento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsentStatus();
  }, [userId]);

  const handleRevokeConsent = async () => {
    if (!confirm('Tem certeza que deseja revogar a autorização? Você não receberá mais holerites via WhatsApp.')) {
      return;
    }

    setRevoking(true);
    try {
      await api.post('/api/whatsapp-consent/revoke', { userId });
      
      toast({
        title: '✅ Consentimento Revogado',
        description: 'Você não receberá mais holerites via WhatsApp.',
        variant: 'default',
      });

      await loadConsentStatus();
    } catch (error: any) {
      console.error('Erro ao revogar consentimento:', error);
      toast({
        title: '❌ Erro',
        description: error.response?.data?.message || 'Não foi possível revogar o consentimento.',
        variant: 'destructive',
      });
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Consentimento WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Consentimento para Recebimento via WhatsApp
          </CardTitle>
          <CardDescription>
            Gerencie sua autorização para receber holerites e documentos via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status atual */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {consentStatus?.hasConsent ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <p className="font-semibold">
                  {consentStatus?.hasConsent ? 'Autorizado' : 'Não Autorizado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {consentStatus?.message}
                </p>
              </div>
            </div>
            <Badge variant={consentStatus?.hasConsent ? 'default' : 'secondary'}>
              {consentStatus?.hasConsent ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {/* Informações do consentimento */}
          {consentStatus?.hasConsent && consentStatus.consentDate && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h3 className="text-sm font-semibold">Detalhes do Consentimento:</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">WhatsApp:</span>
                  <span className="font-mono">{consentStatus.whatsappNumber || 'Não cadastrado'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Data do Consentimento:</span>
                  <span>
                    {format(new Date(consentStatus.consentDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                
                {consentStatus.consentIp && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">IP:</span>
                    <span className="font-mono text-xs">{consentStatus.consentIp}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <p><strong>ℹ️ LGPD:</strong> Estas informações são armazenadas conforme a Lei Geral de Proteção de Dados para comprovar seu consentimento.</p>
              </div>
            </div>
          )}

          {/* Informações sobre a política */}
          <div className="space-y-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <p className="font-semibold text-yellow-900">📋 Política de Uso do WhatsApp:</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-800">
              <li>Enviaremos apenas holerites e comprovantes de pagamento</li>
              <li>Não enviaremos spam ou mensagens promocionais</li>
              <li>Seu número não será compartilhado com terceiros</li>
              <li>Você pode revogar este consentimento a qualquer momento</li>
            </ul>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            {consentStatus?.hasConsent ? (
              <Button
                variant="destructive"
                onClick={handleRevokeConsent}
                disabled={revoking}
              >
                {revoking ? 'Revogando...' : 'Revogar Autorização'}
              </Button>
            ) : (
              <Button
                onClick={() => setShowConsentModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Autorizar Recebimento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de consentimento */}
      {showConsentModal && (
        <WhatsAppConsentModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          userId={userId}
          userName={userName}
          currentWhatsApp={consentStatus?.whatsappNumber}
          onConsentGranted={loadConsentStatus}
        />
      )}
    </>
  );
};

