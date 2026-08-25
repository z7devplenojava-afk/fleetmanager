package com.z7design.fleet_manager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.dto.ChatMessageRequestDTO;
import com.z7design.fleet_manager.dto.ChatMessageResponseDTO;
import com.z7design.fleet_manager.dto.ReactionSummaryDTO;
// import com.z7design.fleet_manager.dto.ChatUserDTO;
import com.z7design.fleet_manager.service.ChatService;
import com.z7design.fleet_manager.service.MessageReactionService;
import com.z7design.fleet_manager.service.NotificationService;
import com.z7design.fleet_manager.service.UserService;
import com.z7design.fleet_manager.model.User;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import com.z7design.fleet_manager.service.ChatFileService;
import com.z7design.fleet_manager.service.ChatFileService.ChatFileInfo;
import com.z7design.fleet_manager.exception.BusinessException;

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
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private MessageReactionService reactionService;
    
    @Autowired
    private ChatFileService chatFileService;
    
    @Autowired
    private com.z7design.fleet_manager.service.ChatMessageActionService actionService;
    
    /**
     * Envia mensagem de chat (texto)
     */
    @PostMapping("/send")
    public ResponseEntity<ChatMessageResponseDTO> sendMessage(
            @Valid @RequestBody ChatMessageRequestDTO request,
            Authentication authentication) {
        
        String username = authentication.getName();
        log.info("Enviando mensagem de chat para usuÃ¡rio: {}", username);
        
        ChatMessageResponseDTO response = chatService.sendChatMessage(request, username);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Envia mensagem de chat com arquivo (imagem, Ã¡udio, vÃ­deo, documento)
     */
    @PostMapping(value = "/send-with-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatMessageResponseDTO> sendMessageWithFile(
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "recipientId", required = false) UUID recipientId,
            @RequestParam(value = "groupId", required = false) UUID groupId,
            @RequestParam(value = "departmentId", required = false) UUID departmentId,
            @RequestParam(value = "type", required = false, defaultValue = "TEXT") String typeStr,
            @RequestParam(value = "replyToId", required = false) UUID replyToId,
            @RequestParam(value = "file") MultipartFile file,
            Authentication authentication) {
        
        String username = authentication.getName();
        log.info("Enviando mensagem de chat com arquivo para usuÃ¡rio: {}", username);
        
        try {
            // Validar que pelo menos um destinatÃ¡rio foi especificado
            if (recipientId == null && groupId == null && departmentId == null) {
                log.error("Nenhum destinatÃ¡rio especificado para mensagem com arquivo");
                return ResponseEntity.badRequest().build();
            }
            
            // Validar arquivo
            if (file == null || file.isEmpty()) {
                log.error("Arquivo nÃ£o fornecido ou vazio");
                return ResponseEntity.badRequest().build();
            }
            
            // Determinar tipo de mensagem baseado no arquivo
            com.z7design.fleet_manager.model.enums.ChatMessageType messageType = 
                determineMessageTypeFromFile(file);
            
            // Salvar arquivo
            ChatFileInfo fileInfo = chatFileService.saveChatFile(file, messageType);
            
            // Criar DTO da requisiÃ§Ã£o
            ChatMessageRequestDTO request = new ChatMessageRequestDTO();
            request.setContent(content != null && !content.trim().isEmpty() ? content : "");
            request.setRecipientId(recipientId);
            request.setGroupId(groupId);
            request.setDepartmentId(departmentId);
            request.setType(messageType);
            request.setReplyToId(replyToId);
            request.setFileUrl(fileInfo.getUrl());
            request.setFileName(fileInfo.getOriginalName());
            request.setFileSize(fileInfo.getSize());
            request.setFileContentType(fileInfo.getContentType());
            
            ChatMessageResponseDTO response = chatService.sendChatMessage(request, username);
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("Erro de negÃ³cio ao enviar mensagem com arquivo: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao enviar mensagem com arquivo: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Determina o tipo de mensagem baseado no arquivo
     */
    private com.z7design.fleet_manager.model.enums.ChatMessageType determineMessageTypeFromFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null) {
            return com.z7design.fleet_manager.model.enums.ChatMessageType.FILE;
        }
        
        if (contentType.startsWith("image/")) {
            return com.z7design.fleet_manager.model.enums.ChatMessageType.IMAGE;
        } else if (contentType.startsWith("audio/")) {
            return com.z7design.fleet_manager.model.enums.ChatMessageType.AUDIO;
        } else if (contentType.startsWith("video/")) {
            return com.z7design.fleet_manager.model.enums.ChatMessageType.VIDEO;
        } else {
            return com.z7design.fleet_manager.model.enums.ChatMessageType.FILE;
        }
    }
    
    /**
     * Busca conversa entre dois usuÃ¡rios
     */
    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<ChatMessageResponseDTO>> getConversation(
            @PathVariable("userId") UUID userId,
            Authentication authentication) {
        
        String currentUsername = authentication.getName();
        log.info("Buscando conversa para usuÃ¡rio: {} com: {}", currentUsername, userId);
        
        List<ChatMessageResponseDTO> messages = chatService.getConversation(currentUsername, userId);
        
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Busca mensagens de um grupo
     */
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ChatMessageResponseDTO>> getGroupMessages(@PathVariable("groupId") UUID groupId) {
        List<ChatMessageResponseDTO> messages = chatService.getGroupMessages(groupId);
        
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Busca mensagens de um departamento
     */
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<ChatMessageResponseDTO>> getDepartmentMessages(@PathVariable("departmentId") UUID departmentId) {
        List<ChatMessageResponseDTO> messages = chatService.getDepartmentMessages(departmentId);
        
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Busca conversas recentes
     */
    @GetMapping("/recent")
    public ResponseEntity<List<ChatMessageResponseDTO>> getRecentConversations(Authentication authentication) {
        try {
            // Obter o ID do usuÃ¡rio a partir do username
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
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
     * Busca usuÃ¡rios disponÃ­veis para chat
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
            @PathVariable("messageId") UUID messageId,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
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
     * Conta mensagens nÃ£o lidas
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Long> countUnreadMessages(Authentication authentication) {
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            Long count = chatService.countUnreadMessages(userId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Erro ao contar mensagens nÃ£o lidas: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * EstatÃ­sticas rÃ¡pidas do chat para badges do painel
     */
    @GetMapping("/stats")
    public ResponseEntity<java.util.Map<String, Long>> getChatStats(Authentication authentication) {
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);

            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }

            return ResponseEntity.ok(chatService.getChatStats(userId));
        } catch (Exception e) {
            log.error("Erro ao buscar estatÃ­sticas do chat: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Busca mensagens nÃ£o lidas
     */
    @GetMapping("/unread")
    public ResponseEntity<List<ChatMessageResponseDTO>> getUnreadMessages(Authentication authentication) {
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            List<ChatMessageResponseDTO> messages = chatService.getUnreadMessages(userId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Erro ao buscar mensagens nÃ£o lidas: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Edita mensagem
     */
    @PutMapping("/{messageId}/edit")
    public ResponseEntity<ChatMessageResponseDTO> editMessage(
            @PathVariable("messageId") UUID messageId,
            @RequestParam(value = "content") String content,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
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
     * Adiciona ou remove reaÃ§Ã£o de uma mensagem
     */
    @PostMapping("/{messageId}/reaction")
    public ResponseEntity<ReactionSummaryDTO> toggleReaction(
            @PathVariable("messageId") UUID messageId,
            @RequestParam(value = "emoji") String emoji,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            ReactionSummaryDTO reaction = reactionService.toggleReaction(messageId, userId, emoji);
            
            // Publicar atualizaÃ§Ã£o via WebSocket
            messagingTemplate.convertAndSend("/topic/chat/message/" + messageId + "/reactions", reaction);
            
            return ResponseEntity.ok(reaction);
        } catch (Exception e) {
            log.error("Erro ao alternar reaÃ§Ã£o: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Busca todas as reaÃ§Ãµes de uma mensagem
     */
    @GetMapping("/{messageId}/reactions")
    public ResponseEntity<List<ReactionSummaryDTO>> getMessageReactions(
            @PathVariable("messageId") UUID messageId,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            List<ReactionSummaryDTO> reactions = reactionService.getAllReactionsForMessage(messageId, userId);
            return ResponseEntity.ok(reactions);
        } catch (Exception e) {
            log.error("Erro ao buscar reaÃ§Ãµes: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Fixa ou desfixa uma mensagem
     */
    @PostMapping("/{messageId}/pin")
    public ResponseEntity<Boolean> togglePin(
            @PathVariable("messageId") UUID messageId,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            log.debug("Tentando alternar fixaÃ§Ã£o da mensagem {} para usuÃ¡rio {}", messageId, userId);
            boolean isPinned = actionService.togglePin(messageId, userId);
            log.debug("FixaÃ§Ã£o alternada com sucesso: {}", isPinned);
            return ResponseEntity.ok(isPinned);
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Erro de acesso ao banco de dados ao alternar fixaÃ§Ã£o: {}", e.getMessage(), e);
            if (e.getCause() != null) {
                log.error("Causa: {}", e.getCause().getMessage());
            }
            return ResponseEntity.internalServerError().build();
        } catch (com.z7design.fleet_manager.exception.BusinessException e) {
            log.error("Erro de negÃ³cio ao alternar fixaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro inesperado ao alternar fixaÃ§Ã£o: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Verifica se uma mensagem estÃ¡ fixada
     */
    @GetMapping("/{messageId}/pin")
    public ResponseEntity<Boolean> isPinned(
            @PathVariable("messageId") UUID messageId,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            boolean isPinned = actionService.isPinned(messageId, userId);
            return ResponseEntity.ok(isPinned);
        } catch (Exception e) {
            log.error("Erro ao verificar fixaÃ§Ã£o: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Adiciona ou remove uma mensagem dos favoritos
     */
    @PostMapping("/{messageId}/favorite")
    public ResponseEntity<Boolean> toggleFavorite(
            @PathVariable("messageId") UUID messageId,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            log.debug("Tentando alternar favorito da mensagem {} para usuÃ¡rio {}", messageId, userId);
            boolean isFavorite = actionService.toggleFavorite(messageId, userId);
            log.debug("Favorito alternado com sucesso: {}", isFavorite);
            return ResponseEntity.ok(isFavorite);
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Erro de acesso ao banco de dados ao alternar favorito: {}", e.getMessage(), e);
            if (e.getCause() != null) {
                log.error("Causa: {}", e.getCause().getMessage());
            }
            return ResponseEntity.internalServerError().build();
        } catch (com.z7design.fleet_manager.exception.BusinessException e) {
            log.error("Erro de negÃ³cio ao alternar favorito: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro inesperado ao alternar favorito: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Verifica se uma mensagem estÃ¡ nos favoritos
     */
    @GetMapping("/{messageId}/favorite")
    public ResponseEntity<Boolean> isFavorite(
            @PathVariable("messageId") UUID messageId,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            boolean isFavorite = actionService.isFavorite(messageId, userId);
            return ResponseEntity.ok(isFavorite);
        } catch (Exception e) {
            log.error("Erro ao verificar favorito: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Denuncia uma mensagem
     */
    @PostMapping("/{messageId}/report")
    public ResponseEntity<Void> reportMessage(
            @PathVariable("messageId") UUID messageId,
            @RequestParam(value = "reason") String reason,
            @RequestParam(value = "description", required = false) String description,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            actionService.reportMessage(messageId, userId, reason, description);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Erro ao denunciar mensagem: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Encaminha uma mensagem para novos destinatÃ¡rios
     */
    @PostMapping("/{messageId}/forward")
    public ResponseEntity<Void> forwardMessage(
            @PathVariable("messageId") UUID messageId,
            @RequestParam(value = "recipientIds", required = false) UUID[] recipientIds,
            @RequestParam(value = "groupIds", required = false) UUID[] groupIds,
            @RequestParam(value = "departmentIds", required = false) UUID[] departmentIds,
            Authentication authentication) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("UsuÃ¡rio nÃ£o encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            actionService.forwardMessage(messageId, userId, recipientIds, groupIds, departmentIds);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Erro ao encaminhar mensagem: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Recebe evento de digitaÃ§Ã£o via WebSocket e propaga para os destinatÃ¡rios
     */
    @MessageMapping("/chat/typing")
    public void handleTypingEvent(@Payload TypingEvent typingEvent, SimpMessageHeaderAccessor headerAccessor) {
        log.info("UsuÃ¡rio {} estÃ¡ digitando na conversa {}", typingEvent.getUserId(), typingEvent.getConversationId());
        // Enviar notificaÃ§Ã£o de digitaÃ§Ã£o para os participantes da conversa
        if (typingEvent.getRecipientId() != null) {
            notificationService.sendChatTypingNotification(typingEvent.getRecipientId(), typingEvent);
        }
        if (typingEvent.getGroupId() != null) {
            // Enviar para todos do grupo via tÃ³pico
            try {
                String destination = "/topic/chat/group/" + typingEvent.getGroupId() + "/typing";
                messagingTemplate.convertAndSend(destination, typingEvent);
                log.info("Evento de digitaÃ§Ã£o publicado para grupo: {} (destino: {})", typingEvent.getGroupId(), destination);
            } catch (Exception e) {
                log.error("Erro ao publicar evento de digitaÃ§Ã£o para grupo: {}", e.getMessage(), e);
            }
        }
        if (typingEvent.getDepartmentId() != null) {
            // Enviar para todos do departamento via tÃ³pico
            try {
                String destination = "/topic/chat/department/" + typingEvent.getDepartmentId() + "/typing";
                messagingTemplate.convertAndSend(destination, typingEvent);
                log.info("Evento de digitaÃ§Ã£o publicado para departamento: {} (destino: {})", typingEvent.getDepartmentId(), destination);
            } catch (Exception e) {
                log.error("Erro ao publicar evento de digitaÃ§Ã£o para departamento: {}", e.getMessage(), e);
            }
        }
    }
    
    /**
     * MÃ©todo auxiliar para obter o ID do usuÃ¡rio a partir do username
     */
    private UUID getUserIdFromUsername(String username) {
        try {
            return userService.findByUsername(username)
                .map(User::getId)
                .orElse(null);
        } catch (Exception e) {
            log.error("Erro ao buscar usuÃ¡rio por username: {}", username, e);
            return null;
        }
    }
}

// DTO para evento de digitaÃ§Ã£o
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
