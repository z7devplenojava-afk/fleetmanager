package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payslips")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payslip {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 255)
    private String employeeName;
    
    @Column(nullable = false, length = 20)
    private String cpf;
    
    @Column(length = 255)
    private String companyName;
    
    @Column(length = 20)
    private String companyCnpj;
    
    @Column(name = "company_sigla", length = 10)
    private String companySigla;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;
    
    @Column(name = "work_post_name", length = 150)
    private String workPostName;
    
    @Column(nullable = false)
    private Integer month;
    
    @Column(nullable = false)
    private Integer year;
    
    @Column(nullable = false)
    private String fileName;
    
    @Column(nullable = false)
    private LocalDateTime processedAt;
    
    // TASK 02: Campos financeiros para comparaÃ§Ã£o de holerites
    @Column(name = "total_earnings", precision = 15, scale = 2)
    private java.math.BigDecimal totalEarnings;
    
    @Column(name = "total_deductions", precision = 15, scale = 2)
    private java.math.BigDecimal totalDeductions;
    
    @Column(name = "net_value", precision = 15, scale = 2)
    private java.math.BigDecimal netValue;
    
    // Dados detalhados da tabela de vencimentos/descontos (JSON)
    // Armazenado como JSONB no PostgreSQL
    @Column(name = "table_details", columnDefinition = "jsonb")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private java.util.List<com.z7design.fleet_manager.dto.PayslipTableRow> tableDetails;
    
    // Campos de versionamento conforme PRD
    @Column(name = "versao")
    private Integer versao;
    
    @Column(name = "hash_conteudo", length = 64)
    private String hashConteudo;
    
    @Column(name = "arquivo_caminho", length = 500)
    private String arquivoCaminho;
    
    @PrePersist
    protected void onCreate() {
        processedAt = LocalDateTime.now();
        if (versao == null) {
            versao = 1; // VersÃ£o padrÃ£o se nÃ£o especificada
        }
    }

    @JsonProperty("companyId")
    public UUID getCompanyId() {
        return company != null ? company.getId() : null;
    }
} 
