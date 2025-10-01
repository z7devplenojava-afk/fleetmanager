package br.com.fleetmanager.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class DepartmentDTO {
    
    private UUID id;
    
    private String name;
    
    private String description;
    
    private String emailDomain;
    
    private UUID managerId;
    
    private Boolean isActive;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
} 