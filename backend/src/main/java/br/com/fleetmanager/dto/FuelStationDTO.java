package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonFormat;

import br.com.fleetmanager.model.FuelStation;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuelStationDTO {
    
    private UUID id;
    private String name;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String phone;
    private String email;
    private String cnpj;
    private String brand;
    private String manager;
    private String managerPhone;
    private String managerEmail;
    private String operatingHours;
    private String services;
    private String paymentMethods;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private FuelStation.FuelStationStatus status;
    private String notes;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    public static FuelStationDTO fromEntity(FuelStation fuelStation) {
        return FuelStationDTO.builder()
                .id(fuelStation.getId())
                .name(fuelStation.getName())
                .address(fuelStation.getAddress())
                .city(fuelStation.getCity())
                .state(fuelStation.getState())
                .zipCode(fuelStation.getZipCode())
                .phone(fuelStation.getPhone())
                .email(fuelStation.getEmail())
                .cnpj(fuelStation.getCnpj())
                .brand(fuelStation.getBrand())
                .manager(fuelStation.getManager())
                .managerPhone(fuelStation.getManagerPhone())
                .managerEmail(fuelStation.getManagerEmail())
                .operatingHours(fuelStation.getOperatingHours())
                .services(fuelStation.getServices())
                .paymentMethods(fuelStation.getPaymentMethods())
                .latitude(fuelStation.getLatitude())
                .longitude(fuelStation.getLongitude())
                .status(fuelStation.getStatus())
                .notes(fuelStation.getNotes())
                .createdAt(fuelStation.getCreatedAt())
                .updatedAt(fuelStation.getUpdatedAt())
                .build();
    }
    
    public FuelStation toEntity() {
        return FuelStation.builder()
                .id(this.id)
                .name(this.name)
                .address(this.address)
                .city(this.city)
                .state(this.state)
                .zipCode(this.zipCode)
                .phone(this.phone)
                .email(this.email)
                .cnpj(this.cnpj)
                .brand(this.brand)
                .manager(this.manager)
                .managerPhone(this.managerPhone)
                .managerEmail(this.managerEmail)
                .operatingHours(this.operatingHours)
                .services(this.services)
                .paymentMethods(this.paymentMethods)
                .latitude(this.latitude)
                .longitude(this.longitude)
                .status(this.status)
                .notes(this.notes)
                .build();
    }
}
