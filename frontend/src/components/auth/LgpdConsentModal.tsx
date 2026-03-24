import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileText, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';

interface LgpdConsentModalProps {
  isOpen: boolean;
  userId: string;
  onConsentAccepted: () => void;
}

export const LgpdConsentModal: React.FC<LgpdConsentModalProps> = ({
  isOpen,
  userId,
  onConsentAccepted
}) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedDataProcessing, setAcceptedDataProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'terms' | 'privacy' | 'data' | 'confirmation'>('terms');

  const canProceed = acceptedTerms && acceptedPrivacy && acceptedDataProcessing;

  const handleAcceptAll = async () => {
    if (!canProceed) return;

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
          userId,
          ...consent,
          latitude: null,
          longitude: null
        });
      }

      // Marcar primeiro acesso como completo
      await api.post(`/lgpd/complete-first-access/${userId}`);

      onConsentAccepted();
    } catch (error) {
      console.error('Erro ao registrar consentimentos:', error);
      alert('Erro ao registrar consentimentos. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl bg-seguranca-graphite border-gray-600 max-h-[90vh]" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-seguranca-lightgray text-2xl">
            <Shield className="h-6 w-6 text-blue-400" />
            Bem-vindo ao Fleet Manager
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Para utilizar nosso sistema, é necessário aceitar os termos de uso e políticas de privacidade, conforme exigido pela LGPD.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Termos de Uso */}
            <div className="bg-seguranca-black border border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <FileText className="h-5 w-5 text-blue-400 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-seguranca-lightgray">Termos de Uso</h3>
                  <p className="text-sm text-gray-400 mt-1">Versão 1.0 - Atualizado em 05/11/2025</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-300 space-y-2 mb-4">
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  className="border-gray-600"
                />
                <label htmlFor="terms" className="text-sm text-seguranca-lightgray cursor-pointer">
                  Li e aceito os <strong className="text-blue-400">Termos de Uso</strong>
                </label>
              </div>
            </div>

            {/* Política de Privacidade */}
            <div className="bg-seguranca-black border border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <Shield className="h-5 w-5 text-green-400 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-seguranca-lightgray">Política de Privacidade</h3>
                  <p className="text-sm text-gray-400 mt-1">Como tratamos seus dados pessoais</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-300 space-y-2 mb-4">
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={acceptedPrivacy}
                  onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                  className="border-gray-600"
                />
                <label htmlFor="privacy" className="text-sm text-seguranca-lightgray cursor-pointer">
                  Li e aceito a <strong className="text-green-400">Política de Privacidade</strong>
                </label>
              </div>
            </div>

            {/* Processamento de Dados */}
            <div className="bg-seguranca-black border border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <Database className="h-5 w-5 text-yellow-400 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-seguranca-lightgray">Consentimento para Processamento de Dados</h3>
                  <p className="text-sm text-gray-400 mt-1">Autorização LGPD</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-300 space-y-2 mb-4">
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
                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <p className="text-xs text-gray-400">
                      Este consentimento é necessário para o funcionamento adequado do sistema e cumprimento das obrigações trabalhistas. 
                      Você pode revogar este consentimento a qualquer momento através das configurações do sistema.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dataProcessing"
                  checked={acceptedDataProcessing}
                  onCheckedChange={(checked) => setAcceptedDataProcessing(checked as boolean)}
                  className="border-gray-600"
                />
                <label htmlFor="dataProcessing" className="text-sm text-seguranca-lightgray cursor-pointer">
                  Autorizo o <strong className="text-yellow-400">Processamento dos Meus Dados</strong>
                </label>
              </div>
            </div>

            {/* Resumo */}
            {canProceed && (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <p className="text-green-400 font-medium">
                    Todos os consentimentos foram aceitos!
                  </p>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Clique em "Continuar" para prosseguir com o acesso ao sistema.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={handleAcceptAll}
            disabled={!canProceed || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Registrando...' : 'Aceitar e Continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


