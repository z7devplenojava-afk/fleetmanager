package com.z7design.fleet_manager.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.dto.MessageRequestDTO;
import com.z7design.fleet_manager.dto.MessageResponseDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.Department;
import com.z7design.fleet_manager.model.Message;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.model.enums.MessageStatus;
import com.z7design.fleet_manager.model.MessageDeletionLog;
import com.z7design.fleet_manager.repository.DepartmentRepository;
import com.z7design.fleet_manager.repository.MessageRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.UserGroupRepository;
import com.z7design.fleet_manager.repository.MessageDeletionLogRepository;

import lombok.extern.slf4j.Slf4j;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import com.z7design.fleet_manager.dto.UserResponseDTO;
import com.z7design.fleet_manager.dto.DepartmentDTO;

@Service
@Slf4j
@Transactional
public class MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DepartmentRepository departmentRepository;
    
    @Autowired
    private UserGroupRepository userGroupRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private MessageDeletionLogRepository messageDeletionLogRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * Cria uma mensagem (mÃ©todo usado por outros serviÃ§os)
     */
    public Message createMessage(MessageRequestDTO request, User sender) {
        log.info("Criando mensagem: {}", request.getTitle());
        
        Message message = new Message();
        message.setTitle(request.getTitle());
        message.setContent(request.getContent());
        message.setType(request.getType());
        message.setPriority(request.getPriority());
        message.setSender(sender);
        message.setSendEmail(request.getSendEmail());
        message.setSendNotification(request.getSendNotification());
        message.setScheduledAt(request.getScheduledAt());
        
        // Definir destinatÃ¡rios baseado no tipo
        Set<User> recipients = getRecipients(request);
        message.setRecipients(recipients);
        
        // Definir departamentos se aplicÃ¡vel
        if (request.getDepartmentIds() != null && !request.getDepartmentIds().isEmpty()) {
            Set<Department> departments = departmentRepository.findAllById(request.getDepartmentIds())
                .stream().collect(Collectors.toSet());
            message.setDepartments(departments);
        }
        
        message = messageRepository.save(message);
        
        // Enviar imediatamente se nÃ£o for agendada
        if (message.getScheduledAt() == null) {
            sendMessageNow(message);
        }
        
        return message;
    }
    
    /**
     * Envia uma mensagem
     */
    public MessageResponseDTO sendMessage(MessageRequestDTO request, UUID senderId) {
        log.info("Enviando mensagem: {}", request.getTitle());
        
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new BusinessException("UsuÃ¡rio remetente nÃ£o encontrado"));
        
        Message message = new Message();
        message.setTitle(request.getTitle());
        message.setContent(request.getContent());
        message.setType(request.getType());
        message.setPriority(request.getPriority());
        message.setSender(sender);
        message.setSendEmail(request.getSendEmail());
        message.setSendNotification(request.getSendNotification());
        message.setScheduledAt(request.getScheduledAt());
        
        // Se for uma resposta, definir a mensagem original
        if (request.getReplyToId() != null) {
            Message replyToMessage = messageRepository.findById(request.getReplyToId())
                .orElseThrow(() -> new BusinessException("Mensagem original nÃ£o encontrada"));
            message.setReplyTo(replyToMessage);
            
            // Se nÃ£o foram especificados destinatÃ¡rios, usar o remetente da mensagem original
            if (request.getRecipientIds() == null || request.getRecipientIds().isEmpty()) {
                Set<User> replyRecipients = new HashSet<>();
                replyRecipients.add(replyToMessage.getSender());
                message.setRecipients(replyRecipients);
                message.setType(MessageType.INDIVIDUAL);
            } else {
                Set<User> recipients = getRecipients(request);
                message.setRecipients(recipients);
            }
        } else {
            // Definir destinatÃ¡rios baseado no tipo
            Set<User> recipients = getRecipients(request);
            message.setRecipients(recipients);
        }
        
        // Definir departamentos se aplicÃ¡vel
        if (request.getDepartmentIds() != null && !request.getDepartmentIds().isEmpty()) {
            Set<Department> departments = departmentRepository.findAllById(request.getDepartmentIds())
                .stream().collect(Collectors.toSet());
            message.setDepartments(departments);
        }
        
        message = messageRepository.save(message);
        
        // Enviar imediatamente se nÃ£o for agendada
        if (message.getScheduledAt() == null) {
            sendMessageNow(message);
        }
        
        return convertToDTO(message);
    }
    
    /**
     * Busca mensagens recebidas por um usuÃ¡rio (excluindo arquivadas)
     */
    public Page<MessageResponseDTO> getReceivedMessages(UUID userId, Pageable pageable) {
        log.info("Buscando mensagens recebidas para usuÃ¡rio: {} (excluindo arquivadas)", userId);
        
        // Buscar apenas mensagens nÃ£o arquivadas onde o usuÃ¡rio Ã© destinatÃ¡rio
        Page<Message> messages = messageRepository.findNonArchivedByUserId(userId, pageable);
        // Filtrar apenas mensagens onde o usuÃ¡rio Ã© destinatÃ¡rio (nÃ£o remetente)
        List<Message> receivedMessages = messages.getContent().stream()
                .filter(m -> {
                    boolean isRecipient = m.getRecipients() != null && 
                                       m.getRecipients().stream()
                                          .anyMatch(user -> user.getId().equals(userId));
                    boolean isNotSender = !m.getSender().getId().equals(userId);
                    return isRecipient && isNotSender;
                })
                .collect(java.util.stream.Collectors.toList());
        
        Page<Message> filteredPage = new org.springframework.data.domain.PageImpl<>(
                receivedMessages, 
                pageable, 
                receivedMessages.size()
        );
        
        log.info("Encontradas {} mensagens recebidas nÃ£o arquivadas para usuÃ¡rio {}", filteredPage.getTotalElements(), userId);
        return filteredPage.map(this::convertToDTO);
    }
    
    /**
     * Busca mensagens enviadas por um usuÃ¡rio (excluindo arquivadas)
     */
    public Page<MessageResponseDTO> getSentMessages(UUID userId, Pageable pageable) {
        log.info("Buscando mensagens enviadas por usuÃ¡rio: {} (excluindo arquivadas)", userId);
        
        // Buscar apenas mensagens nÃ£o arquivadas enviadas pelo usuÃ¡rio
        Page<Message> messages = messageRepository.findNonArchivedByUserId(userId, pageable);
        // Filtrar apenas as mensagens onde o usuÃ¡rio Ã© remetente
        List<Message> sentMessages = messages.getContent().stream()
                .filter(m -> m.getSender().getId().equals(userId))
                .collect(java.util.stream.Collectors.toList());
        
        Page<Message> filteredPage = new org.springframework.data.domain.PageImpl<>(
                sentMessages, 
                pageable, 
                sentMessages.size()
        );
        
        log.info("Encontradas {} mensagens enviadas nÃ£o arquivadas para usuÃ¡rio {}", filteredPage.getTotalElements(), userId);
        return filteredPage.map(this::convertToDTO);
    }
    
    /**
     * Marca mensagem como lida
     */
    public void markAsRead(UUID messageId, UUID userId) {
        log.info("Marcando mensagem {} como lida pelo usuÃ¡rio {}", messageId, userId);
        
        try {
            Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new BusinessException("Mensagem nÃ£o encontrada"));
            
            // Verificar se o usuÃ¡rio Ã© o remetente
            boolean isSender = message.getSender() != null && message.getSender().getId().equals(userId);
            
            // Verificar se o usuÃ¡rio Ã© destinatÃ¡rio
            boolean isRecipient = false;
            if (message.getRecipients() != null && !message.getRecipients().isEmpty()) {
                isRecipient = message.getRecipients().stream()
                    .anyMatch(user -> user.getId().equals(userId));
            }
            
            // Verificar tipo de mensagem
            boolean isGlobalOrDepartment = message.getType() == MessageType.GLOBAL || 
                                          message.getType() == MessageType.DEPARTMENT;
            
            // Permitir marcar como lida se:
            // 1. O usuÃ¡rio Ã© o remetente, OU
            // 2. O usuÃ¡rio Ã© destinatÃ¡rio, OU
            // 3. Ã‰ mensagem GLOBAL ou DEPARTMENT (qualquer usuÃ¡rio autenticado pode marcar)
            if (!isSender && !isRecipient && !isGlobalOrDepartment) {
                log.warn("UsuÃ¡rio {} nÃ£o tem permissÃ£o para marcar mensagem {} como lida (nÃ£o Ã© remetente, destinatÃ¡rio, nem mensagem global/departamento)", userId, messageId);
                throw new BusinessException("UsuÃ¡rio nÃ£o tem permissÃ£o para marcar esta mensagem como lida");
            }
            
            message.setReadAt(LocalDateTime.now());
            message.setStatus(MessageStatus.READ);
            messageRepository.save(message);
            log.info("Mensagem {} marcada como lida com sucesso pelo usuÃ¡rio {} (remetente: {}, destinatÃ¡rio: {}, tipo: {})", 
                    messageId, userId, isSender, isRecipient, message.getType());
        } catch (BusinessException e) {
            log.error("Erro de negÃ³cio ao marcar mensagem como lida: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Erro inesperado ao marcar mensagem {} como lida: {}", messageId, e.getMessage(), e);
            throw new BusinessException("Erro ao marcar mensagem como lida: " + e.getMessage());
        }
    }
    
    /**
     * Conta mensagens nÃ£o lidas (considerando remetente ou destinatÃ¡rio)
     */
    public Long countUnreadMessages(UUID userId) {
        return messageRepository.countUnreadByUserIdIncludingSender(userId);
    }
    
    /**
     * ObtÃ©m estatÃ­sticas de mensagens para o usuÃ¡rio
     */
    public MessageStatistics getMessageStatistics(UUID userId) {
        Long total = messageRepository.countTotalByUserId(userId);
        Long unread = messageRepository.countUnreadByUserIdIncludingSender(userId);
        Long read = messageRepository.countByUserIdAndStatus(userId, MessageStatus.READ);
        Long archived = messageRepository.countByUserIdAndStatus(userId, MessageStatus.ARCHIVED);
        
        return MessageStatistics.builder()
                .total(total != null ? total : 0L)
                .unread(unread != null ? unread : 0L)
                .read(read != null ? read : 0L)
                .archived(archived != null ? archived : 0L)
                .build();
    }
    
    /**
     * Classe interna para estatÃ­sticas de mensagens
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MessageStatistics {
        private Long total;
        private Long unread;
        private Long read;
        private Long archived;
    }
    
    /**
     * Busca mensagens por tipo
     */
    public List<MessageResponseDTO> getMessagesByType(MessageType type) {
        List<Message> messages = messageRepository.findByTypeOrderByCreatedAtDesc(type);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    /**
     * Agenda mensagens para envio
     */
    @Scheduled(fixedRate = 60000) // Executa a cada minuto
    @Transactional
    public void processScheduledMessages() {
        try {
            log.info("Processando mensagens agendadas");
            
            // Verificar se existem mensagens antes de processar
            long messageCount = messageRepository.count();
            if (messageCount == 0) {
                log.debug("Nenhuma mensagem encontrada no banco. Pulando processamento.");
                return;
            }
            
            List<Message> scheduledMessages = messageRepository.findScheduledMessages(LocalDateTime.now());
            
            for (Message message : scheduledMessages) {
                try {
                    sendMessageNow(message);
                    message.setSentAt(LocalDateTime.now());
                    messageRepository.save(message);
                    log.info("Mensagem agendada enviada: {}", message.getId());
                } catch (Exception e) {
                    log.error("Erro ao enviar mensagem agendada: {}", message.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Erro durante processamento de mensagens agendadas: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Envia mensagem imediatamente
     */
    private void sendMessageNow(Message message) {
        try {
            // Enviar notificaÃ§Ã£o
            if (message.getSendNotification()) {
                notificationService.sendNotification(message);
            }
            
            // Enviar email
            if (message.getSendEmail()) {
                // TODO: Implementar envio de email para mensagens
                // Por enquanto, apenas log
                log.info("ðŸ“§ Email solicitado para mensagem: {} - ImplementaÃ§Ã£o pendente", message.getId());
            }
            
            message.setSentAt(LocalDateTime.now());
            messageRepository.save(message);
            
            log.info("Mensagem enviada com sucesso: {}", message.getId());
        } catch (Exception e) {
            log.error("Erro ao enviar mensagem: {}", message.getId(), e);
            throw new BusinessException("Erro ao enviar mensagem: " + e.getMessage());
        }
    }
    
    /**
     * Define destinatÃ¡rios baseado no tipo de mensagem
     */
    private Set<User> getRecipients(MessageRequestDTO request) {
        Set<User> recipients = Set.of();
        
        switch (request.getType()) {
            case INDIVIDUAL:
                if (request.getRecipientIds() == null || request.getRecipientIds().isEmpty()) {
                    throw new BusinessException("DestinatÃ¡rios sÃ£o obrigatÃ³rios para mensagens individuais");
                }
                recipients = userRepository.findAllById(request.getRecipientIds())
                    .stream().collect(Collectors.toSet());
                break;
                
            case GROUP:
                if (request.getGroupIds() == null || request.getGroupIds().isEmpty()) {
                    throw new BusinessException("Grupos sÃ£o obrigatÃ³rios para mensagens de grupo");
                }
                // Buscar usuÃ¡rios dos grupos especificados
                recipients = userGroupRepository.findAllById(request.getGroupIds())
                    .stream()
                    .flatMap(group -> group.getUsers().stream())
                    .collect(Collectors.toSet());
                break;
                
            case DEPARTMENT:
                if (request.getDepartmentIds() == null || request.getDepartmentIds().isEmpty()) {
                    throw new BusinessException("Departamentos sÃ£o obrigatÃ³rios para mensagens de departamento");
                }
                // Por enquanto, buscar todos os usuÃ¡rios ativos
                recipients = userRepository.findByActiveTrue()
                    .stream().collect(Collectors.toSet());
                break;
                
            case GLOBAL:
                recipients = userRepository.findByActiveTrue()
                    .stream().collect(Collectors.toSet());
                break;
                
            default:
                throw new BusinessException("Tipo de mensagem nÃ£o suportado");
        }
        
        return recipients;
    }
    
    /**
     * Busca mensagens por status (considerando remetente ou destinatÃ¡rio)
     */
    public Page<MessageResponseDTO> getMessagesByStatus(UUID userId, MessageStatus status, Pageable pageable) {
        log.info("Buscando mensagens com status {} para usuÃ¡rio: {} (remetente ou destinatÃ¡rio)", status, userId);
        
        // Buscar mensagens onde o usuÃ¡rio Ã© remetente ou destinatÃ¡rio
        Page<Message> messages = messageRepository.findByUserIdAndStatus(userId, status, pageable);
        log.info("Encontradas {} mensagens com status {} para usuÃ¡rio {}", messages.getTotalElements(), status, userId);
        return messages.map(this::convertToDTO);
    }
    
    /**
     * Busca mensagens nÃ£o lidas
     */
    public List<MessageResponseDTO> getUnreadMessages(UUID userId) {
        log.info("Buscando mensagens nÃ£o lidas para usuÃ¡rio: {}", userId);
        
        List<Message> messages = messageRepository.findUnreadByUserId(userId);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    /**
     * Marca todas as mensagens nÃ£o lidas como lidas
     */
    public void markAllAsRead(UUID userId) {
        log.info("Marcando todas as mensagens como lidas para usuÃ¡rio: {}", userId);
        
        List<Message> unreadMessages = messageRepository.findUnreadByUserId(userId);
        
        for (Message message : unreadMessages) {
            message.setStatus(MessageStatus.READ);
            message.setReadAt(LocalDateTime.now());
        }
        
        messageRepository.saveAll(unreadMessages);
        log.info("{} mensagens marcadas como lidas", unreadMessages.size());
    }
    
    /**
     * Arquiva mensagem
     */
    public void archiveMessage(UUID messageId, UUID userId) {
        log.info("Arquivando mensagem {} para usuÃ¡rio {}", messageId, userId);
        
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Mensagem nÃ£o encontrada"));
        
        // Verificar se o usuÃ¡rio Ã© remetente ou destinatÃ¡rio
        boolean isSender = message.getSender().getId().equals(userId);
        boolean isRecipient = message.getRecipients() != null && 
                             message.getRecipients().stream()
                                    .anyMatch(user -> user.getId().equals(userId));
        
        if (!isSender && !isRecipient) {
            throw new BusinessException("UsuÃ¡rio nÃ£o tem permissÃ£o para arquivar esta mensagem. Apenas remetente ou destinatÃ¡rios podem arquivar.");
        }
        
        message.setStatus(MessageStatus.ARCHIVED);
        messageRepository.save(message);
        log.info("Mensagem {} arquivada com sucesso pelo usuÃ¡rio {}", messageId, userId);
    }
    
    /**
     * Restaura mensagem arquivada
     */
    public void restoreMessage(UUID messageId, UUID userId) {
        log.info("Restaurando mensagem {} para usuÃ¡rio {}", messageId, userId);
        
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Mensagem nÃ£o encontrada"));
        
        // Verificar se a mensagem estÃ¡ arquivada
        if (message.getStatus() != MessageStatus.ARCHIVED) {
            throw new BusinessException("A mensagem nÃ£o estÃ¡ arquivada. Apenas mensagens arquivadas podem ser restauradas.");
        }
        
        // Verificar se o usuÃ¡rio Ã© remetente ou destinatÃ¡rio
        boolean isSender = message.getSender().getId().equals(userId);
        boolean isRecipient = message.getRecipients() != null && 
                             message.getRecipients().stream()
                                    .anyMatch(user -> user.getId().equals(userId));
        
        if (!isSender && !isRecipient) {
            throw new BusinessException("UsuÃ¡rio nÃ£o tem permissÃ£o para restaurar esta mensagem. Apenas remetente ou destinatÃ¡rios podem restaurar.");
        }
        
        // Restaurar para status lido (se foi lida antes) ou nÃ£o lida (se nunca foi lida)
        MessageStatus restoredStatus = message.getReadAt() != null ? MessageStatus.READ : MessageStatus.UNREAD;
        message.setStatus(restoredStatus);
        messageRepository.save(message);
        log.info("Mensagem {} restaurada com sucesso pelo usuÃ¡rio {} com status {}", messageId, userId, restoredStatus);
    }
    
    /**
     * Deleta mensagem com registro de motivo
     */
    public void deleteMessage(UUID messageId, UUID userId, String deletionReason, String ipAddress) {
        log.info("Deletando mensagem {} pelo usuÃ¡rio {}", messageId, userId);
        
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Mensagem nÃ£o encontrada"));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("UsuÃ¡rio nÃ£o encontrado"));
        
        // Criar log de exclusÃ£o
        MessageDeletionLog deletionLog = MessageDeletionLog.builder()
            .messageId(messageId)
            .messageTitle(message.getTitle())
            .deletedBy(user)
            .deletionReason(deletionReason)
            .ipAddress(ipAddress)
            .build();
        
        messageDeletionLogRepository.save(deletionLog);
        
        // Deletar mensagem
        messageRepository.delete(message);
        
        log.info("Mensagem {} deletada com sucesso. Motivo: {}", messageId, deletionReason);
    }
    
    /**
     * Busca logs de exclusÃ£o de mensagens
     */
    public List<MessageDeletionLog> getDeletionLogs(UUID userId) {
        log.info("Buscando logs de exclusÃ£o para usuÃ¡rio: {}", userId);
        return messageDeletionLogRepository.findAll();
    }

    /**
     * Converte entidade para DTO
     */
    private MessageResponseDTO convertToDTO(Message message) {
        MessageResponseDTO dto = new MessageResponseDTO();
        dto.setId(message.getId());
        dto.setTitle(message.getTitle());
        dto.setContent(message.getContent());
        dto.setType(message.getType());
        dto.setPriority(message.getPriority());
        dto.setStatus(message.getStatus());
        dto.setSendEmail(message.getSendEmail());
        dto.setSendNotification(message.getSendNotification());
        dto.setScheduledAt(message.getScheduledAt());
        dto.setSentAt(message.getSentAt());
        dto.setReadAt(message.getReadAt());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setUpdatedAt(message.getUpdatedAt());
        
        // Converter replyTo
        if (message.getReplyTo() != null) {
            dto.setReplyToId(message.getReplyTo().getId());
            // Evitar recursÃ£o infinita - nÃ£o incluir o replyTo completo por padrÃ£o
            // Se necessÃ¡rio, pode ser carregado separadamente
        }
        
        // Converter sender
        if (message.getSender() != null) {
            UserResponseDTO senderDTO = new UserResponseDTO();
            senderDTO.setId(message.getSender().getId());
            senderDTO.setName(message.getSender().getName());
            senderDTO.setEmail(message.getSender().getEmail());
            dto.setSender(senderDTO);
        }
        
        // Converter recipients
        if (message.getRecipients() != null) {
            Set<UserResponseDTO> recipientDTOs = message.getRecipients().stream()
                .map(user -> {
                    UserResponseDTO userDTO = new UserResponseDTO();
                    userDTO.setId(user.getId());
                    userDTO.setName(user.getName());
                    userDTO.setEmail(user.getEmail());
                    return userDTO;
                }).collect(Collectors.toSet());
            dto.setRecipients(recipientDTOs);
        }
        
        // Converter departments
        if (message.getDepartments() != null) {
            Set<DepartmentDTO> departmentDTOs = message.getDepartments().stream()
                .map(dept -> {
                    DepartmentDTO deptDTO = new DepartmentDTO();
                    deptDTO.setId(dept.getId());
                    deptDTO.setName(dept.getName());
                    deptDTO.setDescription(dept.getDescription());
                    deptDTO.setIsActive(dept.getIsActive());
                    return deptDTO;
                }).collect(Collectors.toSet());
            dto.setDepartments(departmentDTOs);
        }
        
        return dto;
    }
} 
