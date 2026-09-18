package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyOverviewDTO {

    private String companyName;
    private String companySigla;
    private String companyCnpj;

    // 1. Recursos Humanos & Colaboradores
    private EmployeeKpiDTO employeeKpis;

    // 2. Frota & Veículos
    private FleetKpiDTO fleetKpis;

    // 3. Clientes & Contratos
    private ClientContractKpiDTO clientContractKpis;

    // 4. Manutenção & Ordens de Serviço
    private MaintenanceKpiDTO maintenanceKpis;

    // 5. Almoxarifado & Estoque
    private StockKpiDTO stockKpis;

    // 6. Financeiro & Comercial
    private FinanceKpiDTO financeKpis;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeKpiDTO {
        private long totalEmployees;
        private long activeEmployees;
        private long onVacationEmployees;
        private long terminatedEmployees;
        private Map<String, Long> byDepartment;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FleetKpiDTO {
        private long totalVehicles;
        private long activeVehicles;
        private long inMaintenanceVehicles;
        private long availableVehicles;
        private double availabilityRate; // % de disponibilidade
        private Map<String, Long> byVehicleType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClientContractKpiDTO {
        private long totalClients;
        private long activeClients;
        private long totalContracts;
        private long activeContracts;
        private long totalWorkPosts;
        private BigDecimal totalContractValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaintenanceKpiDTO {
        private long openOrders;
        private long inProgressOrders;
        private long completedOrders;
        private BigDecimal monthlyMaintenanceCost;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockKpiDTO {
        private long totalItems;
        private long lowStockItems;
        private long outOfStockItems;
        private Double totalStockValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinanceKpiDTO {
        private BigDecimal totalMonthlyReceivables;
        private BigDecimal totalMonthlyInvoices;
        private long pendingReceivablesCount;
    }
}
