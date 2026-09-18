package com.z7design.fleet_manager.dto.procurement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmDeliveryRequestDTO {
    private LocalDateTime deliveryDate;
    private String receivedByName;
    private String notes;
}
