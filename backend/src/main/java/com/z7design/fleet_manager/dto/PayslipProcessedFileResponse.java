package com.z7design.fleet_manager.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PayslipProcessedFileResponse {

    UUID id;
    String fileName;
    String employeeName;
    String cpf;
    Integer month;
    Integer year;
    String companyName;
    String companySigla;
    String companyCnpj;
    UUID companyId;
    String path;
    LocalDateTime processedAt;
}

