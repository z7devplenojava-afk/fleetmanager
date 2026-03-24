package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "modelos_documentos")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ModeloDocumento {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Nome do modelo Ã© obrigatÃ³rio")
    @Size(max = 255, message = "Nome do modelo nÃ£o pode exceder 255 caracteres")
    @Column(name = "nome_modelo", nullable = false)
    private String nomeModelo;
    
    @NotNull(message = "Tipo do arquivo Ã© obrigatÃ³rio")
    @Convert(converter = com.z7design.fleet_manager.converter.TipoArquivoConverter.class)
    @Column(name = "tipo_arquivo", nullable = false, length = 10)
    private TipoArquivo tipoArquivo;
    
    @Column(name = "conteudo_template", columnDefinition = "TEXT")
    private String conteudoTemplate; // NULL para PDFs nÃ£o extraÃ­veis
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "placeholders", columnDefinition = "JSON")
    private String placeholders; // JSON string com lista de placeholders
    
    @Size(max = 20, message = "VersÃ£o nÃ£o pode exceder 20 caracteres")
    @Column(name = "versao", length = 20)
    @Builder.Default
    private String versao = "1.0";
    
    @JsonIgnore
    @Column(name = "arquivo_original", nullable = false, columnDefinition = "BYTEA")
    private byte[] arquivoOriginal;
    
    @NotBlank(message = "Nome do arquivo original Ã© obrigatÃ³rio")
    @Size(max = 255, message = "Nome do arquivo original nÃ£o pode exceder 255 caracteres")
    @Column(name = "nome_arquivo_original", nullable = false)
    private String nomeArquivoOriginal;
    
    @NotNull(message = "Tamanho do arquivo Ã© obrigatÃ³rio")
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
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User criadoPor;
    
    @Column(name = "ativo")
    @Builder.Default
    private Boolean ativo = true;
    
    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;
    
    @Size(max = 100, message = "Categoria nÃ£o pode exceder 100 caracteres")
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
    
    // MÃ©todos auxiliares
    public boolean isAtivo() {
        return ativo != null && ativo;
    }
    
    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }
    
    // MÃ©todo para obter lista de placeholders como List<String>
    public List<String> getPlaceholdersAsList() {
        if (placeholders == null || placeholders.trim().isEmpty()) {
            return List.of();
        }
        try {
            // Aqui vocÃª pode usar um JSON parser se necessÃ¡rio
            // Por simplicidade, assumindo que Ã© uma lista separada por vÃ­rgulas
            return List.of(placeholders.replaceAll("[\\[\\]\"]", "").split(","));
        } catch (Exception e) {
            return List.of();
        }
    }
    
    // MÃ©todo para definir placeholders a partir de uma lista
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
                    throw new IllegalArgumentException("Tipo de arquivo nÃ£o suportado: " + tipo);
            }
        }
    }
}

