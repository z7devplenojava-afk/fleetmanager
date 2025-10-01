package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.StockAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StockAlertRepository extends JpaRepository<StockAlert, UUID> {

    // Buscar alertas não resolvidos
    List<StockAlert> findByIsResolvedFalseOrderByPriorityDescCreatedAtDesc();

    // Buscar alertas não lidos
    List<StockAlert> findByIsReadFalseOrderByPriorityDescCreatedAtDesc();

    // Buscar alertas por item
    List<StockAlert> findByStockItemIdOrderByCreatedAtDesc(UUID stockItemId);

    // Buscar alertas por tipo
    List<StockAlert> findByAlertTypeOrderByCreatedAtDesc(String alertType);

    // Buscar alertas por prioridade
    List<StockAlert> findByPriorityOrderByCreatedAtDesc(Integer priority);

    // Contar alertas não resolvidos
    Long countByIsResolvedFalse();

    // Contar alertas não lidos
    Long countByIsReadFalse();

    // Contar alertas críticos não resolvidos
    @Query("SELECT COUNT(sa) FROM StockAlert sa WHERE sa.isResolved = false AND sa.priority >= 3")
    Long countCriticalUnresolvedAlerts();

    // Verificar se já existe alerta para o item
    boolean existsByStockItemIdAndAlertTypeAndIsResolvedFalse(UUID stockItemId, String alertType);

    // Buscar alertas ativos por item
    List<StockAlert> findByStockItemIdAndIsResolvedFalse(UUID stockItemId);

    // Deletar alertas resolvidos antigos (para limpeza)
    @Query("DELETE FROM StockAlert sa WHERE sa.isResolved = true AND sa.resolvedAt < :cutoffDate")
    void deleteOldResolvedAlerts(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);
}