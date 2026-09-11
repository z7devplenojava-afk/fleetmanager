package com.z7design.fleet_manager.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.dto.ChatMessageRequestDTO;
import com.z7design.fleet_manager.dto.ChatMessageResponseDTO;
// import com.z7design.fleet_manager.dto.ChatUserDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.ChatMessage;
import com.z7design.fleet_manager.model.Department;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.UserGroupEntity;
import com.z7design.fleet_manager.repository.ChatMessageRepository;
import com.z7design.fleet_manager.repository.DepartmentRepository;
import com.z7design.fleet_manager.repository.UserGroupRepository;
import com.z7design.fleet_manager.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@Transactional
public class ChatService {
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserGroupRepository userGroupRepository;
    
    @Autowired
    private DepartmentRepository departmentRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * Envia mensagem de chat
     */
    public ChatMessageResponseDTO sendChatMessage(ChatMessageRequestDTO request, String senderUsername) {
        log.info("Enviando mensagem de chat de {} para {}", senderUsername, request.getRecipientId());
        
        User sender = userRepository.findByUsername(senderUsername)
            .orElseThrow(() -> new BusinessException("UsuÃ¡rio remetente nÃ£o encontrado: " + senderUsername));
        
        ChatMessage chatMessage = new ChatMessage();
        
        // Se hÃ¡ arquivo, permitir conteÃºdo vazio; caso contrÃ¡rio, conteÃºdo Ã© obrigatÃ³rio
        String content = request.getContent();
        if (content == null || content.trim().isEmpty()) {
            if (request.getFileUrl() != null) {
                // Se hÃ¡ arquivo, permitir conteÃºdo vazio
                content = "";
            } else {
                // Se nÃ£o hÃ¡ arquivo, conteÃºdo Ã© obrigatÃ³rio
                throw new BusinessException("ConteÃºdo da mensagem Ã© obrigatÃ³rio quando nÃ£o hÃ¡ arquivo");
            }
        }
        chatMessage.setContent(content);
        chatMessage.setSender(sender);
        chatMessage.setType(request.getType());
        chatMessage.setReplyToId(request.getReplyToId());
        
        // InformaÃ§Ãµes do arquivo (se houver)
        if (request.getFileUrl() != null) {
            chatMessage.setFileUrl(request.getFileUrl());
            chatMessage.setFileName(request.getFileName());
            chatMessage.setFileSize(request.getFileSize());
            chatMessage.setFileContentType(request.getFileContentType());
        }
        
        chatMessage.setCreatedAt(LocalDateTime.now());
        
        // Definir destinatÃ¡rio
        if (request.getRecipientId() != null) {
            User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new BusinessException("UsuÃ¡rio destinatÃ¡rio nÃ£o encontrado"));
            chatMessage.setRecipient(recipient);
        }
        
