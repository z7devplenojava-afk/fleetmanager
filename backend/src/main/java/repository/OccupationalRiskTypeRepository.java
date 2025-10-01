package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.OccupationalRiskType;
import br.com.fleetmanager.model.enums.OccupationalRiskCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repositório para gerenciamento de tipos de riscos ocupacionais
 */
@Repository
public interface OccupationalRiskTypeRepository extends JpaRepository<OccupationalRiskType, UUID> {

    /**
     * Busca riscos por categoria
     */
    List<OccupationalRiskType> findByCategory(OccupationalRiskCategory category);

    /**
     * Busca riscos ativos
     */
    List<OccupationalRiskType> findByIsActiveTrue();

    /**
     * Busca riscos por categoria e status ativo
     */
    List<OccupationalRiskType> findByCategoryAndIsActiveTrue(OccupationalRiskCategory category);

    /**
     * Busca riscos por nível de severidade
     */
    List<OccupationalRiskType> findBySeverityLevel(Integer severityLevel);

    /**
     * Busca riscos por nome (case insensitive)
     */
    @Query("SELECT r FROM OccupationalRiskType r WHERE LOWER(r.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<OccupationalRiskType> findByNameContainingIgnoreCase(@Param("name") String name);

    /**
     * Verifica se existe risco com o mesmo nome
     */
    boolean existsByName(String name);

    /**
     * Verifica se existe risco com o mesmo nome excluindo um ID específico
     */
    boolean existsByNameAndIdNot(String name, UUID id);
}
