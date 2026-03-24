package com.z7design.fleet_manager.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class OrderOfServiceSSTResponseDTO {
    private UUID id;
    private String title;
    private String description;
    private String status;
    private String responsible;
    private LocalDateTime issueDate;
    private LocalDateTime executionDate;
    private String documentUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 
