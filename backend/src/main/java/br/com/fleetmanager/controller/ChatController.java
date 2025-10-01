package br.com.fleetmanager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

// import br.com.fleetmanager.dto.ChatUserDTO;
import br.com.fleetmanager.service.ChatService;
import br.com.fleetmanager.service.NotificationService;
import br.com.fleetmanager.service.UserService;

import br.com.fleetmanager.dto.ChatMessageRequestDTO;
import br.com.fleetmanager.dto.ChatMessageResponseDTO;
import br.com.fleetmanager.model.User;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/chat")
@Slf4j
public class ChatController {
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Envia mensagem de chat
     */
    @PostMapping("/send")
    public ResponseEntity<ChatMessageResponseDTO> sendMessage(
            @Valid @RequestBody ChatMessageRequestDTO request,
            Authentication authentication) {
        
        String username = authentication.getName();
        log.info("Enviando mensagem de chat para usuário: {}", username);
        
        ChatMessageResponseDTO response = chatService.sendChatMessage(request, username);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Busca conversa entre dois usuários
     */
    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<ChatMessageResponseDTO>> getConversation(
            @PathVariable UUID userId,
            Authentication authentication) {
        
        String currentUsername = authentication.getName();
        log.info("Buscando conversa para usuário: {} com: {}", currentUsername, userId);
        
        List<ChatMessageResponseDTO> messages = chatService.getConversation(currentUsername, userId);
        
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Busca mensagens de um grupo
     */
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ChatMessageResponseDTO>> getGroupMessages(@PathVariable UUID groupId) {
        List<ChatMessageResponseDTO> messages = chatService.getGroupMessages(groupId);
        
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Busca mensagens de um departamento
     */
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<ChatMessageResponseDTO>> getDepartmentMessages(@PathVariable UUID departmentId) {
        List<ChatMessageResponseDTO> messages = chatService.getDepartmentMessages(departmentId);
        
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Busca conversas recentes
     */
    @GetMapping("/recent")
    public ResponseEntity<List<ChatMessageResponseDTO>> getRecentConversations(Authentication authentication) {
        try {
            // Obter o ID do usuário a partir do username
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("Usuário não encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            List<ChatMessageResponseDTO> messages = chatService.getRecentConversations(userId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Erro ao buscar conversas recentes: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /*
    /**
     * Busca usuários disponíveis para chat
     */
    /*
    @GetMapping("/users")
    public ResponseEntity<List<ChatUserDTO>> getAvailableUsers(Authentication authentication) {
        UUID currentUserId = UUID.fromString(authentication.getName());
        List<ChatUserDTO> users = chatService.getAvailableUsersForChat(currentUserId);
        return ResponseEntity.ok(users);
    }
    */
    
    /**
     * Marca mensagem como lida
     */
    @PutMapping("/{messageId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID messageId,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("Usuário não encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            chatService.markAsRead(messageId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Erro ao marcar mensagem como lida: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Conta mensagens não lidas
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Long> countUnreadMessages(Authentication authentication) {
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("Usuário não encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            Long count = chatService.countUnreadMessages(userId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Erro ao contar mensagens não lidas: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Busca mensagens não lidas
     */
    @GetMapping("/unread")
    public ResponseEntity<List<ChatMessageResponseDTO>> getUnreadMessages(Authentication authentication) {
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("Usuário não encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            List<ChatMessageResponseDTO> messages = chatService.getUnreadMessages(userId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Erro ao buscar mensagens não lidas: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Edita mensagem
     */
    @PutMapping("/{messageId}/edit")
    public ResponseEntity<ChatMessageResponseDTO> editMessage(
            @PathVariable UUID messageId,
            @RequestParam String content,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("Usuário não encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            ChatMessageResponseDTO response = chatService.editMessage(messageId, content, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erro ao editar mensagem: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Recebe evento de digitação via WebSocket e propaga para os destinatários
     */
    @MessageMapping("/chat/typing")
    public void handleTypingEvent(@Payload TypingEvent typingEvent, SimpMessageHeaderAccessor headerAccessor) {
        log.info("Usuário {} está digitando na conversa {}", typingEvent.getUserId(), typingEvent.getConversationId());
        // Enviar notificação de digitação para os participantes da conversa
        if (typingEvent.getRecipientId() != null) {
            notificationService.sendChatTypingNotification(typingEvent.getRecipientId(), typingEvent);
        }
        if (typingEvent.getGroupId() != null) {
            // Enviar para todos do grupo (exemplo simplificado)
            // notificationService.sendChatTypingNotificationToGroup(typingEvent.getGroupId(), typingEvent);
        }
        if (typingEvent.getDepartmentId() != null) {
            // Enviar para todos do departamento (exemplo simplificado)
            // notificationService.sendChatTypingNotificationToDepartment(typingEvent.getDepartmentId(), typingEvent);
        }
    }
    
    /**
     * Método auxiliar para obter o ID do usuário a partir do username
     */
    private UUID getUserIdFromUsername(String username) {
        try {
            return userService.findByUsername(username)
                .map(User::getId)
                .orElse(null);
        } catch (Exception e) {
            log.error("Erro ao buscar usuário por username: {}", username, e);
            return null;
        }
    }
}

// DTO para evento de digitação
class TypingEvent {
    private String userId;
    private String userName;
    private String conversationId;
    private String recipientId;
    private String groupId;
    private String departmentId;
    // getters e setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }
    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
} 