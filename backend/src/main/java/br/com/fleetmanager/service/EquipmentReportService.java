package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.*;
import br.com.fleetmanager.model.*;
import br.com.fleetmanager.model.enums.*;
import br.com.fleetmanager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EquipmentReportService {
    
    private final EquipmentRepository equipmentRepository;
    private final EquipmentMovementRepository movementRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkPostRepository workPostRepository;
    private final EquipmentService equipmentService;
    private final EquipmentMovementService movementService;
    
    public EquipmentReportDTO generateReport(EquipmentReportFiltersDTO filters) {
        log.info("Gerando relatório de equipamentos com filtros: {}", filters.getReportType());
        
        EquipmentReportDTO.EquipmentReportDTOBuilder reportBuilder = EquipmentReportDTO.builder()
                .reportTitle(getReportTitle(filters.getReportType()))
                .reportType(filters.getReportType())
                .generatedAt(LocalDateTime.now())
                .generatedBy("Sistema SecuredGuard")
                .filtersApplied(buildFiltersDescription(filters));
        
        // Aplicar filtros e buscar dados
        List<Equipment> equipments = applyFilters(filters);
        List<EquipmentDTO> equipmentDTOs = equipments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // Calcular estatísticas
        calculateStatistics(reportBuilder, equipments);
        
        // Gerar relatório específico baseado no tipo
        switch (filters.getReportType()) {
            case "equipment_by_employee":
                generateEquipmentByEmployeeReport(reportBuilder, equipments, filters);
                break;
            case "weapon_validity":
                generateWeaponValidityReport(reportBuilder, equipments, filters);
                break;
            case "usage_report":
                generateUsageReport(reportBuilder, equipments, filters);
                break;
            case "expiry_report":
                generateExpiryReport(reportBuilder, equipments, filters);
                break;
            default:
                generateGeneralReport(reportBuilder, equipments, filters);
        }
        
        return reportBuilder.build();
    }
    
    private String getReportTitle(String reportType) {
        switch (reportType) {
            case "equipment_by_employee":
                return "Relatório de Equipamentos por Funcionário";
            case "weapon_validity":
                return "Relatório de Validade de Armas";
            case "usage_report":
                return "Relatório de Uso de Equipamentos";
            case "expiry_report":
                return "Relatório de Vencimento de Equipamentos";
            default:
                return "Relatório Geral de Equipamentos";
        }
    }
    
    private String buildFiltersDescription(EquipmentReportFiltersDTO filters) {
        List<String> appliedFilters = new ArrayList<>();
        
        if (filters.getStatus() != null) {
            appliedFilters.add("Status: " + filters.getStatus().getDescription());
        }
        if (filters.getIsDangerous() != null) {
            appliedFilters.add("Periculosidade: " + (filters.getIsDangerous() ? "Sim" : "Não"));
        }
        if (filters.getIsExpired() != null) {
            appliedFilters.add("Vencidos: " + (filters.getIsExpired() ? "Sim" : "Não"));
        }
        if (filters.getIsExpiringSoon() != null) {
            appliedFilters.add("Vencendo em breve: " + (filters.getIsExpiringSoon() ? "Sim" : "Não"));
        }
        if (filters.getProtectionLevel() != null) {
            appliedFilters.add("Nível de Proteção: " + filters.getProtectionLevel().getDescription());
        }
        if (filters.getUsage() != null) {
            appliedFilters.add("Tipo de Uso: " + filters.getUsage().getDescription());
        }
        if (filters.getSize() != null) {
            appliedFilters.add("Tamanho: " + filters.getSize().getDescription());
        }
        if (filters.getManufacturingDateFrom() != null) {
            appliedFilters.add("Data de Fabricação a partir de: " + filters.getManufacturingDateFrom());
        }
        if (filters.getManufacturingDateTo() != null) {
            appliedFilters.add("Data de Fabricação até: " + filters.getManufacturingDateTo());
        }
        if (filters.getValidityDateFrom() != null) {
            appliedFilters.add("Data de Validade a partir de: " + filters.getValidityDateFrom());
        }
        if (filters.getValidityDateTo() != null) {
            appliedFilters.add("Data de Validade até: " + filters.getValidityDateTo());
        }
        if (filters.getWeaponRegistrationValidityFrom() != null) {
            appliedFilters.add("Validade do Registro de Arma a partir de: " + filters.getWeaponRegistrationValidityFrom());
        }
        if (filters.getWeaponRegistrationValidityTo() != null) {
            appliedFilters.add("Validade do Registro de Arma até: " + filters.getWeaponRegistrationValidityTo());
        }
        if (filters.getSixYearExpiryFrom() != null) {
            appliedFilters.add("Vencimento de 6 anos a partir de: " + filters.getSixYearExpiryFrom());
        }
        if (filters.getSixYearExpiryTo() != null) {
            appliedFilters.add("Vencimento de 6 anos até: " + filters.getSixYearExpiryTo());
        }
        if (filters.getSearchTerm() != null && !filters.getSearchTerm().trim().isEmpty()) {
            appliedFilters.add("Termo de busca: " + filters.getSearchTerm());
        }
        if (filters.getBatch() != null && !filters.getBatch().trim().isEmpty()) {
            appliedFilters.add("Lote: " + filters.getBatch());
        }
        if (filters.getModel() != null && !filters.getModel().trim().isEmpty()) {
            appliedFilters.add("Modelo: " + filters.getModel());
        }
        
        return appliedFilters.isEmpty() ? "Nenhum filtro aplicado" : String.join(", ", appliedFilters);
    }
    
    private List<Equipment> applyFilters(EquipmentReportFiltersDTO filters) {
        List<Equipment> equipments = equipmentRepository.findAll();
        
        // Filtros básicos
        if (filters.getStatus() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getStatus() == filters.getStatus())
                    .collect(Collectors.toList());
        }
        
        if (filters.getProtectionLevel() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getProtectionLevel() == filters.getProtectionLevel())
                    .collect(Collectors.toList());
        }
        
        if (filters.getUsage() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getUsageType() == filters.getUsage())
                    .collect(Collectors.toList());
        }
        
        if (filters.getSize() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getSize() == filters.getSize())
                    .collect(Collectors.toList());
        }
        
        if (filters.getIsDangerous() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getIsDangerous().equals(filters.getIsDangerous()))
                    .collect(Collectors.toList());
        }
        
        // Filtros de vencimento
        if (filters.getIsExpired() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.isExpired() == filters.getIsExpired())
                    .collect(Collectors.toList());
        }
        
        if (filters.getIsExpiringSoon() != null) {
            int daysToExpiry = filters.getDaysToExpiry() != null ? filters.getDaysToExpiry() : 30;
            equipments = equipments.stream()
                    .filter(e -> e.isExpiringSoon(daysToExpiry) == filters.getIsExpiringSoon())
                    .collect(Collectors.toList());
        }
        
        // Filtros de data
        if (filters.getManufacturingDateFrom() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getManufacturingDate().isAfter(filters.getManufacturingDateFrom()) || 
                                e.getManufacturingDate().isEqual(filters.getManufacturingDateFrom()))
                    .collect(Collectors.toList());
        }
        
        if (filters.getManufacturingDateTo() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getManufacturingDate().isBefore(filters.getManufacturingDateTo()) || 
                                e.getManufacturingDate().isEqual(filters.getManufacturingDateTo()))
                    .collect(Collectors.toList());
        }
        
        if (filters.getValidityDateFrom() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getValidityDate() != null && 
                                (e.getValidityDate().isAfter(filters.getValidityDateFrom()) || 
                                 e.getValidityDate().isEqual(filters.getValidityDateFrom())))
                    .collect(Collectors.toList());
        }
        
        if (filters.getValidityDateTo() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getValidityDate() != null && 
                                (e.getValidityDate().isBefore(filters.getValidityDateTo()) || 
                                 e.getValidityDate().isEqual(filters.getValidityDateTo())))
                    .collect(Collectors.toList());
        }
        
        if (filters.getWeaponRegistrationValidityFrom() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getWeaponRegistrationValidity() != null && 
                                (e.getWeaponRegistrationValidity().isAfter(filters.getWeaponRegistrationValidityFrom()) || 
                                 e.getWeaponRegistrationValidity().isEqual(filters.getWeaponRegistrationValidityFrom())))
                    .collect(Collectors.toList());
        }
        
        if (filters.getWeaponRegistrationValidityTo() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getWeaponRegistrationValidity() != null && 
                                (e.getWeaponRegistrationValidity().isBefore(filters.getWeaponRegistrationValidityTo()) || 
                                 e.getWeaponRegistrationValidity().isEqual(filters.getWeaponRegistrationValidityTo())))
                    .collect(Collectors.toList());
        }
        
        if (filters.getSixYearExpiryFrom() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getSixYearExpiry() != null && 
                                (e.getSixYearExpiry().isAfter(filters.getSixYearExpiryFrom()) || 
                                 e.getSixYearExpiry().isEqual(filters.getSixYearExpiryFrom())))
                    .collect(Collectors.toList());
        }
        
        if (filters.getSixYearExpiryTo() != null) {
            equipments = equipments.stream()
                    .filter(e -> e.getSixYearExpiry() != null && 
                                (e.getSixYearExpiry().isBefore(filters.getSixYearExpiryTo()) || 
                                 e.getSixYearExpiry().isEqual(filters.getSixYearExpiryTo())))
                    .collect(Collectors.toList());
        }
        
        // Filtros de texto
        if (filters.getSearchTerm() != null && !filters.getSearchTerm().trim().isEmpty()) {
            String searchTerm = filters.getSearchTerm().toLowerCase();
            equipments = equipments.stream()
                    .filter(e -> (e.getSerialNumber() != null && e.getSerialNumber().toLowerCase().contains(searchTerm)) ||
                                (e.getModel() != null && e.getModel().toLowerCase().contains(searchTerm)) ||
                                (e.getCaNumber() != null && e.getCaNumber().toLowerCase().contains(searchTerm)) ||
                                (e.getBatch() != null && e.getBatch().toLowerCase().contains(searchTerm)))
                    .collect(Collectors.toList());
        }
        
        if (filters.getBatch() != null && !filters.getBatch().trim().isEmpty()) {
            equipments = equipments.stream()
                    .filter(e -> e.getBatch() != null && e.getBatch().toLowerCase().contains(filters.getBatch().toLowerCase()))
                    .collect(Collectors.toList());
        }
        
        if (filters.getModel() != null && !filters.getModel().trim().isEmpty()) {
            equipments = equipments.stream()
                    .filter(e -> e.getModel() != null && e.getModel().toLowerCase().contains(filters.getModel().toLowerCase()))
                    .collect(Collectors.toList());
        }
        
        return equipments;
    }
    
    private void calculateStatistics(EquipmentReportDTO.EquipmentReportDTOBuilder reportBuilder, List<Equipment> equipments) {
        long total = equipments.size();
        long active = equipments.stream().filter(e -> e.getStatus() == EquipmentStatus.EM_USO).count();
        long expired = equipments.stream().filter(Equipment::isExpired).count();
        long expiringSoon = equipments.stream().filter(e -> e.isExpiringSoon(30)).count();
        long dangerous = equipments.stream().filter(Equipment::getIsDangerous).count();
        long weaponsWithExpiredRegistration = equipments.stream()
                .filter(e -> e.getWeaponRegistrationValidity() != null && e.isWeaponRegistrationExpired())
                .count();
        long weaponsExpiringSoon = equipments.stream()
                .filter(e -> e.getWeaponRegistrationValidity() != null && e.isWeaponRegistrationExpiringSoon(30))
                .count();
        
        reportBuilder
                .totalEquipments(total)
                .activeEquipments(active)
                .expiredEquipments(expired)
                .expiringSoonEquipments(expiringSoon)
                .dangerousEquipments(dangerous)
                .weaponsWithExpiredRegistration(weaponsWithExpiredRegistration)
                .weaponsExpiringSoon(weaponsExpiringSoon);
    }
    
    private void generateEquipmentByEmployeeReport(EquipmentReportDTO.EquipmentReportDTOBuilder reportBuilder, 
                                                  List<Equipment> equipments, 
                                                  EquipmentReportFiltersDTO filters) {
        // Comentando temporariamente para resolver problema de compilação
        // Map<UUID, List<Equipment>> equipmentsByUser = equipment
        //     .filter(e -> e.getCurrentUser() != null)
        //     .collect(Collectors.groupingBy(e -> e.getCurrentUser().getId()));
        
        Map<UUID, List<Equipment>> equipmentsByUser = new HashMap<>(); // Temporário
        
        List<EquipmentReportDTO.EquipmentByEmployeeDTO> equipmentByEmployeeList = new ArrayList<>();
        
        for (Map.Entry<UUID, List<Equipment>> entry : equipmentsByUser.entrySet()) {
            UUID employeeId = entry.getKey();
            List<Equipment> employeeEquipments = entry.getValue();
            
            Employee employee = employeeRepository.findById(employeeId).orElse(null);
            if (employee == null) continue;
            
            // Buscar movimentações do funcionário
            List<EquipmentMovementDTO> movements = movementService.getEmployeeMovements(employeeId);
            
            // Buscar posto de trabalho (assumindo que está na tabela de escalas ou similar)
            String workPostName = "Não atribuído";
            String workPostLocation = "Não atribuído";
            UUID workPostId = null;
            
            // Aqui você pode implementar a lógica para buscar o posto de trabalho atual do funcionário
            // Por enquanto, vamos usar valores padrão
            
            long totalEquipments = employeeEquipments.size();
            long activeEquipments = employeeEquipments.stream()
                    .filter(e -> e.getStatus() == EquipmentStatus.EM_USO).count();
            long expiredEquipments = employeeEquipments.stream()
                    .filter(Equipment::isExpired).count();
            
            List<EquipmentDTO> equipmentDTOs = employeeEquipments.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            
            EquipmentReportDTO.EquipmentByEmployeeDTO dto = EquipmentReportDTO.EquipmentByEmployeeDTO.builder()
                    .employeeId(employeeId)
                    .employeeName(employee.getName())
                    .employeeCpf(employee.getDocument())
                    .workPostId(workPostId)
                    .workPostName(workPostName)
                    .workPostLocation(workPostLocation)
                    .totalEquipments(totalEquipments)
                    .activeEquipments(activeEquipments)
                    .expiredEquipments(expiredEquipments)
                    .equipments(equipmentDTOs)
                    .movements(movements)
                    .build();
            
            equipmentByEmployeeList.add(dto);
        }
        
        reportBuilder.equipmentByEmployee(equipmentByEmployeeList);
    }
    
    private void generateWeaponValidityReport(EquipmentReportDTO.EquipmentReportDTOBuilder reportBuilder, 
                                             List<Equipment> equipments, 
                                             EquipmentReportFiltersDTO filters) {
        List<Equipment> weapons = equipments.stream()
                .filter(e -> e.getWeaponRegistrationValidity() != null)
                .collect(Collectors.toList());
        
        List<EquipmentReportDTO.WeaponValidityDTO> weaponValidityList = new ArrayList<>();
        
        for (Equipment weapon : weapons) {
            boolean isExpired = weapon.isWeaponRegistrationExpired();
            boolean isExpiringSoon = weapon.isWeaponRegistrationExpiringSoon(30);
            int daysToExpiry = weapon.getWeaponRegistrationValidity() != null ? 
                    (int) ChronoUnit.DAYS.between(LocalDate.now(), weapon.getWeaponRegistrationValidity()) : 0;
            
            String currentUserName = "Não atribuído"; // TODO: implementar busca por currentUserId
            String currentUserCpf = ""; // TODO: implementar busca por currentUserId
            
            // Buscar última movimentação
            EquipmentMovementDTO lastMovement = null;
            List<EquipmentMovementDTO> movements = movementService.getEquipmentHistory(weapon.getId());
            if (!movements.isEmpty()) {
                lastMovement = movements.get(0); // Assumindo que está ordenado por data
            }
            
            EquipmentReportDTO.WeaponValidityDTO dto = EquipmentReportDTO.WeaponValidityDTO.builder()
                    .equipmentId(weapon.getId())
                    .serialNumber(weapon.getSerialNumber())
                    .model(weapon.getModel())
                    .caNumber(weapon.getCaNumber())
                    .weaponRegistrationValidity(weapon.getWeaponRegistrationValidity())
                    .isExpired(isExpired)
                    .isExpiringSoon(isExpiringSoon)
                    .daysToExpiry(daysToExpiry)
                    .currentUserName(currentUserName)
                    .currentUserCpf(currentUserCpf)
                    .workPostName("Não atribuído") // Implementar lógica para buscar posto
                    .workPostLocation("Não atribuído")
                    .lastMovement(lastMovement)
                    .build();
            
            weaponValidityList.add(dto);
        }
        
        reportBuilder.weaponValidity(weaponValidityList);
    }
    
    private void generateUsageReport(EquipmentReportDTO.EquipmentReportDTOBuilder reportBuilder, 
                                    List<Equipment> equipments, 
                                    EquipmentReportFiltersDTO filters) {
        List<EquipmentReportDTO.EquipmentUsageDTO> usageList = new ArrayList<>();
        
        for (Equipment equipment : equipments) {
            List<EquipmentMovementDTO> movements = movementService.getEquipmentHistory(equipment.getId());
            
            long totalMovements = movements.size();
            long activeMovements = movements.stream()
                    .filter(m -> m.getReturned() != null && !m.getReturned()).count();
            
            // Calcular dias em uso
            long daysInUse = movements.stream()
                    .filter(m -> m.getMovementDate() != null && m.getActualReturnDate() != null)
                    .mapToLong(m -> ChronoUnit.DAYS.between(m.getMovementDate(), m.getActualReturnDate()))
                    .sum();
            
            // Encontrar funcionário que mais usou
            String mostUsedBy = movements.stream()
                    .collect(Collectors.groupingBy(EquipmentMovementDTO::getEmployeeName, Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("N/A");
            
            // Última movimentação
            EquipmentMovementDTO lastMovement = movements.stream()
                    .max(Comparator.comparing(EquipmentMovementDTO::getMovementDate))
                    .orElse(null);
            
            EquipmentReportDTO.EquipmentUsageDTO dto = EquipmentReportDTO.EquipmentUsageDTO.builder()
                    .equipmentId(equipment.getId())
                    .serialNumber(equipment.getSerialNumber())
                    .model(equipment.getModel())
                    .status(equipment.getStatus())
                    .usage(equipment.getUsageType())
                    .totalMovements(totalMovements)
                    .activeMovements(activeMovements)
                    .daysInUse(daysInUse)
                    .mostUsedBy(mostUsedBy)
                    .lastMovementDate(lastMovement != null ? lastMovement.getMovementDate() : null)
                                    .currentUserName("Não atribuído") // TODO: implementar busca por currentUserId
                .currentUserCpf("") // TODO: implementar busca por currentUserId
                    .build();
            
            usageList.add(dto);
        }
        
        reportBuilder.equipmentUsage(usageList);
    }
    
    private void generateExpiryReport(EquipmentReportDTO.EquipmentReportDTOBuilder reportBuilder, 
                                     List<Equipment> equipments, 
                                     EquipmentReportFiltersDTO filters) {
        List<EquipmentReportDTO.EquipmentExpiryDTO> expiryList = new ArrayList<>();
        
        for (Equipment equipment : equipments) {
            boolean isExpired = equipment.isExpired();
            boolean isExpiringSoon = equipment.isExpiringSoon(30);
            int daysToExpiry = equipment.getValidityDate() != null ? 
                    (int) ChronoUnit.DAYS.between(LocalDate.now(), equipment.getValidityDate()) : 0;
            
            boolean isWeaponRegistrationExpired = equipment.isWeaponRegistrationExpired();
            boolean isWeaponRegistrationExpiringSoon = equipment.isWeaponRegistrationExpiringSoon(30);
            int daysToWeaponRegistrationExpiry = equipment.getWeaponRegistrationValidity() != null ? 
                    (int) ChronoUnit.DAYS.between(LocalDate.now(), equipment.getWeaponRegistrationValidity()) : 0;
            
            String currentUserName = "Não atribuído"; // TODO: implementar busca por currentUserId
            String currentUserCpf = ""; // TODO: implementar busca por currentUserId
            
            EquipmentReportDTO.EquipmentExpiryDTO dto = EquipmentReportDTO.EquipmentExpiryDTO.builder()
                    .equipmentId(equipment.getId())
                    .serialNumber(equipment.getSerialNumber())
                    .model(equipment.getModel())
                    .validityDate(equipment.getValidityDate())
                    .sixYearExpiry(equipment.getSixYearExpiry())
                    .weaponRegistrationValidity(equipment.getWeaponRegistrationValidity())
                    .isExpired(isExpired)
                    .isExpiringSoon(isExpiringSoon)
                    .daysToExpiry(daysToExpiry)
                    .isWeaponRegistrationExpired(isWeaponRegistrationExpired)
                    .isWeaponRegistrationExpiringSoon(isWeaponRegistrationExpiringSoon)
                    .daysToWeaponRegistrationExpiry(daysToWeaponRegistrationExpiry)
                    .currentUserName(currentUserName)
                    .currentUserCpf(currentUserCpf)
                    .workPostName("Não atribuído") // Implementar lógica para buscar posto
                    .workPostLocation("Não atribuído")
                    .build();
            
            expiryList.add(dto);
        }
        
        reportBuilder.equipmentExpiry(expiryList);
    }
    
    private void generateGeneralReport(EquipmentReportDTO.EquipmentReportDTOBuilder reportBuilder, 
                                      List<Equipment> equipments, 
                                      EquipmentReportFiltersDTO filters) {
        // Converter equipamentos para DTOs
        List<EquipmentDTO> equipmentDTOs = equipments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // Buscar movimentações recentes
        List<EquipmentMovementDTO> movements = new ArrayList<>();
        if (filters.getIncludeMovements() != null && filters.getIncludeMovements()) {
            movements = movementService.getActiveMovements();
        }
        
        // Gerar resumo por categoria
        generateCategorySummary(reportBuilder, equipments);
        
        reportBuilder
                .equipments(equipmentDTOs)
                .movements(movements);
    }
    
    private void generateCategorySummary(EquipmentReportDTO.EquipmentReportDTOBuilder reportBuilder, List<Equipment> equipments) {
        Map<String, List<Equipment>> equipmentsByCategory = equipments.stream()
                .collect(Collectors.groupingBy(this::getEquipmentCategory));
        
        List<EquipmentReportDTO.EquipmentCategorySummaryDTO> categorySummaries = new ArrayList<>();
        
        for (Map.Entry<String, List<Equipment>> entry : equipmentsByCategory.entrySet()) {
            String category = entry.getKey();
            List<Equipment> categoryEquipments = entry.getValue();
            
            EquipmentReportDTO.EquipmentCategorySummaryDTO summary = createCategorySummary(category, categoryEquipments);
            categorySummaries.add(summary);
        }
        
        reportBuilder.categorySummary(categorySummaries);
    }
    
    private String getEquipmentCategory(Equipment equipment) {
        if (equipment.getIsDangerous() != null && equipment.getIsDangerous()) {
            return "Weapons";
        } else if (equipment.getProtectionLevel() != null) {
            return "Vests";
        } else {
            return "Other";
        }
    }
    
    private EquipmentReportDTO.EquipmentCategorySummaryDTO createCategorySummary(String category, List<Equipment> equipments) {
        long totalCount = equipments.size();
        long activeCount = equipments.stream().filter(e -> e.getStatus() == EquipmentStatus.EM_USO).count();
        long expiredCount = equipments.stream().filter(Equipment::isExpired).count();
        long expiringSoonCount = equipments.stream().filter(e -> e.isExpiringSoon(30)).count();
        long inMaintenanceCount = equipments.stream().filter(e -> e.getStatus() == EquipmentStatus.EM_MANUTENCAO).count();
        long inStockCount = equipments.stream().filter(e -> e.getStatus() == EquipmentStatus.EM_ESTOQUE).count();
        
        // Calcular idade média
        double averageAgeInDays = equipments.stream()
                .filter(e -> e.getManufacturingDate() != null)
                .mapToLong(e -> ChronoUnit.DAYS.between(e.getManufacturingDate(), LocalDate.now()))
                .average()
                .orElse(0.0);
        
        // Modelo mais comum
        String mostCommonModel = equipments.stream()
                .filter(e -> e.getModel() != null)
                .collect(Collectors.groupingBy(Equipment::getModel, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
        
        // Nível de proteção mais comum
        String mostCommonProtectionLevel = equipments.stream()
                .filter(e -> e.getProtectionLevel() != null)
                .collect(Collectors.groupingBy(e -> e.getProtectionLevel().getDescription(), Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
        
        return EquipmentReportDTO.EquipmentCategorySummaryDTO.builder()
                .category(category)
                .totalCount(totalCount)
                .activeCount(activeCount)
                .expiredCount(expiredCount)
                .expiringSoonCount(expiringSoonCount)
                .inMaintenanceCount(inMaintenanceCount)
                .inStockCount(inStockCount)
                .averageAgeInDays(averageAgeInDays)
                .mostCommonModel(mostCommonModel)
                .mostCommonProtectionLevel(mostCommonProtectionLevel)
                .build();
    }
    
    private EquipmentDTO convertToDTO(Equipment equipment) {
        return EquipmentDTO.builder()
                .id(equipment.getId())
                .status(equipment.getStatus())
                .ballisticPlate(equipment.getBallisticPlate())
                .manufacturingDate(equipment.getManufacturingDate())
                .sixYearExpiry(equipment.getSixYearExpiry())
                .weaponRegistrationValidity(equipment.getWeaponRegistrationValidity())
                .usageType(equipment.getUsageType())
                .serialNumber(equipment.getSerialNumber())
                .caNumber(equipment.getCaNumber())
                .protectionLevel(equipment.getProtectionLevel())
                .batch(equipment.getBatch())
                .model(equipment.getModel())
                .size(equipment.getSize())
                .validityDate(equipment.getValidityDate())
                .isDangerous(equipment.getIsDangerous())
                .notes(equipment.getNotes())
                .qrCode(equipment.getQrCode())
                .currentUserId(equipment.getCurrentUserId())
                .currentUserName(null) // TODO: implementar busca por currentUserId
                .currentUserId(equipment.getCurrentUserId())
                .lastMaintenanceDate(equipment.getLastMaintenanceDate())
                .nextMaintenanceDate(equipment.getNextMaintenanceDate())
                .createdAt(equipment.getCreatedAt())
                .updatedAt(equipment.getUpdatedAt())
                .build();
    }
} 