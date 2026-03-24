import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, XCircle, UserPlus, Phone, Loader2, Edit } from 'lucide-react';
import { contactValidationService, ContactValidationDetail, ContactValidationResponse } from '@/services/contactValidationService';
import { useToast } from '@/hooks/use-toast';
import { QuickUserFormModal } from './QuickUserFormModal';
import { WhatsAppUpdateModal } from './WhatsAppUpdateModal';
import { WhatsAppConsentConfirmationModal } from './WhatsAppConsentConfirmationModal';
import { EmailUpdateModal } from './EmailUpdateModal';

interface ContactValidationModalProps {
  open: boolean;
  onClose: () => void;
  employeeIds: string[];
  sendType: 'email' | 'whatsapp' | 'both';
  documentType?: 'holerite' | 'comprovante' | 'unificado';
  month?: number;
  year?: number;
  onValidated: (validatedIds: string[]) => void;
}

export const ContactValidationModal: React.FC<ContactValidationModalProps> = ({
  open,
  onClose,
  employeeIds,
  sendType,
  documentType,
  month,
  year,
  onValidated,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validationData, setValidationData] = useState<ContactValidationResponse | null>(null);
  const [selectedForAction, setSelectedForAction] = useState<ContactValidationDetail | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [consentDetail, setConsentDetail] = useState<ContactValidationDetail | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [bulkConsentLoading, setBulkConsentLoading] = useState(false);

  useEffect(() => {
    if (open && employeeIds.length > 0) {
      validateContacts();
    }
  }, [open, employeeIds]);

  const validateContacts = async () => {
    setLoading(true);
    try {
      const response = await contactValidationService.validateContacts({
        employeeIds,
        type: sendType,
        documentType,
        month,
        year,
      });
      setValidationData(response);
    } catch (error: any) {
      console.error('Erro ao validar contatos:', error);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível validar os contatos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = (detail: ContactValidationDetail) => {
    setSelectedForAction(detail);
    setShowUserModal(true);
  };

  const handleAddWhatsApp = (detail: ContactValidationDetail) => {
    setSelectedForAction(detail);
    setShowWhatsAppModal(true);
  };

  const handleAddEmail = (detail: ContactValidationDetail) => {
    setSelectedForAction(detail);
    setShowEmailModal(true);
  };

  const handleEditOrCreateUser = (detail: ContactValidationDetail) => {
    // Se não tem usuário, abre modal de criação
    if (detail.needsUserCreation || !detail.hasUser) {
      handleCreateUser(detail);
    } else if (detail.hasUser) {
      // Se tem usuário mas precisa de atualização, verifica o que falta
      if (detail.needsEmailUpdate && (sendType === 'email' || sendType === 'both')) {
        handleAddEmail(detail);
        return;
      }
      if (detail.needsWhatsAppUpdate && (sendType === 'whatsapp' || sendType === 'both')) {
        handleAddWhatsApp(detail);
      } else {
        // Se tem usuário mas precisa de cadastro completo, abre modal de criação (que permitirá editar)
        handleCreateUser(detail);
      }
    }
  };

  const handleUserCreated = () => {
    setShowUserModal(false);
    setSelectedForAction(null);
    // Re-validar após criar usuário
    validateContacts();
    toast({
      title: '✅ Sucesso',
      description: 'Usuário criado com sucesso',
    });
  };

  const handleWhatsAppUpdated = () => {
    setShowWhatsAppModal(false);
    setSelectedForAction(null);
    // Re-validar após atualizar WhatsApp
    validateContacts();
    toast({
      title: '✅ Sucesso',
      description: 'WhatsApp atualizado com sucesso',
    });
  };

  const handleEmailUpdated = () => {
    setShowEmailModal(false);
    setSelectedForAction(null);
    validateContacts();
    toast({
      title: '✅ Sucesso',
      description: 'Email atualizado com sucesso',
    });
  };

  const handleSendNow = () => {
    if (!validationData) return;
    
    // Retornar apenas IDs dos funcionários prontos para envio
    const readyIds = validationData.details
      .filter(d => d.status === 'ready')
      .map(d => d.employeeId);
    
    onValidated(readyIds);
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'needs_action':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-600">Pronto</Badge>;
      case 'needs_action':
        return <Badge className="bg-yellow-600">Ação Necessária</Badge>;
      case 'error':
        return <Badge className="bg-red-600">Erro</Badge>;
      default:
        return null;
    }
  };

  const isWhatsAppFlow = sendType === 'whatsapp' || sendType === 'both';
  const consentPendingDetails = isWhatsAppFlow && validationData
    ? validationData.details.filter((detail) => {
        const whatsappError = detail.whatsappError?.toLowerCase() || '';
        return detail.hasUser && (detail.needsWhatsAppConsent || whatsappError.includes('consent'));
      })
    : [];
  const consentEligibleDetails = consentPendingDetails?.filter((detail) => detail.userId);

  // Funcionários não encontrados (precisam de cadastro ou edição)
  const notFoundDetails = validationData
    ? validationData.details.filter((detail) => {
        const needsCreation = detail.needsUserCreation || !detail.hasUser;
        const hasError = detail.status === 'error' && 
          (detail.generalError?.toLowerCase().includes('não encontrado') ||
           detail.generalError?.toLowerCase().includes('não cadastrado') ||
           detail.generalError?.toLowerCase().includes('não existe'));
        return needsCreation || hasError;
      })
    : [];

  const openConsentModal = (detail: ContactValidationDetail) => {
    setConsentDetail(detail);
    setShowConsentModal(true);
  };

  const handleConsentModalClose = () => {
    if (!bulkConsentLoading) {
      setShowConsentModal(false);
      setConsentDetail(null);
    }
  };

  const handleConsentGranted = async () => {
    setShowConsentModal(false);
    setConsentDetail(null);
    await validateContacts();
    toast({
      title: 'Consentimento registrado',
      description: 'O colaborador foi autorizado a receber mensagens via WhatsApp.',
    });
  };

  const handleBulkConsent = async () => {
    if (!consentEligibleDetails || consentEligibleDetails.length === 0) {
      toast({
        title: 'Nenhum usuário elegível',
        description: 'Não há usuários com cadastro válido para registrar consentimento.',
      });
      return;
    }
    setBulkConsentLoading(true);
    try {
      for (const detail of consentEligibleDetails) {
        if (!detail.userId) continue;
        await contactValidationService.grantWhatsAppConsent(detail.userId, detail.userWhatsapp);
      }
      toast({
        title: 'Consentimento atualizado',
        description: `${consentEligibleDetails.length} colaborador(es) marcados como autorizados.`,
      });
      await validateContacts();
    } catch (error: any) {
      console.error('Erro ao registrar consentimentos:', error);
      toast({
        title: 'Erro ao registrar consentimento',
        description: error?.response?.data?.message || 'Falha ao registrar consentimento em massa.',
        variant: 'destructive',
      });
    } finally {
      setBulkConsentLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-black border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-seguranca-lightgray flex items-center gap-2">
              📤 Validar Contatos para Envio
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Tipo de envio: <Badge className="ml-2">{sendType === 'both' ? 'Email + WhatsApp' : sendType === 'email' ? '📧 Email' : '📱 WhatsApp'}</Badge>
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
              <span className="ml-3 text-gray-400">Validando contatos...</span>
            </div>
          ) : validationData ? (
            <div className="space-y-4">
              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-700">
                  <div className="text-2xl font-bold text-green-500">{validationData.readyToSend}</div>
                  <div className="text-sm text-gray-400">Prontos</div>
                </div>
                <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-700">
                  <div className="text-2xl font-bold text-yellow-500">{validationData.needingAction}</div>
                  <div className="text-sm text-gray-400">Ação Necessária</div>
                </div>
                <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-700">
                  <div className="text-2xl font-bold text-red-500">{validationData.withErrors}</div>
                  <div className="text-sm text-gray-400">Com Erros</div>
                </div>
              </div>

              {/* Mensagem geral */}
              {!validationData.allReady && (
                <Alert className="bg-yellow-900/20 border-yellow-600">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-200">
                    {validationData.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Funcionários não encontrados */}
              {notFoundDetails && notFoundDetails.length > 0 && (
                <div className="rounded-lg border border-red-600 bg-red-900/20 p-4 space-y-3">
                  <div>
                    <p className="text-red-200 font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      {notFoundDetails.length} funcionário(s) não encontrado(s) no banco de dados
                    </p>
                    <p className="text-sm text-red-100/80 mt-1">
                      É necessário cadastrar ou editar os dados desses funcionários antes do envio.
                    </p>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notFoundDetails.map((detail) => (
                      <div
                        key={detail.employeeId}
                        className="flex items-center justify-between border border-red-700/40 rounded-lg px-4 py-3 bg-seguranca-black/60"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-seguranca-lightgray">
                            {detail.employeeName || 'Nome não informado'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">CPF: {detail.employeeCpf}</p>
                          {detail.employeeEmail && (
                            <p className="text-xs text-gray-400">Email: {detail.employeeEmail}</p>
                          )}
                          {detail.employeePhone && (
                            <p className="text-xs text-gray-400">Telefone: {detail.employeePhone}</p>
                          )}
                          {detail.statusMessage && (
                            <p className="text-xs text-red-300 mt-1">{detail.statusMessage}</p>
                          )}
                          {detail.generalError && (
                            <p className="text-xs text-red-400 mt-1">⚠️ {detail.generalError}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-300 hover:bg-green-500/10 ml-4"
                          onClick={() => handleEditOrCreateUser(detail)}
                        >
                          {detail.needsUserCreation || !detail.hasUser ? (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Cadastrar
                            </>
                          ) : (
                            <>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consentimento pendente */}
              {isWhatsAppFlow && consentPendingDetails && consentPendingDetails.length > 0 && (
                <div className="rounded-lg border border-yellow-600 bg-yellow-900/20 p-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-yellow-200 font-semibold">
                        {consentPendingDetails.length} colaborador(es) sem consentimento WhatsApp
                      </p>
                      <p className="text-sm text-yellow-100/80">
                        Eles não serão enviados até que o consentimento seja registrado.
                      </p>
                    </div>
                    <Button
                      onClick={handleBulkConsent}
                      disabled={bulkConsentLoading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {bulkConsentLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Registrando...
                        </>
                      ) : (
                        <>Aceitar consentimento para todos</>
                      )}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {consentPendingDetails.map((detail) => (
                      <div
                        key={detail.employeeId}
                        className="flex items-center justify-between border border-yellow-700/40 rounded-lg px-3 py-2 bg-seguranca-black/60"
                      >
                        <div>
                          <p className="text-sm font-medium text-seguranca-lightgray">
                            {detail.employeeName}
                          </p>
                          <p className="text-xs text-gray-400">{detail.employeeCpf}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-500 text-yellow-300 hover:bg-yellow-500/10"
                          onClick={() => openConsentModal(detail)}
                        >
                          Aceitar consentimento
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de funcionários */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {validationData.details.map((detail) => (
                  <div
                    key={detail.employeeId}
                    className="bg-seguranca-graphite p-4 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(detail.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-seguranca-lightgray">
                              {detail.employeeName}
                            </h3>
                            {getStatusBadge(detail.status)}
                          </div>
                          <p className="text-sm text-gray-400">CPF: {detail.employeeCpf}</p>
                          
                          {/* Informações de contato */}
                          <div className="mt-2 space-y-1">
                            {(sendType === 'email' || sendType === 'both') && (
                              <div className="text-sm">
                                <span className="text-gray-500">Email:</span>{' '}
                                <span className={detail.canSendEmail ? 'text-green-400' : 'text-red-400'}>
                                  {detail.userEmail || detail.employeeEmail || 'Não cadastrado'}
                                </span>
                              </div>
                            )}
                            
                            {(sendType === 'whatsapp' || sendType === 'both') && (
                              <div className="text-sm">
                                <span className="text-gray-500">WhatsApp:</span>{' '}
                                <span className={detail.canSendWhatsApp ? 'text-green-400' : 'text-red-400'}>
                                  {detail.userWhatsapp || 'Não cadastrado'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Mensagem de status */}
                          <p className="text-sm text-gray-400 mt-2">{detail.statusMessage}</p>

                          {/* Erros */}
                          {detail.emailError && (
                            <p className="text-sm text-red-400 mt-1">⚠️ {detail.emailError}</p>
                          )}
                          {detail.whatsappError && (
                            <p className="text-sm text-red-400 mt-1">⚠️ {detail.whatsappError}</p>
                          )}
                        </div>
                      </div>

                      {/* Botões de ação */}
                      {detail.status === 'needs_action' && (
                        <div className="flex flex-col gap-2 ml-4">
                          {detail.needsUserCreation && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateUser(detail)}
                              className="border-green-600 text-green-400 hover:bg-green-600/10"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Criar Usuário
                            </Button>
                          )}
                          {detail.needsWhatsAppUpdate && detail.hasUser && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddWhatsApp(detail)}
                              className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Adicionar WhatsApp
                            </Button>
                          )}
                          {detail.needsEmailUpdate && detail.hasUser && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddEmail(detail)}
                              className="border-amber-500 text-amber-300 hover:bg-amber-500/10"
                            >
                              Atualizar Email
                            </Button>
                          )}
                          {isWhatsAppFlow && detail.hasUser && (detail.needsWhatsAppConsent || (detail.whatsappError || '').toLowerCase().includes('consent')) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openConsentModal(detail)}
                              className="border-yellow-500 text-yellow-300 hover:bg-yellow-500/10"
                            >
                              Aceitar consentimento
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendNow}
              disabled={!validationData || validationData.readyToSend === 0}
              className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/80"
            >
              Enviar Agora ({validationData?.readyToSend || 0})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modais de ação */}
      {selectedForAction && (
        <>
          <QuickUserFormModal
            open={showUserModal}
            onClose={() => setShowUserModal(false)}
            employeeDetail={selectedForAction}
            onSuccess={handleUserCreated}
          />
          <WhatsAppUpdateModal
            open={showWhatsAppModal}
            onClose={() => setShowWhatsAppModal(false)}
            employeeDetail={selectedForAction}
            onSuccess={handleWhatsAppUpdated}
          />
          <EmailUpdateModal
            open={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            employeeDetail={selectedForAction}
            onSuccess={handleEmailUpdated}
          />
        </>
      )}

      {consentDetail && (
        <WhatsAppConsentConfirmationModal
          open={showConsentModal}
          onClose={handleConsentModalClose}
          employeeDetail={consentDetail}
          onConsentGranted={handleConsentGranted}
        />
      )}
    </>
  );
};

