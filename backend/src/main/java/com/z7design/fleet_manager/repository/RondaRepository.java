package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Ronda;
import com.z7design.fleet_manager.model.enums.RondaPrioridade;
import com.z7design.fleet_manager.model.enums.RondaStatus;
import com.z7design.fleet_manager.model.enums.RondaTipo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface RondaRepository extends JpaRepository<Ronda, UUID>, JpaSpecificationExecutor<Ronda> {
    
    @EntityGraph(attributePaths = {"responsavel", "supervisor", "local", "createdBy", "updatedBy"})
    @Query("SELECT r FROM Ronda r")
    Page<Ronda> findAllWithRelationships(Pageable pageable);
    
    @EntityGraph(attributePaths = {"responsavel", "supervisor", "local", "createdBy", "updatedBy"})
    @Query("SELECT DISTINCT r FROM Ronda r WHERE r.id IN :ids")
    List<Ronda> findAllByIdsWithRelationships(@Param("ids") List<UUID> ids);
    
    Page<Ronda> findByStatus(RondaStatus status, Pageable pageable);
    
    Page<Ronda> findByTipo(RondaTipo tipo, Pageable pageable);
    
    Page<Ronda> findByPrioridade(RondaPrioridade prioridade, Pageable pageable);
    
    Page<Ronda> findByResponsavelId(UUID responsavelId, Pageable pageable);
    
    Page<Ronda> findByLocalId(UUID localId, Pageable pageable);
    
    @Query(value = "SELECT r.* FROM rondas r " +
           "WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:tipo IS NULL OR r.tipo = :tipo) AND " +
           "(:prioridade IS NULL OR r.prioridade = :prioridade) AND " +
           "(:responsavelId IS NULL OR r.responsavel_id = :responsavelId) AND " +
           "(:localId IS NULL OR r.local_id = :localId) AND " +
           "(:dataInicio IS NULL OR r.data_inicio >= :dataInicio) AND " +
           "(:dataFim IS NULL OR r.data_fim <= :dataFim) AND " +
           "(:searchTerm IS NULL OR " +
           "LOWER(r.nome::text) LIKE LOWER('%' || :searchTerm || '%') OR " +
           "(r.descricao IS NOT NULL AND LOWER(r.descricao::text) LIKE LOWER('%' || :searchTerm || '%')) OR " +
           "(r.endereco IS NOT NULL AND LOWER(r.endereco::text) LIKE LOWER('%' || :searchTerm || '%')))",
           nativeQuery = true,
           countQuery = "SELECT COUNT(*) FROM rondas r " +
           "WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:tipo IS NULL OR r.tipo = :tipo) AND " +
           "(:prioridade IS NULL OR r.prioridade = :prioridade) AND " +
           "(:responsavelId IS NULL OR r.responsavel_id = :responsavelId) AND " +
           "(:localId IS NULL OR r.local_id = :localId) AND " +
           "(:dataInicio IS NULL OR r.data_inicio >= :dataInicio) AND " +
           "(:dataFim IS NULL OR r.data_fim <= :dataFim) AND " +
           "(:searchTerm IS NULL OR " +
           "LOWER(r.nome::text) LIKE LOWER('%' || :searchTerm || '%') OR " +
           "(r.descricao IS NOT NULL AND LOWER(r.descricao::text) LIKE LOWER('%' || :searchTerm || '%')) OR " +
           "(r.endereco IS NOT NULL AND LOWER(r.endereco::text) LIKE LOWER('%' || :searchTerm || '%')))")
    Page<Ronda> search(
            @Param("status") String status,
            @Param("tipo") String tipo,
            @Param("prioridade") String prioridade,
            @Param("responsavelId") UUID responsavelId,
            @Param("localId") UUID localId,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim,
            @Param("searchTerm") String searchTerm,
            Pageable pageable
    );
    
    @Query("SELECT COUNT(r) FROM Ronda r WHERE r.status = :status")
    Long countByStatus(@Param("status") RondaStatus status);
    
    @Query(value = "SELECT COUNT(*) FROM rondas WHERE DATE(data_inicio) = CURRENT_DATE", nativeQuery = true)
    Long countTodayRondas();
    
    @Query("SELECT COUNT(r) FROM Ronda r WHERE r.dataInicio >= :startOfWeek AND r.dataInicio <= :endOfWeek")
    Long countWeekRondas(@Param("startOfWeek") LocalDateTime startOfWeek, @Param("endOfWeek") LocalDateTime endOfWeek);
}


