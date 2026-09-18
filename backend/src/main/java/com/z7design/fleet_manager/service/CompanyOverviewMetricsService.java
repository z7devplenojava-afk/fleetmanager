package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CompanyOverviewDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.ClientStatus;
import com.z7design.fleet_manager.model.enums.ContractStatus;
import com.z7design.fleet_manager.model.enums.EmploymentStatus;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CompanyOverviewMetricsService {

    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final VehicleRepository vehicleRepository;
    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;
    private final WorkPostRepository workPostRepository;
    private final FleetWorkOrderRepository fleetWorkOrderRepository;
    private final StockItemRepository stockItemRepository;
    private final UserCompanyResolver userCompanyResolver;

    public CompanyOverviewDTO getCompanyOverview() {
        log.info("📊 Calculando indicadores consolidados 360 da empresa");

        UUID companyId = userCompanyResolver.resolveCurrentCompanyId();
        Company company = companyId != null ? companyRepository.findById(companyId).orElse(null) : null;

        String companyName = company != null ? company.getName() : "Visão Global / Todas as Empresas";
        String companySigla = company != null ? company.getSigla() : "GLOBAL";
        String companyCnpj = company != null ? company.getCnpj() : "-";

        // 1. Recursos Humanos
        List<Employee> employees = companyId != null 
                ? employeeRepository.findAll().stream().filter(e -> companyId.equals(e.getCompanyId())).collect(Collectors.toList())
                : employeeRepository.findAll();

        long totalEmployees = employees.size();
        long activeEmployees = employees.stream().filter(e -> e.getStatus() == EmploymentStatus.ACTIVE).count();
        long onVacationEmployees = employees.stream().filter(e -> e.getStatus() == EmploymentStatus.VACATION).count();
        long terminatedEmployees = employees.stream().filter(e -> e.getStatus() == EmploymentStatus.TERMINATED).count();

        Map<String, Long> byDepartment = employees.stream()
                .filter(e -> e.getDepartment() != null && e.getDepartment().getName() != null)
                .collect(Collectors.groupingBy(e -> e.getDepartment().getName(), Collectors.counting()));

        CompanyOverviewDTO.EmployeeKpiDTO employeeKpis = CompanyOverviewDTO.EmployeeKpiDTO.builder()
                .totalEmployees(totalEmployees)
                .activeEmployees(activeEmployees)
                .onVacationEmployees(onVacationEmployees)
                .terminatedEmployees(terminatedEmployees)
                .byDepartment(byDepartment)
                .build();

        // 2. Frota & Veículos
        List<Vehicle> vehicles = companyId != null 
                ? vehicleRepository.findByCompanyId(companyId) 
                : vehicleRepository.findAll();

        long totalVehicles = vehicles.size();
        long inMaintenanceVehicles = vehicles.stream().filter(v -> v.getStatus() == Vehicle.VehicleStatus.MAINTENANCE).count();
        long activeVehicles = vehicles.stream().filter(v -> v.getStatus() == Vehicle.VehicleStatus.ACTIVE).count();
        long availableVehicles = Math.max(activeVehicles - inMaintenanceVehicles, 0);

        double availabilityRate = totalVehicles > 0 
                ? BigDecimal.valueOf((double) availableVehicles / totalVehicles * 100).setScale(1, RoundingMode.HALF_UP).doubleValue() 
                : 100.0;

        Map<String, Long> byVehicleType = vehicles.stream()
                .filter(v -> v.getVehicleType() != null)
                .collect(Collectors.groupingBy(v -> v.getVehicleType().name(), Collectors.counting()));

        CompanyOverviewDTO.FleetKpiDTO fleetKpis = CompanyOverviewDTO.FleetKpiDTO.builder()
                .totalVehicles(totalVehicles)
                .activeVehicles(activeVehicles)
                .inMaintenanceVehicles(inMaintenanceVehicles)
                .availableVehicles(availableVehicles)
                .availabilityRate(availabilityRate)
                .byVehicleType(byVehicleType)
                .build();

        // 3. Clientes & Contratos
        List<Client> clients = companyId != null 
                ? clientRepository.findByCompanyId(companyId) 
                : clientRepository.findAll();

        long totalClients = clients.size();
        long activeClients = clients.stream().filter(c -> c.getStatus() == ClientStatus.ACTIVE).count();

        List<Contract> contracts = companyId != null
                ? contractRepository.findByCompanyId(companyId)
                : contractRepository.findAll();

        long totalContracts = contracts.size();
        long activeContracts = contracts.stream().filter(c -> c.getStatus() == ContractStatus.ACTIVE).count();
        BigDecimal totalContractValue = contracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE && c.getValue() != null)
                .map(Contract::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<WorkPost> workPosts = companyId != null
                ? workPostRepository.findByCompanyId(companyId)
                : workPostRepository.findAll();
        long totalWorkPosts = workPosts.size();

        CompanyOverviewDTO.ClientContractKpiDTO clientContractKpis = CompanyOverviewDTO.ClientContractKpiDTO.builder()
                .totalClients(totalClients)
                .activeClients(activeClients)
                .totalContracts(totalContracts)
                .activeContracts(activeContracts)
                .totalWorkPosts(totalWorkPosts)
                .totalContractValue(totalContractValue)
                .build();

        // 4. Manutenção & Ordens de Serviço
        List<FleetWorkOrder> orders = fleetWorkOrderRepository.findAll();
        if (companyId != null) {
            orders = orders.stream().filter(o -> companyId.equals(o.getCompanyId())).collect(Collectors.toList());
        }

        long openOrders = orders.stream().filter(o -> o.getStatus() == FleetWorkOrder.WorkOrderStatus.OPEN || o.getStatus() == FleetWorkOrder.WorkOrderStatus.APPROVED).count();
        long inProgressOrders = orders.stream().filter(o -> o.getStatus() == FleetWorkOrder.WorkOrderStatus.IN_PROGRESS).count();
        long completedOrders = orders.stream().filter(o -> o.getStatus() == FleetWorkOrder.WorkOrderStatus.COMPLETED).count();

        BigDecimal monthlyMaintenanceCost = orders.stream()
                .filter(o -> o.getStatus() == FleetWorkOrder.WorkOrderStatus.COMPLETED && o.getTotalCost() != null)
                .map(FleetWorkOrder::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        CompanyOverviewDTO.MaintenanceKpiDTO maintenanceKpis = CompanyOverviewDTO.MaintenanceKpiDTO.builder()
                .openOrders(openOrders)
                .inProgressOrders(inProgressOrders)
                .completedOrders(completedOrders)
                .monthlyMaintenanceCost(monthlyMaintenanceCost)
                .build();

        // 5. Almoxarifado / Estoque
        List<StockItem> stockItems = stockItemRepository.findAll();
        if (companyId != null) {
            stockItems = stockItems.stream().filter(si -> si.getCompanyId() == null || companyId.equals(si.getCompanyId())).collect(Collectors.toList());
        }

        long totalItems = stockItems.size();
        long lowStockItems = stockItems.stream()
                .filter(si -> si.getCurrentQuantity() != null && si.getMinimumQuantity() != null && si.getCurrentQuantity() <= si.getMinimumQuantity())
                .count();
        long outOfStockItems = stockItems.stream()
                .filter(si -> si.getCurrentQuantity() != null && si.getCurrentQuantity() == 0)
                .count();
        double totalStockValue = stockItems.stream()
                .filter(si -> si.getUnitCost() != null && si.getCurrentQuantity() != null)
                .mapToDouble(si -> si.getUnitCost().multiply(BigDecimal.valueOf(si.getCurrentQuantity())).doubleValue())
                .sum();

        CompanyOverviewDTO.StockKpiDTO stockKpis = CompanyOverviewDTO.StockKpiDTO.builder()
                .totalItems(totalItems)
                .lowStockItems(lowStockItems)
                .outOfStockItems(outOfStockItems)
                .totalStockValue(totalStockValue)
                .build();

        // 6. Financeiro
        CompanyOverviewDTO.FinanceKpiDTO financeKpis = CompanyOverviewDTO.FinanceKpiDTO.builder()
                .totalMonthlyReceivables(totalContractValue)
                .totalMonthlyInvoices(monthlyMaintenanceCost)
                .pendingReceivablesCount(activeContracts)
                .build();

        return CompanyOverviewDTO.builder()
                .companyName(companyName)
                .companySigla(companySigla)
                .companyCnpj(companyCnpj)
                .employeeKpis(employeeKpis)
                .fleetKpis(fleetKpis)
                .clientContractKpis(clientContractKpis)
                .maintenanceKpis(maintenanceKpis)
                .stockKpis(stockKpis)
                .financeKpis(financeKpis)
                .build();
    }
}
