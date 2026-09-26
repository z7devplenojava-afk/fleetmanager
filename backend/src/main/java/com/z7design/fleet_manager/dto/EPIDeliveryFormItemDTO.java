package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EPIDeliveryFormItemDTO {
    private UUID id;
    private UUID stockItemId;
    private String epiName;
    private Integer quantity;
    private String ca; // Número do CA
    private String caName; // Nome/Descrição do CA
    private LocalDate validityDate;
    private String uniformType;
    private String uniformPiece;
    private String observations;
}






