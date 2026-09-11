package com.z7design.fleet_manager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class MeasurementInvoiceDTO {
    private UUID id;
    private UUID bulletinId;
    private String invoiceType; // NFE, CTE
    private String number;
    private String series;
    private String accessKey;
    private LocalDate issueDate;
    private BigDecimal amount;
    private String issuerName;
    private String status;
    private String xmlUrl;
    private String pdfUrl;
}