        // Definir grupo
        if (request.getGroupId() != null) {
            UserGroupEntity group = userGroupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new BusinessException("Grupo nÃ£o encontrado"));
            chatMessage.setGroup(group);
        }
        
        // Definir departamento
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new BusinessException("Departamento nÃ£o encontrado"));
            chatMessage.setDepartment(department);
        }
        
        chatMessage = chatMessageRepository.save(chatMessage);
        
        // Converter para DTO antes de enviar via WebSocket
        ChatMessageResponseDTO messageDTO = convertToDTO(chatMessage);
        
        // Log detalhado para mensagens com arquivo
        if (messageDTO.getFileUrl() != null) {
            log.info("ðŸ“Ž Mensagem com arquivo - URL: {}, Nome: {}, Tamanho: {}, Tipo: {}", 
                messageDTO.getFileUrl(), 
                messageDTO.getFileName(), 
                messageDTO.getFileSize(), 
                messageDTO.getFileContentType());
        }
        
        // Publicar mensagem via WebSocket
        try {
            if (chatMessage.getRecipient() != null) {
                // Mensagem individual: enviar para o destinatÃ¡rio
                String recipientUsername = chatMessage.getRecipient().getUsername();
                String destination = "/user/" + recipientUsername + "/queue/messages";
                messagingTemplate.convertAndSend(destination, messageDTO);
                log.info("âœ… Mensagem publicada via WebSocket para usuÃ¡rio: {} (destino: {}) - Tipo: {}, Tem arquivo: {}", 
                    recipientUsername, destination, messageDTO.getType(), messageDTO.getFileUrl() != null);
                
                // TambÃ©m enviar para o remetente para atualizaÃ§Ã£o em tempo real
                String senderDestination = "/user/" + senderUsername + "/queue/messages";
                messagingTemplate.convertAndSend(senderDestination, messageDTO);
                log.info("âœ… Mensagem publicada via WebSocket para remetente: {} (destino: {}) - Tipo: {}, Tem arquivo: {}", 
                    senderUsername, senderDestination, messageDTO.getType(), messageDTO.getFileUrl() != null);
            } else if (chatMessage.getGroup() != null) {
                // Mensagem de grupo: enviar para todos os membros do grupo
                String destination = "/topic/chat/group/" + chatMessage.getGroup().getId();
                messagingTemplate.convertAndSend(destination, messageDTO);
                log.info("Mensagem publicada via WebSocket para grupo: {} (destino: {})", chatMessage.getGroup().getId(), destination);
            } else if (chatMessage.getDepartment() != null) {
                // Mensagem de departamento: enviar para todos os membros do departamento
                String destination = "/topic/chat/department/" + chatMessage.getDepartment().getId();
                messagingTemplate.convertAndSend(destination, messageDTO);
                log.info("Mensagem publicada via WebSocket para departamento: {} (destino: {})", chatMessage.getDepartment().getId(), destination);
            }
        } catch (Exception e) {
            log.error("Erro ao publicar mensagem via WebSocket: {}", e.getMessage(), e);
            // NÃ£o lanÃ§ar exceÃ§Ã£o para nÃ£o quebrar o fluxo, apenas logar o erro
        }
        
        log.info("Mensagem de chat enviada: {}", chatMessage.getId());
        return messageDTO;
    }
    
    /**
     * Busca conversa entre dois usuÃ¡rios
     */
    public List<ChatMessageResponseDTO> getConversation(String currentUsername, UUID otherUserId) {
        log.info("Buscando conversa entre {} e {}", currentUsername, otherUserId);
        
        User currentUser = userRepository.findByUsername(currentUsername)
            .orElseThrow(() -> new BusinessException("UsuÃ¡rio atual nÃ£o encontrado: " + currentUsername));
        
        List<ChatMessage> messages = chatMessageRepository.findConversationBetweenUsers(currentUser.getId(), otherUserId);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    /**
     * Busca mensagens de um grupo
     */
    public List<ChatMessageResponseDTO> getGroupMessages(UUID groupId) {
        log.info("Buscando mensagens do grupo: {}", groupId);
        
        List<ChatMessage> messages = chatMessageRepository.findByGroupIdOrderByCreatedAtAsc(groupId);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    /**
     * Busca mensagens de um departamento
     */
    public List<ChatMessageResponseDTO> getDepartmentMessages(UUID departmentId) {
        log.info("Buscando mensagens do departamento: {}", departmentId);
        
        List<ChatMessage> messages = chatMessageRepository.findByDepartmentIdOrderByCreatedAtAsc(departmentId);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    /**
     * Busca conversas recentes de um usuÃ¡rio
     */
    public List<ChatMessageResponseDTO> getRecentConversations(UUID userId) {
        log.info("Buscando conversas recentes para usuÃ¡rio: {}", userId);
        
        List<ChatMessage> messages = chatMessageRepository.findRecentConversationsForUser(userId);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    /**
     * Marca mensagem como lida
     */
    public void markAsRead(UUID messageId, UUID userId) {
        log.info("Marcando mensagem de chat {} como lida pelo usuÃ¡rio {}", messageId, userId);
        
        ChatMessage message = chatMessageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Mensagem nÃ£o encontrada"));
        
        // Verificar se o usuÃ¡rio Ã© destinatÃ¡rio
        boolean isRecipient = (message.getRecipient() != null && message.getRecipient().getId().equals(userId)) ||
                             (message.getGroup() != null && message.getGroup().getUsers().stream()
                                 .anyMatch(user -> user.getId().equals(userId)));
        
        if (!isRecipient) {
            throw new BusinessException("UsuÃ¡rio nÃ£o Ã© destinatÃ¡rio desta mensagem");
        }
        
        message.setIsRead(true);
        message.setReadAt(LocalDateTime.now());
        chatMessageRepository.save(message);
    }
    
    /**
     * Conta mensagens nÃ£o lidas
     */
    public Long countUnreadMessages(UUID userId) {
        return chatMessageRepository.countUnreadMessagesForUser(userId);
    }

    /**
     * EstatÃ­sticas rÃ¡pidas do chat para o painel: total de conversas, nÃ£o lidas e abertas
     */
    public java.util.Map<String, Long> getChatStats(UUID userId) {
        try {
            Long total = chatMessageRepository.countConversationsForUser(userId);
            Long unread = chatMessageRepository.countUnreadMessagesForUser(userId);
            Long open = chatMessageRepository.countOpenConversationsForUser(userId);

            java.util.Map<String, Long> stats = new java.util.HashMap<>();
            stats.put("total", total != null ? total : 0L);
            stats.put("unread", unread != null ? unread : 0L);
            stats.put("open", open != null ? open : 0L);
            return stats;
        } catch (Exception e) {
            log.warn("Aviso ao buscar estatísticas de chat para o usuário {}: {}. Retornando valores zerados.", userId, e.getMessage());
            java.util.Map<String, Long> fallback = new java.util.HashMap<>();
            fallback.put("total", 0L);
            fallback.put("unread", 0L);
            fallback.put("open", 0L);
            return fallback;
        }
    }
    
    /**
     * Busca mensagens nÃ£o lidas
     */
    public List<ChatMessageResponseDTO> getUnreadMessages(UUID userId) {
        List<ChatMessage> messages = chatMessageRepository.findUnreadMessagesForUser(userId);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    /**
     * Edita mensagem
     */
    public ChatMessageResponseDTO editMessage(UUID messageId, String newContent, UUID userId) {
        log.info("Editando mensagem de chat: {}", messageId);
        
        ChatMessage message = chatMessageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Mensagem nÃ£o encontrada"));
        
        // Verificar se o usuÃ¡rio Ã© o remetente
        if (!message.getSender().getId().equals(userId)) {
            throw new BusinessException("Apenas o remetente pode editar a mensagem");
        }
        
        message.setContent(newContent);
        message.setEditedAt(LocalDateTime.now());
        message = chatMessageRepository.save(message);
        
        return convertToDTO(message);
    }

    /*
    /**
     * Busca usuÃ¡rios disponÃ­veis para chat
     */
    /*
    public List<com.z7design.fleet_manager.dto.ChatUserDTO> getAvailableUsersForChat(UUID currentUserId) {
        log.info("Buscando usuÃ¡rios disponÃ­veis para chat para o usuÃ¡rio: {}", currentUserId);

        List<User> allUsers = userRepository.findAll();
        return allUsers.stream()
            .filter(user -> !user.getId().equals(currentUserId) && user.isActive())
            .map(user -> {
                com.z7design.fleet_manager.dto.ChatUserDTO userDTO = new com.z7design.fleet_manager.dto.ChatUserDTO();
                userDTO.setId(user.getId());
                userDTO.setName(user.getName());
                userDTO.setUsername(user.getUsername());
                userDTO.setEmail(user.getEmail());
                userDTO.setActive(user.isActive());
                userDTO.setOnline(false); // TODO: implementar status online/offline
                return userDTO;
            })
            .collect(Collectors.toList());
    }
    */
    
    /**
     * Converte entidade para DTO
     */
    private ChatMessageResponseDTO convertToDTO(ChatMessage message) {
        ChatMessageResponseDTO dto = new ChatMessageResponseDTO();
        dto.setId(message.getId());
        dto.setContent(message.getContent());
        dto.setType(message.getType());
        dto.setIsRead(message.getIsRead());
        dto.setReadAt(message.getReadAt());
        dto.setEditedAt(message.getEditedAt());
        dto.setReplyToId(message.getReplyToId());
        
        // InformaÃ§Ãµes do arquivo
        dto.setFileUrl(message.getFileUrl());
        dto.setFileName(message.getFileName());
        dto.setFileSize(message.getFileSize());
        dto.setFileContentType(message.getFileContentType());
        
        dto.setCreatedAt(message.getCreatedAt());
        dto.setUpdatedAt(message.getUpdatedAt());
        
        // Converter sender
        if (message.getSender() != null) {
            com.z7design.fleet_manager.dto.UserResponseDTO senderDTO = new com.z7design.fleet_manager.dto.UserResponseDTO();
            senderDTO.setId(message.getSender().getId());
            senderDTO.setName(message.getSender().getName());
            senderDTO.setEmail(message.getSender().getEmail());
            dto.setSender(senderDTO);
        }
        
        // Converter recipient
        if (message.getRecipient() != null) {
            com.z7design.fleet_manager.dto.UserResponseDTO recipientDTO = new com.z7design.fleet_manager.dto.UserResponseDTO();
            recipientDTO.setId(message.getRecipient().getId());
            recipientDTO.setName(message.getRecipient().getName());
            recipientDTO.setEmail(message.getRecipient().getEmail());
            dto.setRecipient(recipientDTO);
        }
        
        // Converter group
        if (message.getGroup() != null) {
            com.z7design.fleet_manager.dto.UserGroupDTO groupDTO = new com.z7design.fleet_manager.dto.UserGroupDTO();
            groupDTO.setId(message.getGroup().getId());
            groupDTO.setName(message.getGroup().getDisplayName());
            dto.setGroup(groupDTO);
        }
        
        // Converter department
        if (message.getDepartment() != null) {
            com.z7design.fleet_manager.dto.DepartmentDTO deptDTO = new com.z7design.fleet_manager.dto.DepartmentDTO();
            deptDTO.setId(message.getDepartment().getId());
            deptDTO.setName(message.getDepartment().getName());
            deptDTO.setDescription(message.getDepartment().getDescription());
            dto.setDepartment(deptDTO);
        }
        
        // ReaÃ§Ãµes serÃ£o carregadas via endpoint especÃ­fico quando necessÃ¡rio
        // NÃ£o carregar aqui para evitar dependÃªncia circular e melhorar performance
        
        return dto;
    }
} 
