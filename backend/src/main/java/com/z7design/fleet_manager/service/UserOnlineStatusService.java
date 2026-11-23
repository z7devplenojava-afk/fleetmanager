package com.z7design.fleet_manager.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serviço para rastrear e gerenciar o status online/offline dos usuários
 */
@Service
public class UserOnlineStatusService {
    private static final Logger log = LoggerFactory.getLogger(UserOnlineStatusService.class);

    // Mapa de userId -> Set de sessionIds (um usuário pode ter múltiplas sessões)
    private final Map<UUID, Set<String>> onlineUsers = new ConcurrentHashMap<>();

    /** Janela de inatividade (ms) para considerar usuário online via atividade REST (60s) */
    private static final long REST_ACTIVITY_WINDOW_MS = 60 * 1000L;

    // Mapa de userId -> timestamp da última requisição REST autenticada (heartbeat)
    private final Map<UUID, Long> restActivity = new ConcurrentHashMap<>();

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Registra atividade REST (heartbeat) de um usuário autenticado via JWT.
     * Fallback para quando a conexão WebSocket não estabelece, mantendo o
     * usuário Online na Gestão de Usuários enquanto houver requisições.
     */
    public void recordActivity(UUID userId) {
        if (userId == null) return;
        restActivity.put(userId, System.currentTimeMillis());
    }

    /**
     * Registra que um usuário está online
     * 
     * @param userId    ID do usuário
     * @param sessionId ID da sessão WebSocket
     */
    public void userConnected(UUID userId, String sessionId) {
        onlineUsers.compute(userId, (key, sessions) -> {
            if (sessions == null) {
                sessions = ConcurrentHashMap.newKeySet();
            }
            sessions.add(sessionId);

            // Se é a primeira sessão deste usuário, notificar que ele ficou online
            if (sessions.size() == 1) {
                log.info("Usuário {} ficou online (sessão: {})", userId, sessionId);
                notifyUserStatusChange(userId, true);
            } else {
                log.debug("Usuário {} adicionou nova sessão: {} (total: {})", userId, sessionId, sessions.size());
            }

            return sessions;
        });
    }

    /**
     * Registra que um usuário está offline
     * 
     * @param userId    ID do usuário
     * @param sessionId ID da sessão WebSocket
     */
    public void userDisconnected(UUID userId, String sessionId) {
        onlineUsers.computeIfPresent(userId, (key, sessions) -> {
            sessions.remove(sessionId);

            // Se não há mais sessões, o usuário depende só do heartbeat REST
            if (sessions.isEmpty()) {
                log.info("Usuário {} ficou offline (última sessão removida: {})", userId, sessionId);
                // Não notifica offline imediatamente se o heartbeat REST ainda estiver válido
                if (!isUserOnline(userId)) {
                    notifyUserStatusChange(userId, false);
                }
                return null; // Remove o usuário do mapa
            } else {
                log.debug("Usuário {} removeu sessão: {} (restantes: {})", userId, sessionId, sessions.size());
                return sessions;
            }
        });
    }

    /**
     * Limpeza periódica (a cada 30 segundos) de heartbeats REST expirados.
     * Notifica via WebSocket quando um usuário não tiver mais sessões WS nem heartbeat REST ativo.
     */
    @Scheduled(fixedDelay = 30000)
    public void cleanExpiredRestActivity() {
        long now = System.currentTimeMillis();
        restActivity.forEach((userId, lastSeen) -> {
            if (now - lastSeen > REST_ACTIVITY_WINDOW_MS) {
                restActivity.remove(userId);
                Set<String> sessions = onlineUsers.get(userId);
                if (sessions == null || sessions.isEmpty()) {
                    log.info("Heartbeat REST expirado para usuário {}. Notificando offline.", userId);
                    notifyUserStatusChange(userId, false);
                }
            }
        });
    }

    /**
     * Verifica se um usuário está online
     * 
     * @param userId ID do usuário
     * @return true se o usuário está online, false caso contrário
     */
    public boolean isUserOnline(UUID userId) {
        if (userId == null) return false;

        Set<String> sessions = onlineUsers.get(userId);
        if (sessions != null && !sessions.isEmpty()) {
            return true;
        }
        // Fallback: atividade REST nos últimos REST_ACTIVITY_WINDOW_MS
        Long lastSeen = restActivity.get(userId);
        if (lastSeen != null) {
            if (System.currentTimeMillis() - lastSeen <= REST_ACTIVITY_WINDOW_MS) {
                return true;
            }
            // Expirou a janela — limpa e valida as sessões WS restantes
            restActivity.remove(userId);
            sessions = onlineUsers.get(userId);
            return sessions != null && !sessions.isEmpty();
        }
        return false;
    }

    /**
     * Obtém o número de usuários online
     * 
     * @return número de usuários online
     */
    public int getOnlineUserCount() {
        return onlineUsers.size();
    }

    /**
     * Obtém todos os IDs de usuários online
     * 
     * @return Set de IDs de usuários online
     */
    public Set<UUID> getOnlineUserIds() {
        return Set.copyOf(onlineUsers.keySet());
    }

    /**
     * Notifica todos os clientes sobre mudança de status de um usuário
     * 
     * @param userId   ID do usuário
     * @param isOnline true se ficou online, false se ficou offline
     */
    private void notifyUserStatusChange(UUID userId, boolean isOnline) {
        try {
            UserStatusEvent event = new UserStatusEvent();
            event.setUserId(userId.toString());
            event.setOnline(isOnline);
            event.setTimestamp(System.currentTimeMillis());

            // Enviar para tópico público (broadcast)
            messagingTemplate.convertAndSend("/topic/user-status", event);

            // Enviar para fila específica do usuário (se necessário)
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/user-status",
                    event);

            log.debug("Notificação de status enviada: usuário {} está {}", userId, isOnline ? "online" : "offline");
        } catch (Exception e) {
            log.error("Erro ao notificar mudança de status do usuário {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * DTO interno para eventos de status
     */
    public static class UserStatusEvent {
        private String userId;
        private boolean isOnline;
        private long timestamp;

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public boolean isOnline() {
            return isOnline;
        }

        public void setOnline(boolean online) {
            isOnline = online;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }
}
