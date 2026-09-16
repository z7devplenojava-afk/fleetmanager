package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.MeasurementCut;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.MeasurementBulletinRepository;
import com.z7design.fleet_manager.repository.MeasurementCutRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * MÓDULO 7 — RF-07.1: Cortes automáticos de manutenção no Boletim de Medição.
 * Matriz de rastreabilidade M6→M7: dias parados por oficina geram corte de diária
 * apenas quando NÃO houver atendimento por carro reserva (RF-03.4).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkshopCutService {

    private final FleetWorkOrderRepository workOrderRepository;
    private final MeasurementBulletinRepository bulletinRepository;
    private final MeasurementCutRepository cutRepository;
    private final VehicleRepository vehicleRepository;

    /**
     * Resultado do processamento de cortes de um veículo no período do boletim.
     */
    public record VehicleCutResult(
            UUID vehicleId,
            String plate,
            BigDecimal daysStopped,
            boolean reserveCovered,
            BigDecimal dailyRate,
            BigDecimal cutDays,
            BigDecimal cutAmount,
            String reason) {
    }

    /**
     * Aplica os cortes de oficina no boletim para o período contratual.
     * Idempotente: veículos que já possuem corte automático no boletim são ignorados.
     *
     * @return lista de resultados por veículo (cortados e isentos por carro reserva)
     */
    @Transactional
    public List<VehicleCutResult> applyWorkshopCuts(UUID bulletinId) {
        MeasurementBulletin bulletin = bulletinRepository.findById(bulletinId)
                .orElseThrow(() -> new IllegalArgumentException("Boletim não encontrado: " + bulletinId));

        LocalDate periodStart = bulletin.getPeriodStart();
        LocalDate periodEnd = bulletin.getPeriodEnd();
        if (periodStart == null || periodEnd == null || periodEnd.isBefore(periodStart)) {
            throw new IllegalArgumentException("Período do boletim inválido para cálculo de cortes");
        }

        // Idempotência: ignora veículos já cortados neste boletim
        Set<UUID> alreadyCutVehicleIds = new HashSet<>();
        for (MeasurementCut existing : cutRepository.findByBulletinId(bulletinId)) {
            if (existing.getVehicle() != null) {
                alreadyCutVehicleIds.add(existing.getVehicle().getId());
            }
        }

        List<Vehicle> fleet = vehicleRepository.findAll();
        List<VehicleCutResult> results = new ArrayList<>();

        for (Vehicle vehicle : fleet) {
            List<FleetWorkOrder> ordersInPeriod = workOrderRepository
                    .findByVehicleIdAndDeletedAtIsNull(vehicle.getId()).stream()
                    .filter(o -> stopWindowOverlapsPeriod(o, periodStart, periodEnd))
                    .toList();

            if (ordersInPeriod.isEmpty()) {
                continue;
            }

            BigDecimal totalStoppedDays = BigDecimal.ZERO;
            BigDecimal uncoveredDays = BigDecimal.ZERO;
            boolean anyCovered = false;

            for (FleetWorkOrder order : ordersInPeriod) {
                BigDecimal stoppedDays = stoppedDays(order, periodStart, periodEnd);
                if (stoppedDays.signum() <= 0) {
                    continue;
                }
                totalStoppedDays = totalStoppedDays.add(stoppedDays);
                if (Boolean.TRUE.equals(order.getReserveCovered())) {
                    anyCovered = true;
                } else {
                    uncoveredDays = uncoveredDays.add(stoppedDays);
                }
            }

            if (totalStoppedDays.signum() <= 0) {
                continue;
            }

            BigDecimal dailyRate = findDailyRate(bulletin, vehicle.getPlate());
            boolean reserveCovered = uncoveredDays.signum() == 0;

            if (alreadyCutVehicleIds.contains(vehicle.getId())) {
                results.add(new VehicleCutResult(vehicle.getId(), vehicle.getPlate(),
                        totalStoppedDays, reserveCovered, dailyRate, BigDecimal.ZERO, BigDecimal.ZERO,
                        "Corte já existente no boletim (processamento idempotente)"));
                continue;
            }

            // Corte apenas sobre os dias SEM carro reserva (corte proporcional)
            BigDecimal cutDays = uncoveredDays;
            BigDecimal cutAmount = dailyRate.multiply(cutDays).setScale(2, RoundingMode.HALF_UP);

            String reason = buildReason(ordersInPeriod, reserveCovered, anyCovered);

            if (cutAmount.signum() > 0) {
                MeasurementCut cut = new MeasurementCut();
                cut.setBulletin(bulletin);
                cut.setVehicle(vehicle);
                cut.setCutDays(cutDays);
                cut.setCutAmount(cutAmount);
                cut.setReason(reason);
                cutRepository.save(cut);
                log.info("M7: corte aplicado no boletim {} — placa {} dias parados {} valor {}",
                        bulletin.getId(), vehicle.getPlate(), cutDays, cutAmount);
            }

            results.add(new VehicleCutResult(vehicle.getId(), vehicle.getPlate(),
                    totalStoppedDays, reserveCovered, dailyRate, cutDays, cutAmount, reason));
        }

        return results;
    }

    /**
     * A janela de parada da OS (stopDate/actualDate → exitDate) intersecta o período do BM?
     * Uma OS iniciada antes do período porém ainda parada dentro dele também gera corte.
     * OS aberta (sem exitDate) só conta se a parada começou dentro do período.
     */
    private boolean stopWindowOverlapsPeriod(FleetWorkOrder order, LocalDate periodStart, LocalDate periodEnd) {
        LocalDate start = order.getStopDate() != null ? order.getStopDate() : order.getActualDate();
        if (start == null) {
            return false;
        }
        if (order.getExitDate() == null) {
            return !start.isBefore(periodStart) && !start.isAfter(periodEnd);
        }
        return !start.isAfter(periodEnd) && !order.getExitDate().isBefore(periodStart);
    }

    /**
     * Dias parados da OS intersectados com o período do boletim.
     * Janela: stopDate (ou actualDate) → exitDate (ou fim do período).
     */
    private BigDecimal stoppedDays(FleetWorkOrder order, LocalDate periodStart, LocalDate periodEnd) {
        LocalDate start = order.getStopDate() != null ? order.getStopDate() : order.getActualDate();
        if (start == null || start.isBefore(periodStart)) {
            start = periodStart;
        }
        LocalDate end = order.getExitDate();
        if (end == null || end.isAfter(periodEnd)) {
            end = periodEnd;
        }
        if (end.isBefore(start)) {
            return BigDecimal.ZERO;
        }
        long days = ChronoUnit.DAYS.between(start, end) + 1; // ambos os dias contam como parados
        return BigDecimal.valueOf(days);
    }

    /**
     * Diária contratada do veículo a partir dos itens do boletim (coluna diaria).
     */
    private BigDecimal findDailyRate(MeasurementBulletin bulletin, String plate) {
        if (plate == null) {
            return BigDecimal.ZERO;
        }
        return bulletin.getItems() == null ? BigDecimal.ZERO : bulletin.getItems().stream()
                .filter(i -> plate.equalsIgnoreCase(i.getVehiclePlate()))
                .map(i -> i.getDiaria() != null ? i.getDiaria() : BigDecimal.ZERO)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    private String buildReason(List<FleetWorkOrder> orders, boolean reserveCovered, boolean anyCovered) {
        String osNumbers = orders.stream()
                .map(FleetWorkOrder::getOsNumber)
                .filter(n -> n != null && !n.isBlank())
                .reduce((a, b) -> a + ", " + b)
                .orElse("OS sem número");
        if (reserveCovered) {
            return "Veículo parado para manutenção com atendimento por carro reserva — isento de corte (OS: " + osNumbers + ")";
        }
        if (anyCovered) {
            return "Paradas de oficina parcialmente sem carro reserva — corte proporcional aos dias descobertos (OS: " + osNumbers + ")";
        }
        return "Veículo parado para manutenção sem atendimento por carro reserva (OS: " + osNumbers + ")";
    }

    public List<MeasurementCut> getCuts(UUID bulletinId) {
        return cutRepository.findByBulletinId(bulletinId);
    }

    /**
     * Registra cobertura de carro reserva em uma OS (RF-03.4 → RF-07.1).
     */
    @Transactional
    public FleetWorkOrder registerReserveCover(UUID workOrderId, UUID reserveVehicleId, Integer responseMinutes) {
        Optional<FleetWorkOrder> orderOpt = workOrderRepository.findById(workOrderId);
        FleetWorkOrder order = orderOpt.orElseThrow(
                () -> new IllegalArgumentException("OS não encontrada: " + workOrderId));
        order.setReserveVehicleId(reserveVehicleId);
        order.setReserveCovered(reserveVehicleId != null);
        order.setReserveResponseMinutes(responseMinutes);
        return workOrderRepository.save(order);
    }
}
