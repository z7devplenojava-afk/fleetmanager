package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockNfeProcessResponseDTO {
    private boolean success;
    private String message;
    private UUID supplierId;
    private String supplierName;
    private int itemsCreated;
    private int itemsUpdated;
    private int batteriesCreated;
    private int tiresCreated;
    private int financialAccountsCreated;

    @Builder.Default
    private List<String> details = new ArrayList<>();
}
