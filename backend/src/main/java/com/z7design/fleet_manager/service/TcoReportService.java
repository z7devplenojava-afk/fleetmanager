package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleTcoDTO;
import com.z7design.fleet_manager.model.CostSimulation;
import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.enums.CostSimulationStatus;
import com.z7design.fleet_manager.repository.CostSimulationRepository;
import com.z7design.fleet_manager.repository.DailyLogRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * PRD 1.0 - MÓDULO 6 (RF-06.4): Painel de Decisão de Substituição do Ativo — TCO.
 *
 * Custo Real/KM = Gasto Acumulado (peças, pneus, oficina) no mês / KM rodado no mês.
 * Se o Custo Real/KM ultrapassar em 20% o valor orçado no Módulo 1, ou se o veículo
 * acumular mais de 3 paradas no mês, o sistema gera alerta para remanejamento para
 * a frota reserva ou venda na Tabela FIPE.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TcoReportService {

    private final VehicleRepository vehicleRepository;
    private final DailyLogRepository dailyLogRepository;
    private final FleetWorkOrderRepository workOrderRepository;
    private final CostSimulationRepository costSimulationRepository;

    /** Tolerância PRD: custo real até 20% acima do orçado. */
    private static final BigDecimal OVERBUDGET_THRESHOLD = new BigDecimal("0.20");
    /** Tolerância PRD: no máximo 3 paradas de oficina no mês. */
    private static final long MAX_MONTHLY_STOPS = 3;

    /**
     * Gera o painel TCO do mês corrente para toda a frota.
     */
    @Transactional(readOnly = true)
    public List<VehicleTcoDTO> getCurrentMonthFleetTco() {
        return getFleetTco(null, null, null);
    }

    /**
     * Gera o painel TCO para um período (por placa ou frota inteira).
     *
     * @param plate placa específica (opcional; null = frota inteira)
     * @param start início do período (opcional; padrão = mês corrente)
     * @param end   fim do período (opcional; padrão = mês corrente)
     */
    @Transactional(readOnly = true)
    public List<VehicleTcoDTO> getFleetTco(String plate, LocalDate start, LocalDate end) {
        YearMonth period = YearMonth.now();
        if (start != null) {
            period = YearMonth.from(start);
        }
        LocalDate periodStart = start != null ? start : period.atDay(1);
        LocalDate periodEnd = end != null ? end : period.atEndOfMonth();
        long daysInPeriod = periodStart.until(periodEnd).getDays() + 1L;

        List<Vehicle> vehicles = (plate != null && !plate.isBlank())
                ? vehicleRepository.findAll().stream()
                        .filter(v -> plate.equalsIgnoreCase(v.getPlate()))
                        .collect(Collectors.toList())
                : vehicleRepository.findAll();

        // Simulações aprovadas do Módulo 1, por cliente — fonte do custo/km orçado
        Map<UUID, CostSimulation> approvedBudgets = costSimulationRepository
                .findByStatus(CostSimulationStatus.APPROVED).stream()
                .filter(s -> s.getClient() != null)
                .collect(Collectors.toMap(s -> s.getClient().getId(), Function.identity(), (a, b) -> a));

        List<VehicleTcoDTO> result = new ArrayList<>();
        for (Vehicle vehicle : vehicles) {
            result.add(buildVehicleTco(vehicle, periodStart, periodEnd, daysInPeriod, approvedBudgets));
        }
        log.info("Painel TCO gerado: {} veículo(s) no período {} a {}", result.size(), periodStart, periodEnd);
        return result;
    }

    private VehicleTcoDTO buildVehicleTco(Vehicle vehicle, LocalDate start, LocalDate end,
                                          long daysInPeriod, Map<UUID, CostSimulation> approvedBudgets) {
        VehicleTcoDTO dto = new VehicleTcoDTO();
        dto.setVehicleId(vehicle.getId());
        dto.setPlate(vehicle.getPlate());
        dto.setModel(vehicle.getModel());
        dto.setBrand(vehicle.getBrand());
        dto.setYear(vehicle.getYear());
        dto.setPeriodMonth(start.getMonthValue());
        dto.setPeriodYear(start.getYear());
        dto.setDaysInPeriod(daysInPeriod);

        // KM rodado no mês (fonte: Parte Diária — M5)
        Long kmRun = dailyLogRepository.sumKmRunByVehicleAndPeriod(vehicle.getId(), start, end);
        dto.setKmRunInMonth(kmRun != null ? kmRun : 0L);

        // Dias com apontamento
        Long daysWithLog = dailyLogRepository.countDistinctDaysByVehicleAndPeriod(vehicle.getId(), start, end);
        dto.setDaysWithLog(daysWithLog != null ? daysWithLog : 0L);

        // Oficina: OS do veículo no período (custo e paradas)
        List<FleetWorkOrder> orders = workOrderRepository.findByVehicleIdAndDeletedAtIsNull(vehicle.getId()).stream()
                .filter(o -> o.getActualDate() != null
                        ? !o.getActualDate().isBefore(start) && !o.getActualDate().isAfter(end)
                        : o.getCreatedAt() != null
                                && !o.getCreatedAt().toLocalDate().isBefore(start)
                                && !o.getCreatedAt().toLocalDate().isAfter(end))
                .collect(Collectors.toList());

        BigDecimal maintenanceCost = orders.stream()
                .map(FleetWorkOrder::getTotalCost)
                .filter(c -> c != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setMaintenanceCostInMonth(maintenanceCost);
        dto.setWorkOrdersInMonth((long) orders.size());

        long downtimeHours = orders.stream()
                .filter(o -> o.getStartDate() != null && o.getCompletionDate() != null)
                .mapToLong(o -> java.time.temporal.ChronoUnit.HOURS.between(o.getStartDate(), o.getCompletionDate()))
                .sum();
        dto.setDowntimeHoursInMonth(downtimeHours);

        // Custo Real/KM
        if (kmRun != null && kmRun > 0) {
            dto.setRealCostPerKm(maintenanceCost
                    .divide(BigDecimal.valueOf(kmRun), 4, RoundingMode.HALF_UP));
        } else {
            dto.setRealCostPerKm(null);
        }

        // Custo/KM orçado: simulação aprovada do M1 associada ao cliente do veículo
        CostSimulation budget = vehicle.getClientId() != null
                ? approvedBudgets.get(vehicle.getClientId())
                : null;
        if (budget != null && budget.getVariableCostPerKm() != null) {
            dto.setBudgetedCostPerKm(budget.getVariableCostPerKm());
        }

        // Variação real vs orçado
        if (dto.getRealCostPerKm() != null && dto.getBudgetedCostPerKm() != null
                && dto.getBudgetedCostPerKm().signum() > 0) {
            dto.setCostVariancePct(dto.getRealCostPerKm().subtract(dto.getBudgetedCostPerKm())
                    .divide(dto.getBudgetedCostPerKm(), 4, RoundingMode.HALF_UP));
        }

        evaluateRecommendation(dto);
        return dto;
    }

    /**
     * RF-06.4: regra de decisão — >20% acima do orçado OU >3 paradas no mês.
     */
    private void evaluateRecommendation(VehicleTcoDTO dto) {
        boolean overBudget = dto.getCostVariancePct() != null
                && dto.getCostVariancePct().compareTo(OVERBUDGET_THRESHOLD) > 0;
        boolean excessiveStops = dto.getWorkOrdersInMonth() != null
                && dto.getWorkOrdersInMonth() > MAX_MONTHLY_STOPS;

        dto.setOverBudget(overBudget);
        dto.setExcessiveStops(excessiveStops);

        if (overBudget || excessiveStops) {
            dto.setRecommendation("REPLACE");
            String reasons = overBudget && excessiveStops
                    ? "custo real/km " + formatPct(dto.getCostVariancePct()) + " acima do orçado e "
                            + dto.getWorkOrdersInMonth() + " paradas no mês"
                    : overBudget
                            ? "custo real/km " + formatPct(dto.getCostVariancePct()) + " acima do orçado no Módulo 1"
                            : dto.getWorkOrdersInMonth() + " paradas de oficina no mês (limite: " + MAX_MONTHLY_STOPS + ")";
            dto.setRecommendationMessage("ALERTA PRD: avaliar remanejamento para frota reserva ou venda (Tabela FIPE) — "
                    + reasons + ".");
        } else if (overBudget(dto) || (dto.getWorkOrdersInMonth() != null && dto.getWorkOrdersInMonth() >= 2)) {
            dto.setRecommendation("WATCH");
            dto.setRecommendationMessage("Monitorar de perto: indicadores próximos do limite PRD.");
        } else {
            dto.setRecommendation("NONE");
            dto.setRecommendationMessage("Dentro dos parâmetros do PRD.");
        }
    }

    private boolean overBudget(VehicleTcoDTO dto) {
        return dto.getCostVariancePct() != null
                && dto.getCostVariancePct().compareTo(new BigDecimal("0.10")) > 0;
    }

    private static String formatPct(BigDecimal fraction) {
        if (fraction == null) {
            return "—";
        }
        return fraction.multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP)
                .toPlainString() + "%";
    }
}
