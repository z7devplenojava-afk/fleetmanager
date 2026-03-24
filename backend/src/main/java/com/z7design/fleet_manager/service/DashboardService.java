package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.DashboardSummaryDTO;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DashboardService {

    // Repositories
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final ServiceRepository serviceRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleMaintenanceRepository vehicleMaintenanceRepository;
    private final MeasurementBulletinRepository measurementBulletinRepository;
    private final InvoiceRepository invoiceRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserActivityLogRepository userActivityLogRepository;
    private final NotificationRepository notificationRepository;

    public DashboardSummaryDTO getDashboardSummary() {
        log.info("Gerando resumo do dashboard (nÃ£o encontrado no cache)");
        
        DashboardSummaryDTO summary = new DashboardSummaryDTO();
        
        try {
            // EstatÃ­sticas de usuÃ¡rios
            summary.setTotalUsers(userRepository.count());
            summary.setActiveUsers(userRepository.count()); // Usar count total como ativos por enquanto
            
            // EstatÃ­sticas de clientes e contratos
            summary.setTotalClients(clientRepository.count());
            summary.setActiveContracts(clientRepository.count()); // Usar count total como ativos por enquanto
            
            // EstatÃ­sticas de serviÃ§os
            summary.setTotalServices(serviceRepository.count());
            
            // EstatÃ­sticas de veÃ­culos
            summary.setTotalVehicles(vehicleRepository.count());
            
            // EstatÃ­sticas de manutenÃ§Ãµes
            try {
                summary.setTotalMaintenances(vehicleMaintenanceRepository.count());
            } catch (Exception e) {
                log.warn("Tabela vehicle_maintenances nÃ£o existe, usando valor padrÃ£o", e);
                summary.setTotalMaintenances(0L);
            }
            
            // EstatÃ­sticas de mediÃ§Ãµes
            summary.setTotalMeasurements(measurementBulletinRepository.count());
            summary.setPendingMeasurements(0L); // Implementar quando tiver o enum correto
            
            // EstatÃ­sticas de faturas
            summary.setTotalInvoices(invoiceRepository.count());
            summary.setPendingInvoices(0L); // Implementar quando tiver o enum correto
            
            // EstatÃ­sticas de equipamentos
            Map<String, Object> equipmentStats = getEquipmentStatistics();
            summary.setTotalEquipment(((Number) equipmentStats.get("total")).longValue());
            summary.setEquipmentInUse(((Number) equipmentStats.get("inUse")).longValue());
            summary.setEquipmentInMaintenance(((Number) equipmentStats.get("inMaintenance")).longValue());
            summary.setEquipmentExpiring(((Number) equipmentStats.get("expiringSoon")).longValue());
            
            // EstatÃ­sticas de receita
            Map<String, BigDecimal> revenueStats = getRevenueStatistics();
            summary.setMonthlyRevenue(revenueStats.get("monthly"));
            summary.setTotalRevenue(revenueStats.get("total"));
            
            // EstatÃ­sticas de tarefas e alertas
            summary.setPendingTasks(getPendingTasksCount());
            summary.setCompletedTasks(getCompletedTasksCount());
            summary.setTotalAlerts(notificationRepository.count());
            summary.setUnreadAlerts(notificationRepository.count()); // Usar count total por enquanto
            
            // EstatÃ­sticas de funcionÃ¡rios (se disponÃ­vel)
            summary.setTotalEmployees(getEmployeesCount());
            
            // Dados de tendÃªncia
            summary.setDailyStats(getDailyStats());
            summary.setRecentActivities(getRecentActivities());
            summary.setSystemAlerts(getSystemAlerts());
            
            // InformaÃ§Ãµes do sistema
            summary.setLastUpdate(LocalDateTime.now());
            summary.setSystemVersion("1.0.0");
            summary.setEnvironment(getEnvironment());
            
            log.info("Dashboard summary gerado com sucesso");
            
        } catch (Exception e) {
            log.error("Erro ao gerar resumo do dashboard", e);
            // Retorna dados bÃ¡sicos em caso de erro
            setBasicData(summary);
        }
        
        return summary;
    }

    @Cacheable(value = "statistics", key = "'equipment-stats'")
    private Map<String, Object> getEquipmentStatistics() {
        try {
            log.debug("Buscando estatÃ­sticas de equipamentos (nÃ£o encontrado no cache)");
            // Buscar estatÃ­sticas de equipamentos
            long total = equipmentRepository.count();
            long inUse = 0L; // Implementar quando tiver o enum correto
            long inMaintenance = 0L; // Implementar quando tiver o enum correto
            
            // Equipamentos vencendo em 30 dias
            long expiringSoon = 0L; // Implementar quando tiver o mÃ©todo correto
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("total", total);
            stats.put("inUse", inUse);
            stats.put("inMaintenance", inMaintenance);
            stats.put("expiringSoon", expiringSoon);
            
            return stats;
        } catch (Exception e) {
            log.warn("Erro ao buscar estatÃ­sticas de equipamentos", e);
            return createEmptyEquipmentStats();
        }
    }

    private Map<String, Object> createEmptyEquipmentStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", 0L);
        stats.put("inUse", 0L);
        stats.put("inMaintenance", 0L);
        stats.put("expiringSoon", 0L);
        return stats;
    }

    @Cacheable(value = "statistics", key = "'revenue-stats'")
    private Map<String, BigDecimal> getRevenueStatistics() {
        try {
            log.debug("Buscando estatÃ­sticas de receita (nÃ£o encontrado no cache)");
            // Por enquanto retornar valores zerados atÃ© implementar os mÃ©todos corretos
            Map<String, BigDecimal> revenue = new HashMap<>();
            revenue.put("monthly", BigDecimal.ZERO);
            revenue.put("total", BigDecimal.ZERO);
            
            return revenue;
        } catch (Exception e) {
            log.warn("Erro ao buscar estatÃ­sticas de receita", e);
            Map<String, BigDecimal> revenue = new HashMap<>();
            revenue.put("monthly", BigDecimal.ZERO);
            revenue.put("total", BigDecimal.ZERO);
            return revenue;
        }
    }

    private Long getPendingTasksCount() {
        try {
            // Contar tarefas pendentes (pode ser baseado em diferentes entidades)
            return 0L; // Implementar conforme necessidade especÃ­fica
        } catch (Exception e) {
            log.warn("Erro ao contar tarefas pendentes", e);
            return 0L;
        }
    }

    private Long getCompletedTasksCount() {
        try {
            // Contar tarefas concluÃ­das
            return 0L; // Implementar conforme necessidade especÃ­fica
        } catch (Exception e) {
            log.warn("Erro ao contar tarefas concluÃ­das", e);
            return 0L;
        }
    }

    private Long getEmployeesCount() {
        try {
            // Contar funcionÃ¡rios (se houver entidade especÃ­fica)
            return 0L; // Implementar conforme necessidade especÃ­fica
        } catch (Exception e) {
            log.warn("Erro ao contar funcionÃ¡rios", e);
            return 0L;
        }
    }

    private Map<String, Long> getDailyStats() {
        try {
            // EstatÃ­sticas dos Ãºltimos 7 dias
            Map<String, Long> dailyStats = new LinkedHashMap<>();
            LocalDate today = LocalDate.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
            
            for (int i = 6; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                String dateKey = date.format(formatter);
                
                // Por enquanto retornar valores zerados
                dailyStats.put(dateKey, 0L);
            }
            
            return dailyStats;
        } catch (Exception e) {
            log.warn("Erro ao buscar estatÃ­sticas diÃ¡rias", e);
            return new HashMap<>();
        }
    }

    private List<Map<String, Object>> getRecentActivities() {
        try {
            // Por enquanto retornar lista vazia atÃ© implementar os mÃ©todos corretos
            return new ArrayList<>();
        } catch (Exception e) {
            log.warn("Erro ao buscar atividades recentes", e);
            return new ArrayList<>();
        }
    }

    private List<Map<String, Object>> getSystemAlerts() {
        try {
            // Por enquanto retornar lista vazia atÃ© implementar os mÃ©todos corretos
            return new ArrayList<>();
        } catch (Exception e) {
            log.warn("Erro ao buscar alertas do sistema", e);
            return new ArrayList<>();
        }
    }

    private String getEnvironment() {
        try {
            // Detectar ambiente (desenvolvimento, produÃ§Ã£o, etc.)
            String env = System.getProperty("spring.profiles.active");
            return env != null ? env : "development";
        } catch (Exception e) {
            return "unknown";
        }
    }

    private void setBasicData(DashboardSummaryDTO summary) {
        summary.setTotalUsers(0L);
        summary.setActiveUsers(0L);
        summary.setActiveContracts(0L);
        summary.setMonthlyRevenue(BigDecimal.ZERO);
        summary.setTotalRevenue(BigDecimal.ZERO);
        summary.setTotalEquipment(0L);
        summary.setEquipmentInUse(0L);
        summary.setEquipmentInMaintenance(0L);
        summary.setEquipmentExpiring(0L);
        summary.setPendingTasks(0L);
        summary.setCompletedTasks(0L);
        summary.setTotalAlerts(0L);
        summary.setUnreadAlerts(0L);
        summary.setTotalEmployees(0L);
        summary.setTotalClients(0L);
        summary.setTotalServices(0L);
        summary.setTotalVehicles(0L);
        summary.setTotalMaintenances(0L);
        summary.setTotalMeasurements(0L);
        summary.setPendingMeasurements(0L);
        summary.setTotalInvoices(0L);
        summary.setPendingInvoices(0L);
        summary.setLastUpdate(LocalDateTime.now());
        summary.setSystemVersion("1.0.0");
        summary.setEnvironment("unknown");
    }
}

