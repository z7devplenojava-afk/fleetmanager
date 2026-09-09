/**
 * Ações de deep-link para mensagens do sino de notificações.
 * Mapeia mensagens geradas pelo backend (ex: MaintenanceAlertScheduler)
 * para a página correspondente do módulo.
 */
import { SystemMessage } from '@/stores/messageStore';

/** Prefixos de título usados pelo MaintenanceAlertScheduler (backend). */
export const MAINTENANCE_ALERT_TITLE_PREFIXES = [
  '🔧 Manutenção Preventiva Vencida',
  '🔧 Manutenção Preventiva Próxima',
] as const;

export interface MessageAction {
  label: string;
  to: string;
}

/**
 * Retorna a ação de deep-link da mensagem, quando aplicável.
 * Só mensagens do sistema (rawType NOTIFICATION) com título conhecido
 * recebem link — mensagens de usuários jamais.
 */
export const getMessageAction = (message: Pick<SystemMessage, 'title' | 'rawType'>): MessageAction | undefined => {
  if (message.rawType !== 'NOTIFICATION') return undefined;

  if (MAINTENANCE_ALERT_TITLE_PREFIXES.some(prefix => message.title.startsWith(prefix))) {
    return { label: 'Ver Ordens de Serviço', to: '/frota/ordens-servico' };
  }

  return undefined;
};
