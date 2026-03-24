package com.z7design.fleet_manager.config;

import com.z7design.fleet_manager.service.UserOnlineStatusService;
import com.z7design.fleet_manager.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
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
 * Listener de eventos WebSocket para rastrear conexÃµes e desconexÃµes de
 * usuÃ¡rios
 */
@Component
public class WebSocketEventListener {
    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);

    @Autowired
    private UserOnlineStatusService userOnlineStatusService;

    @Autowired
    private UserService userService;

    /**
     * Evento disparado quando uma sessÃ£o WebSocket Ã© conectada
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        Principal principal = headerAccessor.getUser();

        if (principal != null) {
            try {
                String username = principal.getName();
                UUID userId = userService.findByUsername(username)
                        .map(user -> user.getId())
                        .orElse(null);

                if (userId != null) {
                    log.info("WebSocket conectado: usuÃ¡rio {} (sessionId: {})", username, sessionId);
                    userOnlineStatusService.userConnected(userId, sessionId);
                } else {
                    log.warn("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                }
            } catch (Exception e) {
                log.error("Erro ao processar conexÃ£o WebSocket: {}", e.getMessage(), e);
            }
        } else {
            log.warn("ConexÃ£o WebSocket sem principal (sessionId: {})", sessionId);
        }
    }

    /**
     * Evento disparado quando uma sessÃ£o WebSocket Ã© desconectada
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        Principal principal = headerAccessor.getUser();

        if (principal != null) {
            try {
                String username = principal.getName();
                UUID userId = userService.findByUsername(username)
                        .map(user -> user.getId())
                        .orElse(null);

                if (userId != null) {
                    log.info("WebSocket desconectado: usuÃ¡rio {} (sessionId: {})", username, sessionId);
                    userOnlineStatusService.userDisconnected(userId, sessionId);
                } else {
                    log.warn("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                }
            } catch (Exception e) {
                log.error("Erro ao processar desconexÃ£o WebSocket: {}", e.getMessage(), e);
            }
        } else {
            log.warn("DesconexÃ£o WebSocket sem principal (sessionId: {})", sessionId);
        }
    }

    /**
     * Evento disparado quando um cliente se subscreve a um tÃ³pico
     */
    @EventListener
    public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String destination = headerAccessor.getDestination();
        Principal principal = headerAccessor.getUser();

        if (principal != null && destination != null) {
            log.debug("SubscriÃ§Ã£o WebSocket: usuÃ¡rio {} subscreveu a {} (sessionId: {})",
                    principal.getName(), destination, sessionId);
        }
    }

    /**
     * Evento disparado quando um cliente cancela subscriÃ§Ã£o a um tÃ³pico
     */
    @EventListener
    public void handleWebSocketUnsubscribeListener(SessionUnsubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        Principal principal = headerAccessor.getUser();

        if (principal != null) {
            log.debug("Cancelamento de subscriÃ§Ã£o WebSocket: usuÃ¡rio {} (sessionId: {})",
                    principal.getName(), sessionId);
        }
    }
}
