package com.z7design.fleet_manager.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OrderOfServiceSSTRequestDTO {
    private String title;
    private String description;
    private String status;
    private String responsible;
    private LocalDateTime issueDate;
    private LocalDateTime executionDate;
    private String documentUrl;
} 
