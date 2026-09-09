package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleDTO;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/frota")
@RequiredArgsConstructor
public class FrotaController {

    private final VehicleRepository vehicleRepository;
    private final com.z7design.fleet_manager.service.VehicleService vehicleService;

    @GetMapping("/vehicles")
    public ResponseEntity<List<VehicleDTO>> getAllVehicles() {
        try {
            System.out.println("[DEBUG] FrotaController.getAllVehicles() - Iniciando busca...");

            // Testar conexÃ£o com o banco primeiro
            try {
                long count = vehicleRepository.count();
                System.out.println(
                        "[DEBUG] FrotaController.getAllVehicles() - ConexÃ£o com banco OK. Total de veÃ­culos: "
                                + count);
            } catch (Exception dbError) {
                System.err.println("[DEBUG] FrotaController.getAllVehicles() - Erro na conexÃ£o com banco: "
                        + dbError.getMessage());
                dbError.printStackTrace();
                return ResponseEntity.status(500).body(List.of());
            }

            List<Vehicle> vehicles = vehicleRepository.findAll();
            System.out.println(
                    "[DEBUG] FrotaController.getAllVehicles() - VeÃ­culos encontrados no banco: " + vehicles.size());

            if (vehicles.isEmpty()) {
                System.out.println("[DEBUG] FrotaController.getAllVehicles() - Lista vazia, retornando array vazio");
                return ResponseEntity.ok(List.of());
            }

            System.out.println(
                    "[DEBUG] FrotaController.getAllVehicles() - Primeiro veÃ­culo: " + vehicles.get(0).getPlate());

            List<VehicleDTO> vehicleDTOs = vehicles.stream()
                    .map(vehicle -> {
                        try {
                            System.out.println("[DEBUG] FrotaController.getAllVehicles() - Convertendo veÃ­culo: "
                                    + vehicle.getPlate());
                            VehicleDTO dto = VehicleDTO.fromEntity(vehicle);
                            System.out
                                    .println("[DEBUG] FrotaController.getAllVehicles() - DTO criado com sucesso para: "
                                            + vehicle.getPlate());
                            return dto;
                        } catch (Exception e) {
                            System.err.println("[DEBUG] FrotaController.getAllVehicles() - Erro ao converter veÃ­culo "
                                    + vehicle.getPlate() + ": " + e.getMessage());
                            System.err.println("[DEBUG] FrotaController.getAllVehicles() - Stack trace completo:");
                            e.printStackTrace();
                            throw e;
                        }
                    })
                    .collect(Collectors.toList());

            System.out.println("[DEBUG] FrotaController.getAllVehicles() - DTOs criados: " + vehicleDTOs.size());
            return ResponseEntity.ok(vehicleDTOs);

        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.getAllVehicles() - Erro geral: " + e.getMessage());
            System.err.println(
                    "[DEBUG] FrotaController.getAllVehicles() - Tipo de erro: " + e.getClass().getSimpleName());
            System.err.println("[DEBUG] FrotaController.getAllVehicles() - Stack trace completo:");
            e.printStackTrace();
            // Evitar 500: retornar lista vazia para o frontend lidar graciosamente
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/vehicles/{id}")
    public ResponseEntity<VehicleDTO> getVehicleById(@PathVariable("id") UUID id) {
        try {
            Vehicle vehicle = vehicleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("VeÃ­culo nÃ£o encontrado com ID: " + id));
            return ResponseEntity.ok(VehicleDTO.fromEntity(vehicle));
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.getVehicleById() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/vehicles/plate/{plate}")
    public ResponseEntity<VehicleDTO> getVehicleByPlate(@PathVariable("plate") String plate) {
        try {
            Vehicle vehicle = vehicleRepository.findByPlate(plate)
                    .orElseThrow(() -> new ResourceNotFoundException("VeÃ­culo nÃ£o encontrado com placa: " + plate));
            return ResponseEntity.ok(VehicleDTO.fromEntity(vehicle));
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.getVehicleByPlate() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/vehicles/status/{status}")
    public ResponseEntity<List<VehicleDTO>> getVehiclesByStatus(@PathVariable("status") Vehicle.VehicleStatus status) {
        try {
            List<Vehicle> vehicles = vehicleRepository.findByStatus(status);
            List<VehicleDTO> vehicleDTOs = vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(vehicleDTOs);
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.getVehiclesByStatus() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/vehicles/search")
    public ResponseEntity<List<VehicleDTO>> searchVehicles(@RequestParam(name = "searchTerm") String searchTerm) {
        try {
            List<Vehicle> vehicles = vehicleRepository.findBySearchTerm(searchTerm);
            List<VehicleDTO> vehicleDTOs = vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(vehicleDTOs);
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.searchVehicles() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping(value = "/vehicles", consumes = { "application/json", "application/json;charset=UTF-8" })
    public ResponseEntity<?> createVehicle(@RequestBody Map<String, Object> vehicleData) {
        try {
            System.out.println("[DEBUG] FrotaController.createVehicle() - Dados recebidos (raw): " + vehicleData);

            // Validar campos obrigatÃ³rios
            String plate = (String) vehicleData.get("plate");
            if (plate == null || plate.trim().isEmpty()) {
                System.err.println("[DEBUG] FrotaController.createVehicle() - Placa Ã© obrigatÃ³ria");
                return ResponseEntity.badRequest().body(Map.of("error", "Placa Ã© obrigatÃ³ria"));
            }

            String model = (String) vehicleData.get("model");
            if (model == null || model.trim().isEmpty()) {
                System.err.println("[DEBUG] FrotaController.createVehicle() - Modelo Ã© obrigatÃ³rio");
                return ResponseEntity.badRequest().body(Map.of("error", "Modelo Ã© obrigatÃ³rio"));
            }

            String brand = (String) vehicleData.get("brand");
            if (brand == null || brand.trim().isEmpty()) {
                System.err.println("[DEBUG] FrotaController.createVehicle() - Marca Ã© obrigatÃ³ria");
                return ResponseEntity.badRequest().body(Map.of("error", "Marca Ã© obrigatÃ³ria"));
            }

            Object yearObj = vehicleData.get("year");
            Integer year = null;
            if (yearObj != null) {
                if (yearObj instanceof Integer) {
                    year = (Integer) yearObj;
                } else if (yearObj instanceof Number) {
                    year = ((Number) yearObj).intValue();
                } else if (yearObj instanceof String) {
                    try {
                        year = Integer.parseInt((String) yearObj);
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Ano invÃ¡lido"));
                    }
                }
            }
            if (year == null) {
                System.err.println("[DEBUG] FrotaController.createVehicle() - Ano Ã© obrigatÃ³rio");
                return ResponseEntity.badRequest().body(Map.of("error", "Ano Ã© obrigatÃ³rio"));
            }

            // Verificar se a placa jÃ¡ existe
            if (vehicleRepository.existsByPlate(plate)) {
                System.err.println("[DEBUG] FrotaController.createVehicle() - Placa jÃ¡ existe: " + plate);
                return ResponseEntity.badRequest().body(Map.of("error", "Placa jÃ¡ cadastrada"));
            }

            // Criar objeto Vehicle
            Vehicle vehicle = new Vehicle();
            vehicle.setPlate(plate.toUpperCase().trim());
            vehicle.setModel(model.trim());
            vehicle.setBrand(brand.trim());
            vehicle.setYear(year);

            // Campos opcionais
            if (vehicleData.get("color") != null) {
                vehicle.setColor(((String) vehicleData.get("color")).trim());
            }

            // Status
            Object statusObj = vehicleData.get("status");
            if (statusObj != null) {
                try {
                    String statusStr = statusObj.toString().toUpperCase();
                    vehicle.setStatus(Vehicle.VehicleStatus.valueOf(statusStr));
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] Status invÃ¡lido: " + statusObj);
                    vehicle.setStatus(Vehicle.VehicleStatus.ACTIVE); // Default
                }
            } else {
                vehicle.setStatus(Vehicle.VehicleStatus.ACTIVE);
            }

            // FuelType
            Object fuelTypeObj = vehicleData.get("fuelType");
            if (fuelTypeObj != null) {
                try {
                    String fuelTypeStr = fuelTypeObj.toString().toUpperCase();
                    vehicle.setFuelType(Vehicle.FuelType.valueOf(fuelTypeStr));
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] Tipo de combustÃ­vel invÃ¡lido: " + fuelTypeObj);
                    vehicle.setFuelType(Vehicle.FuelType.FLEX); // Default
                }
            } else {
                vehicle.setFuelType(Vehicle.FuelType.FLEX);
            }

            // Capacity
            Object capacityObj = vehicleData.get("capacity");
            if (capacityObj != null) {
                if (capacityObj instanceof Integer) {
                    vehicle.setCapacity((Integer) capacityObj);
                } else if (capacityObj instanceof Number) {
                    vehicle.setCapacity(((Number) capacityObj).intValue());
                } else if (capacityObj instanceof String) {
                    try {
                        vehicle.setCapacity(Integer.parseInt((String) capacityObj));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Capacidade invÃ¡lida"));
                    }
                }
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Capacidade Ã© obrigatÃ³ria"));
            }

            // CurrentMileage
            Object mileageObj = vehicleData.get("currentMileage");
            if (mileageObj != null) {
                if (mileageObj instanceof Integer) {
                    vehicle.setCurrentMileage((Integer) mileageObj);
                } else if (mileageObj instanceof Number) {
                    vehicle.setCurrentMileage(((Number) mileageObj).intValue());
                } else if (mileageObj instanceof String) {
                    try {
                        vehicle.setCurrentMileage(Integer.parseInt((String) mileageObj));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Quilometragem invÃ¡lida"));
                    }
                }
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Quilometragem atual Ã© obrigatÃ³ria"));
            }

            // Campos opcionais UUID
            if (vehicleData.get("responsibleEmployeeId") != null) {
                try {
                    String empIdStr = vehicleData.get("responsibleEmployeeId").toString();
                    if (!empIdStr.isEmpty()) {
                        vehicle.setResponsibleEmployeeId(UUID.fromString(empIdStr));
                    }
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] UUID de funcionÃ¡rio responsÃ¡vel invÃ¡lido: "
                            + vehicleData.get("responsibleEmployeeId"));
                }
            }

            if (vehicleData.get("departmentId") != null) {
                try {
                    String deptIdStr = vehicleData.get("departmentId").toString();
                    if (!deptIdStr.isEmpty()) {
                        vehicle.setDepartmentId(UUID.fromString(deptIdStr));
                    }
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] UUID de departamento invÃ¡lido: " + vehicleData.get("departmentId"));
                }
            }

            if (vehicleData.get("companyId") != null) {
                try {
                    String compIdStr = vehicleData.get("companyId").toString();
                    if (!compIdStr.isEmpty()) {
                        vehicle.setCompanyId(UUID.fromString(compIdStr));
                    }
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] UUID de empresa invÃ¡lido: " + vehicleData.get("companyId"));
                }
            }

            if (vehicleData.get("workPostId") != null) {
                try {
                    String wpIdStr = vehicleData.get("workPostId").toString();
                    if (!wpIdStr.isEmpty()) {
                        vehicle.setWorkPostId(UUID.fromString(wpIdStr));
                    }
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] UUID de posto de trabalho invÃ¡lido: " + vehicleData.get("workPostId"));
                }
            }

            // Campos opcionais String
            if (vehicleData.get("department") != null) {
                vehicle.setDepartment(vehicleData.get("department").toString());
            }

            if (vehicleData.get("notes") != null) {
                vehicle.setNotes(vehicleData.get("notes").toString());
            }

            if (vehicleData.get("photos") != null) {
                vehicle.setPhotos(vehicleData.get("photos").toString());
            }

            // Campos de data (opcionais)
            if (vehicleData.get("lastMaintenanceDate") != null) {
                try {
                    String dateStr = vehicleData.get("lastMaintenanceDate").toString();
                    if (!dateStr.isEmpty()) {
                        vehicle.setLastMaintenanceDate(java.time.LocalDate.parse(dateStr));
                    }
                } catch (Exception e) {
                    System.err.println("[DEBUG] Data de Ãºltima manutenÃ§Ã£o invÃ¡lida: "
                            + vehicleData.get("lastMaintenanceDate"));
                }
            }

            if (vehicleData.get("nextMaintenanceDate") != null) {
                try {
                    String dateStr = vehicleData.get("nextMaintenanceDate").toString();
                    if (!dateStr.isEmpty()) {
                        vehicle.setNextMaintenanceDate(java.time.LocalDate.parse(dateStr));
                    }
                } catch (Exception e) {
                    System.err.println("[DEBUG] Data de prÃ³xima manutenÃ§Ã£o invÃ¡lida: "
                            + vehicleData.get("nextMaintenanceDate"));
                }
            }

            if (vehicleData.get("insuranceExpiryDate") != null) {
                try {
                    String dateStr = vehicleData.get("insuranceExpiryDate").toString();
                    if (!dateStr.isEmpty()) {
                        vehicle.setInsuranceExpiryDate(java.time.LocalDate.parse(dateStr));
                    }
                } catch (Exception e) {
                    System.err.println("[DEBUG] Data de vencimento do seguro invÃ¡lida: "
                            + vehicleData.get("insuranceExpiryDate"));
                }
            }

            if (vehicleData.get("documentationExpiryDate") != null) {
                try {
                    String dateStr = vehicleData.get("documentationExpiryDate").toString();
                    if (!dateStr.isEmpty()) {
                        vehicle.setDocumentationExpiryDate(java.time.LocalDate.parse(dateStr));
                    }
                } catch (Exception e) {
                    System.err.println("[DEBUG] Data de vencimento da documentaÃ§Ã£o invÃ¡lida: "
                            + vehicleData.get("documentationExpiryDate"));
                }
            }

            if (vehicleData.get("acquisitionDate") != null) {
                try {
                    String dateStr = vehicleData.get("acquisitionDate").toString();
                    if (!dateStr.isEmpty()) {
                        vehicle.setAcquisitionDate(java.time.LocalDate.parse(dateStr));
                    }
                } catch (Exception e) {
                    System.err.println("[DEBUG] Data de aquisiÃ§Ã£o invÃ¡lida: " + vehicleData.get("acquisitionDate"));
                }
            }

            // AcquisitionValue
            if (vehicleData.get("acquisitionValue") != null) {
                try {
                    Object valueObj = vehicleData.get("acquisitionValue");
                    if (valueObj instanceof Number) {
                        vehicle.setAcquisitionValue(java.math.BigDecimal.valueOf(((Number) valueObj).doubleValue()));
                    } else if (valueObj instanceof String) {
                        String valueStr = ((String) valueObj).replace(",", ".").replace("R$", "").trim();
                        if (!valueStr.isEmpty()) {
                            vehicle.setAcquisitionValue(new java.math.BigDecimal(valueStr));
                        }
                    }
                } catch (Exception e) {
                    System.err
                            .println("[DEBUG] Valor de aquisiÃ§Ã£o invÃ¡lido: " + vehicleData.get("acquisitionValue"));
                }
            }

            // ===== Campos de Tipo de VeÃ­culo e Ã”nibus =====
            if (vehicleData.get("vehicleType") != null) {
                try {
                    String vtStr = vehicleData.get("vehicleType").toString().toUpperCase();
                    vehicle.setVehicleType(Vehicle.VehicleType.valueOf(vtStr));
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] Tipo de veÃ­culo invÃ¡lido: " + vehicleData.get("vehicleType"));
                }
            }

            if (vehicleData.get("busType") != null) {
                try {
                    String btStr = vehicleData.get("busType").toString().toUpperCase();
                    vehicle.setBusType(Vehicle.BusType.valueOf(btStr));
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] Tipo de Ã”nibus invÃ¡lido: " + vehicleData.get("busType"));
                }
            }

            // Capacidade de passageiros
            vehicle.setPassengerCapacity(getIntValue(vehicleData.get("passengerCapacity")));
            vehicle.setStandingCapacity(getIntValue(vehicleData.get("standingCapacity")));
            vehicle.setTotalDoors(getIntValue(vehicleData.get("totalDoors")));
            vehicle.setAxleCount(getIntValue(vehicleData.get("axleCount")));
            vehicle.setEnginePowerHp(getIntValue(vehicleData.get("enginePowerHp")));
            vehicle.setTotalWeightKg(getIntValue(vehicleData.get("totalWeightKg")));
            vehicle.setPayloadKg(getIntValue(vehicleData.get("payloadKg")));
            vehicle.setFuelTankCapacityLiters(getIntValue(vehicleData.get("fuelTankCapacityLiters")));

            // Booleanos
            vehicle.setHasAccessibility(getBooleanValue(vehicleData.get("hasAccessibility")));
            vehicle.setHasAirConditioning(getBooleanValue(vehicleData.get("hasAirConditioning")));
            vehicle.setHasWiFi(getBooleanValue(vehicleData.get("hasWiFi")));
            vehicle.setHasCamera(getBooleanValue(vehicleData.get("hasCamera")));
            vehicle.setHasCctv(getBooleanValue(vehicleData.get("hasCctv")));

            // Strings de Ã”nibus
            if (vehicleData.get("busBodyType") != null) vehicle.setBusBodyType(vehicleData.get("busBodyType").toString());
            if (vehicleData.get("chassisBrand") != null) vehicle.setChassisBrand(vehicleData.get("chassisBrand").toString());
            if (vehicleData.get("bodyBuilder") != null) vehicle.setBodyBuilder(vehicleData.get("bodyBuilder").toString());
            if (vehicleData.get("engineModel") != null) vehicle.setEngineModel(vehicleData.get("engineModel").toString());
            if (vehicleData.get("transmissionType") != null) vehicle.setTransmissionType(vehicleData.get("transmissionType").toString());
            if (vehicleData.get("routeNumber") != null) vehicle.setRouteNumber(vehicleData.get("routeNumber").toString());
            if (vehicleData.get("routeName") != null) vehicle.setRouteName(vehicleData.get("routeName").toString());

            // ===== Documentais =====
            if (vehicleData.get("chassisNumber") != null) vehicle.setChassisNumber(vehicleData.get("chassisNumber").toString());
            if (vehicleData.get("renavan") != null) vehicle.setRenavan(vehicleData.get("renavan").toString());

            // ===== Financiamento =====
            if (vehicleData.get("financingStatus") != null) {
                try {
                    vehicle.setFinancingStatus(Vehicle.FinancingStatus.valueOf(vehicleData.get("financingStatus").toString().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] FinancingStatus inválido: " + vehicleData.get("financingStatus"));
                }
            }
            if (vehicleData.get("financingInstallmentValue") != null) vehicle.setFinancingInstallmentValue(getDecimalValue(vehicleData.get("financingInstallmentValue")));
            if (vehicleData.get("financingRemainingInstallments") != null) vehicle.setFinancingRemainingInstallments(getIntValue(vehicleData.get("financingRemainingInstallments")));
            if (vehicleData.get("financingPayoffBalance") != null) vehicle.setFinancingPayoffBalance(getDecimalValue(vehicleData.get("financingPayoffBalance")));
            if (vehicleData.get("financingBankOrInstitution") != null) vehicle.setFinancingBankOrInstitution(vehicleData.get("financingBankOrInstitution").toString());
            if (vehicleData.get("financingContractNumber") != null) vehicle.setFinancingContractNumber(vehicleData.get("financingContractNumber").toString());
            if (vehicleData.get("financingStartDate") != null) vehicle.setFinancingStartDate(getDateValue(vehicleData.get("financingStartDate")));
            if (vehicleData.get("financingEndDate") != null) vehicle.setFinancingEndDate(getDateValue(vehicleData.get("financingEndDate")));

            // ===== Valor de mercado =====
            if (vehicleData.get("marketValue") != null) vehicle.setMarketValue(getDecimalValue(vehicleData.get("marketValue")));

            // ===== Seguros =====
            if (vehicleData.get("insurancePolicyNumber") != null) vehicle.setInsurancePolicyNumber(vehicleData.get("insurancePolicyNumber").toString());
            if (vehicleData.get("insuranceCompany") != null) vehicle.setInsuranceCompany(vehicleData.get("insuranceCompany").toString());
            if (vehicleData.get("insurancePremiumValue") != null) vehicle.setInsurancePremiumValue(getDecimalValue(vehicleData.get("insurancePremiumValue")));
            if (vehicleData.get("insuranceCoverageType") != null) vehicle.setInsuranceCoverageType(vehicleData.get("insuranceCoverageType").toString());
            if (vehicleData.get("insuranceSecondPolicyNumber") != null) vehicle.setInsuranceSecondPolicyNumber(vehicleData.get("insuranceSecondPolicyNumber").toString());
            if (vehicleData.get("insuranceSecondCompany") != null) vehicle.setInsuranceSecondCompany(vehicleData.get("insuranceSecondCompany").toString());
            if (vehicleData.get("insuranceSecondPremiumValue") != null) vehicle.setInsuranceSecondPremiumValue(getDecimalValue(vehicleData.get("insuranceSecondPremiumValue")));
            if (vehicleData.get("insuranceSecondExpiryDate") != null) vehicle.setInsuranceSecondExpiryDate(getDateValue(vehicleData.get("insuranceSecondExpiryDate")));

            // ===== Cliente / Alocação =====
            if (vehicleData.get("clientName") != null) vehicle.setClientName(vehicleData.get("clientName").toString());
            if (vehicleData.get("clientId") != null) {
                try {
                    String clientIdStr = vehicleData.get("clientId").toString();
                    if (!clientIdStr.isEmpty()) vehicle.setClientId(UUID.fromString(clientIdStr));
                } catch (IllegalArgumentException e) { /* ignore */ }
            }
            if (vehicleData.get("allocationContractNumber") != null) vehicle.setAllocationContractNumber(vehicleData.get("allocationContractNumber").toString());
            if (vehicleData.get("allocationStartDate") != null) vehicle.setAllocationStartDate(getDateValue(vehicleData.get("allocationStartDate")));
            if (vehicleData.get("allocationEndDate") != null) vehicle.setAllocationEndDate(getDateValue(vehicleData.get("allocationEndDate")));

            // ===== Agregado =====
            if (vehicleData.get("isAggregated") != null) vehicle.setIsAggregated(getBooleanValue(vehicleData.get("isAggregated")));
            if (vehicleData.get("aggregatedOwnerName") != null) vehicle.setAggregatedOwnerName(vehicleData.get("aggregatedOwnerName").toString());
            if (vehicleData.get("aggregatedOwnerCpfCnpj") != null) vehicle.setAggregatedOwnerCpfCnpj(vehicleData.get("aggregatedOwnerCpfCnpj").toString());
            if (vehicleData.get("aggregatedOwnerPhone") != null) vehicle.setAggregatedOwnerPhone(vehicleData.get("aggregatedOwnerPhone").toString());
            if (vehicleData.get("aggregatedOwnerEmail") != null) vehicle.setAggregatedOwnerEmail(vehicleData.get("aggregatedOwnerEmail").toString());
            if (vehicleData.get("aggregatedDailyRate") != null) vehicle.setAggregatedDailyRate(getDecimalValue(vehicleData.get("aggregatedDailyRate")));
            if (vehicleData.get("aggregatedMonthlyRate") != null) vehicle.setAggregatedMonthlyRate(getDecimalValue(vehicleData.get("aggregatedMonthlyRate")));
            if (vehicleData.get("aggregatedPaymentType") != null) {
                try {
                    vehicle.setAggregatedPaymentType(Vehicle.AggregatedPaymentType.valueOf(vehicleData.get("aggregatedPaymentType").toString().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] AggregatedPaymentType inválido: " + vehicleData.get("aggregatedPaymentType"));
                }
            }
            if (vehicleData.get("aggregatedContractStartDate") != null) vehicle.setAggregatedContractStartDate(getDateValue(vehicleData.get("aggregatedContractStartDate")));
            if (vehicleData.get("aggregatedContractEndDate") != null) vehicle.setAggregatedContractEndDate(getDateValue(vehicleData.get("aggregatedContractEndDate")));
            if (vehicleData.get("aggregatedNotes") != null) vehicle.setAggregatedNotes(vehicleData.get("aggregatedNotes").toString());

            // ===== Diferença financeira =====
            if (vehicleData.get("financialDifference") != null) vehicle.setFinancialDifference(getDecimalValue(vehicleData.get("financialDifference")));

            System.out.println("[DEBUG] FrotaController.createVehicle() - Dados processados:");
            System.out.println("  - Placa: " + vehicle.getPlate());
            System.out.println("  - Modelo: " + vehicle.getModel());
            System.out.println("  - Marca: " + vehicle.getBrand());
            System.out.println("  - Ano: " + vehicle.getYear());
            System.out.println("  - Status: " + vehicle.getStatus());
            System.out.println("  - CombustÃ­vel: " + vehicle.getFuelType());
            System.out.println("  - Capacidade: " + vehicle.getCapacity());
            System.out.println("  - Quilometragem: " + vehicle.getCurrentMileage());

            // Validar campos obrigatÃ³rios antes de salvar
            if (vehicle.getStatus() == null) {
                System.err.println("[DEBUG] Status Ã© null, definindo como ACTIVE");
                vehicle.setStatus(Vehicle.VehicleStatus.ACTIVE);
            }
            if (vehicle.getFuelType() == null) {
                System.err.println("[DEBUG] FuelType Ã© null, definindo como FLEX");
                vehicle.setFuelType(Vehicle.FuelType.FLEX);
            }
            if (vehicle.getCapacity() == null) {
                System.err.println("[DEBUG] Capacity Ã© null, retornando erro");
                return ResponseEntity.badRequest().body(Map.of("error", "Capacidade Ã© obrigatÃ³ria"));
            }
            if (vehicle.getCurrentMileage() == null) {
                System.err.println("[DEBUG] CurrentMileage Ã© null, retornando erro");
                return ResponseEntity.badRequest().body(Map.of("error", "Quilometragem atual Ã© obrigatÃ³ria"));
            }

            // ===== ValidaÃ§Ã£o por tipo de veÃ­culo =====
            if (vehicle.getVehicleType() != null) {
                java.util.List<String> typeErrors = validateVehicleByType(vehicle);
                if (!typeErrors.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", String.join("; ", typeErrors)));
                }
            }

            // ===== ValidaÃ§Ã£o de agregado =====
            if (Boolean.TRUE.equals(vehicle.getIsAggregated())) {
                if (vehicle.getAggregatedOwnerName() == null || vehicle.getAggregatedOwnerName().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Nome do proprietÃ¡rio Ã© obrigatÃ³rio para veÃ­culos de agregado"));
                }
                if (vehicle.getAggregatedPaymentType() == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Tipo de pagamento Ã© obrigatÃ³rio para veÃ­culos de agregado"));
                }
            }

            // ===== ValidaÃ§Ã£o de financiamento =====
            if (vehicle.getFinancingStatus() == Vehicle.FinancingStatus.FINANCED) {
                if (vehicle.getFinancingBankOrInstitution() == null || vehicle.getFinancingBankOrInstitution().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Banco/InstituiÃ§Ã£o Ã© obrigatÃ³rio para veÃ­culos financiados"));
                }
            }

            try {
                Vehicle savedVehicle = vehicleRepository.save(vehicle);
                System.out.println("[DEBUG] FrotaController.createVehicle() - VeÃ­culo salvo com sucesso: "
                        + savedVehicle.getId());

                try {
                    VehicleDTO dto = VehicleDTO.fromEntity(savedVehicle);
                    System.out.println("[DEBUG] FrotaController.createVehicle() - DTO criado com sucesso");
                    return ResponseEntity.ok(dto);
                } catch (Exception dtoException) {
                    System.err.println("[DEBUG] FrotaController.createVehicle() - Erro ao criar DTO: "
                            + dtoException.getMessage());
                    dtoException.printStackTrace();
                    // Retornar o veÃ­culo salvo mesmo sem DTO
                    return ResponseEntity.status(500).body(Map.of(
                            "error", "Erro ao converter veÃ­culo para DTO: " + dtoException.getMessage(),
                            "vehicleId", savedVehicle.getId().toString()));
                }
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                System.err.println(
                        "[DEBUG] FrotaController.createVehicle() - Erro de integridade ao salvar: " + e.getMessage());
                e.printStackTrace();
                String errorMessage = "Erro de integridade";
                if (e.getMessage() != null && e.getMessage().contains("plate")) {
                    errorMessage = "Placa jÃ¡ cadastrada";
                } else if (e.getMessage() != null) {
                    errorMessage = "Erro de integridade: " + e.getMessage();
                }
                return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
            } catch (jakarta.validation.ConstraintViolationException e) {
                System.err.println(
                        "[DEBUG] FrotaController.createVehicle() - Erro de validaÃ§Ã£o ao salvar: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.badRequest().body(Map.of("error", "Erro de validaÃ§Ã£o: " + e.getMessage()));
            }

        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            System.err.println("[DEBUG] FrotaController.createVehicle() - Erro de integridade: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Erro de integridade: " + e.getMessage()));
        } catch (jakarta.validation.ConstraintViolationException e) {
            System.err.println("[DEBUG] FrotaController.createVehicle() - Erro de validaÃ§Ã£o: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Erro de validaÃ§Ã£o: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.createVehicle() - Erro: " + e.getMessage());
            System.err.println("[DEBUG] FrotaController.createVehicle() - Tipo: " + e.getClass().getSimpleName());
            System.err.println("[DEBUG] FrotaController.createVehicle() - Stack trace completo:");
            e.printStackTrace();

            // Mensagem de erro mais amigÃ¡vel
            String errorMessage = "Erro ao criar veÃ­culo";
            if (e.getMessage() != null) {
                if (e.getMessage().contains("NullPointerException")) {
                    errorMessage = "Erro: algum campo obrigatÃ³rio nÃ£o foi preenchido corretamente";
                } else if (e.getMessage().contains("ConstraintViolation")) {
                    errorMessage = "Erro de validaÃ§Ã£o: verifique os dados informados";
                } else {
                    errorMessage = "Erro ao criar veÃ­culo: " + e.getMessage();
                }
            }

            return ResponseEntity.status(500).body(Map.of(
                    "error", errorMessage,
                    "details", e.getClass().getSimpleName() + ": "
                            + (e.getMessage() != null ? e.getMessage() : "Erro desconhecido")));
        }
    }

    @PutMapping(value = "/vehicles/{id}", consumes = { MediaType.APPLICATION_JSON_VALUE,
            "application/json;charset=UTF-8" })
    public ResponseEntity<?> updateVehicle(@PathVariable("id") UUID id,
            @RequestBody(required = false) Map<String, Object> vehicleData) {
        try {
            System.out.println("[DEBUG] FrotaController.updateVehicle() - ID recebido: " + id);

            // Verificar se vehicleData Ã© null (pode acontecer se houver erro de
            // deserializaÃ§Ã£o)
            if (vehicleData == null) {
                System.err.println(
                        "[DEBUG] FrotaController.updateVehicle() - vehicleData Ã© null, tentando ler do request");
                return ResponseEntity.badRequest().body(Map.of("error",
                        "Dados do veÃ­culo nÃ£o foram recebidos corretamente. Verifique o formato JSON."));
            }

            System.out.println("[DEBUG] FrotaController.updateVehicle() - Dados recebidos (raw): " + vehicleData);

            // Validar UUID
            if (id == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "ID do veÃ­culo Ã© obrigatÃ³rio"));
            }

            // Verificar se o UUID nÃ£o Ã© o placeholder invÃ¡lido
            String idStr = id.toString();
            if (idStr.equals("ffffffff-ffff-ffff-ffff-ffffffffffff") ||
                    idStr.equals("00000000-0000-0000-0000-000000000000") ||
                    idStr.equals("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")) {
                System.err.println("[DEBUG] FrotaController.updateVehicle() - UUID invÃ¡lido detectado: " + idStr);
                return ResponseEntity.badRequest().body(Map.of("error",
                        "ID do veÃ­culo invÃ¡lido. Por favor, recarregue a pÃ¡gina e tente novamente."));
            }

            // Verificar se o veÃ­culo existe
            Vehicle vehicle = vehicleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("VeÃ­culo nÃ£o encontrado com ID: " + id));

            System.out.println("[DEBUG] FrotaController.updateVehicle() - VeÃ­culo encontrado: " + vehicle.getPlate());

            // Atualizar apenas os campos fornecidos
            if (vehicleData.get("plate") != null) {
                String plate = vehicleData.get("plate").toString().toUpperCase().trim();
                if (!plate.isEmpty() && !plate.equals(vehicle.getPlate())) {
                    // Verificar se a nova placa jÃ¡ existe (exceto para o prÃ³prio veÃ­culo)
                    if (vehicleRepository.existsByPlate(plate) && !vehicle.getPlate().equals(plate)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Placa jÃ¡ cadastrada"));
                    }
                    vehicle.setPlate(plate);
                }
            }

            if (vehicleData.get("model") != null) {
                vehicle.setModel(vehicleData.get("model").toString().trim());
            }

            if (vehicleData.get("brand") != null) {
                vehicle.setBrand(vehicleData.get("brand").toString().trim());
            }

            if (vehicleData.get("year") != null) {
                Object yearObj = vehicleData.get("year");
                if (yearObj instanceof Integer) {
                    vehicle.setYear((Integer) yearObj);
                } else if (yearObj instanceof Number) {
                    vehicle.setYear(((Number) yearObj).intValue());
                } else if (yearObj instanceof String) {
                    try {
                        vehicle.setYear(Integer.parseInt((String) yearObj));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Ano invÃ¡lido"));
                    }
                }
            }

            if (vehicleData.get("color") != null) {
                vehicle.setColor(vehicleData.get("color").toString().trim());
            }

            // Status
            if (vehicleData.get("status") != null) {
                try {
                    String statusStr = vehicleData.get("status").toString().toUpperCase();
                    vehicle.setStatus(Vehicle.VehicleStatus.valueOf(statusStr));
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] Status invÃ¡lido: " + vehicleData.get("status"));
                    // Manter status atual se invÃ¡lido
                }
            }

