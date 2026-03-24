package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MessageDeletionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageDeletionLogRepository extends JpaRepository<MessageDeletionLog, UUID> {
    
    /**
     * Busca logs de exclusÃ£o por ID da mensagem
     */
    List<MessageDeletionLog> findByMessageIdOrderByDeletedAtDesc(UUID messageId);
    
    /**
     * Busca logs de exclusÃ£o por usuÃ¡rio que deletou
     */
    Page<MessageDeletionLog> findByDeletedByIdOrderByDeletedAtDesc(UUID userId, Pageable pageable);
    
    /**
     * Busca logs de exclusÃ£o em um perÃ­odo
     */
    @Query("SELECT l FROM MessageDeletionLog l WHERE l.deletedAt BETWEEN :startDate AND :endDate ORDER BY l.deletedAt DESC")
    List<MessageDeletionLog> findByPeriod(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Conta logs de exclusÃ£o por usuÃ¡rio
     */
    Long countByDeletedById(UUID userId);
}

