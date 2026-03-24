package com.z7design.fleet_manager.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.MessageReaction;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, UUID> {
    
    /**
     * Busca todas as reaÃ§Ãµes de uma mensagem
     */
    List<MessageReaction> findByMessageId(UUID messageId);
    
    /**
     * Busca reaÃ§Ã£o especÃ­fica de um usuÃ¡rio em uma mensagem
     */
    Optional<MessageReaction> findByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);
    
    /**
     * Busca todas as reaÃ§Ãµes de um usuÃ¡rio em uma mensagem
     */
    List<MessageReaction> findByMessageIdAndUserId(UUID messageId, UUID userId);
    
    /**
     * Conta quantos usuÃ¡rios reagiram com um emoji especÃ­fico em uma mensagem
     */
    @Query("SELECT COUNT(DISTINCT mr.user.id) FROM MessageReaction mr WHERE mr.message.id = :messageId AND mr.emoji = :emoji")
    Long countUsersByMessageIdAndEmoji(@Param("messageId") UUID messageId, @Param("emoji") String emoji);
    
    /**
     * Busca todas as reaÃ§Ãµes agrupadas por emoji para uma mensagem
     */
    @Query("SELECT mr.emoji, COUNT(DISTINCT mr.user.id) FROM MessageReaction mr WHERE mr.message.id = :messageId GROUP BY mr.emoji")
    List<Object[]> countReactionsByEmoji(@Param("messageId") UUID messageId);
    
    /**
     * Remove todas as reaÃ§Ãµes de uma mensagem
     */
    void deleteByMessageId(UUID messageId);
}


