package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Vehicle;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDTO {

    private UUID id;
    private String plate;
    private String fleetNumber;
    private String model;
    private String brand;
    private Integer year;
    private String color;
    private Vehicle.VehicleStatus status;
    private String patrimonyNumber;
    private Integer modelYear;
    private Integer hourmeter;
    private UUID contractId;
    private UUID projectId;
    private String projectName;
    private UUID operationId;
    private String operationName;
    private String garageName;
    private UUID garageId;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate operationEntryDate;
    private Vehicle.VehicleType vehicleType;
    private Vehicle.FuelType fuelType;
    private Integer capacity;
    private Integer currentMileage;
    private Integer initialMileage;
    private String assignedDriver;
    private UUID responsibleEmployeeId;
    private String department;
    private UUID departmentId;
    private UUID companyId;
    private UUID workPostId;
    private String location;
    private LocalDate acquisitionDate;
    private BigDecimal acquisitionValue;
    private BigDecimal averageConsumption;
    private BigDecimal averageCostPerKm;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastMaintenanceDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate nextMaintenanceDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate insuranceExpiryDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate documentationExpiryDate;
    private String notes;
    private String photos;

    // Documentais
    private String chassisNumber;
    private String renavan;

    // Ônibus
    private Vehicle.BusType busType;
    private Integer passengerCapacity;
    private Integer standingCapacity;
    private Integer totalDoors;
    private Boolean hasAccessibility;
    private Boolean hasAirConditioning;
    private Boolean hasWiFi;
    private Boolean hasCamera;
    private Boolean hasCctv;
    private String busBodyType;
    private String chassisBrand;
    private String bodyBuilder;
    private String engineModel;
    private Integer enginePowerHp;
    private String transmissionType;
    private Integer axleCount;
    private Integer totalWeightKg;
    private Integer payloadKg;
    private Integer fuelTankCapacityLiters;
    private String routeNumber;
    private String routeName;

    // Financiamento
    private Vehicle.FinancingStatus financingStatus;
    private BigDecimal financingInstallmentValue;
    private Integer financingRemainingInstallments;
    private BigDecimal financingPayoffBalance;
    private String financingBankOrInstitution;
    private String financingContractNumber;
    private LocalDate financingStartDate;
    private LocalDate financingEndDate;

    // Valor de mercado
    private BigDecimal marketValue;

    // Seguros
    private String insurancePolicyNumber;
    private String insuranceCompany;
    private BigDecimal insurancePremiumValue;
    private String insuranceCoverageType;
    private String insuranceSecondPolicyNumber;
    private String insuranceSecondCompany;
    private BigDecimal insuranceSecondPremiumValue;
    private LocalDate insuranceSecondExpiryDate;

    // Cliente / Alocação
    private String clientName;
    private UUID clientId;
    private String allocationContractNumber;
    private LocalDate allocationStartDate;
    private LocalDate allocationEndDate;

    // Gestão de Agregado
    private Boolean isAggregated;
    private String aggregatedOwnerName;
    private String aggregatedOwnerCpfCnpj;
    private String aggregatedOwnerPhone;
    private String aggregatedOwnerEmail;
    private BigDecimal aggregatedDailyRate;
    private BigDecimal aggregatedMonthlyRate;
    private Vehicle.AggregatedPaymentType aggregatedPaymentType;
    private LocalDate aggregatedContractStartDate;
    private LocalDate aggregatedContractEndDate;
    private String aggregatedNotes;

    // Diferença financeira
    private BigDecimal financialDifference;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VehicleDTO fromEntity(Vehicle vehicle) {
        VehicleDTO dto = new VehicleDTO();

        // Básicos
        dto.setId(vehicle.getId());
        dto.setPlate(vehicle.getPlate());
        dto.setFleetNumber(vehicle.getFleetNumber());
        dto.setModel(vehicle.getModel());
        dto.setBrand(vehicle.getBrand());
        dto.setYear(vehicle.getYear());
        dto.setColor(vehicle.getColor());
        dto.setStatus(vehicle.getStatus());
        dto.setPatrimonyNumber(vehicle.getPatrimonyNumber());
        dto.setModelYear(vehicle.getModelYear());
        dto.setHourmeter(vehicle.getHourmeter());
        dto.setContractId(vehicle.getContractId());
        dto.setProjectId(vehicle.getProjectId());
        dto.setProjectName(vehicle.getProjectName());
        dto.setOperationId(vehicle.getOperationId());
        dto.setOperationName(vehicle.getOperationName());
        dto.setGarageName(vehicle.getGarageName());
        dto.setGarageId(vehicle.getGarageId());
        dto.setOperationEntryDate(vehicle.getOperationEntryDate());
        dto.setVehicleType(vehicle.getVehicleType());
        dto.setFuelType(vehicle.getFuelType());
        dto.setCapacity(vehicle.getCapacity());
        dto.setCurrentMileage(vehicle.getCurrentMileage());
        dto.setInitialMileage(vehicle.getInitialMileage());
        dto.setAssignedDriver(vehicle.getAssignedDriver());
        dto.setResponsibleEmployeeId(vehicle.getResponsibleEmployeeId());
        dto.setDepartment(vehicle.getDepartment());
        dto.setDepartmentId(vehicle.getDepartmentId());
        dto.setCompanyId(vehicle.getCompanyId());
        dto.setWorkPostId(vehicle.getWorkPostId());
        dto.setLocation(vehicle.getLocation());
        dto.setAcquisitionDate(vehicle.getAcquisitionDate());
        dto.setAcquisitionValue(vehicle.getAcquisitionValue());
        dto.setAverageConsumption(vehicle.getAverageConsumption());
        dto.setAverageCostPerKm(vehicle.getAverageCostPerKm());
        dto.setLastMaintenanceDate(vehicle.getLastMaintenanceDate());
        dto.setNextMaintenanceDate(vehicle.getNextMaintenanceDate());
        dto.setInsuranceExpiryDate(vehicle.getInsuranceExpiryDate());
        dto.setDocumentationExpiryDate(vehicle.getDocumentationExpiryDate());
        dto.setNotes(vehicle.getNotes());
        dto.setPhotos(vehicle.getPhotos());
        dto.setCreatedAt(vehicle.getCreatedAt());
        dto.setUpdatedAt(vehicle.getUpdatedAt());

        // Documentais
        dto.setChassisNumber(vehicle.getChassisNumber());
        dto.setRenavan(vehicle.getRenavan());

        // Ônibus
        dto.setBusType(vehicle.getBusType());
        dto.setPassengerCapacity(vehicle.getPassengerCapacity());
        dto.setStandingCapacity(vehicle.getStandingCapacity());
        dto.setTotalDoors(vehicle.getTotalDoors());
        dto.setHasAccessibility(vehicle.getHasAccessibility());
        dto.setHasAirConditioning(vehicle.getHasAirConditioning());
        dto.setHasWiFi(vehicle.getHasWiFi());
        dto.setHasCamera(vehicle.getHasCamera());
        dto.setHasCctv(vehicle.getHasCctv());
        dto.setBusBodyType(vehicle.getBusBodyType());
        dto.setChassisBrand(vehicle.getChassisBrand());
        dto.setBodyBuilder(vehicle.getBodyBuilder());
        dto.setEngineModel(vehicle.getEngineModel());
        dto.setEnginePowerHp(vehicle.getEnginePowerHp());
        dto.setTransmissionType(vehicle.getTransmissionType());
        dto.setAxleCount(vehicle.getAxleCount());
        dto.setTotalWeightKg(vehicle.getTotalWeightKg());
        dto.setPayloadKg(vehicle.getPayloadKg());
        dto.setFuelTankCapacityLiters(vehicle.getFuelTankCapacityLiters());
        dto.setRouteNumber(vehicle.getRouteNumber());
        dto.setRouteName(vehicle.getRouteName());

        // Financiamento
        dto.setFinancingStatus(vehicle.getFinancingStatus());
        dto.setFinancingInstallmentValue(vehicle.getFinancingInstallmentValue());
        dto.setFinancingRemainingInstallments(vehicle.getFinancingRemainingInstallments());
        dto.setFinancingPayoffBalance(vehicle.getFinancingPayoffBalance());
        dto.setFinancingBankOrInstitution(vehicle.getFinancingBankOrInstitution());
        dto.setFinancingContractNumber(vehicle.getFinancingContractNumber());
        dto.setFinancingStartDate(vehicle.getFinancingStartDate());
        dto.setFinancingEndDate(vehicle.getFinancingEndDate());

        // Valor de mercado
        dto.setMarketValue(vehicle.getMarketValue());

        // Seguros
        dto.setInsurancePolicyNumber(vehicle.getInsurancePolicyNumber());
        dto.setInsuranceCompany(vehicle.getInsuranceCompany());
        dto.setInsurancePremiumValue(vehicle.getInsurancePremiumValue());
        dto.setInsuranceCoverageType(vehicle.getInsuranceCoverageType());
        dto.setInsuranceSecondPolicyNumber(vehicle.getInsuranceSecondPolicyNumber());
        dto.setInsuranceSecondCompany(vehicle.getInsuranceSecondCompany());
        dto.setInsuranceSecondPremiumValue(vehicle.getInsuranceSecondPremiumValue());
        dto.setInsuranceSecondExpiryDate(vehicle.getInsuranceSecondExpiryDate());

        // Cliente / Alocação
        dto.setClientName(vehicle.getClientName());
        dto.setClientId(vehicle.getClientId());
        dto.setAllocationContractNumber(vehicle.getAllocationContractNumber());
        dto.setAllocationStartDate(vehicle.getAllocationStartDate());
        dto.setAllocationEndDate(vehicle.getAllocationEndDate());

        // Agregado
        dto.setIsAggregated(vehicle.getIsAggregated());
        dto.setAggregatedOwnerName(vehicle.getAggregatedOwnerName());
        dto.setAggregatedOwnerCpfCnpj(vehicle.getAggregatedOwnerCpfCnpj());
        dto.setAggregatedOwnerPhone(vehicle.getAggregatedOwnerPhone());
        dto.setAggregatedOwnerEmail(vehicle.getAggregatedOwnerEmail());
        dto.setAggregatedDailyRate(vehicle.getAggregatedDailyRate());
        dto.setAggregatedMonthlyRate(vehicle.getAggregatedMonthlyRate());
        dto.setAggregatedPaymentType(vehicle.getAggregatedPaymentType());
        dto.setAggregatedContractStartDate(vehicle.getAggregatedContractStartDate());
        dto.setAggregatedContractEndDate(vehicle.getAggregatedContractEndDate());
        dto.setAggregatedNotes(vehicle.getAggregatedNotes());

        // Diferença financeira
        dto.setFinancialDifference(vehicle.getFinancialDifference());

        return dto;
    }

    public Vehicle toEntity() {
        Vehicle vehicle = new Vehicle();

        vehicle.setId(this.id);
        vehicle.setPlate(this.plate);
        vehicle.setFleetNumber(this.fleetNumber);
        vehicle.setModel(this.model);
        vehicle.setBrand(this.brand);
        vehicle.setYear(this.year);
        vehicle.setColor(this.color);
        vehicle.setStatus(this.status);
        vehicle.setPatrimonyNumber(this.patrimonyNumber);
        vehicle.setModelYear(this.modelYear);
        vehicle.setHourmeter(this.hourmeter);
        vehicle.setContractId(this.contractId);
        vehicle.setProjectId(this.projectId);
        vehicle.setProjectName(this.projectName);
        vehicle.setOperationId(this.operationId);
        vehicle.setOperationName(this.operationName);
        vehicle.setGarageName(this.garageName);
        vehicle.setGarageId(this.garageId);
        vehicle.setOperationEntryDate(this.operationEntryDate);
        vehicle.setVehicleType(this.vehicleType);
        vehicle.setFuelType(this.fuelType);
        vehicle.setCapacity(this.capacity);
        vehicle.setCurrentMileage(this.currentMileage);
        vehicle.setInitialMileage(this.initialMileage);
        vehicle.setAssignedDriver(this.assignedDriver);
        vehicle.setResponsibleEmployeeId(this.responsibleEmployeeId);
        vehicle.setDepartment(this.department);
        vehicle.setDepartmentId(this.departmentId);
        vehicle.setCompanyId(this.companyId);
        vehicle.setWorkPostId(this.workPostId);
        vehicle.setLocation(this.location);
        vehicle.setAcquisitionDate(this.acquisitionDate);
        vehicle.setAcquisitionValue(this.acquisitionValue);
        vehicle.setAverageConsumption(this.averageConsumption);
        vehicle.setAverageCostPerKm(this.averageCostPerKm);
        vehicle.setLastMaintenanceDate(this.lastMaintenanceDate);
        vehicle.setNextMaintenanceDate(this.nextMaintenanceDate);
        vehicle.setInsuranceExpiryDate(this.insuranceExpiryDate);
        vehicle.setDocumentationExpiryDate(this.documentationExpiryDate);
        vehicle.setNotes(this.notes);
        vehicle.setPhotos(this.photos);
        vehicle.setCreatedAt(this.createdAt);
        vehicle.setUpdatedAt(this.updatedAt);

        // Documentais
        vehicle.setChassisNumber(this.chassisNumber);
        vehicle.setRenavan(this.renavan);

        // Ônibus
        vehicle.setBusType(this.busType);
        vehicle.setPassengerCapacity(this.passengerCapacity);
        vehicle.setStandingCapacity(this.standingCapacity);
        vehicle.setTotalDoors(this.totalDoors);
        vehicle.setHasAccessibility(this.hasAccessibility);
        vehicle.setHasAirConditioning(this.hasAirConditioning);
        vehicle.setHasWiFi(this.hasWiFi);
        vehicle.setHasCamera(this.hasCamera);
        vehicle.setHasCctv(this.hasCctv);
        vehicle.setBusBodyType(this.busBodyType);
        vehicle.setChassisBrand(this.chassisBrand);
        vehicle.setBodyBuilder(this.bodyBuilder);
        vehicle.setEngineModel(this.engineModel);
        vehicle.setEnginePowerHp(this.enginePowerHp);
        vehicle.setTransmissionType(this.transmissionType);
        vehicle.setAxleCount(this.axleCount);
        vehicle.setTotalWeightKg(this.totalWeightKg);
        vehicle.setPayloadKg(this.payloadKg);
        vehicle.setFuelTankCapacityLiters(this.fuelTankCapacityLiters);
        vehicle.setRouteNumber(this.routeNumber);
        vehicle.setRouteName(this.routeName);

        // Financiamento
        vehicle.setFinancingStatus(this.financingStatus);
        vehicle.setFinancingInstallmentValue(this.financingInstallmentValue);
        vehicle.setFinancingRemainingInstallments(this.financingRemainingInstallments);
        vehicle.setFinancingPayoffBalance(this.financingPayoffBalance);
        vehicle.setFinancingBankOrInstitution(this.financingBankOrInstitution);
        vehicle.setFinancingContractNumber(this.financingContractNumber);
        vehicle.setFinancingStartDate(this.financingStartDate);
        vehicle.setFinancingEndDate(this.financingEndDate);

        // Valor de mercado
        vehicle.setMarketValue(this.marketValue);

        // Seguros
        vehicle.setInsurancePolicyNumber(this.insurancePolicyNumber);
        vehicle.setInsuranceCompany(this.insuranceCompany);
        vehicle.setInsurancePremiumValue(this.insurancePremiumValue);
        vehicle.setInsuranceCoverageType(this.insuranceCoverageType);
        vehicle.setInsuranceSecondPolicyNumber(this.insuranceSecondPolicyNumber);
        vehicle.setInsuranceSecondCompany(this.insuranceSecondCompany);
        vehicle.setInsuranceSecondPremiumValue(this.insuranceSecondPremiumValue);
        vehicle.setInsuranceSecondExpiryDate(this.insuranceSecondExpiryDate);

        // Cliente / Alocação
        vehicle.setClientName(this.clientName);
        vehicle.setClientId(this.clientId);
        vehicle.setAllocationContractNumber(this.allocationContractNumber);
        vehicle.setAllocationStartDate(this.allocationStartDate);
        vehicle.setAllocationEndDate(this.allocationEndDate);

        // Agregado
        vehicle.setIsAggregated(this.isAggregated);
        vehicle.setAggregatedOwnerName(this.aggregatedOwnerName);
        vehicle.setAggregatedOwnerCpfCnpj(this.aggregatedOwnerCpfCnpj);
        vehicle.setAggregatedOwnerPhone(this.aggregatedOwnerPhone);
        vehicle.setAggregatedOwnerEmail(this.aggregatedOwnerEmail);
        vehicle.setAggregatedDailyRate(this.aggregatedDailyRate);
        vehicle.setAggregatedMonthlyRate(this.aggregatedMonthlyRate);
        vehicle.setAggregatedPaymentType(this.aggregatedPaymentType);
        vehicle.setAggregatedContractStartDate(this.aggregatedContractStartDate);
        vehicle.setAggregatedContractEndDate(this.aggregatedContractEndDate);
        vehicle.setAggregatedNotes(this.aggregatedNotes);

        // Diferença financeira
        vehicle.setFinancialDifference(this.financialDifference);

        return vehicle;
    }
}
