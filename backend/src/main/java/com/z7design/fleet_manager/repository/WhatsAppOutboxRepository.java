package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.WhatsAppOutbox;
import com.z7design.fleet_manager.model.enums.WhatsAppOutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface WhatsAppOutboxRepository extends JpaRepository<WhatsAppOutbox, UUID> {

    boolean existsByDedupeKey(String dedupeKey);

    /**
     * Busca IDs prontos para envio sem carregar o conteudo (que pode ser
     * grande no caso de documentos).
     */
    @Query("SELECT o.id FROM WhatsAppOutbox o " +
           "WHERE o.status = :status AND (o.nextAttemptAt IS NULL OR o.nextAttemptAt <= :now) " +
           "ORDER BY o.createdAt ASC")
    List<UUID> findDueIds(
            @Param("status") WhatsAppOutboxStatus status,
            @Param("now") LocalDateTime now,
            Pageable pageable);

    /**
     * Reserva a linha de forma atomica. Retorna 0 quando outra instancia
     * ja processou a mensagem.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE WhatsAppOutbox o " +
           "SET o.status = :processing, o.updatedAt = :now " +
           "WHERE o.id = :id AND o.status = :pending")
    int claim(
            @Param("id") UUID id,
            @Param("processing") WhatsAppOutboxStatus processing,
            @Param("pending") WhatsAppOutboxStatus pending,
            @Param("now") LocalDateTime now);

    /**
     * Devolve para PENDING linhas que ficaram presas em PROCESSING por
     * queda do processo.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE WhatsAppOutbox o " +
           "SET o.status = :pending, o.nextAttemptAt = :now, o.updatedAt = :now " +
           "WHERE o.status = :processing AND o.updatedAt < :threshold")
    int recoverStuck(
            @Param("pending") WhatsAppOutboxStatus pending,
            @Param("processing") WhatsAppOutboxStatus processing,
            @Param("now") LocalDateTime now,
            @Param("threshold") LocalDateTime threshold);
}
