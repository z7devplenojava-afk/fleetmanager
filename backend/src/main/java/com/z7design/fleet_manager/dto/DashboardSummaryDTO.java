package com.z7design.fleet_manager.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class DashboardSummaryDTO {
    
    // EstatÃ­sticas gerais
    private Long totalUsers;
    private Long activeUsers;
    private Long activeContracts;
    private BigDecimal monthlyRevenue;
    private BigDecimal totalRevenue;
    
    // Equipamentos e recursos
    private Long totalEquipment;
    private Long equipmentInUse;
    private Long equipmentInMaintenance;
    private Long equipmentExpiring;
    
    // Tarefas e atividades
    private Long pendingTasks;
    private Long completedTasks;
    private Long totalAlerts;
    private Long unreadAlerts;
    
    // MÃ³dulos especÃ­ficos
    private Long totalEmployees;
    private Long totalClients;
    private Long totalServices;
    private Long totalVehicles;
    private Long totalMaintenances;
    
    // MediÃ§Ãµes e faturas
    private Long totalMeasurements;
    private Long pendingMeasurements;
    private Long totalInvoices;
    private Long pendingInvoices;
    
    // Dados de tendÃªncia (Ãºltimos 30 dias)
    private Map<String, Long> dailyStats;
    private List<Map<String, Object>> recentActivities;
    private List<Map<String, Object>> systemAlerts;
    
    // InformaÃ§Ãµes do sistema
    private LocalDateTime lastUpdate;
    private String systemVersion;
    private String environment;

    // Constructors
    public DashboardSummaryDTO() {}

    // Getters and Setters
    public Long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(Long totalUsers) { this.totalUsers = totalUsers; }

    public Long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(Long activeUsers) { this.activeUsers = activeUsers; }

    public Long getActiveContracts() { return activeContracts; }
    public void setActiveContracts(Long activeContracts) { this.activeContracts = activeContracts; }

    public BigDecimal getMonthlyRevenue() { return monthlyRevenue; }
    public void setMonthlyRevenue(BigDecimal monthlyRevenue) { this.monthlyRevenue = monthlyRevenue; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public Long getTotalEquipment() { return totalEquipment; }
    public void setTotalEquipment(Long totalEquipment) { this.totalEquipment = totalEquipment; }

    public Long getEquipmentInUse() { return equipmentInUse; }
    public void setEquipmentInUse(Long equipmentInUse) { this.equipmentInUse = equipmentInUse; }

    public Long getEquipmentInMaintenance() { return equipmentInMaintenance; }
    public void setEquipmentInMaintenance(Long equipmentInMaintenance) { this.equipmentInMaintenance = equipmentInMaintenance; }

    public Long getEquipmentExpiring() { return equipmentExpiring; }
    public void setEquipmentExpiring(Long equipmentExpiring) { this.equipmentExpiring = equipmentExpiring; }

    public Long getPendingTasks() { return pendingTasks; }
    public void setPendingTasks(Long pendingTasks) { this.pendingTasks = pendingTasks; }

    public Long getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(Long completedTasks) { this.completedTasks = completedTasks; }

    public Long getTotalAlerts() { return totalAlerts; }
    public void setTotalAlerts(Long totalAlerts) { this.totalAlerts = totalAlerts; }

    public Long getUnreadAlerts() { return unreadAlerts; }
    public void setUnreadAlerts(Long unreadAlerts) { this.unreadAlerts = unreadAlerts; }

    public Long getTotalEmployees() { return totalEmployees; }
    public void setTotalEmployees(Long totalEmployees) { this.totalEmployees = totalEmployees; }

    public Long getTotalClients() { return totalClients; }
    public void setTotalClients(Long totalClients) { this.totalClients = totalClients; }

    public Long getTotalServices() { return totalServices; }
    public void setTotalServices(Long totalServices) { this.totalServices = totalServices; }

    public Long getTotalVehicles() { return totalVehicles; }
    public void setTotalVehicles(Long totalVehicles) { this.totalVehicles = totalVehicles; }

    public Long getTotalMaintenances() { return totalMaintenances; }
    public void setTotalMaintenances(Long totalMaintenances) { this.totalMaintenances = totalMaintenances; }

    public Long getTotalMeasurements() { return totalMeasurements; }
    public void setTotalMeasurements(Long totalMeasurements) { this.totalMeasurements = totalMeasurements; }

    public Long getPendingMeasurements() { return pendingMeasurements; }
    public void setPendingMeasurements(Long pendingMeasurements) { this.pendingMeasurements = pendingMeasurements; }

    public Long getTotalInvoices() { return totalInvoices; }
    public void setTotalInvoices(Long totalInvoices) { this.totalInvoices = totalInvoices; }

    public Long getPendingInvoices() { return pendingInvoices; }
    public void setPendingInvoices(Long pendingInvoices) { this.pendingInvoices = pendingInvoices; }

    public Map<String, Long> getDailyStats() { return dailyStats; }
    public void setDailyStats(Map<String, Long> dailyStats) { this.dailyStats = dailyStats; }

    public List<Map<String, Object>> getRecentActivities() { return recentActivities; }
    public void setRecentActivities(List<Map<String, Object>> recentActivities) { this.recentActivities = recentActivities; }

    public List<Map<String, Object>> getSystemAlerts() { return systemAlerts; }
    public void setSystemAlerts(List<Map<String, Object>> systemAlerts) { this.systemAlerts = systemAlerts; }

    public LocalDateTime getLastUpdate() { return lastUpdate; }
    public void setLastUpdate(LocalDateTime lastUpdate) { this.lastUpdate = lastUpdate; }

    public String getSystemVersion() { return systemVersion; }
    public void setSystemVersion(String systemVersion) { this.systemVersion = systemVersion; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }
}

