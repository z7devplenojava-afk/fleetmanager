import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileText, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TermsConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  userName?: string;
  loading?: boolean;
}

export const TermsConsentModal: React.FC<TermsConsentModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
  userName = "Usuário",
  loading = false
}) => {
  const [acceptance, setAcceptance] = useState<string>('');
  const [showError, setShowError] = useState(false);

  const handleSubmit = () => {
    if (!acceptance) {
      setShowError(true);
      return;
    }

    if (acceptance === 'accept') {
      onAccept();
    } else {
      onDecline();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-seguranca-graphite border-gray-600 text-white max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-seguranca-yellow flex items-center gap-2">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            Termos de Uso e Política de Privacidade
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-seguranca-lightgray">
            Olá, <strong>{userName}</strong>. Leia e aceite os termos para continuar.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[50vh] sm:h-[60vh] pr-4">
          <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm">
            {/* Termos de Uso */}
            <div>
              <h3 className="font-bold text-seguranca-yellow flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Termos de Uso do Sistema SecuredGuard
              </h3>
              
              <div className="space-y-3 text-seguranca-lightgray">
                <p className="font-medium">1. Aceitação dos Termos</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Ao acessar e usar este sistema, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.
                </p>

                <p className="font-medium">2. Uso do Sistema</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-400 text-xs sm:text-sm">
                  <li>Uso responsável e ético do sistema</li>
                  <li>Manutenção da confidencialidade de suas credenciais</li>
                  <li>Não compartilhamento de acesso com terceiros</li>
                  <li>Cumprimento das políticas de segurança da informação</li>
                  <li>Respeito às normas trabalhistas e operacionais</li>
                </ul>

                <p className="font-medium">3. Responsabilidades do Usuário</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-400 text-xs sm:text-sm">
                  <li>Manter senha segura e atualizá-la periodicamente</li>
                  <li>Reportar imediatamente qualquer uso não autorizado</li>
                  <li>Não tentar acessar áreas restritas do sistema</li>
                  <li>Fazer logout ao finalizar o uso</li>
                  <li>Respeitar os direitos de propriedade intelectual</li>
                </ul>

                <p className="font-medium">4. Restrições</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  É proibido: distribuir, modificar, copiar ou usar o sistema para fins ilícitos ou não autorizados.
                </p>
              </div>
            </div>

            {/* Política de Privacidade - LGPD */}
            <div className="border-t border-gray-600 pt-4">
              <h3 className="font-bold text-seguranca-yellow flex items-center gap-2 mb-3">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                Política de Privacidade (LGPD)
              </h3>
              
              <div className="space-y-3 text-seguranca-lightgray">
                <p className="font-medium">1. Coleta de Dados</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Coletamos apenas dados necessários para o funcionamento do sistema e gestão de recursos humanos e operacionais.
                </p>

                <p className="font-medium">2. Dados Coletados</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-400 text-xs sm:text-sm">
                  <li>Dados pessoais (nome, CPF, email, telefone)</li>
                  <li>Dados profissionais (cargo, departamento, escala)</li>
                  <li>Dados de acesso (login, IP, horários)</li>
                  <li>Dados operacionais (ocorrências, rondas, relatórios)</li>
                  <li>Dados biométricos (reconhecimento facial, quando aplicável)</li>
                </ul>

                <p className="font-medium">3. Uso dos Dados</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Seus dados são utilizados exclusivamente para: gestão operacional, folha de pagamento, controle de acesso, segurança e cumprimento de obrigações legais.
                </p>

                <p className="font-medium">4. Compartilhamento</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Não compartilhamos seus dados com terceiros, exceto quando exigido por lei ou para prestação de serviços essenciais (contabilidade, folha de pagamento).
                </p>

                <p className="font-medium">5. Seus Direitos (LGPD)</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-400 text-xs sm:text-sm">
                  <li>Confirmação da existência de tratamento de dados</li>
                  <li>Acesso aos seus dados pessoais</li>
                  <li>Correção de dados incompletos ou desatualizados</li>
                  <li>Anonimização ou eliminação de dados desnecessários</li>
                  <li>Portabilidade de dados (quando aplicável)</li>
                  <li>Informação sobre compartilhamento</li>
                  <li>Revogação do consentimento (quando aplicável)</li>
                </ul>

                <p className="font-medium">6. Segurança</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Implementamos medidas técnicas e organizacionais para proteger seus dados: criptografia, controle de acesso, backup, monitoramento e auditoria.
                </p>

                <p className="font-medium">7. Retenção de Dados</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Mantemos seus dados pelo período necessário para cumprimento de obrigações legais e contratuais, conforme legislação trabalhista e tributária.
                </p>

                <p className="font-medium">8. Contato do DPO</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato com nosso Encarregado de Dados (DPO): dpo@securedguard.com.br
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Seção de Aceite com Radio Buttons */}
        <div className="mt-4 border-t border-gray-600 pt-4">
          {showError && !acceptance && (
            <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-800">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                Por favor, selecione uma opção abaixo para continuar.
              </AlertDescription>
            </Alert>
          )}

          <RadioGroup value={acceptance} onValueChange={(value) => {
            setAcceptance(value);
            setShowError(false);
          }}>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-600 hover:border-green-500 transition-colors cursor-pointer"
                   onClick={() => setAcceptance('accept')}>
                <RadioGroupItem value="accept" id="accept" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="accept" className="cursor-pointer text-xs sm:text-sm">
                    <div className="flex items-center gap-2 font-medium text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      Li e ACEITO os Termos de Uso e Política de Privacidade
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Concordo em cumprir todas as regras e políticas descritas acima
                    </p>
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-600 hover:border-red-500 transition-colors cursor-pointer"
                   onClick={() => setAcceptance('decline')}>
                <RadioGroupItem value="decline" id="decline" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="decline" className="cursor-pointer text-xs sm:text-sm">
                    <div className="flex items-center gap-2 font-medium text-red-400">
                      <XCircle className="h-4 w-4" />
                      NÃO ACEITO os termos
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Não poderei acessar o sistema sem aceitar os termos
                    </p>
                  </Label>
                </div>
              </div>
            </div>
          </RadioGroup>

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
            <p className="text-xs text-blue-200">
              <strong>Importante:</strong> Este consentimento é registrado com seu IP, data/hora e versão dos termos para fins de auditoria e conformidade com a LGPD.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            onClick={handleSubmit}
            disabled={!acceptance || loading}
            className={`w-full h-10 sm:h-11 text-sm sm:text-base ${
              acceptance === 'accept' 
                ? 'bg-green-600 hover:bg-green-700' 
                : acceptance === 'decline'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-600'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              acceptance === 'accept' ? 'Aceitar e Continuar' : 
              acceptance === 'decline' ? 'Não Aceitar e Sair' : 
              'Selecione uma opção'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsConsentModal;

