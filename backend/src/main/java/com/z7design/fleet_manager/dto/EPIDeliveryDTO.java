package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.EPIDelivery;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO de leitura de Entregas de EPI (campos planos).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EPIDeliveryDTO {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID epiId;
    private String epiName;
    private LocalDate deliveryDate;
    private Integer quantity;
    private String reason;
    private String notes;
    private String deliveredBy;
    private String status;
    private LocalDate nextExchangeDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static EPIDeliveryDTO fromEntity(EPIDelivery delivery) {
        if (delivery == null) {
            return null;
        }

        EPIDeliveryDTOBuilder builder = EPIDeliveryDTO.builder()
                .id(delivery.getId())
                .deliveryDate(delivery.getDeliveryDate())
                .quantity(delivery.getQuantity())
                .reason(delivery.getDeliveryReason() != null ? delivery.getDeliveryReason().name() : null)
                .notes(delivery.getNotes())
                .status(delivery.getStatus())
                .nextExchangeDate(delivery.getNextExchangeDate())
                .createdAt(delivery.getCreatedAt())
                .updatedAt(delivery.getUpdatedAt());

        if (delivery.getEmployee() != null) {
            builder.employeeId(delivery.getEmployee().getId());
            builder.employeeName(delivery.getEmployee().getName());
        }

        if (delivery.getEpi() != null) {
            builder.epiId(delivery.getEpi().getId());
            builder.epiName(delivery.getEpi().getName());
        }

        if (delivery.getDeliveredByUser() != null) {
            builder.deliveredBy(delivery.getDeliveredByUser().getName());
        }

        return builder.build();
    }
}
