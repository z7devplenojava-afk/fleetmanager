package br.com.fleetmanager.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.dto.MessageRequestDTO;
import br.com.fleetmanager.dto.MessageResponseDTO;
import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.model.Department;
import br.com.fleetmanager.model.Message;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.enums.MessageType;
import br.com.fleetmanager.repository.DepartmentRepository;
import br.com.fleetmanager.repository.MessageRepository;
import br.com.fleetmanager.repository.UserRepository;
import br.com.fleetmanager.repository.UserGroupRepository;

import lombok.extern.slf4j.Slf4j;
import br.com.fleetmanager.dto.UserResponseDTO;
import br.com.fleetmanager.dto.DepartmentDTO;

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
    private NotificationService notificationService;
    
    /**
     * Cria uma mensagem (método usado por outros serviços)
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
        
        // Definir destinatários baseado no tipo
        Set<User> recipients = getRecipients(request);
        message.setRecipients(recipients);
        
        // Definir departamentos se aplicável
        if (request.getDepartmentIds() != null && !request.getDepartmentIds().isEmpty()) {
            Set<Department> departments = departmentRepository.findAllById(request.getDepartmentIds())
                .stream().collect(Collectors.toSet());
            message.setDepartments(departments);
        }
        
        message = messageRepository.save(message);
        
        // Enviar imediatamente se não for agendada
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
            .orElseThrow(() -> new BusinessException("Usuário remetente não encontrado"));
        
        Message message = new Message();
        message.setTitle(request.getTitle());
        message.setContent(request.getContent());
        message.setType(request.getType());
        message.setPriority(request.getPriority());
        message.setSender(sender);
        message.setSendEmail(request.getSendEmail());
        message.setSendNotification(request.getSendNotification());
        message.setScheduledAt(request.getScheduledAt());
        
        // Definir destinatários baseado no tipo
        Set<User> recipients = getRecipients(request);
        message.setRecipients(recipients);
        
        // Definir departamentos se aplicável
        if (request.getDepartmentIds() != null && !request.getDepartmentIds().isEmpty()) {
            Set<Department> departments = departmentRepository.findAllById(request.getDepartmentIds())
                .stream().collect(Collectors.toSet());
            message.setDepartments(departments);
        }
        
        message = messageRepository.save(message);
        
        // Enviar imediatamente se não for agendada
        if (message.getScheduledAt() == null) {
            sendMessageNow(message);
        }
        
        return convertToDTO(message);
    }
    
    /**
     * Busca mensagens recebidas por um usuário
     */
    public Page<MessageResponseDTO> getReceivedMessages(UUID userId, Pageable pageable) {
        log.info("Buscando mensagens recebidas para usuário: {}", userId);
        
        Page<Message> messages = messageRepository.findByRecipientId(userId, pageable);
        return messages.map(this::convertToDTO);
    }
    
    /**
     * Busca mensagens enviadas por um usuário
     */
    public Page<MessageResponseDTO> getSentMessages(UUID userId, Pageable pageable) {
        log.info("Buscando mensagens enviadas por usuário: {}", userId);
        
        Page<Message> messages = messageRepository.findBySenderIdOrderByCreatedAtDesc(userId, pageable);
        return messages.map(this::convertToDTO);
    }
    
    /**
     * Marca mensagem como lida
     */
    public void markAsRead(UUID messageId, UUID userId) {
        log.info("Marcando mensagem {} como lida pelo usuário {}", messageId, userId);
        
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Mensagem não encontrada"));
        
        // Verificar se o usuário é destinatário
        boolean isRecipient = message.getRecipients().stream()
            .anyMatch(user -> user.getId().equals(userId));
        
        if (!isRecipient) {
            throw new BusinessException("Usuário não é destinatário desta mensagem");
        }
        
        message.setReadAt(LocalDateTime.now());
        messageRepository.save(message);
    }
    
    /**
     * Conta mensagens não lidas
     */
    public Long countUnreadMessages(UUID userId) {
        return messageRepository.countUnreadByUserId(userId);
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
            // Enviar notificação
            if (message.getSendNotification()) {
                notificationService.sendNotification(message);
            }
            
            // Enviar email
            if (message.getSendEmail()) {
                // TODO: Implementar envio de email para mensagens
                // Por enquanto, apenas log
                log.info("📧 Email solicitado para mensagem: {} - Implementação pendente", message.getId());
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
     * Define destinatários baseado no tipo de mensagem
     */
    private Set<User> getRecipients(MessageRequestDTO request) {
        Set<User> recipients = Set.of();
        
        switch (request.getType()) {
            case INDIVIDUAL:
                if (request.getRecipientIds() == null || request.getRecipientIds().isEmpty()) {
                    throw new BusinessException("Destinatários são obrigatórios para mensagens individuais");
                }
                recipients = userRepository.findAllById(request.getRecipientIds())
                    .stream().collect(Collectors.toSet());
                break;
                
            case GROUP:
                if (request.getGroupIds() == null || request.getGroupIds().isEmpty()) {
                    throw new BusinessException("Grupos são obrigatórios para mensagens de grupo");
                }
                // Buscar usuários dos grupos especificados
                recipients = userGroupRepository.findAllById(request.getGroupIds())
                    .stream()
                    .flatMap(group -> group.getUsers().stream())
                    .collect(Collectors.toSet());
                break;
                
            case DEPARTMENT:
                if (request.getDepartmentIds() == null || request.getDepartmentIds().isEmpty()) {
                    throw new BusinessException("Departamentos são obrigatórios para mensagens de departamento");
                }
                // Por enquanto, buscar todos os usuários ativos
                recipients = userRepository.findByActiveTrue()
                    .stream().collect(Collectors.toSet());
                break;
                
            case GLOBAL:
                recipients = userRepository.findByActiveTrue()
                    .stream().collect(Collectors.toSet());
                break;
                
            default:
                throw new BusinessException("Tipo de mensagem não suportado");
        }
        
        return recipients;
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
        dto.setSendEmail(message.getSendEmail());
        dto.setSendNotification(message.getSendNotification());
        dto.setScheduledAt(message.getScheduledAt());
        dto.setSentAt(message.getSentAt());
        dto.setReadAt(message.getReadAt());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setUpdatedAt(message.getUpdatedAt());
        
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