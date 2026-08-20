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
        try {
            if (!vehicleRepository.existsById(id)) {
                throw new ResourceNotFoundException("VeÃ­culo nÃ£o encontrado com ID: " + id);
            }
            vehicleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("[DEBUG] FrotaController.deleteVehicle() - Erro: " + e.getMessage());
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
}
