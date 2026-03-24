package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "remanejamentos_historico")
public class RemanejamentoHistorico {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "remanejamento_id", nullable = false)
    private Remanejamento remanejamento;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RemanejamentoTipo tipo;

    @Column(name = "origem")
    private String origem;

    @Column(name = "destino")
    private String destino;

    @Column(name = "data_remanejamento", nullable = false)
    private LocalDateTime dataRemanejamento;

    @Column(length = 500)
    private String observacao;

    @Enumerated(EnumType.STRING)
    @Column(name = "acao_realizada", nullable = false)
    private AcaoHistorico acao;

    @ManyToOne
    @JoinColumn(name = "usuario_que_executou")
    private User usuarioQueExecutou;

    @Column(name = "data_execucao", nullable = false)
    private LocalDateTime dataExecucao;

    @Column(name = "dados_anteriores", columnDefinition = "TEXT")
    private String dadosAnteriores;

    @Column(name = "dados_novos", columnDefinition = "TEXT")
    private String dadosNovos;

    @Column(name = "motivo_alteracao", length = 500)
    private String motivoAlteracao;

    @Column(name = "ip_usuario")
    private String ipUsuario;

    @Column(name = "user_agent")
    private String userAgent;

    // Construtor padrÃ£o
    public RemanejamentoHistorico() {}

    // Construtor para criaÃ§Ã£o de histÃ³rico
    public RemanejamentoHistorico(Remanejamento remanejamento, AcaoHistorico acao, User usuarioQueExecutou) {
        this.remanejamento = remanejamento;
        this.employee = remanejamento.getEmployee();
        this.tipo = remanejamento.getTipo();
        this.origem = remanejamento.getOrigem();
        this.destino = remanejamento.getDestino();
        this.dataRemanejamento = remanejamento.getDataRemanejamento().atStartOfDay();
        this.observacao = remanejamento.getObservacao();
        this.acao = acao;
        this.usuarioQueExecutou = usuarioQueExecutou;
        this.dataExecucao = LocalDateTime.now();
    }

    // Getters e Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Remanejamento getRemanejamento() { return remanejamento; }
    public void setRemanejamento(Remanejamento remanejamento) { this.remanejamento = remanejamento; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

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

    public User getUsuarioQueExecutou() { return usuarioQueExecutou; }
    public void setUsuarioQueExecutou(User usuarioQueExecutou) { this.usuarioQueExecutou = usuarioQueExecutou; }

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
