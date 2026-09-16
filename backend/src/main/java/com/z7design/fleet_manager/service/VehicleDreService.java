package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleDreDTO;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.CostSimulation;
import com.z7design.fleet_manager.model.DriverShift;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.FuelRecord;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.MeasurementItem;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.enums.CostSimulationStatus;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.CostSimulationRepository;
import com.z7design.fleet_manager.repository.DriverShiftRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.FuelRecordRepository;
import com.z7design.fleet_manager.repository.MeasurementBulletinRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * MÓDULO 7 — RF-07.5: DRE Real por Veículo (placa) e Centro de Custo.
 *
 * Resultado Líquido = Receita Bruta Faturada − Impostos − Diesel
 *                     − Manutenção/Peças − Folha/Benefícios − Depreciação
 *
 * Receita por placa: itens do Boletim de Medição (diárias, km excedente e viagens extras),
 * impostos conforme alíquotas da simulação de custos aprovada do Módulo 1 (M1→M7).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleDreService {

    private static final int DEFAULT_USEFUL_LIFE_MONTHS = 60;

    private final VehicleRepository vehicleRepository;
    private final MeasurementBulletinRepository bulletinRepository;
    private final FuelRecordRepository fuelRecordRepository;
    private final FleetWorkOrderRepository workOrderRepository;
    private final DriverShiftRepository driverShiftRepository;
    private final CostSimulationRepository costSimulationRepository;
    private final ClientRepository clientRepository;

    /** Custo mensal estimado de motorista quando a simulação M1 não tem fixedDriverCost. */
    private static final BigDecimal DEFAULT_DRIVER_MONTHLY_COST = new BigDecimal("5950.00");

    /**
     * DRE consolidado da frota para o mês de referência (yyyy-MM).
     */
    @Transactional(readOnly = true)
    public List<VehicleDreDTO> getFleetDre(String referenceMonth) {
        YearMonth month = YearMonth.parse(referenceMonth);
        LocalDate start = month.atDay(1);
        LocalDate end = month.atEndOfMonth();
        return getFleetDre(start, end, referenceMonth);
    }

    /**
     * DRE da frota para um período arbitrário (reutilizado pelo endpoint por mês).
     */
    @Transactional(readOnly = true)
    public List<VehicleDreDTO> getFleetDre(LocalDate start, LocalDate end, String referenceMonth) {
        List<Vehicle> fleet = vehicleRepository.findAll();
        Map<UUID, VehicleDreDTO> byVehicle = new HashMap<>();

        // ===== Receita: itens faturados por placa nos boletins cujo período intersecta o mês =====
        Map<String, Revenue> revenueByPlate = new HashMap<>();
        for (MeasurementBulletin bulletin : bulletinRepository.findAll()) {
            if (bulletin.getPeriodStart() == null || bulletin.getPeriodEnd() == null) {
                continue;
            }
            boolean overlaps = !bulletin.getPeriodStart().isAfter(end)
                    && !bulletin.getPeriodEnd().isBefore(start);
            if (!overlaps || bulletin.getItems() == null) {
                continue;
            }
            for (MeasurementItem item : bulletin.getItems()) {
                if (item.getVehiclePlate() == null || item.getTotalValue() == null) {
                    continue;
                }
                Revenue rev = revenueByPlate.computeIfAbsent(
                        item.getVehiclePlate().toUpperCase(), p -> new Revenue());
                rev.total = rev.total.add(item.getTotalValue());
                if (item.getValorKmExcedido() != null) {
                    rev.excessKm = rev.excessKm.add(item.getValorKmExcedido());
                }
                if (Boolean.TRUE.equals(item.getIsExtraTrip())) {
                    rev.extraTrips = rev.extraTrips.add(item.getTotalValue());
                }
            }
        }

        // ===== Orçamento M1 aprovado (para alíquotas de imposto) =====
        List<CostSimulation> approvedBudgets = costSimulationRepository.findByStatus(CostSimulationStatus.APPROVED);

        for (Vehicle vehicle : fleet) {
            String plate = vehicle.getPlate();
            VehicleDreDTO dto = VehicleDreDTO.builder()
                    .vehicleId(vehicle.getId())
                    .plate(plate)
                    .model(vehicle.getModel())
                    .referenceMonth(referenceMonth)
                    .usefulLifeMonths(DEFAULT_USEFUL_LIFE_MONTHS)
                    .build();

            // Cliente principal do veículo
            if (vehicle.getClientId() != null) {
                clientRepository.findById(vehicle.getClientId()).ifPresent(c ->
                        dto.setClientName(clientName(c)));
                dto.setClientId(vehicle.getClientId());
            }

            Revenue revenue = revenueByPlate.getOrDefault(plate != null ? plate.toUpperCase() : "", new Revenue());
            dto.setGrossRevenue(scale2(revenue.total));
            dto.setExcessKmRevenue(scale2(revenue.excessKm));
            dto.setExtraTripsRevenue(scale2(revenue.extraTrips));

            // ===== Impostos (M1→M7): alíquotas da simulação aprovada do cliente =====
            CostSimulation budget = approvedBudgets.stream()
                    .filter(s -> s.getClient() != null && vehicle.getClientId() != null
                            && vehicle.getClientId().equals(s.getClient().getId()))
                    .findFirst()
                    .orElse(null);
            BigDecimal taxesPct = budget != null && budget.getTaxesTotalPct() != null
                    ? budget.getTaxesTotalPct()
                    : new BigDecimal("0.1183"); // fallback: soma das alíquotas padrão do PRD
            BigDecimal taxesValue = revenue.total.multiply(taxesPct).setScale(2, RoundingMode.HALF_UP);
            dto.setTaxesPct(taxesPct);
            dto.setTaxesValue(taxesValue);
            dto.setNetRevenue(revenue.total.subtract(taxesValue).setScale(2, RoundingMode.HALF_UP));

            // ===== Diesel (M5/M7: abastecimentos do período) =====
            List<FuelRecord> fuelRecords = fuelRecordRepository.findByVehicleIdAndDateBetween(vehicle.getId(), start, end);
            BigDecimal fuelCost = fuelRecords.stream()
                    .map(f -> f.getCost() != null ? f.getCost() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setFuelCost(scale2(fuelCost));

            // ===== Manutenção/Peças (M6→M7: OSs baixadas no período) =====
            List<FleetWorkOrder> orders = workOrderRepository
                    .findByVehicleIdAndDeletedAtIsNull(vehicle.getId()).stream()
                    .filter(o -> o.getActualDate() != null
                            && !o.getActualDate().isBefore(start)
                            && !o.getActualDate().isAfter(end))
                    .toList();
            BigDecimal maintenanceCost = orders.stream()
                    .map(o -> o.getTotalCost() != null ? o.getTotalCost() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setMaintenanceCost(scale2(maintenanceCost));

            // ===== Folha/Benefícios: motoristas alocados ao veículo no período (M3) × custo M1 =====
            long driversInMonth = driverShiftRepository
                    .findByVehicleIdAndShiftDateBetween(vehicle.getId(), start, end).stream()
                    .map(ds -> ds.getDriver() != null ? ds.getDriver().getId() : null)
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .count();
            BigDecimal driverMonthlyCost = budget != null && budget.getFixedDriverCost() != null
                    && budget.getFixedDriverCost().signum() > 0
                    ? budget.getFixedDriverCost()
                    : DEFAULT_DRIVER_MONTHLY_COST;
            BigDecimal payrollCost = BigDecimal.valueOf(driversInMonth).multiply(driverMonthlyCost);
            dto.setPayrollCost(scale2(payrollCost));

            // ===== Depreciação linear (aquisição − mercado) / vida útil =====
            dto.setDepreciation(monthlyDepreciation(vehicle));

            // ===== KM rodado (Parte Diária → custo real/km) =====
            BigDecimal kmDriven = kmDriven(vehicle, orders);
            dto.setKmDriven(scale2(kmDriven));

            BigDecimal totalCosts = fuelCost.add(maintenanceCost).add(payrollCost).add(dto.getDepreciation());
            dto.setTotalCosts(scale2(totalCosts));
            BigDecimal netResult = revenue.total.subtract(taxesValue).subtract(totalCosts);
            dto.setNetResult(scale2(netResult));
            if (revenue.total.signum() > 0) {
                dto.setResultMarginPct(netResult.divide(revenue.total, 4, RoundingMode.HALF_UP));
            } else {
                dto.setResultMarginPct(BigDecimal.ZERO);
            }
            if (kmDriven.signum() > 0) {
                dto.setRealCostPerKm(totalCosts.divide(kmDriven, 4, RoundingMode.HALF_UP));
            } else {
                dto.setRealCostPerKm(BigDecimal.ZERO);
            }

            byVehicle.put(vehicle.getId(), dto);
        }

        return byVehicle.values().stream()
                .sorted(Comparator.comparing(VehicleDreDTO::getPlate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    /**
     * DRE consolidado por cliente (visão de contrato).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getDreByClient(String referenceMonth) {
        List<VehicleDreDTO> fleetDre = getFleetDre(referenceMonth);
        Map<String, List<VehicleDreDTO>> byClient = new HashMap<>();
        for (VehicleDreDTO dto : fleetDre) {
            String key = dto.getClientName() != null ? dto.getClientName() : "Sem cliente alocado";
            byClient.computeIfAbsent(key, k -> new ArrayList<>()).add(dto);
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalTaxes = BigDecimal.ZERO;
        BigDecimal totalCosts = BigDecimal.ZERO;
        BigDecimal totalResult = BigDecimal.ZERO;

        for (Map.Entry<String, List<VehicleDreDTO>> entry : byClient.entrySet()) {
            List<VehicleDreDTO> vehicles = entry.getValue();
            BigDecimal revenue = vehicles.stream().map(VehicleDreDTO::getGrossRevenue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal taxes = vehicles.stream().map(VehicleDreDTO::getTaxesValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal costs = vehicles.stream().map(VehicleDreDTO::getTotalCosts)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal result = vehicles.stream().map(VehicleDreDTO::getNetResult)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> row = new HashMap<>();
            row.put("clientName", entry.getKey());
            row.put("vehicleCount", vehicles.size());
            row.put("grossRevenue", scale2(revenue));
            row.put("taxesValue", scale2(taxes));
            row.put("totalCosts", scale2(costs));
            row.put("netResult", scale2(result));
            row.put("marginPct", revenue.signum() > 0
                    ? result.divide(revenue, 4, RoundingMode.HALF_UP) : BigDecimal.ZERO);
            rows.add(row);

            totalRevenue = totalRevenue.add(revenue);
            totalTaxes = totalTaxes.add(taxes);
            totalCosts = totalCosts.add(costs);
            totalResult = totalResult.add(result);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("referenceMonth", referenceMonth);
        response.put("clients", rows);
        response.put("totals", Map.of(
                "grossRevenue", scale2(totalRevenue),
                "taxesValue", scale2(totalTaxes),
                "totalCosts", scale2(totalCosts),
                "netResult", scale2(totalResult)));
        return response;
    }

    private BigDecimal monthlyDepreciation(Vehicle vehicle) {
        BigDecimal acquisition = vehicle.getAcquisitionValue() != null
                ? vehicle.getAcquisitionValue() : BigDecimal.ZERO;
        BigDecimal residual = vehicle.getMarketValue() != null ? vehicle.getMarketValue() : BigDecimal.ZERO;
        BigDecimal depreciableBase = acquisition.subtract(residual).max(BigDecimal.ZERO);
        return depreciableBase.divide(BigDecimal.valueOf(DEFAULT_USEFUL_LIFE_MONTHS), 2, RoundingMode.HALF_UP);
    }

    /**
     * KM rodado no período: variação do hodômetro nas OSs; fallback na frota via OdometerService.
     */
    private BigDecimal kmDriven(Vehicle vehicle, List<FleetWorkOrder> orders) {
        Integer maxOut = orders.stream()
                .map(FleetWorkOrder::getOdometerOut)
                .filter(k -> k != null)
                .max(Integer::compareTo)
                .orElse(null);
        Integer minIn = orders.stream()
                .map(FleetWorkOrder::getOdometerIn)
                .filter(k -> k != null)
                .min(Integer::compareTo)
                .orElse(null);
        if (maxOut != null && minIn != null && maxOut > minIn) {
            return BigDecimal.valueOf(maxOut - minIn);
        }
        return BigDecimal.ZERO;
    }

    private String clientName(Client client) {
        try {
            return client.getName();
        } catch (Exception e) {
            return "Cliente " + client.getId();
        }
    }

    private BigDecimal scale2(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    /** Acumulador de receita por placa. */
    private static class Revenue {
        private BigDecimal total = BigDecimal.ZERO;
        private BigDecimal excessKm = BigDecimal.ZERO;
        private BigDecimal extraTrips = BigDecimal.ZERO;
    }
}
