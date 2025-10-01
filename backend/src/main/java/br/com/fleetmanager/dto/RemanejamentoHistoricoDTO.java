package br.com.fleetmanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import br.com.fleetmanager.model.AcaoHistorico;
import br.com.fleetmanager.model.RemanejamentoTipo;

import java.time.LocalDateTime;
import java.util.UUID;

public class RemanejamentoHistoricoDTO {
    private UUID id;
    private UUID remanejamentoId;
    private UUID employeeId;
    private String employeeName;
    private RemanejamentoTipo tipo;
    private String origem;
    private String destino;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dataRemanejamento;
    
    private String observacao;
    private AcaoHistorico acao;
    private UUID usuarioQueExecutouId;
    private String usuarioQueExecutouNome;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dataExecucao;
    
    private String dadosAnteriores;
    private String dadosNovos;
    private String motivoAlteracao;
    private String ipUsuario;
    private String userAgent;

    // Construtor padrão
    public RemanejamentoHistoricoDTO() {}

    // Getters e Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRemanejamentoId() { return remanejamentoId; }
    public void setRemanejamentoId(UUID remanejamentoId) { this.remanejamentoId = remanejamentoId; }

    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public RemanejamentoTipo getTipo() { return tipo; }
    public void setTipo(RemanejamentoTipo tipo) { this.tipo = tipo; }

    public String getOrigem() { return origem; }
    public void setOrigem(String origem) { this.origem = origem; }

    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }

    public LocalDateTime getDataRemanejamento() { return dataRemanejamento; }
    public void setDataRemanejamento(LocalDateTime dataRemanejamento) { this.dataRemanejamento = dataRemanejamento; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }

    public AcaoHistorico getAcao() { return acao; }
    public void setAcao(AcaoHistorico acao) { this.acao = acao; }

    public UUID getUsuarioQueExecutouId() { return usuarioQueExecutouId; }
    public void setUsuarioQueExecutouId(UUID usuarioQueExecutouId) { this.usuarioQueExecutouId = usuarioQueExecutouId; }

    public String getUsuarioQueExecutouNome() { return usuarioQueExecutouNome; }
    public void setUsuarioQueExecutouNome(String usuarioQueExecutouNome) { this.usuarioQueExecutouNome = usuarioQueExecutouNome; }

    public LocalDateTime getDataExecucao() { return dataExecucao; }
    public void setDataExecucao(LocalDateTime dataExecucao) { this.dataExecucao = dataExecucao; }

    public String getDadosAnteriores() { return dadosAnteriores; }
    public void setDadosAnteriores(String dadosAnteriores) { this.dadosAnteriores = dadosAnteriores; }

    public String getDadosNovos() { return dadosNovos; }
    public void setDadosNovos(String dadosNovos) { this.dadosNovos = dadosNovos; }

    public String getMotivoAlteracao() { return motivoAlteracao; }
    public void setMotivoAlteracao(String motivoAlteracao) { this.motivoAlteracao = motivoAlteracao; }

    public String getIpUsuario() { return ipUsuario; }
    public void setIpUsuario(String ipUsuario) { this.ipUsuario = ipUsuario; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
} 