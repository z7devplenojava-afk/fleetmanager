package br.com.fleetmanager.model;

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

import br.com.fleetmanager.model.enums.EPICategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa os EPIs (Equipamentos de Proteção Individual)
 */
@Entity
@Table(name = "personal_protective_equipment")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalProtectiveEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Nome do EPI é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Categoria do EPI é obrigatória")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EPICategory category;

    @Size(max = 50, message = "Número do CA deve ter no máximo 50 caracteres")
    @Column(name = "ca_number")
    private String caNumber; // Número do CA (Certificado de Aprovação)

    @Column(name = "ca_validity")
    private LocalDate caValidity;

    @Size(max = 100, message = "Fabricante deve ter no máximo 100 caracteres")
    private String manufacturer;

    @Size(max = 100, message = "Modelo deve ter no máximo 100 caracteres")
    private String model;

    @NotBlank(message = "Unidade de medida é obrigatória")
    @Size(max = 20, message = "Unidade de medida deve ter no máximo 20 caracteres")
    @Column(name = "unit_of_measurement", nullable = false)
    @Builder.Default
    private String unitOfMeasurement = "UNIDADE";

    @NotNull(message = "Estoque mínimo é obrigatório")
    @Column(name = "minimum_stock", nullable = false)
    @Builder.Default
    private Integer minimumStock = 0;

    @NotNull(message = "Estoque atual é obrigatório")
    @Column(name = "current_stock", nullable = false)
    @Builder.Default
    private Integer currentStock = 0;

    @Column(name = "unit_cost", precision = 10, scale = 2)
    private BigDecimal unitCost;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
