package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderOfServiceDTO {
    private java.util.UUID id;
    private java.util.UUID employeeId;
    private String employeeName;
    private String employeeCpf;
    private String role;
    private String company;
    private String client;
    private String workplace;
    private BigDecimal salary;
    private LocalDate startDate;
    private LocalDate endDate;
    private String documentUrl;
    private Boolean signed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 