package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.z7design.fleet_manager.config.jackson.BlankStringToNullUuidDeserializer;
import com.z7design.fleet_manager.model.enums.BoardingStatus;
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
public class BoardingDTO {
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID id;
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID tripId;
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID passengerId;
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID vehicleId;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime boardingTime;
    private Double boardingLatitude;
    private Double boardingLongitude;
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID boardingPointId;
    private BoardingStatus status;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
