package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Position;
import br.com.fleetmanager.model.PositionRisk;
// import br.com.fleetmanager.model.enums.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repositório para gerenciamento de riscos por posição
 */
@Repository
public interface PositionRiskRepository extends JpaRepository<PositionRisk, UUID> {

    /**
     * Busca riscos por posição
     */
    List<PositionRisk> findByPosition(Position position);

    /**
     * Busca riscos por ID da posição
     */
    List<PositionRisk> findByPositionId(UUID positionId);

    /**
     * Busca riscos ativos por posição
     */
    List<PositionRisk> findByPositionAndIsActiveTrue(Position position);

    /**
     * Busca riscos por nível
     */
    // List<PositionRisk> findByRiskLevel(RiskLevel riskLevel);

    /**
     * Busca riscos por posição e nível
     */
    // List<PositionRisk> findByPositionAndRiskLevel(Position position, RiskLevel riskLevel);

    /**
     * Verifica se existe risco para a posição e tipo de risco
     */
    boolean existsByPositionIdAndRiskTypeId(UUID positionId, UUID riskTypeId);

    /**
     * Busca riscos por múltiplas posições
     */
    @Query("SELECT pr FROM PositionRisk pr WHERE pr.position.id IN :positionIds AND pr.isActive = true")
    List<PositionRisk> findByPositionIdInAndIsActiveTrue(@Param("positionIds") List<UUID> positionIds);
}
