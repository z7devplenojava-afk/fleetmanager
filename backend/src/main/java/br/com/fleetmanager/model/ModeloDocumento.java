package br.com.fleetmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "modelos_documentos")
public class ModeloDocumento {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Nome do modelo é obrigatório")
    @Size(max = 255, message = "Nome do modelo não pode exceder 255 caracteres")
    @Column(name = "nome_modelo", nullable = false)
    private String nomeModelo;
    
    @NotBlank(message = "Tipo do arquivo é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_arquivo", nullable = false, length = 10)
    private TipoArquivo tipoArquivo;
    
    @Column(name = "conteudo_template", columnDefinition = "TEXT")
    private String conteudoTemplate; // NULL para PDFs não extraíveis
    
    @Column(name = "placeholders", columnDefinition = "JSON")
    private String placeholders; // JSON string com lista de placeholders
    
    @Size(max = 20, message = "Versão não pode exceder 20 caracteres")
    @Column(name = "versao", length = 20)
    @Builder.Default
    private String versao = "1.0";
    
    @JsonIgnore
    @Lob
    @Column(name = "arquivo_original", nullable = false)
    private byte[] arquivoOriginal;
    
    @NotBlank(message = "Nome do arquivo original é obrigatório")
    @Size(max = 255, message = "Nome do arquivo original não pode exceder 255 caracteres")
    @Column(name = "nome_arquivo_original", nullable = false)
    private String nomeArquivoOriginal;
    
    @NotNull(message = "Tamanho do arquivo é obrigatório")
    @Column(name = "tamanho_arquivo", nullable = false)
    private Long tamanhoArquivo;
    
    @CreationTimestamp
    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;
    
    @UpdateTimestamp
    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por")
    private User criadoPor;
    
    @Column(name = "ativo")
    @Builder.Default
    private Boolean ativo = true;
    
    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;
    
    @Size(max = 100, message = "Categoria não pode exceder 100 caracteres")
    @Column(name = "categoria", length = 100)
    @Builder.Default
    private String categoria = "GERAL";
    
    @Column(name = "extraivel")
    @Builder.Default
    private Boolean extraivel = true; // false para PDFs escaneados/imagem
    
    // Relacionamento com documentos gerados
    @OneToMany(mappedBy = "modelo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<DocumentoGerado> documentosGerados;
    
    // Métodos auxiliares
    public boolean isAtivo() {
        return ativo != null && ativo;
    }
    
    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }
    
    // Método para obter lista de placeholders como List<String>
    public List<String> getPlaceholdersAsList() {
        if (placeholders == null || placeholders.trim().isEmpty()) {
            return List.of();
        }
        try {
            // Aqui você pode usar um JSON parser se necessário
            // Por simplicidade, assumindo que é uma lista separada por vírgulas
            return List.of(placeholders.replaceAll("[\\[\\]\"]", "").split(","));
        } catch (Exception e) {
            return List.of();
        }
    }
    
    // Método para definir placeholders a partir de uma lista
    public void setPlaceholdersFromList(List<String> placeholdersList) {
        if (placeholdersList == null || placeholdersList.isEmpty()) {
            this.placeholders = "[]";
        } else {
            this.placeholders = "[\"" + String.join("\",\"", placeholdersList) + "\"]";
        }
    }
    
    // Enum para tipos de arquivo suportados
    public enum TipoArquivo {
        DOCX("Documento Word"),
        PDF("Documento PDF");
        
        private final String descricao;
        
        TipoArquivo(String descricao) {
            this.descricao = descricao;
        }
        
        public String getDescricao() {
            return descricao;
        }
        
        public static TipoArquivo fromString(String tipo) {
            if (tipo == null) return null;
            switch (tipo.toLowerCase()) {
                case "docx":
                    return DOCX;
                case "pdf":
                    return PDF;
                default:
                    throw new IllegalArgumentException("Tipo de arquivo não suportado: " + tipo);
            }
        }
    }
}