            // FuelType
            if (vehicleData.get("fuelType") != null) {
                try {
                    String fuelTypeStr = vehicleData.get("fuelType").toString().toUpperCase();
                    vehicle.setFuelType(Vehicle.FuelType.valueOf(fuelTypeStr));
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] Tipo de combustÃ­vel invÃ¡lido: " + vehicleData.get("fuelType"));
                    // Manter tipo atual se invÃ¡lido
                }
            }

            // Capacity
            if (vehicleData.get("capacity") != null) {
                Object capacityObj = vehicleData.get("capacity");
                if (capacityObj instanceof Integer) {
                    vehicle.setCapacity((Integer) capacityObj);
                } else if (capacityObj instanceof Number) {
                    vehicle.setCapacity(((Number) capacityObj).intValue());
                } else if (capacityObj instanceof String) {
                    try {
                        vehicle.setCapacity(Integer.parseInt((String) capacityObj));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Capacidade invÃ¡lida"));
                    }
                }
            }

            // CurrentMileage
            if (vehicleData.get("currentMileage") != null) {
                Object mileageObj = vehicleData.get("currentMileage");
                if (mileageObj instanceof Integer) {
                    vehicle.setCurrentMileage((Integer) mileageObj);
                } else if (mileageObj instanceof Number) {
                    vehicle.setCurrentMileage(((Number) mileageObj).intValue());
                } else if (mileageObj instanceof String) {
                    try {
                        vehicle.setCurrentMileage(Integer.parseInt((String) mileageObj));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Quilometragem invÃ¡lida"));
                    }
                }
            }

            // Campos opcionais UUID
            if (vehicleData.get("responsibleEmployeeId") != null) {
                try {
                    String empIdStr = vehicleData.get("responsibleEmployeeId").toString();
                    if (!empIdStr.isEmpty()) {
                        vehicle.setResponsibleEmployeeId(UUID.fromString(empIdStr));
                    } else {
                        vehicle.setResponsibleEmployeeId(null);
                    }
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] UUID de funcionÃ¡rio responsÃ¡vel invÃ¡lido: "
                            + vehicleData.get("responsibleEmployeeId"));
                }
            }

            if (vehicleData.get("departmentId") != null) {
                try {
                    String deptIdStr = vehicleData.get("departmentId").toString();
                    if (!deptIdStr.isEmpty()) {
                        vehicle.setDepartmentId(UUID.fromString(deptIdStr));
                    } else {
                        vehicle.setDepartmentId(null);
                    }
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] UUID de departamento invÃ¡lido: " + vehicleData.get("departmentId"));
                }
            }

            if (vehicleData.get("companyId") != null) {
                try {
                    String compIdStr = vehicleData.get("companyId").toString();
                    if (!compIdStr.isEmpty()) {
                        vehicle.setCompanyId(UUID.fromString(compIdStr));
                    } else {
                        vehicle.setCompanyId(null);
                    }
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] UUID de empresa invÃ¡lido: " + vehicleData.get("companyId"));
                }
            }

            if (vehicleData.get("workPostId") != null) {
                try {
                    String wpIdStr = vehicleData.get("workPostId").toString();
                    if (!wpIdStr.isEmpty()) {
                        vehicle.setWorkPostId(UUID.fromString(wpIdStr));
                    } else {
                        vehicle.setWorkPostId(null);
                    }
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] UUID de posto de trabalho invÃ¡lido: " + vehicleData.get("workPostId"));
                }
            }

            // Campos opcionais String
            if (vehicleData.get("department") != null) {
                vehicle.setDepartment(vehicleData.get("department").toString());
            }

            if (vehicleData.get("notes") != null) {
                vehicle.setNotes(vehicleData.get("notes").toString());
            }

            if (vehicleData.get("photos") != null) {
                vehicle.setPhotos(vehicleData.get("photos").toString());
            }

            // Campos de data (opcionais)
            if (vehicleData.get("lastMaintenanceDate") != null) {
                try {
                    String dateStr = vehicleData.get("lastMaintenanceDate").toString();
                    if (!dateStr.isEmpty()) {
                        vehicle.setLastMaintenanceDate(java.time.LocalDate.parse(dateStr));
                    } else {
                        vehicle.setLastMaintenanceDate(null);
                    }
                } catch (Exception e) {
                    System.err.println("[DEBUG] Data de Ãºltima manutenÃ§Ã£o invÃ¡lida: "
                            + vehicleData.get("lastMaintenanceDate"));
                }
            }

            if (vehicleData.get("nextMaintenanceDate") != null) {
                try {
                    String dateStr = vehicleData.get("nextMaintenanceDate").toString();
                    if (!dateStr.isEmpty()) {
                        vehicle.setNextMaintenanceDate(java.time.LocalDate.parse(dateStr));
                    } else {
                        vehicle.setNextMaintenanceDate(null);
                    }
                } catch (Exception e) {
                    System.err.println("[DEBUG] Data de prÃ³xima manutenÃ§Ã£o invÃ¡lida: "
                            + vehicleData.get("nextMaintenanceDate"));
                }
            }

            if (vehicleData.get("insuranceExpiryDate") != null) {
                try {
                    String dateStr = vehicleData.get("insuranceExpiryDate").toString();
                    if (!dateStr.isEmpty()) {
                        vehicle.setInsuranceExpiryDate(java.time.LocalDate.parse(dateStr));
                    } else {
                        vehicle.setInsuranceExpiryDate(null);
                    }
                } catch (Exception e) {
                    System.err.println("[DEBUG] Data de vencimento do seguro invÃ¡lida: "
                            + vehicleData.get("insuranceExpiryDate"));
                }
            }

            if (vehicleData.get("documentationExpiryDate") != null) {
                try {
                    String dateStr = vehicleData.get("documentationExpiryDate").toString();
                    if (!dateStr.isEmpty()) {
                        vehicle.setDocumentationExpiryDate(java.time.LocalDate.parse(dateStr));
                    } else {
                        vehicle.setDocumentationExpiryDate(null);
                    }
                } catch (Exception e) {
                    System.err.println("[DEBUG] Data de vencimento da documentaÃ§Ã£o invÃ¡lida: "
                            + vehicleData.get("documentationExpiryDate"));
                }
            }

            if (vehicleData.get("acquisitionDate") != null) {
                try {
                    String dateStr = vehicleData.get("acquisitionDate").toString();
                    if (!dateStr.isEmpty()) {
                        vehicle.setAcquisitionDate(java.time.LocalDate.parse(dateStr));
                    } else {
                        vehicle.setAcquisitionDate(null);
                    }
                } catch (Exception e) {
                    System.err.println("[DEBUG] Data de aquisiÃ§Ã£o invÃ¡lida: " + vehicleData.get("acquisitionDate"));
                }
            }

            // AcquisitionValue
            if (vehicleData.get("acquisitionValue") != null) {
                try {
                    Object valueObj = vehicleData.get("acquisitionValue");
                    if (valueObj instanceof Number) {
                        vehicle.setAcquisitionValue(java.math.BigDecimal.valueOf(((Number) valueObj).doubleValue()));
                    } else if (valueObj instanceof String) {
                        String valueStr = ((String) valueObj).replace(",", ".").replace("R$", "").trim();
                        if (!valueStr.isEmpty()) {
                            vehicle.setAcquisitionValue(new java.math.BigDecimal(valueStr));
                        } else {
                            vehicle.setAcquisitionValue(null);
                        }
                    }
                } catch (Exception e) {
                    System.err
                            .println("[DEBUG] Valor de aquisiÃ§Ã£o invÃ¡lido: " + vehicleData.get("acquisitionValue"));
                }
            }

            // ===== Campos de Tipo de VeÃ­culo e Ã"nibus =====
            if (vehicleData.get("vehicleType") != null) {
                try {
                    String vtStr = vehicleData.get("vehicleType").toString().toUpperCase();
                    vehicle.setVehicleType(Vehicle.VehicleType.valueOf(vtStr));
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] Tipo de veÃ­culo invÃ¡lido: " + vehicleData.get("vehicleType"));
                }
            }

            if (vehicleData.get("busType") != null) {
                try {
                    String btStr = vehicleData.get("busType").toString().toUpperCase();
                    vehicle.setBusType(Vehicle.BusType.valueOf(btStr));
                } catch (IllegalArgumentException e) {
                    System.err.println("[DEBUG] Tipo de onibus invalido: " + vehicleData.get("busType"));
                }
            }

            // Capacidade de passageiros
            if (vehicleData.get("passengerCapacity") != null) vehicle.setPassengerCapacity(getIntValue(vehicleData.get("passengerCapacity")));
            if (vehicleData.get("standingCapacity") != null) vehicle.setStandingCapacity(getIntValue(vehicleData.get("standingCapacity")));
            if (vehicleData.get("totalDoors") != null) vehicle.setTotalDoors(getIntValue(vehicleData.get("totalDoors")));
            if (vehicleData.get("axleCount") != null) vehicle.setAxleCount(getIntValue(vehicleData.get("axleCount")));
            if (vehicleData.get("enginePowerHp") != null) vehicle.setEnginePowerHp(getIntValue(vehicleData.get("enginePowerHp")));
            if (vehicleData.get("totalWeightKg") != null) vehicle.setTotalWeightKg(getIntValue(vehicleData.get("totalWeightKg")));
            if (vehicleData.get("payloadKg") != null) vehicle.setPayloadKg(getIntValue(vehicleData.get("payloadKg")));
            if (vehicleData.get("fuelTankCapacityLiters") != null) vehicle.setFuelTankCapacityLiters(getIntValue(vehicleData.get("fuelTankCapacityLiters")));

            // Booleanos
            if (vehicleData.containsKey("hasAccessibility")) vehicle.setHasAccessibility(getBooleanValue(vehicleData.get("hasAccessibility")));
            if (vehicleData.containsKey("hasAirConditioning")) vehicle.setHasAirConditioning(getBooleanValue(vehicleData.get("hasAirConditioning")));
            if (vehicleData.containsKey("hasWiFi")) vehicle.setHasWiFi(getBooleanValue(vehicleData.get("hasWiFi")));
            if (vehicleData.containsKey("hasCamera")) vehicle.setHasCamera(getBooleanValue(vehicleData.get("hasCamera")));
            if (vehicleData.containsKey("hasCctv")) vehicle.setHasCctv(getBooleanValue(vehicleData.get("hasCctv")));

            // Strings de Ã"nibus
            if (vehicleData.containsKey("busBodyType")) vehicle.setBusBodyType(vehicleData.get("busBodyType") != null ? vehicleData.get("busBodyType").toString() : null);
            if (vehicleData.containsKey("chassisBrand")) vehicle.setChassisBrand(vehicleData.get("chassisBrand") != null ? vehicleData.get("chassisBrand").toString() : null);
            if (vehicleData.containsKey("bodyBuilder")) vehicle.setBodyBuilder(vehicleData.get("bodyBuilder") != null ? vehicleData.get("bodyBuilder").toString() : null);
            if (vehicleData.containsKey("engineModel")) vehicle.setEngineModel(vehicleData.get("engineModel") != null ? vehicleData.get("engineModel").toString() : null);
            if (vehicleData.containsKey("transmissionType")) vehicle.setTransmissionType(vehicleData.get("transmissionType") != null ? vehicleData.get("transmissionType").toString() : null);
            if (vehicleData.containsKey("routeNumber")) vehicle.setRouteNumber(vehicleData.get("routeNumber") != null ? vehicleData.get("routeNumber").toString() : null);
            if (vehicleData.containsKey("routeName")) vehicle.setRouteName(vehicleData.get("routeName") != null ? vehicleData.get("routeName").toString() : null);

            // ===== Documentais =====
            if (vehicleData.containsKey("chassisNumber")) vehicle.setChassisNumber(vehicleData.get("chassisNumber") != null ? vehicleData.get("chassisNumber").toString() : null);
            if (vehicleData.containsKey("renavan")) vehicle.setRenavan(vehicleData.get("renavan") != null ? vehicleData.get("renavan").toString() : null);

            // ===== Financiamento =====
            if (vehicleData.containsKey("financingStatus")) {
                try {
                    vehicle.setFinancingStatus(vehicleData.get("financingStatus") != null ? Vehicle.FinancingStatus.valueOf(vehicleData.get("financingStatus").toString().toUpperCase()) : null);
                } catch (IllegalArgumentException e) { /* ignore */ }
            }
            if (vehicleData.containsKey("financingInstallmentValue")) vehicle.setFinancingInstallmentValue(getDecimalValue(vehicleData.get("financingInstallmentValue")));
            if (vehicleData.containsKey("financingRemainingInstallments")) vehicle.setFinancingRemainingInstallments(getIntValue(vehicleData.get("financingRemainingInstallments")));
            if (vehicleData.containsKey("financingPayoffBalance")) vehicle.setFinancingPayoffBalance(getDecimalValue(vehicleData.get("financingPayoffBalance")));
            if (vehicleData.containsKey("financingBankOrInstitution")) vehicle.setFinancingBankOrInstitution(vehicleData.get("financingBankOrInstitution") != null ? vehicleData.get("financingBankOrInstitution").toString() : null);
            if (vehicleData.containsKey("financingContractNumber")) vehicle.setFinancingContractNumber(vehicleData.get("financingContractNumber") != null ? vehicleData.get("financingContractNumber").toString() : null);
            if (vehicleData.containsKey("financingStartDate")) vehicle.setFinancingStartDate(getDateValue(vehicleData.get("financingStartDate")));
            if (vehicleData.containsKey("financingEndDate")) vehicle.setFinancingEndDate(getDateValue(vehicleData.get("financingEndDate")));

            // ===== Valor de mercado =====
            if (vehicleData.containsKey("marketValue")) vehicle.setMarketValue(getDecimalValue(vehicleData.get("marketValue")));

            // ===== Seguros =====
            if (vehicleData.containsKey("insurancePolicyNumber")) vehicle.setInsurancePolicyNumber(vehicleData.get("insurancePolicyNumber") != null ? vehicleData.get("insurancePolicyNumber").toString() : null);
            if (vehicleData.containsKey("insuranceCompany")) vehicle.setInsuranceCompany(vehicleData.get("insuranceCompany") != null ? vehicleData.get("insuranceCompany").toString() : null);
            if (vehicleData.containsKey("insurancePremiumValue")) vehicle.setInsurancePremiumValue(getDecimalValue(vehicleData.get("insurancePremiumValue")));
            if (vehicleData.containsKey("insuranceCoverageType")) vehicle.setInsuranceCoverageType(vehicleData.get("insuranceCoverageType") != null ? vehicleData.get("insuranceCoverageType").toString() : null);
            if (vehicleData.containsKey("insuranceSecondPolicyNumber")) vehicle.setInsuranceSecondPolicyNumber(vehicleData.get("insuranceSecondPolicyNumber") != null ? vehicleData.get("insuranceSecondPolicyNumber").toString() : null);
            if (vehicleData.containsKey("insuranceSecondCompany")) vehicle.setInsuranceSecondCompany(vehicleData.get("insuranceSecondCompany") != null ? vehicleData.get("insuranceSecondCompany").toString() : null);
            if (vehicleData.containsKey("insuranceSecondPremiumValue")) vehicle.setInsuranceSecondPremiumValue(getDecimalValue(vehicleData.get("insuranceSecondPremiumValue")));
            if (vehicleData.containsKey("insuranceSecondExpiryDate")) vehicle.setInsuranceSecondExpiryDate(getDateValue(vehicleData.get("insuranceSecondExpiryDate")));

            // ===== Cliente / Alocação =====
            if (vehicleData.containsKey("clientName")) vehicle.setClientName(vehicleData.get("clientName") != null ? vehicleData.get("clientName").toString() : null);
            if (vehicleData.containsKey("clientId")) {
                try {
                    vehicle.setClientId(vehicleData.get("clientId") != null ? UUID.fromString(vehicleData.get("clientId").toString()) : null);
                } catch (IllegalArgumentException e) { /* ignore */ }
            }
            if (vehicleData.containsKey("allocationContractNumber")) vehicle.setAllocationContractNumber(vehicleData.get("allocationContractNumber") != null ? vehicleData.get("allocationContractNumber").toString() : null);
            if (vehicleData.containsKey("allocationStartDate")) vehicle.setAllocationStartDate(getDateValue(vehicleData.get("allocationStartDate")));
            if (vehicleData.containsKey("allocationEndDate")) vehicle.setAllocationEndDate(getDateValue(vehicleData.get("allocationEndDate")));

            // ===== Agregado =====
            if (vehicleData.containsKey("isAggregated")) vehicle.setIsAggregated(getBooleanValue(vehicleData.get("isAggregated")));
            if (vehicleData.containsKey("aggregatedOwnerName")) vehicle.setAggregatedOwnerName(vehicleData.get("aggregatedOwnerName") != null ? vehicleData.get("aggregatedOwnerName").toString() : null);
            if (vehicleData.containsKey("aggregatedOwnerCpfCnpj")) vehicle.setAggregatedOwnerCpfCnpj(vehicleData.get("aggregatedOwnerCpfCnpj") != null ? vehicleData.get("aggregatedOwnerCpfCnpj").toString() : null);
            if (vehicleData.containsKey("aggregatedOwnerPhone")) vehicle.setAggregatedOwnerPhone(vehicleData.get("aggregatedOwnerPhone") != null ? vehicleData.get("aggregatedOwnerPhone").toString() : null);
            if (vehicleData.containsKey("aggregatedOwnerEmail")) vehicle.setAggregatedOwnerEmail(vehicleData.get("aggregatedOwnerEmail") != null ? vehicleData.get("aggregatedOwnerEmail").toString() : null);
            if (vehicleData.containsKey("aggregatedDailyRate")) vehicle.setAggregatedDailyRate(getDecimalValue(vehicleData.get("aggregatedDailyRate")));
            if (vehicleData.containsKey("aggregatedMonthlyRate")) vehicle.setAggregatedMonthlyRate(getDecimalValue(vehicleData.get("aggregatedMonthlyRate")));
            if (vehicleData.containsKey("aggregatedPaymentType")) {
                try {
                    vehicle.setAggregatedPaymentType(vehicleData.get("aggregatedPaymentType") != null ? Vehicle.AggregatedPaymentType.valueOf(vehicleData.get("aggregatedPaymentType").toString().toUpperCase()) : null);
                } catch (IllegalArgumentException e) { /* ignore */ }
            }
            if (vehicleData.containsKey("aggregatedContractStartDate")) vehicle.setAggregatedContractStartDate(getDateValue(vehicleData.get("aggregatedContractStartDate")));
            if (vehicleData.containsKey("aggregatedContractEndDate")) vehicle.setAggregatedContractEndDate(getDateValue(vehicleData.get("aggregatedContractEndDate")));
            if (vehicleData.containsKey("aggregatedNotes")) vehicle.setAggregatedNotes(vehicleData.get("aggregatedNotes") != null ? vehicleData.get("aggregatedNotes").toString() : null);

            // ===== Diferença financeira =====
            if (vehicleData.containsKey("financialDifference")) vehicle.setFinancialDifference(getDecimalValue(vehicleData.get("financialDifference")));

            System.out.println("[DEBUG] FrotaController.updateVehicle() - Dados processados, salvando...");

            Vehicle updatedVehicle = vehicleRepository.save(vehicle);
            System.out.println("[DEBUG] FrotaController.updateVehicle() - VeÃ­culo atualizado com sucesso: "
                    + updatedVehicle.getId());

            try {
                VehicleDTO dto = VehicleDTO.fromEntity(updatedVehicle);
                return ResponseEntity.ok(dto);
            } catch (Exception dtoException) {
                System.err.println(
                        "[DEBUG] FrotaController.updateVehicle() - Erro ao criar DTO: " + dtoException.getMessage());
                dtoException.printStackTrace();
                return ResponseEntity.status(500).body(Map.of(
                        "error", "Erro ao converter veÃ­culo para DTO: " + dtoException.getMessage(),
                        "vehicleId", updatedVehicle.getId().toString()));
            }

        } catch (ResourceNotFoundException e) {
            System.err.println("[DEBUG] FrotaController.updateVehicle() - VeÃ­culo nÃ£o encontrado: " + e.getMessage());
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            System.err.println("[DEBUG] FrotaController.updateVehicle() - Erro de integridade: " + e.getMessage());
            e.printStackTrace();
            String errorMessage = "Erro de integridade";
            if (e.getMessage() != null && e.getMessage().contains("plate")) {
                errorMessage = "Placa jÃ¡ cadastrada";
            } else if (e.getMessage() != null) {
                errorMessage = "Erro de integridade: " + e.getMessage();
            }
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        } catch (jakarta.validation.ConstraintViolationException e) {
            System.err.println("[DEBUG] FrotaController.updateVehicle() - Erro de validaÃ§Ã£o: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Erro de validaÃ§Ã£o: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.updateVehicle() - Erro: " + e.getMessage());
            System.err.println("[DEBUG] FrotaController.updateVehicle() - Tipo: " + e.getClass().getSimpleName());
            System.err.println("[DEBUG] FrotaController.updateVehicle() - Stack trace completo:");
            e.printStackTrace();

            String errorMessage = "Erro ao atualizar veÃ­culo";
            if (e.getMessage() != null) {
                if (e.getMessage().contains("NullPointerException")) {
                    errorMessage = "Erro: algum campo obrigatÃ³rio nÃ£o foi preenchido corretamente";
                } else if (e.getMessage().contains("ConstraintViolation")) {
                    errorMessage = "Erro de validaÃ§Ã£o: verifique os dados informados";
                } else {
                    errorMessage = "Erro ao atualizar veÃ­culo: " + e.getMessage();
                }
            }

            return ResponseEntity.status(500).body(Map.of(
                    "error", errorMessage,
                    "details", e.getClass().getSimpleName() + ": "
                            + (e.getMessage() != null ? e.getMessage() : "Erro desconhecido")));
        }
    }

    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable("id") UUID id) {
        // Soft delete: o veículo mantém o histórico (abastecimentos, manutenções,
        // multas, pneus, OSs) e apenas deixa de aparecer nas listagens.
        try {
            if (!vehicleRepository.existsById(id)) {
                throw new ResourceNotFoundException("VeÃ­culo nÃ£o encontrado com ID: " + id);
            }
            vehicleRepository.softDelete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.deleteVehicle() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Exclusão em massa de veículos (soft delete).
     * Retorna { requested, deleted } para feedback preciso na UI.
     */
    @PostMapping("/vehicles/bulk-delete")
    public ResponseEntity<Map<String, Object>> bulkDeleteVehicles(@RequestBody List<String> ids) {
        try {
            List<UUID> vehicleIds = ids.stream()
                    .map(UUID::fromString)
                    .collect(java.util.stream.Collectors.toList());
            int deleted = vehicleService.deleteVehicles(vehicleIds);
            return ResponseEntity.ok(Map.of(
                    "requested", vehicleIds.size(),
                    "deleted", deleted));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "ID inválido na solicitação de exclusão em massa."));
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.bulkDeleteVehicles() - Erro: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Endpoints de teste
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Endpoint de teste da frota funcionando!");
    }

    @GetMapping("/test-simple")
    public ResponseEntity<Map<String, Object>> testSimple() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Teste simples funcionando");
            response.put("timestamp", LocalDateTime.now());
            response.put("status", "OK");

            // Testar acesso ao repositÃ³rio
            try {
                long count = vehicleRepository.count();
                response.put("vehicleCount", count);
                response.put("database", "OK");
            } catch (Exception e) {
                response.put("database", "ERROR: " + e.getMessage());
                response.put("databaseErrorType", e.getClass().getSimpleName());
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("type", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/test-db")
    public ResponseEntity<String> testDatabase() {
        try {
            long count = vehicleRepository.count();
            return ResponseEntity.ok("ConexÃ£o com banco OK. Total de veÃ­culos: " + count);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erro no banco: " + e.getMessage());
        }
    }

    @GetMapping("/insert-test-data")
    public ResponseEntity<String> insertTestData() {
        try {
            // Verificar se jÃ¡ existem dados
            long existingCount = vehicleRepository.count();
            if (existingCount > 0) {
                return ResponseEntity.ok("Dados de teste jÃ¡ existem. Total de veÃ­culos: " + existingCount);
            }

            // Inserir dados de teste diretamente
            System.out.println("[DEBUG] FrotaController.insertTestData() - Inserindo dados de teste...");

            // Aqui vocÃª pode inserir dados diretamente ou chamar um serviÃ§o
            // Por enquanto, vamos apenas retornar uma mensagem
            return ResponseEntity
                    .ok("Endpoint para inserir dados de teste. Execute a migraÃ§Ã£o V402 ou insira dados manualmente.");

        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.insertTestData() - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erro ao inserir dados: " + e.getMessage());
        }
    }

    @GetMapping("/debug-vehicles")
    public ResponseEntity<String> debugVehicles() {
        try {
            StringBuilder debug = new StringBuilder();
            debug.append("=== DEBUG VEHICLES ===\n");

            // 1. Contar veÃ­culos
            long count = vehicleRepository.count();
            debug.append("1. Total de veÃ­culos no banco: ").append(count).append("\n");

            if (count == 0) {
                debug.append("2. Nenhum veÃ­culo encontrado\n");
                return ResponseEntity.ok(debug.toString());
            }

            // 2. Buscar primeiro veÃ­culo
            List<Vehicle> vehicles = vehicleRepository.findAll();
            debug.append("2. VeÃ­culos encontrados: ").append(vehicles.size()).append("\n");

            if (!vehicles.isEmpty()) {
                Vehicle firstVehicle = vehicles.get(0);
                debug.append("3. Primeiro veÃ­culo:\n");
                debug.append("   - ID: ").append(firstVehicle.getId()).append("\n");
                debug.append("   - Placa: ").append(firstVehicle.getPlate()).append("\n");
                debug.append("   - Modelo: ").append(firstVehicle.getModel()).append("\n");
                debug.append("   - Marca: ").append(firstVehicle.getBrand()).append("\n");
                debug.append("   - Ano: ").append(firstVehicle.getYear()).append("\n");
                debug.append("   - Status: ").append(firstVehicle.getStatus()).append("\n");
                debug.append("   - Tipo CombustÃ­vel: ").append(firstVehicle.getFuelType()).append("\n");
                debug.append("   - Capacidade: ").append(firstVehicle.getCapacity()).append("\n");
                debug.append("   - Quilometragem: ").append(firstVehicle.getCurrentMileage()).append("\n");
                debug.append("   - Criado em: ").append(firstVehicle.getCreatedAt()).append("\n");
                debug.append("   - Atualizado em: ").append(firstVehicle.getUpdatedAt()).append("\n");

                // 3. Tentar converter para DTO
                try {
                    debug.append("4. Tentando converter para DTO...\n");
                    VehicleDTO dto = VehicleDTO.fromEntity(firstVehicle);
                    debug.append("5. ConversÃ£o para DTO: SUCESSO\n");
                    debug.append("   - DTO ID: ").append(dto.getId()).append("\n");
                    debug.append("   - DTO Placa: ").append(dto.getPlate()).append("\n");
                } catch (Exception e) {
                    debug.append("5. ConversÃ£o para DTO: ERRO\n");
                    debug.append("   - Erro: ").append(e.getMessage()).append("\n");
                    debug.append("   - Tipo: ").append(e.getClass().getSimpleName()).append("\n");
                    e.printStackTrace();
                }
            }

            return ResponseEntity.ok(debug.toString());

        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.debugVehicles() - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erro no debug: " + e.getMessage());
        }
    }

    // ===== Helpers para conversao segura de tipos =====
    private Integer getIntValue(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Integer) return (Integer) obj;
        if (obj instanceof Number) return ((Number) obj).intValue();
        if (obj instanceof String) {
            try {
                String str = ((String) obj).trim();
                if (str.isEmpty()) return null;
                return Integer.parseInt(str);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private Boolean getBooleanValue(Object obj) {
        if (obj == null) return false;
        if (obj instanceof Boolean) return (Boolean) obj;
        if (obj instanceof String) {
            String str = ((String) obj).trim().toLowerCase();
            return "true".equals(str) || "1".equals(str) || "sim".equals(str);
        }
        if (obj instanceof Number) return ((Number) obj).intValue() != 0;
        return false;
    }

    // ===== Validação por tipo de veículo =====
    private java.util.List<String> validateVehicleByType(Vehicle vehicle) {
        java.util.List<String> errors = new java.util.ArrayList<>();
        Vehicle.VehicleType type = vehicle.getVehicleType();
        
        if (type == null) return errors;
        
        switch (type) {
            case BUS_ROAD:
            case BUS_LUXURY_TOURISM:
            case BUS_URBAN:
            case MINIBUS:
                if (vehicle.getBusType() == null) {
                    errors.add("Tipo de ônibus é obrigatório para este tipo de veículo");
                }
                if (vehicle.getChassisNumber() == null || vehicle.getChassisNumber().trim().isEmpty()) {
                    errors.add("Chassi é obrigatório para ônibus");
                }
                if (vehicle.getRenavan() == null || vehicle.getRenavan().trim().isEmpty()) {
                    errors.add("RENAVAN é obrigatório para ônibus");
                }
                break;
            case VAN:
            case TRUCK:
            case CAR_UTILITY:
                if (vehicle.getChassisNumber() == null || vehicle.getChassisNumber().trim().isEmpty()) {
                    errors.add("Chassi é obrigatório para este tipo de veículo");
                }
                if (vehicle.getRenavan() == null || vehicle.getRenavan().trim().isEmpty()) {
                    errors.add("RENAVAN é obrigatório para este tipo de veículo");
                }
                break;
            default:
                // CAR, MOTORCYCLE, PICKUP, SUV, OTHER - campos opcionais
                break;
        }
        
        return errors;
    }

    private java.math.BigDecimal getDecimalValue(Object obj) {
        if (obj == null) return null;
        if (obj instanceof java.math.BigDecimal) return (java.math.BigDecimal) obj;
        if (obj instanceof Number) return java.math.BigDecimal.valueOf(((Number) obj).doubleValue());
        if (obj instanceof String) {
            String str = ((String) obj).replace(",", ".").replace("R$", "").trim();
            if (str.isEmpty()) return null;
            try {
                return new java.math.BigDecimal(str);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private java.time.LocalDate getDateValue(Object obj) {
        if (obj == null) return null;
        if (obj instanceof java.time.LocalDate) return (java.time.LocalDate) obj;
        if (obj instanceof String) {
            String str = ((String) obj).trim();
            if (str.isEmpty()) return null;
            try {
                return java.time.LocalDate.parse(str);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}
