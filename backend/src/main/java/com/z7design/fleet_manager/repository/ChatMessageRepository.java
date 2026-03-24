package com.z7design.fleet_manager.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.ChatMessage;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    
    /**
     * Busca conversa entre dois usuÃ¡rios
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE " +
           "(cm.sender.id = :user1Id AND cm.recipient.id = :user2Id) OR " +
           "(cm.sender.id = :user2Id AND cm.recipient.id = :user1Id) " +
           "ORDER BY cm.createdAt ASC")
    List<ChatMessage> findConversationBetweenUsers(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);
    
    /**
     * Busca mensagens de um grupo
     */
    List<ChatMessage> findByGroupIdOrderByCreatedAtAsc(UUID groupId);
    
    /**
     * Busca mensagens de um departamento
     */
    List<ChatMessage> findByDepartmentIdOrderByCreatedAtAsc(UUID departmentId);
    
    /**
     * Busca mensagens nÃ£o lidas para um usuÃ¡rio
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE " +
           "(cm.recipient.id = :userId AND cm.isRead = false) OR " +
           "(cm.group.id IN (SELECT ug.id FROM User u JOIN u.groups ug WHERE u.id = :userId) AND cm.isRead = false) " +
           "ORDER BY cm.createdAt DESC")
    List<ChatMessage> findUnreadMessagesForUser(@Param("userId") UUID userId);
    
    /**
     * Conta mensagens nÃ£o lidas para um usuÃ¡rio
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE " +
           "(cm.recipient.id = :userId AND cm.isRead = false) OR " +
           "(cm.group.id IN (SELECT ug.id FROM User u JOIN u.groups ug WHERE u.id = :userId) AND cm.isRead = false)")
    Long countUnreadMessagesForUser(@Param("userId") UUID userId);
    
    /**
     * Busca Ãºltimas mensagens de conversas para um usuÃ¡rio
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.id IN (" +
           "SELECT MAX(cm2.id) FROM ChatMessage cm2 WHERE " +
           "(cm2.sender.id = :userId OR cm2.recipient.id = :userId OR " +
           "cm2.group.id IN (SELECT ug.id FROM User u JOIN u.groups ug WHERE u.id = :userId)) " +
           "GROUP BY CASE " +
           "WHEN cm2.recipient.id = :userId THEN cm2.sender.id " +
           "WHEN cm2.sender.id = :userId THEN cm2.recipient.id " +
           "ELSE cm2.group.id END) " +
           "ORDER BY cm.createdAt DESC")
    List<ChatMessage> findRecentConversationsForUser(@Param("userId") UUID userId);
} 
