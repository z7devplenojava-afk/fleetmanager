package com.z7design.fleet_manager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Documento do Controle de Certificações Federais, Municipais e Estaduais (CFME).
 * Guarda arquivos (PDF/Excel) emitidos por órgãos reguladores (ANTT, ATR, DEER,
 * CREA, certidões em geral, listas de passageiros, autorizações de viagem, atas)
 * com controle de validade e isolamento por empresa.
 */
@Entity
@Table(name = "cfme_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CfmeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private DocumentCategory category;

    @Column(length = 180)
    private String title;

    /** Órgão / entidade emissora (ex.: ANTT, DEER, CREA, Prefeitura). */
    @Column(length = 150)
    private String issuer;

    @Column(name = "document_number", length = 80)
    private String documentNumber;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "stored_path", nullable = false, columnDefinition = "TEXT")
    private String storedPath;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 120)
    private String mimeType;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @Column(name = "uploaded_by_name", length = 200)
    private String uploadedByName;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Categorias de documentos regulatórios controlados no CFME.
     */
    public enum DocumentCategory {
        ANTT("ANTT (Agência Nacional de Transportes Terrestres)"),
        ATR("ATR (Autorização de Transporte Rodoviário)"),
        DEER("DEER (Departamento de Estradas de Rodagem)"),
        CREA("CREA (Conselho Regional de Engenharia e Agronomia)"),
        CERTIDAO("Certidões em geral"),
        LISTA_PASSAGEIROS("Lista de Passageiros"),
        AUTORIZACAO_VIAGEM("Autorização de Viagens"),
        ATA("Atas"),
        OUTRO("Outros documentos");

        private final String description;

        DocumentCategory(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
