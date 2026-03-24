package com.z7design.fleet_manager.service;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.ChatMessage;
import com.z7design.fleet_manager.model.ChatMessageFavorite;
import com.z7design.fleet_manager.model.ChatMessagePin;
import com.z7design.fleet_manager.model.ChatMessageReport;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.ChatMessageFavoriteRepository;
import com.z7design.fleet_manager.repository.ChatMessagePinRepository;
import com.z7design.fleet_manager.repository.ChatMessageReportRepository;
import com.z7design.fleet_manager.repository.ChatMessageRepository;
import com.z7design.fleet_manager.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@Transactional
public class ChatMessageActionService {
    
    @Autowired
    private ChatMessagePinRepository pinRepository;
    
    @Autowired
    private ChatMessageFavoriteRepository favoriteRepository;
    
    @Autowired
    private ChatMessageReportRepository reportRepository;
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Fixa ou desfixa uma mensagem
     */
    public boolean togglePin(UUID messageId, UUID userId) {
        try {
            log.info("Alternando fixaÃ§Ã£o da mensagem {} para usuÃ¡rio {}", messageId, userId);
            
            if (messageId == null) {
                throw new BusinessException("ID da mensagem Ã© obrigatÃ³rio");
            }
            
            if (userId == null) {
                throw new BusinessException("ID do usuÃ¡rio Ã© obrigatÃ³rio");
            }
            
            ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new BusinessException("Mensagem nÃ£o encontrada"));
            
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("UsuÃ¡rio nÃ£o encontrado"));
            
            boolean isPinned = pinRepository.existsByMessageIdAndUserId(messageId, userId);
            
