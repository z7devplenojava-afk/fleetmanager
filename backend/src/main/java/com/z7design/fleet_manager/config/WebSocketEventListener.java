package com.z7design.fleet_manager.config;

import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.service.UserOnlineStatusService;
import com.z7design.fleet_manager.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import java.security.Principal;
import java.util.UUID;

/**
 * Listener de eventos WebSocket para rastrear conexões e desconexões de usuários
 */
@Component
public class WebSocketEventListener {
    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);

    @Autowired
    private UserOnlineStatusService userOnlineStatusService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    private UUID resolveUserIdFromPrincipal(Principal principal) {
        if (principal == null) return null;

        // Se o principal for UsernamePasswordAuthenticationToken contendo User
        if (principal instanceof UsernamePasswordAuthenticationToken tokenAuth) {
            Object principalObj = tokenAuth.getPrincipal();
            if (principalObj instanceof User userEntity && userEntity.getId() != null) {
                return userEntity.getId();
            }
        }

        String username = principal.getName();
        if (username == null || username.isBlank()) return null;

        String cleanDigits = username.replaceAll("\\D", "");
        return userRepository.findByIdentifierNative(username, cleanDigits)
                .or(() -> userRepository.findByUsernameNative(username))
                .or(() -> userRepository.findByEmailNative(username))
                .or(() -> userService.findByUsername(username))
                .map(User::getId)
                .orElse(null);
    }

    /**
     * Evento disparado quando uma sessão WebSocket é conectada
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        Principal principal = headerAccessor.getUser();

        if (principal != null) {
            try {
                String username = principal.getName();
                UUID userId = resolveUserIdFromPrincipal(principal);

                if (userId != null) {
                    log.info("WebSocket conectado: usuário {} (ID: {}, sessionId: {})", username, userId, sessionId);
                    userOnlineStatusService.userConnected(userId, sessionId);
                } else {
                    log.warn("Usuário não encontrado para principal: {}", username);
                }
            } catch (Exception e) {
                log.error("Erro ao processar conexão WebSocket: {}", e.getMessage(), e);
            }
        } else {
            log.warn("Conexão WebSocket sem principal (sessionId: {})", sessionId);
        }
    }

    /**
     * Evento disparado quando uma sessão WebSocket é desconectada
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        Principal principal = headerAccessor.getUser();

        if (principal != null) {
            try {
                String username = principal.getName();
                UUID userId = resolveUserIdFromPrincipal(principal);

                if (userId != null) {
                    log.info("WebSocket desconectado: usuário {} (ID: {}, sessionId: {})", username, userId, sessionId);
                    userOnlineStatusService.userDisconnected(userId, sessionId);
                } else {
                    log.warn("Usuário não encontrado para principal na desconexão: {}", username);
                }
            } catch (Exception e) {
                log.error("Erro ao processar desconexão WebSocket: {}", e.getMessage(), e);
            }
        } else {
            log.warn("Desconexão WebSocket sem principal (sessionId: {})", sessionId);
        }
    }

    /**
     * Evento disparado quando um cliente se subscreve a um tópico
     */
    @EventListener
    public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String destination = headerAccessor.getDestination();
        Principal principal = headerAccessor.getUser();

        if (principal != null && destination != null) {
            log.debug("Subscrição WebSocket: usuário {} subscreveu a {} (sessionId: {})",
                    principal.getName(), destination, sessionId);
        }
    }

    /**
     * Evento disparado quando um cliente cancela subscrição a um tópico
     */
    @EventListener
    public void handleWebSocketUnsubscribeListener(SessionUnsubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        Principal principal = headerAccessor.getUser();

        if (principal != null) {
            log.debug("Cancelamento de subscrição WebSocket: usuário {} (sessionId: {})",
                    principal.getName(), sessionId);
        }
    }
}
