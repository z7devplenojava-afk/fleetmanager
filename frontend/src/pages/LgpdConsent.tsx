import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Database, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

const LgpdConsent = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedDataProcessing, setAcceptedDataProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const canProceed = acceptedTerms && acceptedPrivacy && acceptedDataProcessing;

  // Debug: Log quando os estados mudam
  useEffect(() => {
    console.log('🔍 Estado dos checkboxes:', {
      acceptedTerms,
      acceptedPrivacy,
      acceptedDataProcessing,
      canProceed
    });
  }, [acceptedTerms, acceptedPrivacy, acceptedDataProcessing, canProceed]);

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [user, navigate]);

  const handleAcceptAll = async () => {
    if (!canProceed || !user) return;

    setIsSubmitting(true);
    try {
      // Registrar cada tipo de consentimento
      const consents = [
        { consentType: 'TERMS_OF_USE' },
        { consentType: 'PRIVACY_POLICY' },
        { consentType: 'DATA_PROCESSING' }
      ];

      for (const consent of consents) {
        await api.post('/lgpd/consent', {
          consentType: consent.consentType,
          latitude: null,
          longitude: null
        });
      }

      // Marcar primeiro acesso como completo (sem userId no path)
      await api.post('/lgpd/complete-first-access');

      toast({
        title: 'Consentimentos registrados',
        description: 'Todos os consentimentos foram aceitos com sucesso.',
        variant: 'default',
      });

      // Atualizar dados do usuário
      if (refreshUser) {
        await refreshUser();
      }

      // Redirecionar para o dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao registrar consentimentos:', error);
      toast({
        title: 'Erro ao registrar consentimentos',
        description: error?.response?.data?.message || 'Não foi possível registrar os consentimentos. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-seguranca-black flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seguranca-yellow"></div>
        <p className="mt-4 text-seguranca-lightgray">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <SEO title="Consentimento LGPD - Fleet Manager" />
      <div className="min-h-screen w-full bg-seguranca-black flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl space-y-4 sm:space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <Logo />
          </div>

          {/* Card Principal - Padrão SST */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-seguranca-lightgray text-xl sm:text-2xl md:text-3xl">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-400" />
                Bem-vindo ao Fleet Manager
              </CardTitle>
              <p className="text-gray-300 text-sm sm:text-base mt-2">
                Para utilizar nosso sistema, é necessário aceitar os termos de uso e políticas de privacidade, conforme exigido pela LGPD.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Resumo de progresso - Padrão SST */}
              <Card className="bg-seguranca-black border-gray-700">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-seguranca-lightgray mb-3 font-semibold">Progresso de Aceitação:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className={`flex items-center gap-2 ${acceptedTerms ? 'text-green-400' : 'text-gray-500'}`}>
                      {acceptedTerms ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
                      <span className="truncate">Termos de Uso {acceptedTerms ? '✓' : '✗'}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${acceptedPrivacy ? 'text-green-400' : 'text-gray-500'}`}>
                      {acceptedPrivacy ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
                      <span className="truncate">Política de Privacidade {acceptedPrivacy ? '✓' : '✗'}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${acceptedDataProcessing ? 'text-green-400' : 'text-gray-500'}`}>
                      {acceptedDataProcessing ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
                      <span className="truncate">Processamento de Dados {acceptedDataProcessing ? '✓' : '✗'}</span>
                    </div>
                  </div>
                  {!canProceed && (
                    <p className="text-xs text-yellow-400 mt-3 flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      <span>Role para baixo e aceite todos os três termos para continuar.</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Termos de Uso - Card SST */}
              <Card className="bg-seguranca-black border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-semibold text-seguranca-lightgray">
                        Termos de Uso
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">Versão 1.0 - Atualizado em 05/11/2025</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="text-xs sm:text-sm text-gray-300 space-y-2">
                    <p><strong>1. Aceitação dos Termos</strong></p>
                    <p>Ao acessar e usar o Fleet Manager, você concorda em cumprir estes Termos de Uso.</p>
                    
                    <p className="mt-3"><strong>2. Uso do Sistema</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>O sistema é de uso exclusivo para colaboradores autorizados</li>
                      <li>Você é responsável pela confidencialidade de suas credenciais</li>
                      <li>Não compartilhe seu login e senha com terceiros</li>
                      <li>Notifique imediatamente qualquer uso não autorizado</li>
                    </ul>

                    <p className="mt-3"><strong>3. Responsabilidades</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Manter suas informações atualizadas</li>
                      <li>Usar o sistema apenas para fins profissionais</li>
                      <li>Respeitar a privacidade de outros usuários</li>
                      <li>Não tentar acessar áreas não autorizadas</li>
                    </ul>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 pt-2 border-t border-gray-700">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        console.log('🔍 Checkbox Terms mudou:', { checked, isChecked });
                        setAcceptedTerms(isChecked);
                      }}
                      className="border-gray-600 mt-1 flex-shrink-0"
                    />
                    <label 
                      htmlFor="terms" 
                      className="text-xs sm:text-sm text-seguranca-lightgray cursor-pointer flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setAcceptedTerms(prev => !prev);
                      }}
                    >
                      Li e aceito os <strong className="text-blue-400">Termos de Uso</strong>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Política de Privacidade - Card SST */}
              <Card className="bg-seguranca-black border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-semibold text-seguranca-lightgray">
                        Política de Privacidade
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">Como tratamos seus dados pessoais</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="text-xs sm:text-sm text-gray-300 space-y-2">
                    <p><strong>Coleta de Dados</strong></p>
                    <p>Coletamos e processamos os seguintes dados:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Nome completo, CPF, email e telefone</li>
                      <li>Dados de acesso (logs de login, IP, dispositivo)</li>
                      <li>Informações profissionais (cargo, departamento, unidade)</li>
                      <li>Documentos (holerites, comprovantes, registros)</li>
                    </ul>

                    <p className="mt-3"><strong>Uso dos Dados</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Gestão de recursos humanos e folha de pagamento</li>
                      <li>Controle de acesso e segurança do sistema</li>
                      <li>Comunicação institucional e envio de documentos</li>
                      <li>Cumprimento de obrigações legais e trabalhistas</li>
                    </ul>

                    <p className="mt-3"><strong>Seus Direitos (LGPD)</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Acessar seus dados pessoais</li>
                      <li>Solicitar correção de dados incorretos</li>
                      <li>Solicitar exclusão (conforme permitido por lei)</li>
                      <li>Revogar consentimentos (quando aplicável)</li>
                    </ul>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 pt-2 border-t border-gray-700">
                    <Checkbox
                      id="privacy"
                      checked={acceptedPrivacy}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        console.log('🔍 Checkbox Privacy mudou:', { checked, isChecked });
                        setAcceptedPrivacy(isChecked);
                      }}
                      className="border-gray-600 mt-1 flex-shrink-0"
                    />
                    <label 
                      htmlFor="privacy" 
                      className="text-xs sm:text-sm text-seguranca-lightgray cursor-pointer flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setAcceptedPrivacy(prev => !prev);
                      }}
                    >
                      Li e aceito a <strong className="text-green-400">Política de Privacidade</strong>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Processamento de Dados - Card SST */}
              <Card className="bg-seguranca-black border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Database className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-semibold text-seguranca-lightgray">
                        Consentimento para Processamento de Dados
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">Autorização LGPD</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="text-xs sm:text-sm text-gray-300 space-y-2">
                    <p>Autorizo expressamente o processamento dos meus dados pessoais para:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Gestão de vínculo empregatício e benefícios</li>
                      <li>Controle de ponto e jornada de trabalho</li>
                      <li>Envio de holerites e documentos por email/WhatsApp</li>
                      <li>Comunicações relacionadas ao trabalho</li>
                      <li>Segurança e controle de acesso às instalações</li>
                    </ul>

                    <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mt-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-400">
                          Este consentimento é necessário para o funcionamento adequado do sistema e cumprimento das obrigações trabalhistas. 
                          Você pode revogar este consentimento a qualquer momento através das configurações do sistema.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 pt-2 border-t border-gray-700">
                    <Checkbox
                      id="dataProcessing"
                      checked={acceptedDataProcessing}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        console.log('🔍 Checkbox DataProcessing mudou:', { checked, isChecked });
                        setAcceptedDataProcessing(isChecked);
                      }}
                      className="border-gray-600 mt-1 flex-shrink-0"
                    />
                    <label 
                      htmlFor="dataProcessing" 
                      className="text-xs sm:text-sm text-seguranca-lightgray cursor-pointer flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setAcceptedDataProcessing(prev => !prev);
                      }}
                    >
                      Autorizo o <strong className="text-yellow-400">Processamento dos Meus Dados</strong>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo de sucesso */}
              {canProceed && (
                <Card className="bg-green-900/30 border-green-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <p className="text-green-400 font-medium text-sm sm:text-base">
                        Todos os consentimentos foram aceitos!
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2">
                      Clique em "Aceitar e Continuar" para prosseguir com o acesso ao sistema.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Botão de ação - Padrão SST */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-700">
                {!canProceed && (
                  <div className="text-xs sm:text-sm text-yellow-400 flex items-center gap-2 flex-1">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>Por favor, aceite todos os termos acima para continuar.</span>
                  </div>
                )}
                <Button
                  onClick={handleAcceptAll}
                  disabled={!canProceed || isSubmitting}
                  className={`w-full sm:w-auto sm:min-w-[200px] text-white ${
                    canProceed 
                      ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
                      : 'bg-gray-600 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Aceitar e Continuar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default LgpdConsent;

