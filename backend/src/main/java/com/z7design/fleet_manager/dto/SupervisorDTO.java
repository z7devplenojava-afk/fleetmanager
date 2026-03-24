package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Supervisor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class SupervisorDTO {
    private UUID id;
    private String name;
    private String cpf;
    private String email;
    private String phone;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Campos para reconhecimento facial (nÃ£o expor dados sensÃ­veis)
    private Boolean hasFaceRegistered;
    private Double faceQualityScore;
    
    public static SupervisorDTO fromEntity(Supervisor supervisor) {
        SupervisorDTO dto = new SupervisorDTO();
        dto.setId(supervisor.getId());
        dto.setName(supervisor.getName());
        dto.setCpf(supervisor.getCpf());
        dto.setEmail(supervisor.getEmail());
        dto.setPhone(supervisor.getPhone());
        dto.setIsActive(supervisor.getIsActive());
        dto.setCreatedAt(supervisor.getCreatedAt());
        dto.setUpdatedAt(supervisor.getUpdatedAt());
        dto.setHasFaceRegistered(supervisor.getFaceTemplate() != null && supervisor.getFaceTemplate().length > 0);
        dto.setFaceQualityScore(supervisor.getFaceQualityScore());
        return dto;
    }
}

