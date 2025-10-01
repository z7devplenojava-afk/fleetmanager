package br.com.fleetmanager.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import br.com.fleetmanager.model.*;
import br.com.fleetmanager.repository.RemanejamentoHistoricoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RemanejamentoHistoricoService {
    
    @Autowired
    private RemanejamentoHistoricoRepository historicoRepository;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * Registra uma ação no histórico de remanejamento
     */
    public RemanejamentoHistorico registrarAcao(Remanejamento remanejamento, AcaoHistorico acao, 
                                               User usuarioQueExecutou, String motivoAlteracao) {
        return registrarAcao(remanejamento, acao, usuarioQueExecutou, motivoAlteracao, null, null);
    }
    
    /**
     * Registra uma ação no histórico de remanejamento com dados de comparação
     */
    public RemanejamentoHistorico registrarAcao(Remanejamento remanejamento, AcaoHistorico acao, 
                                               User usuarioQueExecutou, String motivoAlteracao,
                                               Remanejamento dadosAnteriores, String ipUsuario) {
        RemanejamentoHistorico historico = new RemanejamentoHistorico(remanejamento, acao, usuarioQueExecutou);
        historico.setMotivoAlteracao(motivoAlteracao);
        historico.setIpUsuario(ipUsuario);
        
        // Se há dados anteriores, serializar para JSON
        if (dadosAnteriores != null) {
            try {
                historico.setDadosAnteriores(objectMapper.writeValueAsString(dadosAnteriores));
                historico.setDadosNovos(objectMapper.writeValueAsString(remanejamento));
            } catch (JsonProcessingException e) {
                historico.setDadosAnteriores("Erro ao serializar dados anteriores");
                historico.setDadosNovos("Erro ao serializar dados novos");
            }
        }
        
        return historicoRepository.save(historico);
    }
    
    /**
     * Busca histórico por ID
     */
    public Optional<RemanejamentoHistorico> findById(UUID id) {
        return historicoRepository.findById(id);
    }
    
    /**
     * Busca todo o histórico
     */
    public List<RemanejamentoHistorico> findAll() {
        return historicoRepository.findAll();
    }
    
    /**
     * Busca histórico por remanejamento
     */
    public List<RemanejamentoHistorico> findByRemanejamentoId(UUID remanejamentoId) {
        return historicoRepository.findByRemanejamentoIdOrderByDataExecucaoDesc(remanejamentoId);
    }
    
    /**
     * Busca histórico por funcionário
     */
    public List<RemanejamentoHistorico> findByEmployeeId(UUID employeeId) {
        return historicoRepository.findByEmployeeIdOrderByDataExecucaoDesc(employeeId);
    }
    
    /**
     * Busca histórico por funcionário com paginação
     */
    public Page<RemanejamentoHistorico> findByEmployeeId(UUID employeeId, Pageable pageable) {
        return historicoRepository.findByEmployeeIdOrderByDataExecucaoDesc(employeeId, pageable);
    }
    
    /**
     * Busca histórico por tipo de ação
     */
    public List<RemanejamentoHistorico> findByAcao(AcaoHistorico acao) {
        return historicoRepository.findByAcaoOrderByDataExecucaoDesc(acao);
    }
    
    /**
     * Busca histórico por usuário que executou
     */
    public List<RemanejamentoHistorico> findByUsuarioQueExecutou(UUID usuarioId) {
        return historicoRepository.findByUsuarioQueExecutouIdOrderByDataExecucaoDesc(usuarioId);
    }
    
    /**
     * Busca histórico por período
     */
    public List<RemanejamentoHistorico> findByPeriodo(LocalDateTime dataInicio, LocalDateTime dataFim) {
        return historicoRepository.findByDataExecucaoBetweenOrderByDataExecucaoDesc(dataInicio, dataFim);
    }
    
    /**
     * Busca histórico por funcionário e período
     */
    public List<RemanejamentoHistorico> findByEmployeeIdAndPeriodo(UUID employeeId, 
                                                                  LocalDateTime dataInicio, 
                                                                  LocalDateTime dataFim) {
        return historicoRepository.findByEmployeeIdAndDataExecucaoBetweenOrderByDataExecucaoDesc(
            employeeId, dataInicio, dataFim);
    }
    
    /**
     * Busca histórico por funcionário e tipo de ação
     */
    public List<RemanejamentoHistorico> findByEmployeeIdAndAcao(UUID employeeId, AcaoHistorico acao) {
        return historicoRepository.findByEmployeeIdAndAcaoOrderByDataExecucaoDesc(employeeId, acao);
    }
    
    /**
     * Busca histórico com filtros múltiplos
     */
    public Page<RemanejamentoHistorico> findWithFilters(UUID employeeId, AcaoHistorico acao, 
                                                       UUID usuarioId, LocalDateTime dataInicio, 
                                                       LocalDateTime dataFim, Pageable pageable) {
        return historicoRepository.findWithFilters(employeeId, acao, usuarioId, dataInicio, dataFim, pageable);
    }
    
    /**
     * Busca última ação realizada em um remanejamento
     */
    public Optional<RemanejamentoHistorico> findLastActionByRemanejamentoId(UUID remanejamentoId) {
        return Optional.ofNullable(historicoRepository.findLastActionByRemanejamentoId(remanejamentoId));
    }
    
    /**
     * Conta histórico por funcionário
     */
    public long countByEmployeeId(UUID employeeId) {
        return historicoRepository.countByEmployeeId(employeeId);
    }
    
    /**
     * Conta histórico por tipo de ação
     */
    public long countByAcao(AcaoHistorico acao) {
        return historicoRepository.countByAcao(acao);
    }
    
    /**
     * Conta histórico por usuário
     */
    public long countByUsuarioQueExecutou(UUID usuarioId) {
        return historicoRepository.countByUsuarioQueExecutouId(usuarioId);
    }
    
    /**
     * Gera relatório de atividades por período
     */
    public List<RemanejamentoHistorico> gerarRelatorioAtividades(LocalDateTime dataInicio, LocalDateTime dataFim) {
        return historicoRepository.findByDataExecucaoBetweenOrderByDataExecucaoDesc(dataInicio, dataFim);
    }
    
    /**
     * Gera relatório de atividades por funcionário
     */
    public List<RemanejamentoHistorico> gerarRelatorioFuncionario(UUID employeeId, LocalDateTime dataInicio, LocalDateTime dataFim) {
        return historicoRepository.findByEmployeeIdAndDataExecucaoBetweenOrderByDataExecucaoDesc(employeeId, dataInicio, dataFim);
    }
} 