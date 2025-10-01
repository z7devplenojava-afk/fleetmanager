package br.com.fleetmanager.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimpleEmployeeDTO {
    private UUID id;
    private String name;
    private String document;
    private String email;
    private String phone;
    private String cnhNumber;
    private String registrationNumber;
    private String positionName;
    private String unitName;
}