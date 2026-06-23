package com.z7design.fleet_manager.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import com.z7design.fleet_manager.model.TimeRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeRecordDTO {
    private UUID id;
    private LocalDate recordDate;
    private LocalDateTime punchTime;
    private TimeRecord.RecordType punchType;
    private String location;
    private Double latitude;
    private Double longitude;
    private String photoBase64;
    private String observations;
    private Boolean isManual;
    private LocalDateTime createdAt;
    private String status;

    public static TimeRecordDTO fromEntity(TimeRecord timeRecord) {
        if (timeRecord == null) return null;
        
        return TimeRecordDTO.builder()
                .id(timeRecord.getId())
                .recordDate(timeRecord.getRecordedAt() != null ? timeRecord.getRecordedAt().toLocalDate() : null)
                .punchTime(timeRecord.getRecordedAt())
                .punchType(timeRecord.getRecordType())
                .location(timeRecord.getLocation())
                .latitude(timeRecord.getLatitude())
                .longitude(timeRecord.getLongitude())
                .photoBase64(timeRecord.getPhotoUrl()) // Use photoUrl as a placeholder/url
                .observations(timeRecord.getJustification())
                .isManual(timeRecord.getIsManual())
                .createdAt(timeRecord.getCreatedAt())
                .status(timeRecord.getStatus() != null ? timeRecord.getStatus().name() : null)
                .build();
    }
}
