package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.EPIDeliveryForm;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EPIDeliveryFormDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String employeeCpf;
    private UUID companyId;
    private String companyName;
    private String companyCnpj;
    private LocalDate deliveryDate;
    private UUID responsibleEmployeeId;
    private String responsibleEmployeeName;
    private String observations;
    private String pdfUrl;
    private UUID createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<EPIDeliveryFormItemDTO> items;

    public static EPIDeliveryFormDTO fromEntity(EPIDeliveryForm form) {
        return EPIDeliveryFormDTO.builder()
                .id(form.getId())
                .employeeId(form.getEmployee().getId())
                .employeeName(form.getEmployee().getName())
                .employeeCpf(form.getEmployee().getDocument() != null ? form.getEmployee().getDocument() : null)
                .companyId(form.getCompany().getId())
                .companyName(form.getCompany().getName())
                .companyCnpj(form.getCompany().getCnpj())
                .deliveryDate(form.getDeliveryDate())
                .responsibleEmployeeId(form.getResponsibleEmployee() != null ? form.getResponsibleEmployee().getId() : null)
                .responsibleEmployeeName(form.getResponsibleEmployee() != null ? form.getResponsibleEmployee().getName() : null)
                .observations(form.getObservations())
                .pdfUrl(form.getPdfUrl())
                .createdById(form.getCreatedBy() != null ? form.getCreatedBy().getId() : null)
                .createdByName(form.getCreatedBy() != null ? form.getCreatedBy().getName() : null)
                .createdAt(form.getCreatedAt())
                .updatedAt(form.getUpdatedAt())
                .items(form.getItems() != null ? form.getItems().stream()
                        .map(item -> EPIDeliveryFormItemDTO.builder()
                                .id(item.getId())
                                .stockItemId(item.getStockItemId())
                                .epiName(item.getEpiName())
                                .quantity(item.getQuantity())
                                .ca(item.getCa())
                                .caName(item.getCaName())
                                .validityDate(item.getValidityDate())
                                .uniformType(item.getUniformType())
                                .uniformPiece(item.getUniformPiece())
                                .observations(item.getObservations())
                                .build())
                        .collect(Collectors.toList()) : null)
                .build();
    }
}


