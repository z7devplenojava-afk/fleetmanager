package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Driver;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class DriverDTO {
    private UUID id;
    private String name;
    private String licenseNumber;
    private String phone;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DriverDTO fromEntity(Driver driver) {
        try {
            if (driver == null) {
                System.err.println("Driver Ã© nulo - retornando DTO vazio");
                return new DriverDTO();
            }
            
            DriverDTO dto = new DriverDTO();
            dto.setId(driver.getId());
            dto.setName(driver.getName());
            dto.setLicenseNumber(driver.getLicenseNumber());
            dto.setPhone(driver.getPhone());
            dto.setStatus(driver.getStatus());
            dto.setCreatedAt(driver.getCreatedAt());
            dto.setUpdatedAt(driver.getUpdatedAt());
            return dto;
        } catch (Exception e) {
            System.err.println("Erro ao converter Driver para DTO: " + e.getMessage());
            e.printStackTrace();
            
            // Retornar DTO bÃ¡sico em caso de erro
            DriverDTO fallbackDto = new DriverDTO();
            try {
                if (driver != null) {
                    fallbackDto.setId(driver.getId());
                    fallbackDto.setName(driver.getName() != null ? driver.getName() : "Nome nÃ£o disponÃ­vel");
                }
            } catch (Exception fallbackError) {
                System.err.println("Erro no fallback do DriverDTO: " + fallbackError.getMessage());
            }
            
            return fallbackDto;
        }
    }
} 
