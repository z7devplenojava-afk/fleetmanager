package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.DriverFuelConsumptionService;
import br.com.fleetmanager.service.FileStorageService;
import br.com.fleetmanager.service.FuelRecordReportService;

import br.com.fleetmanager.dto.CreateFuelRecordDTO;
import br.com.fleetmanager.dto.DriverDTO;
import br.com.fleetmanager.dto.DriverFuelConsumptionStatsDTO;
import br.com.fleetmanager.dto.FuelRecordDTO;
import br.com.fleetmanager.dto.VehicleFuelStatsDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Driver;
import br.com.fleetmanager.model.FuelRecord;
import br.com.fleetmanager.model.FuelStation;
import br.com.fleetmanager.model.Vehicle;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import br.com.fleetmanager.repository.DriverRepository;
import br.com.fleetmanager.repository.FuelRecordRepository;
import br.com.fleetmanager.repository.FuelStationRepository;
import br.com.fleetmanager.repository.VehicleRepository;

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
    
    @Qualifier("receiptStorageService")
    private final FileStorageService receiptStorageService;
    
    @GetMapping
    public ResponseEntity<List<FuelRecordDTO>> getAllFuelRecords() {
        try {
            log.info("GET /api/fuel-records - Iniciando busca de todos os registros");
            
            // Primeiro teste com findAll básico
            List<FuelRecord> fuelRecords = fuelRecordRepository.findAll();
            log.info("Registros encontrados com findAll: {}", fuelRecords.size());
            
            // Se não há registros, retorna lista vazia
            if (fuelRecords.isEmpty()) {
                log.info("Nenhum registro encontrado, retornando lista vazia");
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            List<FuelRecordDTO> fuelRecordDTOs = fuelRecords.stream()
                    .map(fuelRecord -> {
                        try {
                            return FuelRecordDTO.fromEntity(fuelRecord);
                        } catch (Exception e) {
                            log.warn("Ignorando registro {} devido a erro de conversão: {}", fuelRecord.getId(), e.getMessage());
                            return null; // pular registro problemático
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());
            
            log.info("DTOs convertidos com sucesso: {}", fuelRecordDTOs.size());
            return ResponseEntity.ok(fuelRecordDTOs);
        } catch (Exception e) {
            log.error("Erro ao buscar registros de abastecimento: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<FuelRecordDTO> getFuelRecordById(@PathVariable UUID id) {
        FuelRecord fuelRecord = fuelRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de abastecimento não encontrado com ID: " + id));
        return ResponseEntity.ok(FuelRecordDTO.fromEntity(fuelRecord));
    }
    
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<FuelRecordDTO>> getFuelRecordsByVehicle(@PathVariable UUID vehicleId) {
        try {
            log.info("🔍 Buscando registros de combustível para veículo: {}", vehicleId);
            
            List<FuelRecord> fuelRecords = fuelRecordRepository.findByVehicleIdWithVehicleAndDriver(vehicleId);
            log.info("📊 Encontrados {} registros para o veículo {}", fuelRecords.size(), vehicleId);
            
            List<FuelRecordDTO> fuelRecordDTOs = fuelRecords.stream()
                    .map(fuelRecord -> {
                        try {
                            return FuelRecordDTO.fromEntity(fuelRecord);
                        } catch (Exception e) {
                            log.warn("⚠️ Erro ao converter registro {} para DTO: {}", fuelRecord.getId(), e.getMessage());
                            // Retornar DTO básico sem dados problemáticos
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
                            
                            // Tentar definir dados do veículo de forma segura
                            if (fuelRecord.getVehicle() != null) {
                                try {
                                    dto.setVehicleId(fuelRecord.getVehicle().getId());
                                    dto.setVehiclePlate(fuelRecord.getVehicle().getPlate());
                                } catch (Exception ve) {
                                    log.warn("⚠️ Erro ao acessar dados do veículo: {}", ve.getMessage());
                                }
                            }
                            
                            // Tentar definir dados do motorista de forma segura
                            if (fuelRecord.getDriver() != null) {
                                try {
                                    dto.setDriver(DriverDTO.fromEntity(fuelRecord.getDriver()));
                                } catch (Exception de) {
                                    log.warn("⚠️ Erro ao converter motorista: {}", de.getMessage());
                                    // Continuar sem o motorista
                                }
                            }
                            
                            return dto;
                        }
                    })
                    .collect(Collectors.toList());
            
            log.info("✅ Convertidos {} DTOs com sucesso", fuelRecordDTOs.size());
            return ResponseEntity.ok(fuelRecordDTOs);
            
        } catch (Exception e) {
            log.error("❌ Erro ao buscar registros de combustível para veículo {}: {}", vehicleId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/vehicle/{vehicleId}/period")
    public ResponseEntity<List<FuelRecordDTO>> getFuelRecordsByVehicleAndPeriod(
            @PathVariable UUID vehicleId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<FuelRecord> fuelRecords = fuelRecordRepository.findByVehicleIdAndDateBetween(vehicleId, startDate, endDate);
        List<FuelRecordDTO> fuelRecordDTOs = fuelRecords.stream()
                .map(FuelRecordDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(fuelRecordDTOs);
    }
    
    /**
     * Buscar estatísticas de consumo de combustível para todos os veículos
     */
    @GetMapping("/stats/all-vehicles")
    public ResponseEntity<List<VehicleFuelStatsDTO>> getAllVehiclesStats() {
        try {
            log.info("🔍 Endpoint /stats/all-vehicles chamado - buscando estatísticas de todos os veículos");
            List<VehicleFuelStatsDTO> stats = driverFuelConsumptionService.getAllVehiclesStats();
            
            log.info("✅ Estatísticas encontradas para {} veículos", stats.size());
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("❌ Erro ao buscar estatísticas de todos os veículos: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Buscar postos de combustível únicos
     */
    @GetMapping("/stations")
    public ResponseEntity<List<String>> getUniqueFuelStations() {
        try {
            log.info("🔍 Endpoint /stations chamado - buscando postos de combustível únicos");
            
            // Primeiro tentar buscar da tabela de postos
            try {
                List<String> stationsFromTable = fuelStationRepository.findAll().stream()
                        .map(FuelStation::getName)
                        .filter(name -> name != null && !name.trim().isEmpty())
                        .distinct()
                        .sorted()
                        .collect(Collectors.toList());
                
                if (!stationsFromTable.isEmpty()) {
                    log.info("✅ Encontrados {} postos na tabela fuel_stations", stationsFromTable.size());
                    return ResponseEntity.ok(stationsFromTable);
                }
            } catch (Exception e) {
                log.warn("⚠️ Erro ao buscar da tabela fuel_stations: {}", e.getMessage());
            }
            
            // Fallback: buscar dos registros de combustível
            List<String> stations = fuelRecordRepository.findAll().stream()
                    .map(FuelRecord::getStation)
                    .filter(station -> station != null && !station.trim().isEmpty())
                    .distinct()
                    .sorted()
                    .collect(Collectors.toList());
            
            log.info("✅ Encontrados {} postos de combustível únicos (fallback)", stations.size());
            return ResponseEntity.ok(stations);
            
        } catch (Exception e) {
            log.error("❌ Erro ao buscar postos de combustível: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/stats/top-consumers")
    public ResponseEntity<List<Object[]>> getTopVehiclesByFuelConsumption() {
        List<Object[]> topConsumers = fuelRecordRepository.getTopVehiclesByFuelConsumption();
        return ResponseEntity.ok(topConsumers);
    }
    
    @GetMapping("/stats/vehicle/{vehicleId}/by-fuel-type")
    public ResponseEntity<List<Object[]>> getFuelConsumptionByType(@PathVariable UUID vehicleId) {
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
            
            // Teste apenas a consulta sem conversão
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
            
            // Teste apenas a contagem básica
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
            log.info("POST /api/fuel-records - Iniciando criação de registro");
            log.info("Dados recebidos: {}", createFuelRecordDTO);
            
            Vehicle vehicle = vehicleRepository.findById(createFuelRecordDTO.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + createFuelRecordDTO.getVehicleId()));
            log.info("Veículo encontrado: {}", vehicle.getId());
            
            Driver driver = null;
            if (createFuelRecordDTO.getDriverId() != null) {
                driver = driverRepository.findById(createFuelRecordDTO.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Motorista não encontrado com ID: " + createFuelRecordDTO.getDriverId()));
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
            fuelRecord.setCost(BigDecimal.valueOf(createFuelRecordDTO.getCost()));
            fuelRecord.setMileage(createFuelRecordDTO.getMileage());
            fuelRecord.setInitialMileage(createFuelRecordDTO.getInitialMileage());
            fuelRecord.setFinalMileage(createFuelRecordDTO.getFinalMileage());
            fuelRecord.setStation(createFuelRecordDTO.getStation());
            fuelRecord.setDriver(driver);
            fuelRecord.setNotes(createFuelRecordDTO.getNotes());
            fuelRecord.setCostCenter(createFuelRecordDTO.getCostCenter());
            
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
            @PathVariable UUID id, 
            @RequestPart("fuelRecord") @Valid CreateFuelRecordDTO updateFuelRecordDTO,
            @RequestPart(name = "receipt", required = false) MultipartFile receipt) throws IOException {
        try {
            log.info("PUT /api/fuel-records/{} - Iniciando atualização", id);
            log.info("Dados recebidos: {}", updateFuelRecordDTO);
            
            FuelRecord fuelRecord = fuelRecordRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Registro de abastecimento não encontrado com ID: " + id));
            
            log.info("Registro encontrado: {}", fuelRecord.getId());
            
            Vehicle vehicle = vehicleRepository.findById(updateFuelRecordDTO.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + updateFuelRecordDTO.getVehicleId()));
            
            log.info("Veículo encontrado: {}", vehicle.getId());
            
            fuelRecord.setVehicle(vehicle);
            fuelRecord.setDate(updateFuelRecordDTO.getDate());
            fuelRecord.setFuelType(updateFuelRecordDTO.getFuelType());
            fuelRecord.setQuantity(BigDecimal.valueOf(updateFuelRecordDTO.getQuantity()));
            fuelRecord.setCost(BigDecimal.valueOf(updateFuelRecordDTO.getCost()));
            fuelRecord.setMileage(updateFuelRecordDTO.getMileage());
            fuelRecord.setStation(updateFuelRecordDTO.getStation());
            
            Driver updateDriver = null;
            if (updateFuelRecordDTO.getDriverId() != null) {
                updateDriver = driverRepository.findById(updateFuelRecordDTO.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Motorista não encontrado com ID: " + updateFuelRecordDTO.getDriverId()));
                log.info("Motorista encontrado: {}", updateDriver.getId());
            }
            fuelRecord.setDriver(updateDriver);
            fuelRecord.setNotes(updateFuelRecordDTO.getNotes());
            fuelRecord.setCostCenter(updateFuelRecordDTO.getCostCenter());
            
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
            log.error("Erro ao atualizar registro de combustível: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping("/last/{vehicleId}")
    public ResponseEntity<FuelRecordDTO> getLastFuelRecord(@PathVariable UUID vehicleId) {
        return fuelRecordRepository.findTopByVehicleIdOrderByDateDesc(vehicleId)
                .map(fuelRecord -> ResponseEntity.ok(FuelRecordDTO.fromEntity(fuelRecord)))
                .orElse(ResponseEntity.noContent().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFuelRecord(@PathVariable UUID id) {
        if (!fuelRecordRepository.existsById(id)) {
            throw new ResourceNotFoundException("Registro de abastecimento não encontrado com ID: " + id);
        }
        fuelRecordRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Excluir múltiplos registros de combustível por IDs
     */
    @DeleteMapping("/batch")
    public ResponseEntity<Map<String, Object>> deleteFuelRecordsBatch(@RequestBody List<UUID> ids) {
        try {
            log.info("🗑️ Excluindo {} registros de combustível em lote", ids.size());
            
            if (ids == null || ids.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Lista de IDs não pode estar vazia"));
            }
            
            // Verificar se todos os IDs existem
            List<FuelRecord> existingRecords = fuelRecordRepository.findAllById(ids);
            if (existingRecords.size() != ids.size()) {
                log.warn("⚠️ Alguns registros não foram encontrados. IDs solicitados: {}, IDs encontrados: {}", 
                    ids.size(), existingRecords.size());
            }
            
            // Excluir os registros encontrados
            fuelRecordRepository.deleteAll(existingRecords);
            
            log.info("✅ {} registros de combustível excluídos com sucesso", existingRecords.size());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Registros excluídos com sucesso");
            response.put("deletedCount", existingRecords.size());
            response.put("requestedCount", ids.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Erro ao excluir registros em lote: {}", e.getMessage(), e);
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
    public ResponseEntity<DriverFuelConsumptionStatsDTO> getDriverStats(@PathVariable UUID driverId) {
        DriverFuelConsumptionStatsDTO stats = driverFuelConsumptionService.getDriverStats(driverId);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/stats/driver/{driverId}/period")
    public ResponseEntity<DriverFuelConsumptionStatsDTO> getDriverStatsByPeriod(
            @PathVariable UUID driverId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        DriverFuelConsumptionStatsDTO stats = driverFuelConsumptionService.getDriverStatsByPeriod(driverId, startDate, endDate);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/stats/drivers/top-consumption")
    public ResponseEntity<List<Object[]>> getTopDriversByFuelConsumption() {
        List<Object[]> topDrivers = driverFuelConsumptionService.getTopDriversByFuelConsumption();
        return ResponseEntity.ok(topDrivers);
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
    
    // Endpoints para geração de relatórios
    @GetMapping("/report/pdf")
    public ResponseEntity<byte[]> generatePdfReport(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) String posto,
            @RequestParam(required = false) UUID driverId) {
        
        try {
            byte[] pdfBytes = fuelRecordReportService.generatePdfReport(startDate, endDate, vehicleId, posto, driverId);
            
            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=relatorio-abastecimentos.pdf")
                    .body(pdfBytes);
                    
        } catch (UnsupportedOperationException e) {
            return ResponseEntity.status(501)
                    .header("Content-Type", "application/json")
                    .body(("{\"message\":\"" + e.getMessage() + "\"}").getBytes());
        } catch (Exception e) {
            log.error("Erro ao gerar relatório PDF", e);
            return ResponseEntity.status(500)
                    .header("Content-Type", "application/json")
                    .body(("{\"message\":\"Erro interno ao gerar relatório PDF\"}").getBytes());
        }
    }
    
    @GetMapping("/report/excel")
    public ResponseEntity<byte[]> generateExcelReport(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) String posto,
            @RequestParam(required = false) UUID driverId) {
        
        try {
            byte[] excelBytes = fuelRecordReportService.generateExcelReport(startDate, endDate, vehicleId, posto, driverId);
            
            return ResponseEntity.ok()
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .header("Content-Disposition", "attachment; filename=relatorio-abastecimentos.xlsx")
                    .body(excelBytes);
                    
        } catch (Exception e) {
            log.error("Erro ao gerar relatório Excel", e);
            return ResponseEntity.status(500)
                    .header("Content-Type", "application/json")
                    .body(("{\"message\":\"Erro interno ao gerar relatório Excel\"}").getBytes());
        }
    }
    
    @GetMapping("/report/filtered")
    public ResponseEntity<List<FuelRecordDTO>> getFilteredFuelRecordsReport(
            @RequestParam(required = false) String vehicleId,
            @RequestParam(required = false) String driverId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            log.info("GET /api/fuel-records/report/filtered - Relatório com filtros");
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
                            log.warn("Ignorando registro {} devido a erro de conversão: {}", fuelRecord.getId(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());
            
            log.info("Relatório gerado com {} registros", fuelRecordDTOs.size());
            return ResponseEntity.ok(fuelRecordDTOs);
        } catch (Exception e) {
            log.error("Erro ao gerar relatório: {}", e.getMessage(), e);
            throw e;
        }
    }
    
} 