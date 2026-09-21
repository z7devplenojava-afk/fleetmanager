package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateFuelRecordDTO;
import com.z7design.fleet_manager.dto.DriverFuelConsumptionStatsDTO;
import com.z7design.fleet_manager.dto.FuelRecordDTO;
import com.z7design.fleet_manager.dto.DriverDTO;
import com.z7design.fleet_manager.dto.VehicleFuelStatsDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.model.FuelRecord;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.FuelRecordRepository;
import com.z7design.fleet_manager.repository.FuelStationRepository;
import com.z7design.fleet_manager.model.FuelStation;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.service.DriverFuelConsumptionService;
import com.z7design.fleet_manager.service.FileStorageService;
import com.z7design.fleet_manager.service.FuelRecordReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.SupplierRepository;

@RestController
@RequestMapping("/api/fuel-records")
@RequiredArgsConstructor
@Slf4j
public class FuelRecordController {

    private final FuelRecordRepository fuelRecordRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverFuelConsumptionService driverFuelConsumptionService;
    private final DriverRepository driverRepository;
    private final FuelRecordReportService fuelRecordReportService;
    private final FuelStationRepository fuelStationRepository;
    private final ClientRepository clientRepository;
    private final WorkPostRepository workPostRepository;
    private final ContractRepository contractRepository;
    private final SupplierRepository supplierRepository;

    @Qualifier("receiptStorageService")
    private final FileStorageService receiptStorageService;

