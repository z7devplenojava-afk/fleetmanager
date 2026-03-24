package com.z7design.fleet_manager.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.dto.ReactionSummaryDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.ChatMessage;
import com.z7design.fleet_manager.model.MessageReaction;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.ChatMessageRepository;
import com.z7design.fleet_manager.repository.MessageReactionRepository;
import com.z7design.fleet_manager.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@Transactional
public class MessageReactionService {
    
    @Autowired
    private MessageReactionRepository reactionRepository;
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Adiciona ou remove uma reaÃ§Ã£o de uma mensagem
     * Se a reaÃ§Ã£o jÃ¡ existe, remove; caso contrÃ¡rio, adiciona
     */
    public ReactionSummaryDTO toggleReaction(UUID messageId, UUID userId, String emoji) {
        try {
            log.info("Alternando reaÃ§Ã£o {} na mensagem {} pelo usuÃ¡rio {}", emoji, messageId, userId);
            
            if (messageId == null) {
                throw new BusinessException("ID da mensagem Ã© obrigatÃ³rio");
            }
            
            if (userId == null) {
                throw new BusinessException("ID do usuÃ¡rio Ã© obrigatÃ³rio");
            }
            
            if (emoji == null || emoji.trim().isEmpty()) {
                throw new BusinessException("Emoji Ã© obrigatÃ³rio");
            }
            
            ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new BusinessException("Mensagem nÃ£o encontrada"));
            
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("UsuÃ¡rio nÃ£o encontrado"));
            
            // Verificar se a reaÃ§Ã£o jÃ¡ existe
            var existingReaction = reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, userId, emoji);
            
            if (existingReaction.isPresent()) {
                // Remover reaÃ§Ã£o existente
                reactionRepository.delete(existingReaction.get());
                log.info("ReaÃ§Ã£o {} removida da mensagem {} pelo usuÃ¡rio {}", emoji, messageId, userId);
            } else {
                // Adicionar nova reaÃ§Ã£o
                MessageReaction reaction = new MessageReaction();
                reaction.setMessage(message);
                reaction.setUser(user);
                reaction.setEmoji(emoji.trim());
                reactionRepository.save(reaction);
                log.info("ReaÃ§Ã£o {} adicionada Ã  mensagem {} pelo usuÃ¡rio {}", emoji, messageId, userId);
            }
            
            // Retornar resumo atualizado das reaÃ§Ãµes
            return getReactionSummary(messageId, emoji, userId);
        } catch (BusinessException e) {
            log.error("Erro de negÃ³cio ao alternar reaÃ§Ã£o: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Erro inesperado ao alternar reaÃ§Ã£o {} na mensagem {} pelo usuÃ¡rio {}: {}", 
                emoji, messageId, userId, e.getMessage(), e);
            throw new BusinessException("Erro ao processar reaÃ§Ã£o: " + e.getMessage());
        }
    }
    
    /**
     * Busca resumo de reaÃ§Ãµes para um emoji especÃ­fico em uma mensagem
     */
    public ReactionSummaryDTO getReactionSummary(UUID messageId, String emoji, UUID currentUserId) {
        try {
            List<MessageReaction> reactions = reactionRepository.findByMessageId(messageId)
                .stream()
                .filter(r -> r != null && r.getEmoji() != null && r.getEmoji().equals(emoji))
                .collect(Collectors.toList());
            
            List<UUID> userIds = reactions.stream()
                .filter(r -> r.getUser() != null)
                .map(r -> r.getUser().getId())
                .collect(Collectors.toList());
            
            boolean currentUserReacted = currentUserId != null && userIds.contains(currentUserId);
            
            return new ReactionSummaryDTO(emoji, (long) reactions.size(), userIds, currentUserReacted);
        } catch (Exception e) {
            log.error("Erro ao buscar resumo de reaÃ§Ãµes para mensagem {} e emoji {}: {}", messageId, emoji, e.getMessage(), e);
            // Retornar resumo vazio em caso de erro
            return new ReactionSummaryDTO(emoji, 0L, new java.util.ArrayList<>(), false);
        }
    }
    
    /**
     * Busca todas as reaÃ§Ãµes de uma mensagem agrupadas por emoji
     */
    public List<ReactionSummaryDTO> getAllReactionsForMessage(UUID messageId, UUID currentUserId) {
        try {
            if (messageId == null) {
                return new java.util.ArrayList<>();
            }
            List<MessageReaction> allReactions = reactionRepository.findByMessageId(messageId);
            
            if (allReactions == null || allReactions.isEmpty()) {
                return new java.util.ArrayList<>();
            }
            
            // Agrupar por emoji
            return allReactions.stream()
                .filter(r -> r != null && r.getEmoji() != null)
                .collect(Collectors.groupingBy(MessageReaction::getEmoji))
                .entrySet()
                .stream()
                .map(entry -> {
                    String emoji = entry.getKey();
                    List<MessageReaction> reactions = entry.getValue();
                    
                    List<UUID> userIds = reactions.stream()
                        .filter(r -> r.getUser() != null)
                        .map(r -> r.getUser().getId())
                        .collect(Collectors.toList());
                    
                    boolean currentUserReacted = currentUserId != null && userIds.contains(currentUserId);
                    
                    return new ReactionSummaryDTO(emoji, (long) reactions.size(), userIds, currentUserReacted);
                })
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar todas as reaÃ§Ãµes para mensagem {}: {}", messageId, e.getMessage(), e);
            return new java.util.ArrayList<>();
        }
    }
    
    /**
     * Remove todas as reaÃ§Ãµes de um usuÃ¡rio em uma mensagem
     */
    public void removeAllUserReactionsFromMessage(UUID messageId, UUID userId) {
        log.info("Removendo todas as reaÃ§Ãµes do usuÃ¡rio {} da mensagem {}", userId, messageId);
        reactionRepository.findByMessageIdAndUserId(messageId, userId)
            .forEach(reactionRepository::delete);
    }
}


