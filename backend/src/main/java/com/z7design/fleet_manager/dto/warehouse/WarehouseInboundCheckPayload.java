package com.z7design.fleet_manager.dto.warehouse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Payload enviado pelo almoxarife com a conferência física e os seriais/DOTs lidos.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseInboundCheckPayload {

    private UUID checkedUserId;
    private String notes;

    @Builder.Default
    private List<ItemCheckDTO> items = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemCheckDTO {
        private UUID itemId;
        private UUID matchedProductId; // Produto do catálogo selecionado/vinculado
        private UUID targetLocationId; // Localização de destino no almoxarifado
        private BigDecimal quantityChecked;
        private String lotNumber;

        @Builder.Default
        private List<String> serialsOrDots = new ArrayList<>(); // DOTs para pneus ou seriais para baterias
    }
}
