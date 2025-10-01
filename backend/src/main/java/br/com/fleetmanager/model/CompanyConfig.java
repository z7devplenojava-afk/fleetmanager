package br.com.fleetmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "company_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotBlank(message = "Nome da empresa é obrigatório")
    @Size(min = 3, max = 200, message = "Nome deve ter entre 3 e 200 caracteres")
    @Column(name = "name", nullable = false)
    private String name;

    @NotBlank(message = "CNPJ é obrigatório")
    @Size(min = 14, max = 18, message = "CNPJ deve ter formato válido")
    @Column(name = "cnpj", nullable = false, unique = true)
    private String cnpj;

    @NotBlank(message = "Endereço é obrigatório")
    @Size(max = 500, message = "Endereço não pode exceder 500 caracteres")
    @Column(name = "address", nullable = false)
    private String address;

    @NotBlank(message = "Cidade é obrigatória")
    @Size(max = 100, message = "Cidade não pode exceder 100 caracteres")
    @Column(name = "city", nullable = false)
    private String city;

    @NotBlank(message = "Estado é obrigatório")
    @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres")
    @Column(name = "state", nullable = false)
    private String state;

    @NotBlank(message = "CEP é obrigatório")
    @Size(min = 8, max = 10, message = "CEP deve ter formato válido")
    @Column(name = "zip_code", nullable = false)
    private String zipCode;

    @NotBlank(message = "Telefone é obrigatório")
    @Size(max = 20, message = "Telefone não pode exceder 20 caracteres")
    @Column(name = "phone", nullable = false)
    private String phone;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email deve ter formato válido")
    @Size(max = 100, message = "Email não pode exceder 100 caracteres")
    @Column(name = "email", nullable = false)
    private String email;

    @Size(max = 100, message = "Website não pode exceder 100 caracteres")
    @Column(name = "website")
    private String website;

    @Lob
    @Column(name = "logo_url")
    private String logoUrl;

    @Size(max = 200, message = "Texto do cabeçalho não pode exceder 200 caracteres")
    @Column(name = "header_text")
    private String headerText;

    @Size(max = 500, message = "Texto do rodapé não pode exceder 500 caracteres")
    @Column(name = "footer_text")
    private String footerText;

    @Lob
    @Column(name = "contract_terms")
    private String contractTerms;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
