package br.com.fleetmanager.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.dto.ChatMessageRequestDTO;
import br.com.fleetmanager.dto.ChatMessageResponseDTO;
// import br.com.fleetmanager.dto.ChatUserDTO;
import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.model.ChatMessage;
import br.com.fleetmanager.model.Department;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.UserGroupEntity;
import br.com.fleetmanager.repository.ChatMessageRepository;
import br.com.fleetmanager.repository.DepartmentRepository;
import br.com.fleetmanager.repository.UserGroupRepository;
import br.com.fleetmanager.repository.UserRepository;

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
    
    /**
     * Envia mensagem de chat
     */
    public ChatMessageResponseDTO sendChatMessage(ChatMessageRequestDTO request, String senderUsername) {
        log.info("Enviando mensagem de chat de {} para {}", senderUsername, request.getRecipientId());
        
        User sender = userRepository.findByUsername(senderUsername)
            .orElseThrow(() -> new BusinessException("Usuário remetente não encontrado: " + senderUsername));
        
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setContent(request.getContent());
        chatMessage.setSender(sender);
        chatMessage.setType(request.getType());
        chatMessage.setReplyToId(request.getReplyToId());
        chatMessage.setCreatedAt(LocalDateTime.now());
        
        // Definir destinatário
        if (request.getRecipientId() != null) {
            User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new BusinessException("Usuário destinatário não encontrado"));
            chatMessage.setRecipient(recipient);
        }
        
        // Definir grupo
        if (request.getGroupId() != null) {
            UserGroupEntity group = userGroupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new BusinessException("Grupo não encontrado"));
            chatMessage.setGroup(group);
        }
        
        // Definir departamento
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new BusinessException("Departamento não encontrado"));
            chatMessage.setDepartment(department);
        }
        
        chatMessage = chatMessageRepository.save(chatMessage);
        
        log.info("Mensagem de chat enviada: {}", chatMessage.getId());
        return convertToDTO(chatMessage);
    }
    
    /**
     * Busca conversa entre dois usuários
     */
    public List<ChatMessageResponseDTO> getConversation(String currentUsername, UUID otherUserId) {
        log.info("Buscando conversa entre {} e {}", currentUsername, otherUserId);
        
        User currentUser = userRepository.findByUsername(currentUsername)
            .orElseThrow(() -> new BusinessException("Usuário atual não encontrado: " + currentUsername));
        
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
     * Busca conversas recentes de um usuário
     */
    public List<ChatMessageResponseDTO> getRecentConversations(UUID userId) {
        log.info("Buscando conversas recentes para usuário: {}", userId);
        
        List<ChatMessage> messages = chatMessageRepository.findRecentConversationsForUser(userId);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    /**
     * Marca mensagem como lida
     */
    public void markAsRead(UUID messageId, UUID userId) {
        log.info("Marcando mensagem de chat {} como lida pelo usuário {}", messageId, userId);
        
        ChatMessage message = chatMessageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Mensagem não encontrada"));
        
        // Verificar se o usuário é destinatário
        boolean isRecipient = (message.getRecipient() != null && message.getRecipient().getId().equals(userId)) ||
                             (message.getGroup() != null && message.getGroup().getUsers().stream()
                                 .anyMatch(user -> user.getId().equals(userId)));
        
        if (!isRecipient) {
            throw new BusinessException("Usuário não é destinatário desta mensagem");
        }
        
        message.setIsRead(true);
        message.setReadAt(LocalDateTime.now());
        chatMessageRepository.save(message);
    }
    
    /**
     * Conta mensagens não lidas
     */
    public Long countUnreadMessages(UUID userId) {
        return chatMessageRepository.countUnreadMessagesForUser(userId);
    }
    
    /**
     * Busca mensagens não lidas
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
            .orElseThrow(() -> new BusinessException("Mensagem não encontrada"));
        
        // Verificar se o usuário é o remetente
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
     * Busca usuários disponíveis para chat
     */
    /*
    public List<br.com.fleetmanager.dto.ChatUserDTO> getAvailableUsersForChat(UUID currentUserId) {
        log.info("Buscando usuários disponíveis para chat para o usuário: {}", currentUserId);

        List<User> allUsers = userRepository.findAll();
        return allUsers.stream()
            .filter(user -> !user.getId().equals(currentUserId) && user.isActive())
            .map(user -> {
                br.com.fleetmanager.dto.ChatUserDTO userDTO = new br.com.fleetmanager.dto.ChatUserDTO();
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
        dto.setCreatedAt(message.getCreatedAt());
        dto.setUpdatedAt(message.getUpdatedAt());
        
        // Converter sender
        if (message.getSender() != null) {
            br.com.fleetmanager.dto.UserResponseDTO senderDTO = new br.com.fleetmanager.dto.UserResponseDTO();
            senderDTO.setId(message.getSender().getId());
            senderDTO.setName(message.getSender().getName());
            senderDTO.setEmail(message.getSender().getEmail());
            dto.setSender(senderDTO);
        }
        
        // Converter recipient
        if (message.getRecipient() != null) {
            br.com.fleetmanager.dto.UserResponseDTO recipientDTO = new br.com.fleetmanager.dto.UserResponseDTO();
            recipientDTO.setId(message.getRecipient().getId());
            recipientDTO.setName(message.getRecipient().getName());
            recipientDTO.setEmail(message.getRecipient().getEmail());
            dto.setRecipient(recipientDTO);
        }
        
        // Converter group
        if (message.getGroup() != null) {
            br.com.fleetmanager.dto.UserGroupDTO groupDTO = new br.com.fleetmanager.dto.UserGroupDTO();
            groupDTO.setId(message.getGroup().getId());
            groupDTO.setName(message.getGroup().getDisplayName());
            dto.setGroup(groupDTO);
        }
        
        // Converter department
        if (message.getDepartment() != null) {
            br.com.fleetmanager.dto.DepartmentDTO deptDTO = new br.com.fleetmanager.dto.DepartmentDTO();
            deptDTO.setId(message.getDepartment().getId());
            deptDTO.setName(message.getDepartment().getName());
            deptDTO.setDescription(message.getDepartment().getDescription());
            dto.setDepartment(deptDTO);
        }
        
        return dto;
    }
} 