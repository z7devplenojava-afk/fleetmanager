package br.com.fleetmanager.model;

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
    @NotNull(message = "Documento é obrigatório")
    private Document document;
    
    @Column(name = "signer_name", nullable = false, length = 255)
    @NotBlank(message = "Nome do signatário é obrigatório")
    private String signerName;
    
    @Column(name = "signer_cpf", nullable = false, length = 14)
    @NotBlank(message = "CPF do signatário é obrigatório")
    @Pattern(regexp = "^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$", message = "CPF deve estar no formato 000.000.000-00")
    private String signerCpf;
    
    @Column(name = "signer_role", nullable = false, length = 100)
    @NotBlank(message = "Cargo/função do signatário é obrigatório")
    private String signerRole;
    
    @Column(name = "signer_ip", nullable = false, length = 45)
    @NotBlank(message = "IP do signatário é obrigatório")
    private String signerIp;
    
    @Column(name = "signature_hash", nullable = false, length = 64, unique = true)
    @NotBlank(message = "Hash da assinatura é obrigatório")
    private String signatureHash;
    
    @Column(name = "signature_date", nullable = false)
    @NotNull(message = "Data da assinatura é obrigatória")
    private LocalDateTime signatureDate;
    
    @Column(name = "created_by", nullable = false, length = 100)
    @NotBlank(message = "Usuário que criou a assinatura é obrigatório")
    private String createdBy;
    
    @Column(name = "created_at", nullable = false)
    @NotNull(message = "Data de criação é obrigatória")
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