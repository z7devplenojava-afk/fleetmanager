package com.z7design.fleet_manager.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ServiÃ§o para rastrear e gerenciar o status online/offline dos usuÃ¡rios
 */
@Service
public class UserOnlineStatusService {
    private static final Logger log = LoggerFactory.getLogger(UserOnlineStatusService.class);

    // Mapa de userId -> Set de sessionIds (um usuÃ¡rio pode ter mÃºltiplas
    // sessÃµes)
    private final Map<UUID, Set<String>> onlineUsers = new ConcurrentHashMap<>();

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Registra que um usuÃ¡rio estÃ¡ online
     * 
     * @param userId    ID do usuÃ¡rio
     * @param sessionId ID da sessÃ£o WebSocket
     */
    public void userConnected(UUID userId, String sessionId) {
        onlineUsers.compute(userId, (key, sessions) -> {
            if (sessions == null) {
                sessions = ConcurrentHashMap.newKeySet();
            }
            sessions.add(sessionId);

            // Se Ã© a primeira sessÃ£o deste usuÃ¡rio, notificar que ele ficou online
            if (sessions.size() == 1) {
                log.info("UsuÃ¡rio {} ficou online (sessÃ£o: {})", userId, sessionId);
                notifyUserStatusChange(userId, true);
            } else {
                log.debug("UsuÃ¡rio {} adicionou nova sessÃ£o: {} (total: {})", userId, sessionId, sessions.size());
            }

            return sessions;
        });
    }

    /**
     * Registra que um usuÃ¡rio estÃ¡ offline
     * 
     * @param userId    ID do usuÃ¡rio
     * @param sessionId ID da sessÃ£o WebSocket
     */
    public void userDisconnected(UUID userId, String sessionId) {
        onlineUsers.computeIfPresent(userId, (key, sessions) -> {
            sessions.remove(sessionId);

            // Se nÃ£o hÃ¡ mais sessÃµes, o usuÃ¡rio ficou offline
            if (sessions.isEmpty()) {
                log.info("UsuÃ¡rio {} ficou offline (Ãºltima sessÃ£o removida: {})", userId, sessionId);
                notifyUserStatusChange(userId, false);
                return null; // Remove o usuÃ¡rio do mapa
            } else {
                log.debug("UsuÃ¡rio {} removeu sessÃ£o: {} (restantes: {})", userId, sessionId, sessions.size());
                return sessions;
            }
        });
    }

    /**
     * Verifica se um usuÃ¡rio estÃ¡ online
     * 
     * @param userId ID do usuÃ¡rio
     * @return true se o usuÃ¡rio estÃ¡ online, false caso contrÃ¡rio
     */
    public boolean isUserOnline(UUID userId) {
        return onlineUsers.containsKey(userId) && !onlineUsers.get(userId).isEmpty();
    }

    /**
     * ObtÃ©m o nÃºmero de usuÃ¡rios online
     * 
     * @return nÃºmero de usuÃ¡rios online
     */
    public int getOnlineUserCount() {
        return onlineUsers.size();
    }

    /**
     * ObtÃ©m todos os IDs de usuÃ¡rios online
     * 
     * @return Set de IDs de usuÃ¡rios online
     */
    public Set<UUID> getOnlineUserIds() {
        return Set.copyOf(onlineUsers.keySet());
    }

    /**
     * Notifica todos os clientes sobre mudanÃ§a de status de um usuÃ¡rio
     * 
     * @param userId   ID do usuÃ¡rio
     * @param isOnline true se ficou online, false se ficou offline
     */
    private void notifyUserStatusChange(UUID userId, boolean isOnline) {
        try {
            UserStatusEvent event = new UserStatusEvent();
            event.setUserId(userId.toString());
            event.setOnline(isOnline);
            event.setTimestamp(System.currentTimeMillis());

            // Enviar para tÃ³pico pÃºblico (broadcast)
            messagingTemplate.convertAndSend("/topic/user-status", event);

            // Enviar para fila especÃ­fica do usuÃ¡rio (se necessÃ¡rio)
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/user-status",
                    event);

            log.debug("NotificaÃ§Ã£o de status enviada: usuÃ¡rio {} estÃ¡ {}", userId, isOnline ? "online" : "offline");
        } catch (Exception e) {
            log.error("Erro ao notificar mudanÃ§a de status do usuÃ¡rio {}: {}", userId, e.getMessage(), e);
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