    @GetMapping
    public ResponseEntity<List<FuelRecordDTO>> getAllFuelRecords() {
        try {
            log.info("GET /api/fuel-records - Iniciando busca de todos os registros");

            // Primeiro teste com findAll bÃ¡sico
            List<FuelRecord> fuelRecords = fuelRecordRepository.findAll();
            log.info("Registros encontrados com findAll: {}", fuelRecords.size());

            // Se nÃ£o hÃ¡ registros, retorna lista vazia
            if (fuelRecords.isEmpty()) {
                log.info("Nenhum registro encontrado, retornando lista vazia");
                return ResponseEntity.ok(new ArrayList<>());
            }

            List<FuelRecordDTO> fuelRecordDTOs = fuelRecords.stream()
                    .map(fuelRecord -> {
                        try {
                            return FuelRecordDTO.fromEntity(fuelRecord);
                        } catch (Exception e) {
                            log.warn("Ignorando registro {} devido a erro de conversÃ£o: {}", fuelRecord.getId(),
                                    e.getMessage());
                            return null; // pular registro problemÃ¡tico
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());

            log.info("DTOs convertidos com sucesso: {}", fuelRecordDTOs.size());
            return ResponseEntity.ok(fuelRecordDTOs);
        } catch (Exception e) {
            log.error("Erro ao buscar registros de abastecimento: {}", e.getMessage(), e);
            // Evitar 500: retornar lista vazia em caso de falha inesperada
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<FuelRecordDTO> getFuelRecordById(@PathVariable("id") UUID id) {
        FuelRecord fuelRecord = fuelRecordRepository.findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Registro de abastecimento nÃ£o encontrado com ID: " + id));
        return ResponseEntity.ok(FuelRecordDTO.fromEntity(fuelRecord));
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<FuelRecordDTO>> getFuelRecordsByVehicle(@PathVariable("vehicleId") UUID vehicleId) {
        try {
            log.info("ðŸ” Buscando registros de combustÃ­vel para veÃ­culo: {}", vehicleId);

            List<FuelRecord> fuelRecords = fuelRecordRepository.findByVehicleIdWithVehicleAndDriver(vehicleId);
            log.info("ðŸ“Š Encontrados {} registros para o veÃ­culo {}", fuelRecords.size(), vehicleId);

            List<FuelRecordDTO> fuelRecordDTOs = fuelRecords.stream()
                    .map(fuelRecord -> {
                        try {
                            return FuelRecordDTO.fromEntity(fuelRecord);
                        } catch (Exception e) {
                            log.warn("âš ï¸ Erro ao converter registro {} para DTO: {}", fuelRecord.getId(),
                                    e.getMessage());
                            // Retornar DTO bÃ¡sico sem dados problemÃ¡ticos
                            FuelRecordDTO dto = new FuelRecordDTO();
                            dto.setId(fuelRecord.getId());
                            dto.setDate(fuelRecord.getDate());
                            dto.setFuelType(fuelRecord.getFuelType());
                            dto.setQuantity(fuelRecord.getQuantity());
                            dto.setCost(fuelRecord.getCost());
                            dto.setMileage(fuelRecord.getMileage());
                            dto.setStation(fuelRecord.getStation());
                            dto.setNotes(fuelRecord.getNotes());
                            dto.setReceiptUrl(fuelRecord.getReceiptUrl());
                            dto.setCostCenter(fuelRecord.getCostCenter());

                            // Tentar definir dados do veÃ­culo de forma segura
                            if (fuelRecord.getVehicle() != null) {
                                try {
                                    dto.setVehicleId(fuelRecord.getVehicle().getId());
                                    dto.setVehiclePlate(fuelRecord.getVehicle().getPlate());
                                } catch (Exception ve) {
                                    log.warn("âš ï¸ Erro ao acessar dados do veÃ­culo: {}", ve.getMessage());
                                }
                            }

                            // Tentar definir dados do motorista de forma segura
                            if (fuelRecord.getDriver() != null) {
                                try {
                                    dto.setDriver(DriverDTO.fromEntity(fuelRecord.getDriver()));
                                } catch (Exception de) {
                                    log.warn("âš ï¸ Erro ao converter motorista: {}", de.getMessage());
                                    // Continuar sem o motorista
                                }
                            }

                            return dto;
                        }
                    })
                    .collect(Collectors.toList());

            log.info("âœ… Convertidos {} DTOs com sucesso", fuelRecordDTOs.size());
            return ResponseEntity.ok(fuelRecordDTOs);

        } catch (Exception e) {
            log.error("âŒ Erro ao buscar registros de combustÃ­vel para veÃ­culo {}: {}", vehicleId, e.getMessage(),
                    e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/vehicle/{vehicleId}/period")
    public ResponseEntity<List<FuelRecordDTO>> getFuelRecordsByVehicleAndPeriod(
            @PathVariable("vehicleId") UUID vehicleId,
            @RequestParam(name = "startDate") LocalDate startDate,
            @RequestParam(name = "endDate") LocalDate endDate) {
        List<FuelRecord> fuelRecords = fuelRecordRepository.findByVehicleIdAndDateBetween(vehicleId, startDate,
                endDate);
        List<FuelRecordDTO> fuelRecordDTOs = fuelRecords.stream()
                .map(FuelRecordDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(fuelRecordDTOs);
    }

    /**
     * Buscar estatÃ­sticas de consumo de combustÃ­vel para todos os veÃ­culos
     */
    @GetMapping("/stats/all-vehicles")
    public ResponseEntity<List<VehicleFuelStatsDTO>> getAllVehiclesStats() {
        try {
            log.info("ðŸ” Endpoint /stats/all-vehicles chamado - buscando estatÃ­sticas de todos os veÃ­culos");
            List<VehicleFuelStatsDTO> stats = driverFuelConsumptionService.getAllVehiclesStats();

            log.info("âœ… EstatÃ­sticas encontradas para {} veÃ­culos", stats.size());
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("âŒ Erro ao buscar estatÃ­sticas de todos os veÃ­culos: {}", e.getMessage(), e);
            // Evitar 500 para o frontend
            return ResponseEntity.ok(java.util.List.of());
        }
    }

    /**
     * Buscar postos de combustÃ­vel Ãºnicos
     */
    @GetMapping("/stations")
    public ResponseEntity<List<String>> getUniqueFuelStations() {
        try {
            log.info("ðŸ” Endpoint /stations chamado - buscando postos de combustÃ­vel Ãºnicos");

            // Primeiro tentar buscar da tabela de postos
            try {
                List<String> stationsFromTable = fuelStationRepository.findAll().stream()
                        .map(FuelStation::getName)
                        .filter(name -> name != null && !name.trim().isEmpty())
                        .distinct()
                        .sorted()
                        .collect(Collectors.toList());

                if (!stationsFromTable.isEmpty()) {
                    log.info("âœ… Encontrados {} postos na tabela fuel_stations", stationsFromTable.size());
                    return ResponseEntity.ok(stationsFromTable);
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao buscar da tabela fuel_stations: {}", e.getMessage());
            }

            // Fallback: buscar dos registros de combustÃ­vel
            List<String> stations = fuelRecordRepository.findAll().stream()
                    .map(FuelRecord::getStation)
                    .filter(station -> station != null && !station.trim().isEmpty())
                    .distinct()
                    .sorted()
                    .collect(Collectors.toList());

            log.info("âœ… Encontrados {} postos de combustÃ­vel Ãºnicos (fallback)", stations.size());
            return ResponseEntity.ok(stations);

        } catch (Exception e) {
            log.error("âŒ Erro ao buscar postos de combustÃ­vel: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats/top-consumers")
    public ResponseEntity<List<Object[]>> getTopVehiclesByFuelConsumption() {
        List<Object[]> topConsumers = fuelRecordRepository.getTopVehiclesByFuelConsumption();
        return ResponseEntity.ok(topConsumers);
    }

    @GetMapping("/stats/vehicle/{vehicleId}/by-fuel-type")
    public ResponseEntity<List<Object[]>> getFuelConsumptionByType(@PathVariable("vehicleId") UUID vehicleId) {
        List<Object[]> consumptionByType = fuelRecordRepository.getFuelConsumptionByType(vehicleId);
        return ResponseEntity.ok(consumptionByType);
    }

    @PostMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        try {
            log.info("Teste de endpoint funcionando");
            return ResponseEntity.ok("Endpoint funcionando corretamente");
        } catch (Exception e) {
            log.error("Erro no teste: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }

    @GetMapping("/test-simple")
    public ResponseEntity<String> testSimpleGet() {
        try {
            log.info("GET /api/fuel-records/test-simple - Teste simples");

            // Teste apenas a consulta sem conversÃ£o
            List<FuelRecord> fuelRecords = fuelRecordRepository.findAllWithVehicleAndDriver();
            log.info("Registros encontrados: {}", fuelRecords.size());

            if (!fuelRecords.isEmpty()) {
                FuelRecord firstRecord = fuelRecords.get(0);
                log.info("Primeiro registro - ID: {}, Vehicle: {}, Driver: {}",
                        firstRecord.getId(),
                        firstRecord.getVehicle() != null ? firstRecord.getVehicle().getId() : "null",
                        firstRecord.getDriver() != null ? firstRecord.getDriver().getId() : "null");
            }

            return ResponseEntity.ok("Consulta funcionando - " + fuelRecords.size() + " registros encontrados");
        } catch (Exception e) {
            log.error("Erro no teste simples: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }

    @GetMapping("/test-count")
    public ResponseEntity<String> testCount() {
        try {
            log.info("GET /api/fuel-records/test-count - Teste de contagem");

            // Teste apenas a contagem bÃ¡sica
            long count = fuelRecordRepository.count();
            log.info("Total de registros: {}", count);

            return ResponseEntity.ok("Total de registros: " + count);
        } catch (Exception e) {
            log.error("Erro no teste de contagem: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<FuelRecordDTO> createFuelRecord(
            @RequestPart("fuelRecord") @Valid CreateFuelRecordDTO createFuelRecordDTO,
            @RequestPart(name = "receipt", required = false) MultipartFile receipt) throws IOException {
        try {
            log.info("POST /api/fuel-records - Iniciando criaÃ§Ã£o de registro");
            log.info("Dados recebidos: {}", createFuelRecordDTO);

            Vehicle vehicle = vehicleRepository.findById(createFuelRecordDTO.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "VeÃ­culo nÃ£o encontrado com ID: " + createFuelRecordDTO.getVehicleId()));
            log.info("VeÃ­culo encontrado: {}", vehicle.getId());

            Driver driver = null;
            if (createFuelRecordDTO.getDriverId() != null) {
                driver = driverRepository.findById(createFuelRecordDTO.getDriverId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Motorista nÃ£o encontrado com ID: " + createFuelRecordDTO.getDriverId()));
                log.info("Motorista encontrado: {}", driver.getId());
            }

            FuelRecord fuelRecord = new FuelRecord();
            if (receipt != null && !receipt.isEmpty()) {
                log.info("Processando arquivo de recibo...");
                String receiptPath = receiptStorageService.storeFile(receipt);
                fuelRecord.setReceiptUrl(receiptPath);
                log.info("Recibo salvo em: {}", receiptPath);
            }

            fuelRecord.setVehicle(vehicle);
            fuelRecord.setDate(createFuelRecordDTO.getDate());
            fuelRecord.setFuelType(createFuelRecordDTO.getFuelType());
            fuelRecord.setQuantity(BigDecimal.valueOf(createFuelRecordDTO.getQuantity()));
            fuelRecord.setCost(createFuelRecordDTO.getCost() != null ? BigDecimal.valueOf(createFuelRecordDTO.getCost()) : BigDecimal.ZERO);
            fuelRecord.setMileage(createFuelRecordDTO.getMileage());
            fuelRecord.setInitialMileage(createFuelRecordDTO.getInitialMileage());
            fuelRecord.setFinalMileage(createFuelRecordDTO.getFinalMileage());
            fuelRecord.setStation(createFuelRecordDTO.getStation());
            fuelRecord.setDriver(driver);
            fuelRecord.setNotes(createFuelRecordDTO.getNotes());
            fuelRecord.setCostCenter(createFuelRecordDTO.getCostCenter());

            if (createFuelRecordDTO.getPricePerLiter() != null) {
                fuelRecord.setPricePerLiter(BigDecimal.valueOf(createFuelRecordDTO.getPricePerLiter()));
            }
            fuelRecord.setClientName(createFuelRecordDTO.getClientName());
            fuelRecord.setObraName(createFuelRecordDTO.getObraName());
            fuelRecord.setContractNumber(createFuelRecordDTO.getContractNumber());

            if (createFuelRecordDTO.getClientId() != null) {
                clientRepository.findById(createFuelRecordDTO.getClientId()).ifPresent(fuelRecord::setClient);
            }
            if (createFuelRecordDTO.getWorkPostId() != null) {
                workPostRepository.findById(createFuelRecordDTO.getWorkPostId()).ifPresent(fuelRecord::setWorkPost);
            }
            if (createFuelRecordDTO.getContractId() != null) {
                contractRepository.findById(createFuelRecordDTO.getContractId()).ifPresent(fuelRecord::setContract);
            }
            if (createFuelRecordDTO.getSupplierId() != null) {
                supplierRepository.findById(createFuelRecordDTO.getSupplierId()).ifPresent(fuelRecord::setSupplier);
            }

            // Atualizar KM atual do veículo se o novo KM for maior
            if (createFuelRecordDTO.getMileage() != null && (vehicle.getCurrentMileage() == null || createFuelRecordDTO.getMileage() > vehicle.getCurrentMileage())) {
                vehicle.setCurrentMileage(createFuelRecordDTO.getMileage());
                vehicleRepository.save(vehicle);
            }

            log.info("Salvando registro de combustível...");
            FuelRecord savedFuelRecord = fuelRecordRepository.save(fuelRecord);
            log.info("Registro salvo com sucesso: {}", savedFuelRecord.getId());

            log.info("Convertendo para DTO...");
            try {
                FuelRecordDTO responseDTO = FuelRecordDTO.fromEntity(savedFuelRecord);
                log.info("DTO criado com sucesso");
                return ResponseEntity.ok(responseDTO);
            } catch (Exception dtoException) {
                log.error("Erro ao converter para DTO: {}", dtoException.getMessage(), dtoException);
                throw new RuntimeException("Erro ao converter registro para DTO", dtoException);
            }

        } catch (Exception e) {
            log.error("Erro ao criar registro de combustível: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<FuelRecordDTO> updateFuelRecord(
            @PathVariable("id") UUID id,
            @RequestPart("fuelRecord") @Valid CreateFuelRecordDTO updateFuelRecordDTO,
            @RequestPart(name = "receipt", required = false) MultipartFile receipt) throws IOException {
        try {
            log.info("PUT /api/fuel-records/{} - Iniciando atualização", id);
            log.info("Dados recebidos: {}", updateFuelRecordDTO);

            FuelRecord fuelRecord = fuelRecordRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Registro de abastecimento não encontrado com ID: " + id));

            log.info("Registro encontrado: {}", fuelRecord.getId());

            Vehicle vehicle = vehicleRepository.findById(updateFuelRecordDTO.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Veículo não encontrado com ID: " + updateFuelRecordDTO.getVehicleId()));

            log.info("Veículo encontrado: {}", vehicle.getId());

            fuelRecord.setVehicle(vehicle);
            fuelRecord.setDate(updateFuelRecordDTO.getDate());
            fuelRecord.setFuelType(updateFuelRecordDTO.getFuelType());
            fuelRecord.setQuantity(BigDecimal.valueOf(updateFuelRecordDTO.getQuantity()));
            fuelRecord.setCost(updateFuelRecordDTO.getCost() != null ? BigDecimal.valueOf(updateFuelRecordDTO.getCost()) : BigDecimal.ZERO);
            fuelRecord.setMileage(updateFuelRecordDTO.getMileage());
            fuelRecord.setInitialMileage(updateFuelRecordDTO.getInitialMileage());
            fuelRecord.setFinalMileage(updateFuelRecordDTO.getFinalMileage());
            fuelRecord.setStation(updateFuelRecordDTO.getStation());

            Driver updateDriver = null;
            if (updateFuelRecordDTO.getDriverId() != null) {
                updateDriver = driverRepository.findById(updateFuelRecordDTO.getDriverId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Motorista não encontrado com ID: " + updateFuelRecordDTO.getDriverId()));
                log.info("Motorista encontrado: {}", updateDriver.getId());
            }
            fuelRecord.setDriver(updateDriver);
            fuelRecord.setNotes(updateFuelRecordDTO.getNotes());
            fuelRecord.setCostCenter(updateFuelRecordDTO.getCostCenter());

            if (updateFuelRecordDTO.getPricePerLiter() != null) {
                fuelRecord.setPricePerLiter(BigDecimal.valueOf(updateFuelRecordDTO.getPricePerLiter()));
            }
            fuelRecord.setClientName(updateFuelRecordDTO.getClientName());
            fuelRecord.setObraName(updateFuelRecordDTO.getObraName());
            fuelRecord.setContractNumber(updateFuelRecordDTO.getContractNumber());

            if (updateFuelRecordDTO.getClientId() != null) {
                clientRepository.findById(updateFuelRecordDTO.getClientId()).ifPresent(fuelRecord::setClient);
            } else {
                fuelRecord.setClient(null);
            }
            if (updateFuelRecordDTO.getWorkPostId() != null) {
                workPostRepository.findById(updateFuelRecordDTO.getWorkPostId()).ifPresent(fuelRecord::setWorkPost);
            } else {
                fuelRecord.setWorkPost(null);
            }
            if (updateFuelRecordDTO.getContractId() != null) {
                contractRepository.findById(updateFuelRecordDTO.getContractId()).ifPresent(fuelRecord::setContract);
            } else {
                fuelRecord.setContract(null);
            }
            if (updateFuelRecordDTO.getSupplierId() != null) {
                supplierRepository.findById(updateFuelRecordDTO.getSupplierId()).ifPresent(fuelRecord::setSupplier);
            } else {
                fuelRecord.setSupplier(null);
            }

            if (updateFuelRecordDTO.getMileage() != null && (vehicle.getCurrentMileage() == null || updateFuelRecordDTO.getMileage() > vehicle.getCurrentMileage())) {
                vehicle.setCurrentMileage(updateFuelRecordDTO.getMileage());
                vehicleRepository.save(vehicle);
            }

            // Tratar arquivo de recibo se fornecido
            if (receipt != null && !receipt.isEmpty()) {
                String receiptPath = receiptStorageService.storeFile(receipt);
                fuelRecord.setReceiptUrl(receiptPath);
            }

            log.info("Salvando registro atualizado...");
            FuelRecord updatedFuelRecord = fuelRecordRepository.save(fuelRecord);
            log.info("Registro salvo com sucesso: {}", updatedFuelRecord.getId());

            return ResponseEntity.ok(FuelRecordDTO.fromEntity(updatedFuelRecord));

        } catch (Exception e) {
            log.error("Erro ao atualizar registro de combustÃ­vel: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/last/{vehicleId}")
    public ResponseEntity<FuelRecordDTO> getLastFuelRecord(@PathVariable("vehicleId") UUID vehicleId) {
        return fuelRecordRepository.findTopByVehicleIdOrderByDateDesc(vehicleId)
                .map(fuelRecord -> ResponseEntity.ok(FuelRecordDTO.fromEntity(fuelRecord)))
                .orElse(ResponseEntity.noContent().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFuelRecord(@PathVariable("id") UUID id) {
        if (!fuelRecordRepository.existsById(id)) {
            throw new ResourceNotFoundException("Registro de abastecimento nÃ£o encontrado com ID: " + id);
        }
        fuelRecordRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Excluir mÃºltiplos registros de combustÃ­vel por IDs
     */
    @DeleteMapping("/batch")
    public ResponseEntity<Map<String, Object>> deleteFuelRecordsBatch(@RequestBody List<UUID> ids) {
        try {
            log.info("ðŸ—‘ï¸ Excluindo {} registros de combustÃ­vel em lote", ids.size());

            if (ids == null || ids.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Lista de IDs nÃ£o pode estar vazia"));
            }

            // Verificar se todos os IDs existem
            List<FuelRecord> existingRecords = fuelRecordRepository.findAllById(ids);
            if (existingRecords.size() != ids.size()) {
                log.warn("âš ï¸ Alguns registros nÃ£o foram encontrados. IDs solicitados: {}, IDs encontrados: {}",
                        ids.size(), existingRecords.size());
            }

            // Excluir os registros encontrados
            fuelRecordRepository.deleteAll(existingRecords);

            log.info("âœ… {} registros de combustÃ­vel excluÃ­dos com sucesso", existingRecords.size());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Registros excluÃ­dos com sucesso");
            response.put("deletedCount", existingRecords.size());
            response.put("requestedCount", ids.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("âŒ Erro ao excluir registros em lote: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erro interno ao excluir registros: " + e.getMessage()));
        }
    }

    @GetMapping("/stats/drivers")
    public ResponseEntity<List<DriverDTO>> getAllDrivers() {
        List<DriverDTO> drivers = driverFuelConsumptionService.getAllDrivers();
        return ResponseEntity.ok(drivers);
    }

    @GetMapping("/stats/driver/{driverId}")
    public ResponseEntity<DriverFuelConsumptionStatsDTO> getDriverStats(@PathVariable("driverId") UUID driverId) {
        DriverFuelConsumptionStatsDTO stats = driverFuelConsumptionService.getDriverStats(driverId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/driver/{driverId}/period")
    public ResponseEntity<DriverFuelConsumptionStatsDTO> getDriverStatsByPeriod(
            @PathVariable("driverId") UUID driverId,
            @RequestParam(name = "startDate") LocalDate startDate,
            @RequestParam(name = "endDate") LocalDate endDate) {
        DriverFuelConsumptionStatsDTO stats = driverFuelConsumptionService.getDriverStatsByPeriod(driverId, startDate,
                endDate);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/drivers/top-consumption")
    public ResponseEntity<List<Object[]>> getTopDriversByFuelConsumption() {
        try {
            List<Object[]> topDrivers = driverFuelConsumptionService.getTopDriversByFuelConsumption();
            return ResponseEntity.ok(topDrivers);
        } catch (Exception e) {
            log.error("Erro em /stats/drivers/top-consumption: {}", e.getMessage(), e);
            return ResponseEntity.ok(java.util.List.of());
        }
    }

    @GetMapping("/stats/drivers/top-cost")
    public ResponseEntity<List<Object[]>> getTopDriversByCost() {
        List<Object[]> topDrivers = driverFuelConsumptionService.getTopDriversByCost();
        return ResponseEntity.ok(topDrivers);
    }

    @GetMapping("/stats/drivers/summary")
    public ResponseEntity<List<Object[]>> getFuelStatsByDriver() {
        List<Object[]> stats = driverFuelConsumptionService.getFuelStatsByDriver();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/drivers/by-fuel-type")
    public ResponseEntity<List<Object[]>> getFuelConsumptionByDriverAndType() {
        List<Object[]> consumption = driverFuelConsumptionService.getFuelConsumptionByDriverAndType();
        return ResponseEntity.ok(consumption);
    }

    @GetMapping("/test-permissions")
    public ResponseEntity<Map<String, Object>> testPermissions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> response = new HashMap<>();
        response.put("username", authentication.getName());
        response.put("authorities", authentication.getAuthorities());
        return ResponseEntity.ok(response);
    }

    // Endpoints para geraÃ§Ã£o de relatÃ³rios
    @GetMapping("/report/pdf")
    public ResponseEntity<byte[]> generatePdfReport(
            @RequestParam(name = "startDate", required = false) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) LocalDate endDate,
            @RequestParam(name = "vehicleId", required = false) UUID vehicleId,
            @RequestParam(name = "posto", required = false) String posto,
            @RequestParam(name = "driverId", required = false) UUID driverId,
            @RequestParam(name = "fuelType", required = false) String fuelType) {

        try {
            byte[] pdfBytes = fuelRecordReportService.generatePdfReport(startDate, endDate, vehicleId, posto, driverId,
                    fuelType);

            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=relatorio-abastecimentos.pdf")
                    .body(pdfBytes);

        } catch (UnsupportedOperationException e) {
            return ResponseEntity.status(501)
                    .header("Content-Type", "application/json")
                    .body(("{\"message\":\"" + e.getMessage() + "\"}").getBytes());
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF", e);
            return ResponseEntity.status(500)
                    .header("Content-Type", "application/json")
                    .body(("{\"message\":\"Erro interno ao gerar relatÃ³rio PDF\"}").getBytes());
        }
    }

    @GetMapping("/report/excel")
    public ResponseEntity<byte[]> generateExcelReport(
            @RequestParam(name = "startDate", required = false) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) LocalDate endDate,
            @RequestParam(name = "vehicleId", required = false) UUID vehicleId,
            @RequestParam(name = "posto", required = false) String posto,
            @RequestParam(name = "driverId", required = false) UUID driverId,
            @RequestParam(name = "fuelType", required = false) String fuelType) {

        try {
            byte[] excelBytes = fuelRecordReportService.generateExcelReport(startDate, endDate, vehicleId, posto,
                    driverId, fuelType);

            return ResponseEntity.ok()
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .header("Content-Disposition", "attachment; filename=relatorio-abastecimentos.xlsx")
                    .body(excelBytes);

        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio Excel", e);
            return ResponseEntity.status(500)
                    .header("Content-Type", "application/json")
                    .body(("{\"message\":\"Erro interno ao gerar relatÃ³rio Excel\"}").getBytes());
        }
    }

    @GetMapping("/report/filtered")
    public ResponseEntity<List<FuelRecordDTO>> getFilteredFuelRecordsReport(
            @RequestParam(name = "vehicleId", required = false) String vehicleId,
            @RequestParam(name = "driverId", required = false) String driverId,
            @RequestParam(name = "startDate", required = false) String startDate,
            @RequestParam(name = "endDate", required = false) String endDate) {
        try {
            log.info("GET /api/fuel-records/report/filtered - RelatÃ³rio com filtros");
            log.info("Filtros: vehicleId={}, driverId={}, startDate={}, endDate={}",
                    vehicleId, driverId, startDate, endDate);

            List<FuelRecord> fuelRecords = fuelRecordRepository.findAllWithVehicleAndDriver();

            // Aplicar filtros
            if (vehicleId != null && !vehicleId.isEmpty()) {
                fuelRecords = fuelRecords.stream()
                        .filter(record -> record.getVehicle() != null &&
                                record.getVehicle().getId().toString().equals(vehicleId))
                        .collect(Collectors.toList());
            }

            if (driverId != null && !driverId.isEmpty()) {
                fuelRecords = fuelRecords.stream()
                        .filter(record -> record.getDriver() != null &&
                                record.getDriver().getId().toString().equals(driverId))
                        .collect(Collectors.toList());
            }

            if (startDate != null && !startDate.isEmpty()) {
                LocalDate start = LocalDate.parse(startDate);
                fuelRecords = fuelRecords.stream()
                        .filter(record -> record.getDate().isAfter(start) || record.getDate().isEqual(start))
                        .collect(Collectors.toList());
            }

            if (endDate != null && !endDate.isEmpty()) {
                LocalDate end = LocalDate.parse(endDate);
                fuelRecords = fuelRecords.stream()
                        .filter(record -> record.getDate().isBefore(end) || record.getDate().isEqual(end))
                        .collect(Collectors.toList());
            }

            List<FuelRecordDTO> fuelRecordDTOs = fuelRecords.stream()
                    .map(fuelRecord -> {
                        try {
                            return FuelRecordDTO.fromEntity(fuelRecord);
                        } catch (Exception e) {
                            log.warn("Ignorando registro {} devido a erro de conversÃ£o: {}", fuelRecord.getId(),
                                    e.getMessage());
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());

            log.info("RelatÃ³rio gerado com {} registros", fuelRecordDTOs.size());
            return ResponseEntity.ok(fuelRecordDTOs);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio: {}", e.getMessage(), e);
            throw e;
        }
    }

}
