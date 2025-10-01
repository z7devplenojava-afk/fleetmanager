package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.KmControlDTO;
import br.com.fleetmanager.model.KmControl;
import br.com.fleetmanager.model.Vehicle;
import br.com.fleetmanager.repository.KmControlRepository;
import br.com.fleetmanager.repository.VehicleRepository;
import br.com.fleetmanager.repository.UserRepository;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class KmControlService {
    
    private final KmControlRepository kmControlRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    
    private static final String UPLOAD_DIR = "uploads/km-controls/dashboard-photos/";
    
    /**
     * Buscar todos os registros de controle de KM
     */
    public List<KmControlDTO> getAllKmControls() {
        try {
            log.info("Buscando todos os registros de controle de KM");
            List<KmControl> kmControls = kmControlRepository.findAll();
            log.info("Encontrados {} registros de KmControl no banco", kmControls.size());
            
            if (kmControls.isEmpty()) {
                log.warn("Nenhum registro de KmControl encontrado no banco de dados");
                return new ArrayList<>();
            }
            
            // Debug do primeiro registro
            if (!kmControls.isEmpty()) {
                KmControl first = kmControls.get(0);
                log.info("Primeiro registro - ID: {}, Supervisor: {}, Data: {}", 
                    first.getId(), first.getSupervisor(), first.getDate());
            }
            
            List<KmControlDTO> dtos = kmControls.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            
            log.info("Conversão concluída com sucesso: {} DTOs criados", dtos.size());
            return dtos;
        } catch (Exception e) {
            log.error("Erro ao buscar registros de controle de KM: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar registros de KM: " + e.getMessage(), e);
        }
    }
    
    /**
     * Buscar registro por ID
     */
    public KmControlDTO getKmControlById(String id) {
        log.info("Buscando registro de controle de KM com ID: {}", id);
        UUID uuid = UUID.fromString(id);
        KmControl kmControl = kmControlRepository.findById(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de controle de KM não encontrado com ID: " + id));
        return convertToDTO(kmControl);
    }
    
    /**
     * Buscar registros com filtros (retorna DTOs)
     */
    public List<KmControlDTO> getKmControlsWithFilters(
            LocalDate startDate, 
            LocalDate endDate, 
            String supervisor, 
            String vehiclePlate) {
        
        log.info("Buscando registros com filtros (DTOs) - Data: {} a {}, Supervisor: {}, Veículo: {}", 
                startDate, endDate, supervisor, vehiclePlate);
        
        List<KmControl> kmControls = filterKmControls(startDate, endDate, supervisor, vehiclePlate);
        
        return kmControls.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Buscar registros com filtros (retorna entidades, para relatórios)
     */
    public List<KmControl> getKmControlsEntitiesWithFilters(
            LocalDate startDate, 
            LocalDate endDate, 
            String supervisor, 
            String vehiclePlate) {
        
        log.info("Buscando registros com filtros (Entidades) - Data: {} a {}, Supervisor: {}, Veículo: {}", 
                startDate, endDate, supervisor, vehiclePlate);
        
        return filterKmControls(startDate, endDate, supervisor, vehiclePlate);
    }

    private List<KmControl> filterKmControls(
            LocalDate startDate, 
            LocalDate endDate, 
            String supervisor, 
            String vehiclePlate) {
        List<KmControl> kmControls;
        
        if (startDate != null && endDate != null && supervisor != null && !supervisor.equals("all") && 
            vehiclePlate != null && !vehiclePlate.equals("all")) {
            // Todos os filtros
            kmControls = kmControlRepository.findBySupervisorAndVehiclePlateAndDateBetweenOrderByDateDesc(
                    supervisor, vehiclePlate, startDate, endDate);
        } else if (startDate != null && endDate != null && supervisor != null && !supervisor.equals("all")) {
            // Data e supervisor
            kmControls = kmControlRepository.findBySupervisorAndDateBetweenOrderByDateDesc(supervisor, startDate, endDate);
        } else if (startDate != null && endDate != null && vehiclePlate != null && !vehiclePlate.equals("all")) {
            // Data e veículo
            kmControls = kmControlRepository.findByVehiclePlateAndDateBetweenOrderByDateDesc(vehiclePlate, startDate, endDate);
        } else if (startDate != null && endDate != null) {
            // Apenas data
            kmControls = kmControlRepository.findByDateBetweenOrderByDateDesc(startDate, endDate);
        } else if (supervisor != null && !supervisor.equals("all")) {
            // Apenas supervisor
            kmControls = kmControlRepository.findBySupervisorOrderByDateDesc(supervisor);
        } else if (vehiclePlate != null && !vehiclePlate.equals("all")) {
            // Apenas veículo
            kmControls = kmControlRepository.findByVehiclePlateOrderByDateDesc(vehiclePlate);
        } else {
            // Sem filtros
            kmControls = kmControlRepository.findAll();
        }
        return kmControls;
    }
    
    /**
     * Criar novo registro
     */
    @Transactional
    public KmControlDTO createKmControl(KmControlDTO kmControlDTO) {
        log.info("Criando novo registro de controle de KM para supervisor: {}", kmControlDTO.getSupervisor());
        log.info("Dados recebidos - KM Inicial: {}, KM Final: {}, Justificativa Inicial: {}, Justificativa Final: {}", 
                kmControlDTO.getInitialKm(), kmControlDTO.getFinalKm(), 
                kmControlDTO.getInitialKmJustification(), kmControlDTO.getFinalKmJustification());
        
        // Validar KM - permitir 0 quando há justificativa
        if (kmControlDTO.getInitialKm() != null && kmControlDTO.getFinalKm() != null) {
            log.info("Validando KM - Inicial: {}, Final: {}", kmControlDTO.getInitialKm(), kmControlDTO.getFinalKm());
            if (kmControlDTO.getInitialKm() >= kmControlDTO.getFinalKm() && kmControlDTO.getFinalKm() > 0) {
                log.error("Validação falhou: KM inicial ({}) >= KM final ({})", kmControlDTO.getInitialKm(), kmControlDTO.getFinalKm());
                throw new IllegalArgumentException("KM inicial deve ser menor que KM final");
            }
            log.info("Validação de KM passou");
        }
        
        // Validar horários
        if (kmControlDTO.getShiftStart() != null && kmControlDTO.getShiftEnd() != null) {
            // Adicionar lógica para turnos que atravessam a meia-noite (no backend a validação é um pouco diferente do frontend)
            if (kmControlDTO.getShiftEnd().isBefore(kmControlDTO.getShiftStart())) {
                // Se o fim do turno é antes do início, assume que é no dia seguinte.
                // Para validação de duração, isso é suficiente, pois a duração deve ser positiva.
                // Ex: 18:00 (dia 1) a 06:00 (dia 2) -> 06:00 é logicamente depois de 18:00
            } else if (kmControlDTO.getShiftEnd().equals(kmControlDTO.getShiftStart())) {
                throw new IllegalArgumentException("Fim do turno não pode ser igual ao início do turno");
            }
        }
        
        // Verificar se veículo existe
        if (kmControlDTO.getVehicleId() != null && !kmControlDTO.getVehicleId().isEmpty()) {
            try {
                java.util.UUID vehicleUUID = java.util.UUID.fromString(kmControlDTO.getVehicleId());
                Vehicle vehicle = vehicleRepository.findById(vehicleUUID)
   .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + kmControlDTO.getVehicleId()));
                kmControlDTO.setVehiclePlate(vehicle.getPlate());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("ID do veículo inválido: " + kmControlDTO.getVehicleId());
            }
        }
        
        // Verificar se já existe registro para o veículo na data
        if (kmControlDTO.getVehiclePlate() != null && kmControlDTO.getDate() != null) {
            if (kmControlRepository.existsByVehiclePlateAndDate(kmControlDTO.getVehiclePlate(), kmControlDTO.getDate())) {
                log.warn("Já existe registro para veículo {} na data {}", kmControlDTO.getVehiclePlate(), kmControlDTO.getDate());
            }
        }
        
        KmControl kmControl = convertToEntity(kmControlDTO);
        kmControl = kmControlRepository.save(kmControl);
        
        log.info("Registro de controle de KM criado com ID: {}", kmControl.getId());
        return convertToDTO(kmControl);
    }
    
    /**
     * Atualizar registro existente
     */
    @Transactional
    public KmControlDTO updateKmControl(String id, KmControlDTO kmControlDTO) {
        log.info("Atualizando registro de controle de KM com ID: {}", id);
        
        UUID uuid = UUID.fromString(id);
        KmControl existingKmControl = kmControlRepository.findById(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de controle de KM não encontrado com ID: " + id));
        
        // Validar KM - permitir 0 quando há justificativa
        if (kmControlDTO.getInitialKm() != null && kmControlDTO.getFinalKm() != null) {
            if (kmControlDTO.getInitialKm() >= kmControlDTO.getFinalKm() && kmControlDTO.getFinalKm() > 0) {
                throw new IllegalArgumentException("KM inicial deve ser menor que KM final");
            }
        }
        
        // Validar horários
        if (kmControlDTO.getShiftStart() != null && kmControlDTO.getShiftEnd() != null) {
            // Adicionar lógica para turnos que atravessam a meia-noite (no backend a validação é um pouco diferente do frontend)
            if (kmControlDTO.getShiftEnd().isBefore(kmControlDTO.getShiftStart())) {
                // Se o fim do turno é antes do início, assume que é no dia seguinte.
                // Para validação de duração, isso é suficiente, pois a duração deve ser positiva.
            } else if (kmControlDTO.getShiftEnd().equals(kmControlDTO.getShiftStart())) {
                throw new IllegalArgumentException("Fim do turno não pode ser igual ao início do turno");
            }
        }
        
        // Atualizar campos
        existingKmControl.setDate(kmControlDTO.getDate());
        existingKmControl.setSupervisor(kmControlDTO.getSupervisor());
        existingKmControl.setFuelType(kmControlDTO.getFuelType());
        existingKmControl.setInitialKm(kmControlDTO.getInitialKm());
        existingKmControl.setFinalKm(kmControlDTO.getFinalKm());
        existingKmControl.setValue(kmControlDTO.getValue());
        existingKmControl.setShiftStart(kmControlDTO.getShiftStart());
        existingKmControl.setShiftEnd(kmControlDTO.getShiftEnd());
        existingKmControl.setWorkPost(kmControlDTO.getWorkPost());
        existingKmControl.setProblemDescription(kmControlDTO.getProblemDescription());
        existingKmControl.setWorkPostPerformance(kmControlDTO.getWorkPostPerformance());
        existingKmControl.setObservations(kmControlDTO.getObservations());
        existingKmControl.setInitialKmJustification(kmControlDTO.getInitialKmJustification());
        existingKmControl.setFinalKmJustification(kmControlDTO.getFinalKmJustification());
        existingKmControl.setFuelQuantity(kmControlDTO.getFuelQuantity()); // Adicionado
        
        // Atualizar veículo se necessário
        if (kmControlDTO.getVehicleId() != null && !kmControlDTO.getVehicleId().isEmpty()) {
            try {
                java.util.UUID vehicleUUID = java.util.UUID.fromString(kmControlDTO.getVehicleId());
                Vehicle vehicle = vehicleRepository.findById(vehicleUUID)
                        .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + kmControlDTO.getVehicleId()));
                existingKmControl.setVehicle(vehicle);
                existingKmControl.setVehiclePlate(vehicle.getPlate());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("ID do veículo inválido: " + kmControlDTO.getVehicleId());
            }
        }
        
        existingKmControl = kmControlRepository.save(existingKmControl);
        
        log.info("Registro de controle de KM atualizado com ID: {}", existingKmControl.getId());
        return convertToDTO(existingKmControl);
    }
    
    /**
     * Deletar registro
     */
    @Transactional
    public void deleteKmControl(String id) {
        log.info("Deletando registro de controle de KM com ID: {}", id);
        
        UUID uuid = UUID.fromString(id);
        if (!kmControlRepository.existsById(uuid)) {
            throw new ResourceNotFoundException("Registro de controle de KM não encontrado com ID: " + id);
        }
        
        kmControlRepository.deleteById(uuid);
        log.info("Registro de controle de KM deletado com ID: {}", id);
    }
    
    /**
     * Buscar estatísticas
     */
    public Map<String, Object> getStatistics(LocalDate startDate, LocalDate endDate) {
        log.info("Buscando estatísticas para período: {} a {}", startDate, endDate);
        
        Object[] stats = kmControlRepository.getStatisticsByPeriod(startDate, endDate);
        
        Map<String, Object> statistics = Map.of(
                "totalRecords", stats[0] != null ? stats[0] : 0,
                "totalKm", stats[1] != null ? stats[1] : 0,
                "totalValue", stats[2] != null ? stats[2] : 0
        );
        
        log.info("Estatísticas calculadas: {}", statistics);
        return statistics;
    }
    
    /**
     * Buscar registros com observações
     */
    public List<KmControlDTO> getKmControlsWithObservations() {
        log.info("Buscando registros com observações");
        List<KmControl> kmControls = kmControlRepository.findByObservationsIsNotNullOrProblemDescriptionIsNotNullOrderByDateDesc();
        return kmControls.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar todos os supervisores disponíveis
     * Primeiro busca dos registros de KM, depois complementa com funcionários que são supervisores
     */
    public List<String> getAllSupervisors() {
        log.info("Buscando todos os supervisores disponíveis");
        
        Set<String> supervisors = new java.util.HashSet<>();
        
        // 1. Buscar supervisores dos registros de KM existentes
        try {
            List<String> kmSupervisors = kmControlRepository.findDistinctSupervisors();
            supervisors.addAll(kmSupervisors);
            log.info("Supervisores encontrados nos registros de KM: {}", kmSupervisors.size());
        } catch (Exception e) {
            log.warn("Erro ao buscar supervisores dos registros de KM: {}", e.getMessage());
        }
        
        // 2. Buscar funcionários que são supervisores (role SUPERVISOR)
        try {
            List<String> userSupervisors = userRepository.findSupervisors()
                    .stream()
                    .map(user -> user.getName()) // Nome do usuário
                    .filter(name -> name != null && !name.trim().isEmpty())
                    .collect(Collectors.toList());
            
            supervisors.addAll(userSupervisors);
            log.info("Supervisores encontrados na tabela de usuários: {}", userSupervisors.size());
        } catch (Exception e) {
            log.warn("Erro ao buscar supervisores da tabela de usuários: {}", e.getMessage());
        }
        
        // Filtrar, ordenar e retornar
        List<String> allSupervisors = supervisors.stream()
                .filter(s -> s != null && !s.trim().isEmpty())
                .sorted()
                .collect(Collectors.toList());
        
        log.info("Total de supervisores encontrados (combinando fontes): {}", allSupervisors.size());
        return allSupervisors;
    }
    
    /**
     * Upload de foto do painel
     */
    @Transactional
    public KmControlDTO uploadDashboardPhoto(String id, MultipartFile file, String description) {
        log.info("Fazendo upload de foto do painel para registro: {}", id);
        
        // Buscar o registro de controle de KM
        UUID uuid = UUID.fromString(id);
        KmControl kmControl = kmControlRepository.findById(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de controle de KM não encontrado com ID: " + id));
        
        try {
            // Criar diretório se não existir
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("Diretório criado: {}", uploadPath.toAbsolutePath());
            }
            
            // Gerar nome único para o arquivo
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String filename = UUID.randomUUID().toString() + "_" + id + fileExtension;
            Path filePath = uploadPath.resolve(filename);
            
            // Salvar arquivo
            Files.copy(file.getInputStream(), filePath);
            log.info("Arquivo salvo: {}", filePath.toAbsolutePath());
            
            // Construir URL da foto (assumindo que o diretório de upload é servido estaticamente)
            String photoUrl = "/uploads/km-controls/dashboard-photos/" + filename;
            
            // Atualizar registro no banco de dados
            kmControl.setDashboardPhotoUrl(photoUrl);
            kmControl.setDashboardPhotoDescription(description);
            kmControl = kmControlRepository.save(kmControl);
            
            log.info("✅ Foto do painel salva com sucesso para o registro: {}", id);
            return convertToDTO(kmControl);
            
        } catch (IOException e) {
            log.error("❌ Erro ao salvar arquivo de foto: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao salvar foto do painel: " + e.getMessage());
        }
    }
    
    /**
     * Converter entidade para DTO
     */
    private KmControlDTO convertToDTO(KmControl kmControl) {
        try {
            KmControlDTO dto = new KmControlDTO();
            
            // Campos obrigatórios
            dto.setId(kmControl.getId() != null ? kmControl.getId().toString() : null);
            dto.setDate(kmControl.getDate());
            dto.setSupervisor(kmControl.getSupervisor());
            
            // FuelType - verificar se não é null
            if (kmControl.getFuelType() != null) {
                dto.setFuelType(kmControl.getFuelType());
            }
            
            dto.setInitialKm(kmControl.getInitialKm());
            dto.setFinalKm(kmControl.getFinalKm());
            dto.setTotalKm(kmControl.getTotalKm());
            dto.setValue(kmControl.getValue());
            dto.setShiftStart(kmControl.getShiftStart());
            dto.setShiftEnd(kmControl.getShiftEnd());
            dto.setWorkPost(kmControl.getWorkPost());
            
            // Campos opcionais
            dto.setProblemDescription(kmControl.getProblemDescription());
            dto.setWorkPostPerformance(kmControl.getWorkPostPerformance());
            dto.setObservations(kmControl.getObservations());
            dto.setInitialKmJustification(kmControl.getInitialKmJustification());
            dto.setFinalKmJustification(kmControl.getFinalKmJustification());
            
            // Vehicle - verificar se não é null e se tem ID
            try {
                if (kmControl.getVehicle() != null && kmControl.getVehicle().getId() != null) {
                    dto.setVehicleId(kmControl.getVehicle().getId().toString());
                }
            } catch (Exception e) {
                log.warn("Erro ao obter ID do veículo para KmControl {}: {}", kmControl.getId(), e.getMessage());
                dto.setVehicleId(null);
            }
            
            dto.setVehiclePlate(kmControl.getVehiclePlate());
            dto.setDashboardPhotoUrl(kmControl.getDashboardPhotoUrl());
            dto.setDashboardPhotoDescription(kmControl.getDashboardPhotoDescription());
            dto.setFuelQuantity(kmControl.getFuelQuantity());
            
            // Timestamps
            dto.setCreatedAt(kmControl.getCreatedAt());
            dto.setUpdatedAt(kmControl.getUpdatedAt());
            
            return dto;
        } catch (Exception e) {
            log.error("Erro ao converter KmControl para DTO: {}", e.getMessage(), e);
            throw new RuntimeException("Erro na conversão de dados: " + e.getMessage(), e);
        }
    }
    
    /**
     * Criar dados de teste para KM Controls
     */
    public List<KmControlDTO> createTestData() {
        log.info("Criando dados de teste para KM Controls");
        
        List<KmControl> testKmControls = List.of(
            createTestKmControl(
                java.time.LocalDate.now().minusDays(1),
                "João Silva",
                "GASOLINA",
                1000, 1200, 200,
                new BigDecimal("150.0"),
                java.time.LocalTime.of(8, 0),
                java.time.LocalTime.of(18, 0),
                "Posto Central",
                "Nenhum problema",
                "EXCELLENT",
                "Trabalho realizado com excelência",
                "ABC-1234",
                "50.0"
            ),
            
            createTestKmControl(
                java.time.LocalDate.now(),
                "Maria Santos",
                "ETANOL",
                1200, 1400, 200,
                new BigDecimal("120.0"),
                java.time.LocalTime.of(7, 0),
                java.time.LocalTime.of(17, 0),
                "Posto Norte",
                "Pequeno problema no motor",
                "GOOD",
                "Motor apresentou pequeno ruído",
                "XYZ-5678",
                "45.0"
            ),
            
            createTestKmControl(
                java.time.LocalDate.now().minusDays(2),
                "Pedro Costa",
                "DIESEL",
                800, 1000, 200,
                new BigDecimal("200.0"),
                java.time.LocalTime.of(6, 0),
                java.time.LocalTime.of(16, 0),
                "Posto Sul",
                "Nenhum problema",
                "EXCELLENT",
                "Veículo em perfeito estado",
                "DEF-9012",
                "60.0"
            )
        );
        
        List<KmControl> savedKmControls = kmControlRepository.saveAll(testKmControls);
        log.info("✅ Dados de teste salvos: {} registros", savedKmControls.size());
        
        return savedKmControls.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Método helper para criar KmControl de teste
     */
    private KmControl createTestKmControl(
            LocalDate date, String supervisor, String fuelType,
            int initialKm, int finalKm, int totalKm,
            BigDecimal value, LocalTime shiftStart, LocalTime shiftEnd,
            String workPost, String problemDescription, String workPostPerformance,
            String observations, String vehiclePlate, String fuelQuantity) {
        
        KmControl kmControl = new KmControl();
        kmControl.setDate(date);
        kmControl.setSupervisor(supervisor);
        kmControl.setFuelType(Vehicle.FuelType.valueOf(fuelType));
        kmControl.setInitialKm(initialKm);
        kmControl.setFinalKm(finalKm);
        kmControl.setTotalKm(totalKm);
        kmControl.setValue(value);
        kmControl.setShiftStart(shiftStart);
        kmControl.setShiftEnd(shiftEnd);
        kmControl.setWorkPost(workPost);
        kmControl.setProblemDescription(problemDescription);
        kmControl.setWorkPostPerformance(workPostPerformance);
        kmControl.setObservations(observations);
        kmControl.setVehiclePlate(vehiclePlate);
        kmControl.setFuelQuantity(fuelQuantity);
        
        return kmControl;
    }
    
    /**
     * Converter DTO para entidade
     */
    private KmControl convertToEntity(KmControlDTO dto) {
        KmControl kmControl = new KmControl();
        kmControl.setDate(dto.getDate());
        kmControl.setSupervisor(dto.getSupervisor());
        kmControl.setFuelType(dto.getFuelType());
        kmControl.setInitialKm(dto.getInitialKm());
        kmControl.setFinalKm(dto.getFinalKm());
        kmControl.setValue(dto.getValue());
        
        // Tratar horários obrigatórios - usar 00:00 se não fornecidos
        if (dto.getShiftStart() != null) {
            kmControl.setShiftStart(dto.getShiftStart());
        } else {
            kmControl.setShiftStart(LocalTime.of(0, 0));
        }
        
        if (dto.getShiftEnd() != null) {
            kmControl.setShiftEnd(dto.getShiftEnd());
        } else {
            kmControl.setShiftEnd(LocalTime.of(0, 0));
        }
        
        kmControl.setWorkPost(dto.getWorkPost());
        kmControl.setProblemDescription(dto.getProblemDescription());
        kmControl.setWorkPostPerformance(dto.getWorkPostPerformance());
        kmControl.setObservations(dto.getObservations());
        kmControl.setInitialKmJustification(dto.getInitialKmJustification());
        kmControl.setFinalKmJustification(dto.getFinalKmJustification());
        kmControl.setVehiclePlate(dto.getVehiclePlate());
        kmControl.setDashboardPhotoUrl(dto.getDashboardPhotoUrl());
        kmControl.setDashboardPhotoDescription(dto.getDashboardPhotoDescription());
        kmControl.setFuelQuantity(dto.getFuelQuantity());
        return kmControl;
    }
}
