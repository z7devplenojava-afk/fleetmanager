package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.StockAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface StockAlertRepository extends JpaRepository<StockAlert, UUID> {

    // Buscar alertas nÃ£o resolvidos
    List<StockAlert> findByIsResolvedFalseOrderByPriorityDescCreatedAtDesc();

    // Buscar alertas nÃ£o lidos
    List<StockAlert> findByIsReadFalseOrderByPriorityDescCreatedAtDesc();

    // Buscar alertas por item
    List<StockAlert> findByStockItemIdOrderByCreatedAtDesc(UUID stockItemId);

    // Buscar alertas por tipo
    List<StockAlert> findByAlertTypeOrderByCreatedAtDesc(String alertType);

    // Buscar alertas por prioridade
    List<StockAlert> findByPriorityOrderByCreatedAtDesc(Integer priority);

    // Contar alertas nÃ£o resolvidos
    Long countByIsResolvedFalse();

    // Contar alertas nÃ£o lidos
    Long countByIsReadFalse();

    // Contar alertas crÃ­ticos nÃ£o resolvidos
    @Query("SELECT COUNT(sa) FROM StockAlert sa WHERE sa.isResolved = false AND sa.priority >= 3")
    Long countCriticalUnresolvedAlerts();

    // Verificar se jÃ¡ existe alerta para o item
    boolean existsByStockItemIdAndAlertTypeAndIsResolvedFalse(UUID stockItemId, String alertType);

    // Buscar alertas ativos por item
    List<StockAlert> findByStockItemIdAndIsResolvedFalse(UUID stockItemId);

    // Deletar alertas resolvidos antigos (para limpeza)
    @Modifying
    @Transactional
    @Query("DELETE FROM StockAlert sa WHERE sa.isResolved = true AND sa.resolvedAt < :cutoffDate")
    void deleteOldResolvedAlerts(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);
}
