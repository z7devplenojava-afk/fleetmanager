package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private java.util.UUID id;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private java.util.UUID employeeId;
    
    private String employeeName;
    private String employeeCpf;
    private String role;
    private String company;
    private String client;
    private String workplace;
    
    private BigDecimal salary;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    
    private String documentUrl;
    private Boolean signed;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
} 
