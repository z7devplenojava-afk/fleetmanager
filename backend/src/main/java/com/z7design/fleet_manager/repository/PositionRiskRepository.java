package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Position;
import com.z7design.fleet_manager.model.PositionRisk;
// import com.z7design.fleet_manager.model.enums.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * RepositÃ³rio para gerenciamento de riscos por posiÃ§Ã£o
 */
@Repository
public interface PositionRiskRepository extends JpaRepository<PositionRisk, UUID> {

    /**
     * Busca riscos por posiÃ§Ã£o
     */
    List<PositionRisk> findByPosition(Position position);

    /**
     * Busca riscos por ID da posiÃ§Ã£o
     */
    List<PositionRisk> findByPositionId(UUID positionId);

    /**
     * Busca riscos ativos por posiÃ§Ã£o
     */
    List<PositionRisk> findByPositionAndIsActiveTrue(Position position);

    /**
     * Busca riscos por nÃ­vel
     */
    // List<PositionRisk> findByRiskLevel(RiskLevel riskLevel);

    /**
     * Busca riscos por posiÃ§Ã£o e nÃ­vel
     */
    // List<PositionRisk> findByPositionAndRiskLevel(Position position, RiskLevel riskLevel);

    /**
     * Verifica se existe risco para a posiÃ§Ã£o e tipo de risco
     */
    boolean existsByPositionIdAndRiskTypeId(UUID positionId, UUID riskTypeId);

    /**
     * Busca riscos por mÃºltiplas posiÃ§Ãµes
     */
    @Query("SELECT pr FROM PositionRisk pr WHERE pr.position.id IN :positionIds AND pr.isActive = true")
    List<PositionRisk> findByPositionIdInAndIsActiveTrue(@Param("positionIds") List<UUID> positionIds);
}

