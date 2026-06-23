package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.z7design.fleet_manager.config.jackson.BlankStringToNullUuidDeserializer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisembarkingDTO {
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID id;
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID boardingId;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime disembarkingTime;
    private Double disembarkingLatitude;
    private Double disembarkingLongitude;
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID disembarkingPointId;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
