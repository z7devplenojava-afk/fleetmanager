package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.AccidentStatus;
import com.z7design.fleet_manager.model.enums.AccidentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccidentRecordDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDate accidentDate;
    private LocalTime accidentTime;
    private String location;
    private AccidentType accidentType;
    private String description;
    private String injuryDescription;
    private String[] bodyPartsAffected;
    private String immediateCauses;
    private String rootCauses;
    private String correctiveActions;
    private String preventiveActions;
    private String catNumber;
    private LocalDate catIssuedDate;
    private Integer daysOff;
    private LocalDate returnToWorkDate;
    private String witnessNames;
    private AccidentStatus status;
    private String[] photosUrls;
    private String[] documentsUrls;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


