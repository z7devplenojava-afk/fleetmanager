package br.com.fleetmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "assinaturas_documentos")
public class AssinaturaDocumento {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull(message = "Documento gerado é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_gerado_id", nullable = false)
    @JsonIgnore
    private DocumentoGerado documentoGerado;
    
    @NotNull(message = "Usuário é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_assinatura", nullable = false)
    @Builder.Default
    private TipoAssinatura tipoAssinatura = TipoAssinatura.ELETRONICA;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    @CreationTimestamp
    @Column(name = "data_assinatura", nullable = false, updatable = false)
    private LocalDateTime dataAssinatura;
    
    @Column(name = "hash_assinatura")
    private String hashAssinatura;
    
    @Column(name = "certificado_digital", columnDefinition = "TEXT")
    private String certificadoDigital;
    
    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;
    
    // Enum para tipo de assinatura
    public enum TipoAssinatura {
        ELETRONICA("Assinatura Eletrônica"),
        DIGITAL("Assinatura Digital");
        
        private final String descricao;
        
        TipoAssinatura(String descricao) {
            this.descricao = descricao;
        }
        
        public String getDescricao() {
            return descricao;
        }
    }
    
    // Métodos auxiliares
    public boolean isAssinaturaDigital() {
        return tipoAssinatura == TipoAssinatura.DIGITAL;
    }
    
    public boolean isAssinaturaEletronica() {
        return tipoAssinatura == TipoAssinatura.ELETRONICA;
    }
    
    // Método para gerar hash da assinatura
    public void gerarHashAssinatura() {
        if (usuario != null && documentoGerado != null && dataAssinatura != null) {
            String dados = usuario.getId().toString() + 
                          documentoGerado.getId().toString() + 
                          dataAssinatura.toString() + 
                          ipAddress;
            this.hashAssinatura = String.valueOf(dados.hashCode());
        }
    }
}
