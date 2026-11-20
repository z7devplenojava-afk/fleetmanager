package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CrlvImportResultDTO;
import com.z7design.fleet_manager.dto.CrlvImportResultDTO.CrlvImportItemDTO;
import com.z7design.fleet_manager.dto.CrlvParsedDataDTO;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.Vehicle.FuelType;
import com.z7design.fleet_manager.model.Vehicle.VehicleStatus;
import com.z7design.fleet_manager.model.Vehicle.VehicleType;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleCrlvImportService {

    private final CrlvParserService crlvParserService;
    private final VehicleRepository vehicleRepository;
    private final UserCompanyResolver userCompanyResolver;

    public CrlvParsedDataDTO parseSingleCrlv(MultipartFile file) {
        return crlvParserService.parsePdf(file);
    }

    public CrlvImportResultDTO importCrlvBatch(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Nenhum arquivo enviado para importação.");
        }

        CrlvImportResultDTO result = CrlvImportResultDTO.empty();
        result.setTotalFiles(files.size());

        UUID currentCompanyId = userCompanyResolver.resolveCurrentCompanyId();
        Optional<Company> currentCompany = userCompanyResolver.resolveCurrentCompany();

        log.info("Iniciando importação de CRLV em lote: {} arquivo(s) - Empresa: {}", files.size(), currentCompanyId);

        // 1. Pré-carregar veículos existentes da empresa para matching O(1) por placa limpa e por número de frota
        Map<String, Vehicle> existingMap = new HashMap<>();
        Map<String, Vehicle> existingFleetMap = new HashMap<>();
        try {
            List<Vehicle> allVehicles = currentCompanyId != null
                    ? vehicleRepository.findByCompanyId(currentCompanyId)
                    : vehicleRepository.findAll();
            for (Vehicle v : allVehicles) {
                if (v.getPlate() != null && !v.getPlate().isBlank()) {
                    existingMap.put(cleanPlate(v.getPlate()), v);
                }
                if (v.getFleetNumber() != null && !v.getFleetNumber().isBlank()) {
                    existingFleetMap.put(v.getFleetNumber().trim().toUpperCase(), v);
                }
            }
            log.info("Pré-carregados {} veículos em memória para cruzamento.", existingMap.size());
        } catch (Exception e) {
            log.warn("Falha ao pré-carregar veículos: {}", e.getMessage());
        }

        for (MultipartFile file : files) {
            String fileName = file.getOriginalFilename();
            try {
                if (file.isEmpty()) {
                    result.setSkipped(result.getSkipped() + 1);
                    result.getItems().add(CrlvImportItemDTO.builder()
                            .fileName(fileName)
                            .action("SKIPPED")
                            .message("Arquivo vazio ignorado.")
                            .build());
                    continue;
                }

                CrlvParsedDataDTO parsed = null;
                try {
                    parsed = crlvParserService.parsePdf(file);
                } catch (Exception e) {
                    log.warn("Processamento padrão do PDF {} falhou ({}). Tentando resgate via metadados do nome do arquivo...", fileName, e.getMessage());
                    parsed = crlvParserService.extractFromFilename(fileName);
                }

                if (parsed == null || ((parsed.getPlate() == null || parsed.getPlate().isBlank()) && (parsed.getFleetNumber() == null || parsed.getFleetNumber().isBlank()))) {
                    CrlvParsedDataDTO fallback = crlvParserService.extractFromFilename(fileName);
                    if (fallback != null) {
                        parsed = fallback;
                    }
                }

                String plate = parsed != null ? parsed.getPlate() : null;
                String cleanPlateStr = cleanPlate(plate);
                Vehicle existing = null;

                if (!cleanPlateStr.isEmpty()) {
                    existing = existingMap.get(cleanPlateStr);
                    if (existing == null) {
                        existing = vehicleRepository.findByPlateGlobal(cleanPlateStr).orElse(null);
                        if (existing != null) {
                            existingMap.put(cleanPlateStr, existing);
                        }
                    }
                }

                // Se não localizou por placa, mas possui número de frota no CRLV/nome do arquivo, tenta cruzar pela frota
                if (existing == null && parsed != null && parsed.getFleetNumber() != null && !parsed.getFleetNumber().isBlank()) {
                    existing = existingFleetMap.get(parsed.getFleetNumber().trim().toUpperCase());
                    if (existing != null && cleanPlateStr.isEmpty()) {
                        cleanPlateStr = cleanPlate(existing.getPlate());
                    }
                }

                if (cleanPlateStr.isEmpty() && existing == null) {
                    result.setSkipped(result.getSkipped() + 1);
                    result.getErrors().add("Arquivo " + fileName + ": Não foi possível extrair a placa nem a frota do CRLV.");
                    result.getItems().add(CrlvImportItemDTO.builder()
                            .fileName(fileName)
                            .action("ERROR")
                            .message("Placa não identificada no documento.")
                            .build());
                    continue;
                }

                if (existing != null) {
                    // ============================================================
                    // VEÍCULO EXISTE: Preenche SOMENTE campos vazios / em branco
                    // ============================================================
                    if (existing.getCompanyId() == null && currentCompanyId != null) {
                        existing.setCompanyId(currentCompanyId);
                        if (currentCompany.isPresent()) {
                            existing.setCompany(currentCompany.get());
                        }
                    }
                    List<String> updatedFields = new ArrayList<>();

                    if ((existing.getFleetNumber() == null || existing.getFleetNumber().isBlank()) && parsed.getFleetNumber() != null) {
                        existing.setFleetNumber(parsed.getFleetNumber());
                        updatedFields.add("Frota / Prefixo");
                    }
                    if ((existing.getChassisNumber() == null || existing.getChassisNumber().isBlank()) && parsed.getChassisNumber() != null) {
                        existing.setChassisNumber(parsed.getChassisNumber());
                        updatedFields.add("Chassi");
                    }
                    if ((existing.getRenavan() == null || existing.getRenavan().isBlank()) && parsed.getRenavam() != null) {
                        existing.setRenavan(parsed.getRenavam());
                        updatedFields.add("RENAVAM");
                    }
                    if ((existing.getBrand() == null || existing.getBrand().isBlank() || "Outros".equalsIgnoreCase(existing.getBrand())) && parsed.getBrand() != null) {
                        existing.setBrand(parsed.getBrand());
                        updatedFields.add("Marca");
                    }
                    if ((existing.getModel() == null || existing.getModel().isBlank() || "Não Informado".equalsIgnoreCase(existing.getModel())) && parsed.getModel() != null) {
                        existing.setModel(parsed.getModel());
                        updatedFields.add("Modelo");
                    }
                    if ((existing.getYear() == null || existing.getYear() == 0) && parsed.getManufactureYear() != null) {
                        existing.setYear(parsed.getManufactureYear());
                        updatedFields.add("Ano Fabricação");
                    }
                    if ((existing.getModelYear() == null || existing.getModelYear() == 0) && parsed.getModelYear() != null) {
                        existing.setModelYear(parsed.getModelYear());
                        updatedFields.add("Ano Modelo");
                    }
                    if ((existing.getColor() == null || existing.getColor().isBlank()) && parsed.getColor() != null) {
                        existing.setColor(parsed.getColor());
                        updatedFields.add("Cor");
                    }
                    if (existing.getFuelType() == null && parsed.getFuelType() != null) {
                        existing.setFuelType(parsed.getFuelType());
                        updatedFields.add("Combustível");
                    }
                    if ((existing.getCapacity() == null || existing.getCapacity() == 0) && parsed.getCapacity() != null) {
                        existing.setCapacity(parsed.getCapacity());
                        updatedFields.add("Capacidade");
                    }
                    if ((existing.getPassengerCapacity() == null || existing.getPassengerCapacity() == 0) && parsed.getCapacity() != null) {
                        existing.setPassengerCapacity(parsed.getCapacity());
                        updatedFields.add("Lotação Passageiros");
                    }
                    if ((existing.getEnginePowerHp() == null || existing.getEnginePowerHp() == 0) && parsed.getEnginePowerHp() != null) {
                        existing.setEnginePowerHp(parsed.getEnginePowerHp());
                        updatedFields.add("Potência CV");
                    }
                    if ((existing.getTotalWeightKg() == null || existing.getTotalWeightKg() == 0) && parsed.getTotalWeightKg() != null) {
                        existing.setTotalWeightKg(parsed.getTotalWeightKg());
                        updatedFields.add("Peso Bruto");
                    }
                    if ((existing.getAxleCount() == null || existing.getAxleCount() == 0) && parsed.getAxleCount() != null) {
                        existing.setAxleCount(parsed.getAxleCount());
                        updatedFields.add("Eixos");
                    }
                    if ((existing.getEngineModel() == null || existing.getEngineModel().isBlank()) && parsed.getEngineNumber() != null) {
                        existing.setEngineModel(parsed.getEngineNumber());
                        updatedFields.add("Número do Motor");
                    }
                    if (existing.getBusType() == null && parsed.getBusType() != null) {
                        existing.setBusType(parsed.getBusType());
                        updatedFields.add("Tipo de Ônibus");
                    }

                    if (!updatedFields.isEmpty()) {
                        vehicleRepository.saveAndFlush(existing);
                        result.setUpdated(result.getUpdated() + 1);
                        result.getItems().add(CrlvImportItemDTO.builder()
                                .fileName(fileName)
                                .plate(existing.getPlate())
                                .renavam(existing.getRenavan())
                                .chassisNumber(existing.getChassisNumber())
                                .brand(existing.getBrand())
                                .model(existing.getModel())
                                .year(existing.getYear())
                                .action("UPDATED")
                                .updatedFields(updatedFields)
                                .message("Veículo atualizado. Campos preenchidos: " + String.join(", ", updatedFields))
                                .build());
                    } else {
                        result.setSkipped(result.getSkipped() + 1);
                        result.getItems().add(CrlvImportItemDTO.builder()
                                .fileName(fileName)
                                .plate(existing.getPlate())
                                .renavam(existing.getRenavan())
                                .chassisNumber(existing.getChassisNumber())
                                .brand(existing.getBrand())
                                .model(existing.getModel())
                                .year(existing.getYear())
                                .action("SKIPPED")
                                .message("Todos os campos do CRLV já estavam preenchidos neste veículo.")
                                .build());
                    }

                } else {
                    // ============================================================
                    // VEÍCULO NÃO EXISTE: Cria diretamente conforme solicitado
                    // ============================================================
                    Optional<Vehicle> globalExisting = vehicleRepository.findByPlateGlobal(cleanPlateStr);
                    if (globalExisting.isPresent()) {
                        Vehicle recovered = globalExisting.get();
                        existingMap.put(cleanPlateStr, recovered);
                        if (recovered.getCompanyId() == null && currentCompanyId != null) {
                            recovered.setCompanyId(currentCompanyId);
                            if (currentCompany.isPresent()) {
                                recovered.setCompany(currentCompany.get());
                            }
                        }
                        if (parsed.getFleetNumber() != null && (recovered.getFleetNumber() == null || recovered.getFleetNumber().isBlank())) {
                            recovered.setFleetNumber(parsed.getFleetNumber().trim());
                        }
                        if (parsed.getChassisNumber() != null && (recovered.getChassisNumber() == null || recovered.getChassisNumber().isBlank())) {
                            recovered.setChassisNumber(parsed.getChassisNumber().trim());
                        }
                        if (parsed.getRenavam() != null && (recovered.getRenavan() == null || recovered.getRenavan().isBlank())) {
                            recovered.setRenavan(parsed.getRenavam().trim());
                        }
                        vehicleRepository.saveAndFlush(recovered);
                        result.setUpdated(result.getUpdated() + 1);
                        result.getItems().add(CrlvImportItemDTO.builder()
                                .fileName(fileName)
                                .plate(recovered.getPlate())
                                .renavam(recovered.getRenavan())
                                .chassisNumber(recovered.getChassisNumber())
                                .brand(recovered.getBrand())
                                .model(recovered.getModel())
                                .year(recovered.getYear())
                                .action("UPDATED")
                                .message("Veículo localizado na base e atualizado com dados do CRLV.")
                                .build());
                    } else {
                        Vehicle newVehicle = new Vehicle();
                        newVehicle.setPlate(cleanPlateStr);
                        newVehicle.setBrand(parsed.getBrand() != null ? parsed.getBrand() : "Outros");
                        newVehicle.setModel(parsed.getModel() != null ? parsed.getModel() : "Não Informado");
                        newVehicle.setYear(parsed.getManufactureYear() != null ? parsed.getManufactureYear()
                                : (parsed.getModelYear() != null ? parsed.getModelYear() : 2024));
                        newVehicle.setModelYear(parsed.getModelYear());
                        newVehicle.setColor(parsed.getColor() != null ? parsed.getColor() : "Branco");
                        newVehicle.setFuelType(parsed.getFuelType() != null ? parsed.getFuelType() : FuelType.DIESEL);
                        newVehicle.setCapacity(parsed.getCapacity() != null ? parsed.getCapacity() : 40);
                        newVehicle.setCurrentMileage(0);
                        newVehicle.setStatus(VehicleStatus.ACTIVE);
                        newVehicle.setVehicleType(parsed.getVehicleType() != null ? parsed.getVehicleType() : VehicleType.BUS_ROAD);
                        newVehicle.setChassisNumber(parsed.getChassisNumber());
                        newVehicle.setRenavan(parsed.getRenavam());
                        newVehicle.setBusType(parsed.getBusType());
                        newVehicle.setPassengerCapacity(parsed.getCapacity());
                        newVehicle.setEnginePowerHp(parsed.getEnginePowerHp());
                        newVehicle.setTotalWeightKg(parsed.getTotalWeightKg());
                        newVehicle.setAxleCount(parsed.getAxleCount());
                        newVehicle.setEngineModel(parsed.getEngineNumber());
                        if (parsed.getFleetNumber() != null && !parsed.getFleetNumber().isBlank()) {
                            newVehicle.setFleetNumber(parsed.getFleetNumber().trim());
                        }

                        if (currentCompany.isPresent()) {
                            newVehicle.setCompany(currentCompany.get());
                        } else if (currentCompanyId != null) {
                            newVehicle.setCompanyId(currentCompanyId);
                        }

                        Vehicle saved = vehicleRepository.saveAndFlush(newVehicle);
                        existingMap.put(cleanPlateStr, saved); // Adiciona ao cache local
                        if (saved.getFleetNumber() != null && !saved.getFleetNumber().isBlank()) {
                            existingFleetMap.put(saved.getFleetNumber().trim().toUpperCase(), saved);
                        }

                        result.setInserted(result.getInserted() + 1);
                        result.getItems().add(CrlvImportItemDTO.builder()
                                .fileName(fileName)
                                .plate(saved.getPlate())
                                .renavam(saved.getRenavan())
                                .chassisNumber(saved.getChassisNumber())
                                .brand(saved.getBrand())
                                .model(saved.getModel())
                                .year(saved.getYear())
                                .action("CREATED")
                                .message("Novo veículo cadastrado automaticamente via CRLV.")
                                .build());
                    }
                }

            } catch (Exception e) {
                log.error("Erro ao processar CRLV {}: {}", fileName, e.getMessage(), e);
                result.setSkipped(result.getSkipped() + 1);
                result.getErrors().add("Erro no arquivo " + fileName + ": " + e.getMessage());
                result.getItems().add(CrlvImportItemDTO.builder()
                        .fileName(fileName)
                        .action("ERROR")
                        .message("Falha no processamento: " + e.getMessage())
                        .build());
            }
        }

        log.info("Importação de CRLV finalizada: Inseridos={}, Atualizados={}, Ignorados={}",
                result.getInserted(), result.getUpdated(), result.getSkipped());
        return result;
    }

    private String cleanPlate(String rawPlate) {
        if (rawPlate == null) return "";
        return rawPlate.replaceAll("[^A-Za-z0-9]", "").toUpperCase().trim();
    }
}
