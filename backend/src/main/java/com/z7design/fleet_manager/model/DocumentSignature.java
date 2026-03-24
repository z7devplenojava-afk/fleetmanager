package com.z7design.fleet_manager.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "document_signatures")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSignature {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    @NotNull(message = "Documento Ã© obrigatÃ³rio")
    private Document document;
    
    @Column(name = "signer_name", nullable = false, length = 255)
    @NotBlank(message = "Nome do signatÃ¡rio Ã© obrigatÃ³rio")
    private String signerName;
    
    @Column(name = "signer_cpf", nullable = false, length = 14)
    @NotBlank(message = "CPF do signatÃ¡rio Ã© obrigatÃ³rio")
    @Pattern(regexp = "^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$", message = "CPF deve estar no formato 000.000.000-00")
    private String signerCpf;
    
    @Column(name = "signer_role", nullable = false, length = 100)
    @NotBlank(message = "Cargo/funÃ§Ã£o do signatÃ¡rio Ã© obrigatÃ³rio")
    private String signerRole;
    
    @Column(name = "signer_ip", nullable = false, length = 45)
    @NotBlank(message = "IP do signatÃ¡rio Ã© obrigatÃ³rio")
    private String signerIp;
    
    @Column(name = "signature_hash", nullable = false, length = 64, unique = true)
    @NotBlank(message = "Hash da assinatura Ã© obrigatÃ³rio")
    private String signatureHash;
    
    @Column(name = "signature_date", nullable = false)
    @NotNull(message = "Data da assinatura Ã© obrigatÃ³ria")
    private LocalDateTime signatureDate;
    
    @Column(name = "created_by", nullable = false, length = 100)
    @NotBlank(message = "UsuÃ¡rio que criou a assinatura Ã© obrigatÃ³rio")
    private String createdBy;
    
    @Column(name = "created_at", nullable = false)
    @NotNull(message = "Data de criaÃ§Ã£o Ã© obrigatÃ³ria")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        signatureDate = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 
