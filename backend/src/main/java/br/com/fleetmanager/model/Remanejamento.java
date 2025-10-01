package br.com.fleetmanager.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "remanejamentos")
public class Remanejamento {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

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
    private LocalDate dataRemanejamento;

    @Column(length = 500)
    private String observacao;

    // Getters e setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public RemanejamentoTipo getTipo() { return tipo; }
    public void setTipo(RemanejamentoTipo tipo) { this.tipo = tipo; }
    public String getOrigem() { return origem; }
    public void setOrigem(String origem) { this.origem = origem; }
    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }
    public LocalDate getDataRemanejamento() { return dataRemanejamento; }
    public void setDataRemanejamento(LocalDate dataRemanejamento) { this.dataRemanejamento = dataRemanejamento; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
} 