            if (isPinned) {
                pinRepository.deleteByMessageIdAndUserId(messageId, userId);
                log.info("Mensagem {} desfixada para usuÃ¡rio {}", messageId, userId);
                return false;
            } else {
                ChatMessagePin pin = new ChatMessagePin();
                pin.setMessage(message);
                pin.setUser(user);
                pinRepository.save(pin);
                log.info("Mensagem {} fixada para usuÃ¡rio {}", messageId, userId);
                return true;
            }
        } catch (BusinessException e) {
            log.error("Erro de negÃ³cio ao alternar fixaÃ§Ã£o: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Erro inesperado ao alternar fixaÃ§Ã£o da mensagem {} para usuÃ¡rio {}: {}", 
                messageId, userId, e.getMessage(), e);
            throw new BusinessException("Erro ao processar fixaÃ§Ã£o: " + e.getMessage());
        }
    }
    
    /**
     * Verifica se uma mensagem estÃ¡ fixada para um usuÃ¡rio
     */
    public boolean isPinned(UUID messageId, UUID userId) {
        return pinRepository.existsByMessageIdAndUserId(messageId, userId);
    }
    
    /**
     * Adiciona ou remove uma mensagem dos favoritos
     */
    public boolean toggleFavorite(UUID messageId, UUID userId) {
        try {
            log.info("Alternando favorito da mensagem {} para usuÃ¡rio {}", messageId, userId);
            
            if (messageId == null) {
                throw new BusinessException("ID da mensagem Ã© obrigatÃ³rio");
            }
            
            if (userId == null) {
                throw new BusinessException("ID do usuÃ¡rio Ã© obrigatÃ³rio");
            }
            
            ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new BusinessException("Mensagem nÃ£o encontrada"));
            
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("UsuÃ¡rio nÃ£o encontrado"));
            
            boolean isFavorite = favoriteRepository.existsByMessageIdAndUserId(messageId, userId);
            
            if (isFavorite) {
                favoriteRepository.deleteByMessageIdAndUserId(messageId, userId);
                log.info("Mensagem {} removida dos favoritos para usuÃ¡rio {}", messageId, userId);
                return false;
            } else {
                ChatMessageFavorite favorite = new ChatMessageFavorite();
                favorite.setMessage(message);
                favorite.setUser(user);
                favoriteRepository.save(favorite);
                log.info("Mensagem {} adicionada aos favoritos para usuÃ¡rio {}", messageId, userId);
                return true;
            }
        } catch (BusinessException e) {
            log.error("Erro de negÃ³cio ao alternar favorito: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Erro inesperado ao alternar favorito da mensagem {} para usuÃ¡rio {}: {}", 
                messageId, userId, e.getMessage(), e);
            throw new BusinessException("Erro ao processar favorito: " + e.getMessage());
        }
    }
    
    /**
     * Verifica se uma mensagem estÃ¡ nos favoritos de um usuÃ¡rio
     */
    public boolean isFavorite(UUID messageId, UUID userId) {
        return favoriteRepository.existsByMessageIdAndUserId(messageId, userId);
    }
    
    /**
     * Cria uma denÃºncia de mensagem
     */
    public ChatMessageReport reportMessage(UUID messageId, UUID reporterId, String reason, String description) {
        log.info("Criando denÃºncia da mensagem {} por usuÃ¡rio {}", messageId, reporterId);
        
        ChatMessage message = chatMessageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Mensagem nÃ£o encontrada"));
        
        User reporter = userRepository.findById(reporterId)
            .orElseThrow(() -> new BusinessException("UsuÃ¡rio denunciante nÃ£o encontrado"));
        
        // Verificar se jÃ¡ existe denÃºncia do mesmo usuÃ¡rio para a mesma mensagem
        if (reportRepository.existsByMessageIdAndReporterId(messageId, reporterId)) {
            throw new BusinessException("VocÃª jÃ¡ denunciou esta mensagem");
        }
        
        ChatMessageReport report = new ChatMessageReport();
        report.setMessage(message);
        report.setReporter(reporter);
        report.setReason(reason);
        report.setDescription(description);
        report.setStatus("PENDING");
        
        report = reportRepository.save(report);
        log.info("DenÃºncia {} criada com sucesso", report.getId());
        
        return report;
    }
    
    /**
     * Encaminha uma mensagem para novos destinatÃ¡rios
     */
    public void forwardMessage(UUID messageId, UUID senderId, UUID[] recipientIds, UUID[] groupIds, UUID[] departmentIds) {
        log.info("Encaminhando mensagem {} de {} para {} destinatÃ¡rios", messageId, senderId, 
            (recipientIds != null ? recipientIds.length : 0) + 
            (groupIds != null ? groupIds.length : 0) + 
            (departmentIds != null ? departmentIds.length : 0));
        
        ChatMessage originalMessage = chatMessageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Mensagem original nÃ£o encontrada"));
        
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new BusinessException("UsuÃ¡rio remetente nÃ£o encontrado"));
        
        // Criar nova mensagem com conteÃºdo da original
        ChatMessage forwardedMessage = new ChatMessage();
        forwardedMessage.setContent("Encaminhado: " + originalMessage.getContent());
        forwardedMessage.setSender(sender);
        forwardedMessage.setType(originalMessage.getType());
        // NÃ£o usar replyToId para encaminhamento, apenas para respostas diretas
        
        // Copiar informaÃ§Ãµes do arquivo se houver
        if (originalMessage.getFileUrl() != null) {
            forwardedMessage.setFileUrl(originalMessage.getFileUrl());
            forwardedMessage.setFileName(originalMessage.getFileName());
            forwardedMessage.setFileSize(originalMessage.getFileSize());
            forwardedMessage.setFileContentType(originalMessage.getFileContentType());
            forwardedMessage.setType(originalMessage.getType());
        }
        
        // Definir destinatÃ¡rios individuais
        if (recipientIds != null && recipientIds.length > 0) {
            // Para mÃºltiplos destinatÃ¡rios, criar uma mensagem para cada um
            for (UUID recipientId : recipientIds) {
                User recipient = userRepository.findById(recipientId)
                    .orElseThrow(() -> new BusinessException("UsuÃ¡rio destinatÃ¡rio nÃ£o encontrado: " + recipientId));
                
                ChatMessage msg = new ChatMessage();
                msg.setContent(forwardedMessage.getContent());
                msg.setSender(sender);
                msg.setRecipient(recipient);
                msg.setType(originalMessage.getType());
                msg.setReplyToId(originalMessage.getId());
                
                if (originalMessage.getFileUrl() != null) {
                    msg.setFileUrl(originalMessage.getFileUrl());
                    msg.setFileName(originalMessage.getFileName());
                    msg.setFileSize(originalMessage.getFileSize());
                    msg.setFileContentType(originalMessage.getFileContentType());
                    msg.setType(originalMessage.getType());
                }
                
                chatMessageRepository.save(msg);
            }
        }
        
        // TODO: Implementar encaminhamento para grupos e departamentos
        // Por enquanto, apenas destinatÃ¡rios individuais sÃ£o suportados
        
        log.info("Mensagem {} encaminhada com sucesso", messageId);
    }
}


