package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "documentos_gerados")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DocumentoGerado {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull(message = "Modelo Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modelo_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ModeloDocumento modelo;
    
    @NotNull(message = "FuncionÃ¡rio Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionario_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Employee funcionario;
    
    @Column(name = "conteudo_final", columnDefinition = "TEXT")
    private String conteudoFinal;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dados_preenchidos", columnDefinition = "JSON")
    private String dadosPreenchidos; // JSON com os dados utilizados
    
    @JsonIgnore
    @Column(name = "arquivo_gerado", nullable = false, columnDefinition = "BYTEA")
    private byte[] arquivoGerado; // Sempre PDF
    
    @NotBlank(message = "Nome do arquivo gerado Ã© obrigatÃ³rio")
    @Column(name = "nome_arquivo_gerado", nullable = false)
    private String nomeArquivoGerado;
    
    @NotNull(message = "Tamanho do arquivo gerado Ã© obrigatÃ³rio")
    @Column(name = "tamanho_arquivo_gerado", nullable = false)
    private Long tamanhoArquivoGerado;
    
    @CreationTimestamp
    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;
    
    @Column(name = "data_assinatura")
    private LocalDateTime dataAssinatura;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private StatusDocumento status = StatusDocumento.PENDENTE;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assinado_por")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User assinadoPor;
    
    @Column(name = "ip_assinatura")
    private String ipAssinatura;
    
    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;
    
    @Column(name = "data_vencimento")
    private LocalDateTime dataVencimento;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User criadoPor;
    
    // Relacionamento com assinaturas
    @OneToMany(mappedBy = "documentoGerado", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AssinaturaDocumento> assinaturas;
    
    // Enum para status do documento
    public enum StatusDocumento {
        PENDENTE("Pendente"),
        ASSINADO("Assinado"),
        VENCIDO("Vencido"),
        CANCELADO("Cancelado");
        
        private final String descricao;
        
        StatusDocumento(String descricao) {
            this.descricao = descricao;
        }
        
        public String getDescricao() {
            return descricao;
        }
    }
    
    // MÃ©todos auxiliares
    public boolean isAssinado() {
        return status == StatusDocumento.ASSINADO;
    }
    
    public boolean isVencido() {
        return dataVencimento != null && LocalDateTime.now().isAfter(dataVencimento);
    }
    
    public boolean isPendente() {
        return status == StatusDocumento.PENDENTE;
    }
    
    public void marcarComoAssinado(User usuario, String ip) {
        this.status = StatusDocumento.ASSINADO;
        this.dataAssinatura = LocalDateTime.now();
        this.assinadoPor = usuario;
        this.ipAssinatura = ip;
    }
    
    public void marcarComoVencido() {
        this.status = StatusDocumento.VENCIDO;
    }
    
    public void cancelar() {
        this.status = StatusDocumento.CANCELADO;
    }
}

