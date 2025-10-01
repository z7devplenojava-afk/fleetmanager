package br.com.fleetmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.net.InetAddress;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "documentos_gerados")
public class DocumentoGerado {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull(message = "Modelo é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modelo_id", nullable = false)
    private ModeloDocumento modelo;
    
    @NotNull(message = "Funcionário é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionario_id", nullable = false)
    private Employee funcionario;
    
    @Column(name = "conteudo_final", columnDefinition = "TEXT")
    private String conteudoFinal;
    
    @Column(name = "dados_preenchidos", columnDefinition = "JSON")
    private String dadosPreenchidos; // JSON com os dados utilizados
    
    @JsonIgnore
    @Lob
    @Column(name = "arquivo_gerado", nullable = false)
    private byte[] arquivoGerado; // Sempre PDF
    
    @NotBlank(message = "Nome do arquivo gerado é obrigatório")
    @Column(name = "nome_arquivo_gerado", nullable = false)
    private String nomeArquivoGerado;
    
    @NotNull(message = "Tamanho do arquivo gerado é obrigatório")
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
    private User assinadoPor;
    
    @Column(name = "ip_assinatura")
    private String ipAssinatura;
    
    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;
    
    @Column(name = "data_vencimento")
    private LocalDateTime dataVencimento;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por")
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
    
    // Métodos auxiliares
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
