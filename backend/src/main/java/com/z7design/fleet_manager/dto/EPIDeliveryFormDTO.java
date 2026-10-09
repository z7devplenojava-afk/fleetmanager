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
        if (form == null) return null;

        UUID employeeId = null;
        String employeeName = null;
        String employeeCpf = null;
        if (form.getEmployee() != null) {
            try {
                employeeId = form.getEmployee().getId();
                employeeName = form.getEmployee().getName();
                employeeCpf = form.getEmployee().getDocument();
            } catch (Exception ignored) {}
        }

        UUID companyId = null;
        String companyName = null;
        String companyCnpj = null;
        if (form.getCompany() != null) {
            try {
                companyId = form.getCompany().getId();
                companyName = form.getCompany().getName();
                companyCnpj = form.getCompany().getCnpj();
            } catch (Exception ignored) {}
        }

        UUID respId = null;
        String respName = null;
        if (form.getResponsibleEmployee() != null) {
            try {
                respId = form.getResponsibleEmployee().getId();
                respName = form.getResponsibleEmployee().getName();
            } catch (Exception ignored) {}
        }

        UUID createdById = null;
        String createdByName = null;
        if (form.getCreatedBy() != null) {
            try {
                createdById = form.getCreatedBy().getId();
                createdByName = form.getCreatedBy().getName();
            } catch (Exception ignored) {}
        }

        List<EPIDeliveryFormItemDTO> itemDtos = null;
        try {
            if (form.getItems() != null && org.hibernate.Hibernate.isInitialized(form.getItems())) {
                itemDtos = form.getItems().stream()
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
                        .collect(Collectors.toList());
            }
        } catch (Exception ignored) {}

        return EPIDeliveryFormDTO.builder()
                .id(form.getId())
                .employeeId(employeeId)
                .employeeName(employeeName)
                .employeeCpf(employeeCpf)
                .companyId(companyId)
                .companyName(companyName)
                .companyCnpj(companyCnpj)
                .deliveryDate(form.getDeliveryDate())
                .responsibleEmployeeId(respId)
                .responsibleEmployeeName(respName)
                .observations(form.getObservations())
                .pdfUrl(form.getPdfUrl())
                .createdById(createdById)
                .createdByName(createdByName)
                .createdAt(form.getCreatedAt())
                .updatedAt(form.getUpdatedAt())
                .items(itemDtos)
                .build();
    }
}


