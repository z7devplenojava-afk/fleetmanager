package com.z7design.fleet_manager.dto.client;

import com.z7design.fleet_manager.model.enums.TicketCategory;
import com.z7design.fleet_manager.model.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientTicketCreateDTO {
    @NotBlank(message = "O título do chamado é obrigatório")
    private String title;

    @NotBlank(message = "A descrição detalhada é obrigatória")
    private String description;

    @NotNull(message = "A categoria é obrigatória")
    private TicketCategory category;

    @Builder.Default
    private TicketPriority priority = TicketPriority.NORMAL;

    private UUID contractId;
    private String vehiclePlate;
    private String contactPhone;
}
