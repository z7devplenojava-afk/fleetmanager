package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.RemanejamentoHistorico;
import br.com.fleetmanager.model.AcaoHistorico;
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
    
    // Buscar histórico por remanejamento
    List<RemanejamentoHistorico> findByRemanejamentoIdOrderByDataExecucaoDesc(UUID remanejamentoId);
    
    // Buscar histórico por funcionário
    List<RemanejamentoHistorico> findByEmployeeIdOrderByDataExecucaoDesc(UUID employeeId);
    
    // Buscar histórico por funcionário com paginação
    Page<RemanejamentoHistorico> findByEmployeeIdOrderByDataExecucaoDesc(UUID employeeId, Pageable pageable);
    
    // Buscar histórico por tipo de ação
    List<RemanejamentoHistorico> findByAcaoOrderByDataExecucaoDesc(AcaoHistorico acao);
    
    // Buscar histórico por usuário que executou
    List<RemanejamentoHistorico> findByUsuarioQueExecutouIdOrderByDataExecucaoDesc(UUID usuarioId);
    
    // Buscar histórico por período
    List<RemanejamentoHistorico> findByDataExecucaoBetweenOrderByDataExecucaoDesc(
        LocalDateTime dataInicio, LocalDateTime dataFim);
    
    // Buscar histórico por funcionário e período
    List<RemanejamentoHistorico> findByEmployeeIdAndDataExecucaoBetweenOrderByDataExecucaoDesc(
        UUID employeeId, LocalDateTime dataInicio, LocalDateTime dataFim);
    
    // Buscar histórico por funcionário e tipo de ação
    List<RemanejamentoHistorico> findByEmployeeIdAndAcaoOrderByDataExecucaoDesc(
        UUID employeeId, AcaoHistorico acao);
    
    // Buscar histórico por remanejamento e tipo de ação
    List<RemanejamentoHistorico> findByRemanejamentoIdAndAcaoOrderByDataExecucaoDesc(
        UUID remanejamentoId, AcaoHistorico acao);
    
    // Query personalizada para buscar histórico com filtros múltiplos
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
    
    // Contar histórico por funcionário
    long countByEmployeeId(UUID employeeId);
    
    // Contar histórico por tipo de ação
    long countByAcao(AcaoHistorico acao);
    
    // Contar histórico por usuário
    long countByUsuarioQueExecutouId(UUID usuarioId);
    
    // Buscar última ação realizada em um remanejamento
    @Query("SELECT h FROM RemanejamentoHistorico h WHERE h.remanejamento.id = :remanejamentoId " +
           "ORDER BY h.dataExecucao DESC LIMIT 1")
    RemanejamentoHistorico findLastActionByRemanejamentoId(@Param("remanejamentoId") UUID remanejamentoId);
} 