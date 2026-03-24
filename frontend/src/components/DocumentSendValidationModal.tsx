import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, Mail, MessageCircle, UserPlus, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ValidationResult {
  valid: boolean;
  exists: boolean;
  cpf: string;
  name?: string;
  error?: string;
  userId?: string;
  hasEmail?: boolean;
  email?: string;
  hasWhatsApp?: boolean;
  whatsapp?: string;
  whatsappConsent?: boolean;
  canSendEmail?: boolean;
  canSendWhatsApp?: boolean;
  needsEmail?: boolean;
  needsWhatsApp?: boolean;
  needsWhatsAppConsent?: boolean;
  isReady?: boolean;
  message?: string;
}

interface DocumentSendValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validation: ValidationResult | null;
  documentName: string;
  sendType: 'email' | 'whatsapp';
  expectedName?: string; // Nome esperado do arquivo
  onRegisterContacts?: () => void;
  onProceedAnyway?: () => void;
}

export const DocumentSendValidationModal: React.FC<DocumentSendValidationModalProps> = ({
  isOpen,
  onClose,
  validation,
  documentName,
  sendType,
  expectedName,
  onRegisterContacts,
  onProceedAnyway
}) => {
  if (!validation) return null;

  // Caso 1: CPF não existe no sistema
  if (!validation.exists) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <DialogTitle className="text-xl">CPF Não Cadastrado</DialogTitle>
            </div>
            <DialogDescription>
              O CPF extraído do documento não está cadastrado no sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-red-900">Documento:</span>
                  <p className="text-red-800">{documentName}</p>
                </div>
                <div>
                  <span className="font-semibold text-red-900">CPF encontrado:</span>
                  <p className="text-red-800 font-mono">{validation.cpf}</p>
                </div>
                <div>
                  <span className="font-semibold text-red-900">Status:</span>
                  <p className="text-red-800">❌ Não cadastrado no sistema</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ O que fazer:</strong><br/>
                O funcionário precisa ser cadastrado no sistema antes de receber documentos.
                Entre em contato com o RH ou administrador do sistema.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={onClose} variant="outline">
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Caso 2: Nome não confere
  if (expectedName && validation.name && expectedName.toUpperCase() !== validation.name.toUpperCase()) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <DialogTitle className="text-xl">Nome Não Corresponde</DialogTitle>
            </div>
            <DialogDescription>
              O nome do arquivo não corresponde ao nome cadastrado para este CPF.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-orange-900">Nome no arquivo:</span>
                  <p className="text-orange-800 font-medium">{expectedName}</p>
                </div>
                <div>
                  <span className="font-semibold text-orange-900">Nome cadastrado (CPF {validation.cpf}):</span>
                  <p className="text-orange-800 font-medium">{validation.name}</p>
                </div>
                <div className="flex items-center gap-2 text-orange-900 font-semibold">
                  <XCircle className="w-4 h-4" />
                  <span>Os nomes não conferem!</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Atenção:</strong><br/>
                Por segurança, não é possível enviar documentos quando há divergência entre
                o nome do arquivo e o cadastro do CPF. Isso evita envios para a pessoa errada.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
            {onProceedAnyway && (
              <Button 
                onClick={onProceedAnyway} 
                variant="destructive"
                className="bg-orange-600 hover:bg-orange-700"
              >
                Enviar Mesmo Assim (Risco)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Caso 3: Sem contatos cadastrados
  if (validation.needsEmail && validation.needsWhatsApp) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <DialogTitle className="text-xl">Contatos Não Cadastrados</DialogTitle>
            </div>
            <DialogDescription>
              O funcionário não possui Email nem WhatsApp cadastrados no sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Informações do usuário */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Funcionário:</span>
                  <p className="text-gray-900 font-medium">{validation.name}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">CPF:</span>
                  <p className="text-gray-900 font-mono">{validation.cpf}</p>
                </div>
              </div>
            </div>

            {/* Status dos contatos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Email</span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Não cadastrado
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">WhatsApp</span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Não cadastrado
                </Badge>
              </div>
            </div>

            {/* Aviso */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Para enviar documentos:</strong><br/>
                É necessário cadastrar ao menos Email OU WhatsApp para este funcionário.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
            {onRegisterContacts && (
              <Button onClick={onRegisterContacts} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Contatos
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Caso 4: Tentando enviar WhatsApp mas não tem WhatsApp/consentimento
  if (sendType === 'whatsapp') {
    if (!validation.hasWhatsApp) {
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-6 h-6 text-orange-600" />
                <DialogTitle className="text-xl">WhatsApp Não Cadastrado</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Funcionário:</span>
                    <p className="font-medium">{validation.name}</p>
                  </div>
                  <div>
                    <span className="font-semibold">CPF:</span>
                    <p className="font-mono">{validation.cpf}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </div>
                <Badge variant="destructive" className="text-xs">Não cadastrado</Badge>
              </div>

              {validation.hasEmail && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ Alternativa:</strong><br/>
                    O funcionário possui <strong>Email cadastrado</strong>. Você pode enviar por email.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button onClick={onClose} variant="outline">
                Cancelar
              </Button>
              {onRegisterContacts && (
                <Button onClick={onRegisterContacts} className="bg-green-600 hover:bg-green-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Cadastrar WhatsApp
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    if (!validation.whatsappConsent) {
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <DialogTitle className="text-xl">Consentimento WhatsApp Necessário</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Funcionário:</span>
                    <p className="font-medium">{validation.name}</p>
                  </div>
                  <div>
                    <span className="font-semibold">WhatsApp:</span>
                    <p className="font-mono">{validation.whatsapp}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-2">Consentimento não concedido</p>
                    <p>
                      Por segurança e conformidade com a <strong>LGPD</strong> e <strong>Políticas da Meta/WhatsApp</strong>,
                      o funcionário precisa autorizar explicitamente o recebimento de mensagens.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>💡 Como resolver:</strong><br/>
                  Solicite ao funcionário que acesse o sistema, vá em "Meu Perfil" → "Configurações"
                  e autorize o recebimento de mensagens WhatsApp.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={onClose} variant="outline">
                Entendi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }
  }

  // Caso 5: Tentando enviar Email mas não tem Email
  if (sendType === 'email' && !validation.hasEmail) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-6 h-6 text-orange-600" />
              <DialogTitle className="text-xl">Email Não Cadastrado</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Funcionário:</span>
                  <p className="font-medium">{validation.name}</p>
                </div>
                <div>
                  <span className="font-semibold">CPF:</span>
                  <p className="font-mono">{validation.cpf}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <Badge variant="destructive" className="text-xs">Não cadastrado</Badge>
            </div>

            {validation.hasWhatsApp && validation.whatsappConsent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Alternativa:</strong><br/>
                  O funcionário possui <strong>WhatsApp cadastrado</strong>. Você pode enviar por WhatsApp.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
            {onRegisterContacts && (
              <Button onClick={onRegisterContacts} className="bg-blue-600 hover:bg-blue-700">
                <Mail className="w-4 h-4 mr-2" />
                Cadastrar Email
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Caso 6: Tudo OK - confirmação final
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <DialogTitle className="text-xl">Pronto para Enviar</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Funcionário:</span>
                <p className="font-medium">{validation.name}</p>
              </div>
              <div>
                <span className="font-semibold">CPF:</span>
                <p className="font-mono">{validation.cpf}</p>
              </div>
              {sendType === 'email' && validation.email && (
                <div>
                  <span className="font-semibold">Email:</span>
                  <p>{validation.email}</p>
                </div>
              )}
              {sendType === 'whatsapp' && validation.whatsapp && (
                <div>
                  <span className="font-semibold">WhatsApp:</span>
                  <p className="font-mono">{validation.whatsapp}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">✅ Validações OK</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>CPF cadastrado no sistema</li>
                  <li>Nome corresponde ao CPF</li>
                  {sendType === 'whatsapp' && (
                    <>
                      <li>WhatsApp cadastrado</li>
                      <li>Consentimento LGPD ativo</li>
                    </>
                  )}
                  {sendType === 'email' && <li>Email cadastrado</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              onClose();
              // O envio real acontece no componente pai
            }}
            className={sendType === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
          >
            {sendType === 'whatsapp' ? (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar WhatsApp
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Enviar Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

