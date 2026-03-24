package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.ClientStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientReportFilterDTO {
    private String name;
    private String cnpj;
    private LocalDate startDate;
    private LocalDate endDate;
    private ClientStatus status;
}

