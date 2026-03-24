package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.RemanejamentoHistoricoRepository;
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
     * Registra uma aÃ§Ã£o no histÃ³rico de remanejamento
     */
    public RemanejamentoHistorico registrarAcao(Remanejamento remanejamento, AcaoHistorico acao, 
                                               User usuarioQueExecutou, String motivoAlteracao) {
        return registrarAcao(remanejamento, acao, usuarioQueExecutou, motivoAlteracao, null, null);
    }
    
    /**
     * Registra uma aÃ§Ã£o no histÃ³rico de remanejamento com dados de comparaÃ§Ã£o
     */
    public RemanejamentoHistorico registrarAcao(Remanejamento remanejamento, AcaoHistorico acao, 
                                               User usuarioQueExecutou, String motivoAlteracao,
                                               Remanejamento dadosAnteriores, String ipUsuario) {
        RemanejamentoHistorico historico = new RemanejamentoHistorico(remanejamento, acao, usuarioQueExecutou);
        historico.setMotivoAlteracao(motivoAlteracao);
        historico.setIpUsuario(ipUsuario);
        
        // Se hÃ¡ dados anteriores, serializar para JSON
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
     * Busca histÃ³rico por ID
     */
    public Optional<RemanejamentoHistorico> findById(UUID id) {
        return historicoRepository.findById(id);
    }
    
    /**
     * Busca todo o histÃ³rico
     */
    public List<RemanejamentoHistorico> findAll() {
        return historicoRepository.findAll();
    }
    
    /**
     * Busca histÃ³rico por remanejamento
     */
    public List<RemanejamentoHistorico> findByRemanejamentoId(UUID remanejamentoId) {
        return historicoRepository.findByRemanejamentoIdOrderByDataExecucaoDesc(remanejamentoId);
    }
    
    /**
     * Busca histÃ³rico por funcionÃ¡rio
     */
    public List<RemanejamentoHistorico> findByEmployeeId(UUID employeeId) {
        return historicoRepository.findByEmployeeIdOrderByDataExecucaoDesc(employeeId);
    }
    
    /**
     * Busca histÃ³rico por funcionÃ¡rio com paginaÃ§Ã£o
     */
    public Page<RemanejamentoHistorico> findByEmployeeId(UUID employeeId, Pageable pageable) {
        return historicoRepository.findByEmployeeIdOrderByDataExecucaoDesc(employeeId, pageable);
    }
    
    /**
     * Busca histÃ³rico por tipo de aÃ§Ã£o
     */
    public List<RemanejamentoHistorico> findByAcao(AcaoHistorico acao) {
        return historicoRepository.findByAcaoOrderByDataExecucaoDesc(acao);
    }
    
    /**
     * Busca histÃ³rico por usuÃ¡rio que executou
     */
    public List<RemanejamentoHistorico> findByUsuarioQueExecutou(UUID usuarioId) {
        return historicoRepository.findByUsuarioQueExecutouIdOrderByDataExecucaoDesc(usuarioId);
    }
    
    /**
     * Busca histÃ³rico por perÃ­odo
     */
    public List<RemanejamentoHistorico> findByPeriodo(LocalDateTime dataInicio, LocalDateTime dataFim) {
        return historicoRepository.findByDataExecucaoBetweenOrderByDataExecucaoDesc(dataInicio, dataFim);
    }
    
    /**
     * Busca histÃ³rico por funcionÃ¡rio e perÃ­odo
     */
    public List<RemanejamentoHistorico> findByEmployeeIdAndPeriodo(UUID employeeId, 
                                                                  LocalDateTime dataInicio, 
                                                                  LocalDateTime dataFim) {
        return historicoRepository.findByEmployeeIdAndDataExecucaoBetweenOrderByDataExecucaoDesc(
            employeeId, dataInicio, dataFim);
    }
    
    /**
     * Busca histÃ³rico por funcionÃ¡rio e tipo de aÃ§Ã£o
     */
    public List<RemanejamentoHistorico> findByEmployeeIdAndAcao(UUID employeeId, AcaoHistorico acao) {
        return historicoRepository.findByEmployeeIdAndAcaoOrderByDataExecucaoDesc(employeeId, acao);
    }
    
    /**
     * Busca histÃ³rico com filtros mÃºltiplos
     */
    public Page<RemanejamentoHistorico> findWithFilters(UUID employeeId, AcaoHistorico acao, 
                                                       UUID usuarioId, LocalDateTime dataInicio, 
                                                       LocalDateTime dataFim, Pageable pageable) {
        return historicoRepository.findWithFilters(employeeId, acao, usuarioId, dataInicio, dataFim, pageable);
    }
    
    /**
     * Busca Ãºltima aÃ§Ã£o realizada em um remanejamento
     */
    public Optional<RemanejamentoHistorico> findLastActionByRemanejamentoId(UUID remanejamentoId) {
        return Optional.ofNullable(historicoRepository.findLastActionByRemanejamentoId(remanejamentoId));
    }
    
    /**
     * Conta histÃ³rico por funcionÃ¡rio
     */
    public long countByEmployeeId(UUID employeeId) {
        return historicoRepository.countByEmployeeId(employeeId);
    }
    
    /**
     * Conta histÃ³rico por tipo de aÃ§Ã£o
     */
    public long countByAcao(AcaoHistorico acao) {
        return historicoRepository.countByAcao(acao);
    }
    
    /**
     * Conta histÃ³rico por usuÃ¡rio
     */
    public long countByUsuarioQueExecutou(UUID usuarioId) {
        return historicoRepository.countByUsuarioQueExecutouId(usuarioId);
    }
    
    /**
     * Gera relatÃ³rio de atividades por perÃ­odo
     */
    public List<RemanejamentoHistorico> gerarRelatorioAtividades(LocalDateTime dataInicio, LocalDateTime dataFim) {
        return historicoRepository.findByDataExecucaoBetweenOrderByDataExecucaoDesc(dataInicio, dataFim);
    }
    
    /**
     * Gera relatÃ³rio de atividades por funcionÃ¡rio
     */
    public List<RemanejamentoHistorico> gerarRelatorioFuncionario(UUID employeeId, LocalDateTime dataInicio, LocalDateTime dataFim) {
        return historicoRepository.findByEmployeeIdAndDataExecucaoBetweenOrderByDataExecucaoDesc(employeeId, dataInicio, dataFim);
    }
} 
