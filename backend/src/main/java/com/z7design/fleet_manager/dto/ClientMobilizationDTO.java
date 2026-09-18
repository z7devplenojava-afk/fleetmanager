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
public class ClientMobilizationDTO {

    private UUID clientId;
    private String clientName;
    private String cnpj;
    private Integer postsQuantity; // Quantidade de postos
    private Integer vehiclesQuantity; // Quantidade de veículos
    private Integer headcountQuantity; // Quantidade de colaboradores/efetivo
    private LocalDate operationStartDate; // Data prevista para início
    private String contractNumber;
    private String contractDuration; // Vigência
    private String notes; // Detalhes e especificações da operação

    // Flags de canais
    @Builder.Default
    private boolean notifyInternal = true;

    @Builder.Default
    private boolean notifyEmail = true;

    @Builder.Default
    private boolean notifyWhatsapp = true;
}
