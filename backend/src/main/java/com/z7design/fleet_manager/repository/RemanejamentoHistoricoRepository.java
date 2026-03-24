package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.RemanejamentoHistorico;
import com.z7design.fleet_manager.model.AcaoHistorico;
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
public interface RemanejamentoHistoricoRepository extends JpaRepository<RemanejamentoHistorico, UUID> {
    
    // Buscar histÃ³rico por remanejamento
    List<RemanejamentoHistorico> findByRemanejamentoIdOrderByDataExecucaoDesc(UUID remanejamentoId);
    
    // Buscar histÃ³rico por funcionÃ¡rio
    List<RemanejamentoHistorico> findByEmployeeIdOrderByDataExecucaoDesc(UUID employeeId);
    
    // Buscar histÃ³rico por funcionÃ¡rio com paginaÃ§Ã£o
    Page<RemanejamentoHistorico> findByEmployeeIdOrderByDataExecucaoDesc(UUID employeeId, Pageable pageable);
    
    // Buscar histÃ³rico por tipo de aÃ§Ã£o
    List<RemanejamentoHistorico> findByAcaoOrderByDataExecucaoDesc(AcaoHistorico acao);
    
    // Buscar histÃ³rico por usuÃ¡rio que executou
    List<RemanejamentoHistorico> findByUsuarioQueExecutouIdOrderByDataExecucaoDesc(UUID usuarioId);
    
    // Buscar histÃ³rico por perÃ­odo
    List<RemanejamentoHistorico> findByDataExecucaoBetweenOrderByDataExecucaoDesc(
        LocalDateTime dataInicio, LocalDateTime dataFim);
    
    // Buscar histÃ³rico por funcionÃ¡rio e perÃ­odo
    List<RemanejamentoHistorico> findByEmployeeIdAndDataExecucaoBetweenOrderByDataExecucaoDesc(
        UUID employeeId, LocalDateTime dataInicio, LocalDateTime dataFim);
    
    // Buscar histÃ³rico por funcionÃ¡rio e tipo de aÃ§Ã£o
    List<RemanejamentoHistorico> findByEmployeeIdAndAcaoOrderByDataExecucaoDesc(
        UUID employeeId, AcaoHistorico acao);
    
    // Buscar histÃ³rico por remanejamento e tipo de aÃ§Ã£o
    List<RemanejamentoHistorico> findByRemanejamentoIdAndAcaoOrderByDataExecucaoDesc(
        UUID remanejamentoId, AcaoHistorico acao);
    
    // Query personalizada para buscar histÃ³rico com filtros mÃºltiplos
    @Query("SELECT h FROM RemanejamentoHistorico h WHERE " +
           "(:employeeId IS NULL OR h.employee.id = :employeeId) AND " +
           "(:acao IS NULL OR h.acao = :acao) AND " +
           "(:usuarioId IS NULL OR h.usuarioQueExecutou.id = :usuarioId) AND " +
           "(:dataInicio IS NULL OR h.dataExecucao >= :dataInicio) AND " +
           "(:dataFim IS NULL OR h.dataExecucao <= :dataFim) " +
           "ORDER BY h.dataExecucao DESC")
    Page<RemanejamentoHistorico> findWithFilters(
        @Param("employeeId") UUID employeeId,
        @Param("acao") AcaoHistorico acao,
        @Param("usuarioId") UUID usuarioId,
        @Param("dataInicio") LocalDateTime dataInicio,
        @Param("dataFim") LocalDateTime dataFim,
        Pageable pageable);
    
    // Contar histÃ³rico por funcionÃ¡rio
    long countByEmployeeId(UUID employeeId);
    
    // Contar histÃ³rico por tipo de aÃ§Ã£o
    long countByAcao(AcaoHistorico acao);
    
    // Contar histÃ³rico por usuÃ¡rio
    long countByUsuarioQueExecutouId(UUID usuarioId);
    
    // Buscar Ãºltima aÃ§Ã£o realizada em um remanejamento
    @Query("SELECT h FROM RemanejamentoHistorico h WHERE h.remanejamento.id = :remanejamentoId " +
           "ORDER BY h.dataExecucao DESC LIMIT 1")
    RemanejamentoHistorico findLastActionByRemanejamentoId(@Param("remanejamentoId") UUID remanejamentoId);
} 
