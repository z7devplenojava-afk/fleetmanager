package com.z7design.fleet_manager.dto;

import java.time.LocalDate;
import com.z7design.fleet_manager.model.enums.VacationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VacationRequestDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private VacationType vacationType;
    private String observations;
}
