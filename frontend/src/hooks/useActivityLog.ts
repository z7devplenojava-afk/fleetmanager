import { useCallback } from 'react';
import { activityLogService } from '@/services/activityLogService';

export const useActivityLog = () => {
  /**
   * Registra uma atividade de forma simplificada
   */
  const logActivity = useCallback((action: string, module?: string, details?: string) => {
    activityLogService.logSimpleActivity(action, module, details);
  }, []);

  /**
   * Registra uma atividade de login
   */
  const logLogin = useCallback((username: string, success: boolean = true) => {
    const action = success ? 'LOGIN' : 'LOGIN_FAILED';
    const status = success ? 'SUCCESS' : 'ERROR';
    const details = success ? `Login realizado com sucesso` : `Tentativa de login falhou`;
    
    activityLogService.logActivity(username, action, 'AUTENTICACAO', details, status);
  }, []);

  /**
   * Registra uma atividade de logout
   */
  const logLogout = useCallback((username: string) => {
    activityLogService.logActivity(username, 'LOGOUT', 'AUTENTICACAO', 'Logout realizado', 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de criação
   */
  const logCreate = useCallback((username: string, module: string, details: string) => {
    activityLogService.logActivity(username, 'CRIAR', module, details, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de atualização
   */
  const logUpdate = useCallback((username: string, module: string, details: string) => {
    activityLogService.logActivity(username, 'ATUALIZAR', module, details, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de exclusão
   */
  const logDelete = useCallback((username: string, module: string, details: string) => {
    activityLogService.logActivity(username, 'EXCLUIR', module, details, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de consulta
   */
  const logQuery = useCallback((username: string, module: string, details: string) => {
    activityLogService.logActivity(username, 'CONSULTAR', module, details, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de erro
   */
  const logError = useCallback((username: string, module: string, details: string) => {
    activityLogService.logActivity(username, 'ERRO', module, details, 'ERROR');
  }, []);

  /**
   * Registra uma atividade de acesso a página
   */
  const logPageAccess = useCallback((username: string, pageName: string) => {
    activityLogService.logActivity(username, 'ACESSAR_PAGINA', 'NAVEGACAO', `Acessou a página: ${pageName}`, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de download
   */
  const logDownload = useCallback((username: string, module: string, fileName: string) => {
    activityLogService.logActivity(username, 'DOWNLOAD', module, `Download do arquivo: ${fileName}`, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de upload
   */
  const logUpload = useCallback((username: string, module: string, fileName: string) => {
    activityLogService.logActivity(username, 'UPLOAD', module, `Upload do arquivo: ${fileName}`, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de exportação
   */
  const logExport = useCallback((username: string, module: string, format: string) => {
    activityLogService.logActivity(username, 'EXPORTAR', module, `Exportação em formato: ${format}`, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de importação
   */
  const logImport = useCallback((username: string, module: string, details: string) => {
    activityLogService.logActivity(username, 'IMPORTAR', module, details, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de impressão
   */
  const logPrint = useCallback((username: string, module: string, details: string) => {
    activityLogService.logActivity(username, 'IMPRIMIR', module, details, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de envio de email
   */
  const logEmailSend = useCallback((username: string, recipient: string, subject: string) => {
    activityLogService.logActivity(username, 'ENVIAR_EMAIL', 'COMUNICACAO', 
                                 `Email enviado para: ${recipient} - Assunto: ${subject}`, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de envio de WhatsApp
   */
  const logWhatsAppSend = useCallback((username: string, recipient: string, message: string) => {
    activityLogService.logActivity(username, 'ENVIAR_WHATSAPP', 'COMUNICACAO', 
                                 `WhatsApp enviado para: ${recipient}`, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de backup
   */
  const logBackup = useCallback((username: string, module: string, details: string) => {
    activityLogService.logActivity(username, 'BACKUP', module, details, 'SUCCESS');
  }, []);

  /**
   * Registra uma atividade de restauração
   */
  const logRestore = useCallback((username: string, module: string, details: string) => {
    activityLogService.logActivity(username, 'RESTAURAR', module, details, 'SUCCESS');
  }, []);

  return {
    logActivity,
    logLogin,
    logLogout,
    logCreate,
    logUpdate,
    logDelete,
    logQuery,
    logError,
    logPageAccess,
    logDownload,
    logUpload,
    logExport,
    logImport,
    logPrint,
    logEmailSend,
    logWhatsAppSend,
    logBackup,
    logRestore
  };
};
