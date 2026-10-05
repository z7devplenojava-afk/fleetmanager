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
public class PassengerDTO {
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID id;
    private String registration;
    private String name;
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID employeeId;
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID companyId;
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID routeId;
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID boardingPointId;
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private UUID disembarkPointId;
    private String shift;
    private Boolean active;
    private String costCenter;
    private String cpf;
    private String phone;
    private String email;
    /** COMUM, ESTUDANTE, IDOSO, PCD */
    private String passengerType;
    @JsonFormat(pattern = "HH:mm")
    private java.time.LocalTime preferredTime;
    private Boolean notificationsEnabled;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
