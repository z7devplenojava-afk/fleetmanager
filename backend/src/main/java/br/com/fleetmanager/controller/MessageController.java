package br.com.fleetmanager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMethod;

import br.com.fleetmanager.service.MessageService;
import br.com.fleetmanager.service.UserService;

import br.com.fleetmanager.dto.MessageRequestDTO;
import br.com.fleetmanager.dto.MessageResponseDTO;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.enums.MessageType;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/messages")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@Slf4j
public class MessageController {
    
    @Autowired
    private MessageService messageService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Envia uma mensagem
     */
    @PostMapping
    public ResponseEntity<MessageResponseDTO> sendMessage(
            @Valid @RequestBody MessageRequestDTO request,
            Authentication authentication) {
        
        try {
            log.info("Recebendo requisição para enviar mensagem: {}", request);
            
            String username = authentication.getName();
            log.info("Username autenticado: {}", username);
            
            UUID senderId = getUserIdFromUsername(username);
            
            if (senderId == null) {
                log.error("Usuário não encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            log.info("Sender ID encontrado: {}", senderId);
            
            MessageResponseDTO response = messageService.sendMessage(request, senderId);
            log.info("Mensagem enviada com sucesso: {}", response.getId());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erro ao enviar mensagem: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Busca mensagens recebidas
     */
    @GetMapping("/received")
    public ResponseEntity<Page<MessageResponseDTO>> getReceivedMessages(
            Authentication authentication,
            Pageable pageable) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("Usuário não encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            Page<MessageResponseDTO> messages = messageService.getReceivedMessages(userId, pageable);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Erro ao buscar mensagens recebidas: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Busca mensagens enviadas
     */
    @GetMapping("/sent")
    public ResponseEntity<Page<MessageResponseDTO>> getSentMessages(
            Authentication authentication,
            Pageable pageable) {
        
        try {
            String username = authentication.getName();
            UUID userId = getUserIdFromUsername(username);
            
            if (userId == null) {
                log.error("Usuário não encontrado para username: {}", username);
                return ResponseEntity.badRequest().build();
            }
            
            Page<MessageResponseDTO> messages = messageService.getSentMessages(userId, pageable);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Erro ao buscar mensagens enviadas: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
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
            
            messageService.markAsRead(messageId, userId);
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
            
            Long count = messageService.countUnreadMessages(userId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Erro ao contar mensagens não lidas: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Busca mensagens por tipo
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<MessageResponseDTO>> getMessagesByType(@PathVariable MessageType type) {
        List<MessageResponseDTO> messages = messageService.getMessagesByType(type);
        
        return ResponseEntity.ok(messages);
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