package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.TimeRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PunchRequestDTO {
    private TimeRecord.RecordType punchType;
    private Double latitude;
    private Double longitude;
    private String photoBase64;
    private String observations;
}
