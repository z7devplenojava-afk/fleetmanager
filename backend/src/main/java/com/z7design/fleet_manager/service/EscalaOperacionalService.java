package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.EscalaOperacionalDTO;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.model.EscalaOperacional;
import com.z7design.fleet_manager.model.LineTimeSlot;
import com.z7design.fleet_manager.model.Route;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.EscalaOperacionalRepository;
import com.z7design.fleet_manager.repository.RouteRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Escalas operacionais: agenda diaria de partidas por linha (PRD Viasao Sao Silvestre - Fase 2).
 *
 * Conflitos sao reportados no padrao {violacoes, alertas}:
 *  - violacoes: impedem a gravacao (motorista/veiculo em sobreposicao, motorista inativo,
 *    veiculo em manutencao/bloqueado);
 *  - alertas: apenas informativos (onibus com capacidade menor que a linha, horario fora
 *    dos horarios ativos da linha).
 */
@Service
@RequiredArgsConstructor
public class EscalaOperacionalService {

    private static final Set<String> VALID_STATUS = Set.of(
            EscalaOperacional.STATUS_PLANEJADA, EscalaOperacional.STATUS_CONFIRMADA,
            EscalaOperacional.STATUS_EXECUTANDO, EscalaOperacional.STATUS_CONCLUIDA,
            EscalaOperacional.STATUS_CANCELADA);

    /** Status que ocupam motorista/veiculo (geram conflito de sobreposicao). */
    private static final Set<String> ACTIVE_STATUS = Set.of(
            EscalaOperacional.STATUS_PLANEJADA, EscalaOperacional.STATUS_CONFIRMADA,
            EscalaOperacional.STATUS_EXECUTANDO);

    private static final long DEFAULT_DURATION_MINUTES = 60L;
    private static final String ROUTE_STATUS_ATIVA = "ATIVA";
    private static final String DRIVER_STATUS_ATIVO = "ATIVO";

    private final EscalaOperacionalRepository escalaRepository;
    private final RouteRepository routeRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final LineTimeSlotService lineTimeSlotService;

    @Transactional(readOnly = true)
    public List<EscalaOperacionalDTO> findAll(LocalDate date) {
        List<EscalaOperacional> escalas = date != null
                ? escalaRepository.findByScaleDateOrderByDepartureTimeAsc(date)
                : escalaRepository.findAll();
        return escalas.stream().map(EscalaOperacionalDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public EscalaOperacionalDTO findById(UUID id) {
        return EscalaOperacionalDTO.from(getEntity(id));
    }

    @Transactional
    public EscalaOperacionalDTO create(EscalaOperacional payload) {
        EscalaOperacional entity = resolve(payload);
        if (entity.getScaleDate() == null) {
            throw new IllegalArgumentException("A data da escala e obrigatoria.");
        }
        if (entity.getRoute() == null) {
            throw new IllegalArgumentException("A linha (routeId) e obrigatoria.");
        }
        if (entity.getDepartureTime() == null) {
            throw new IllegalArgumentException("O horario de partida e obrigatorio.");
        }
        if (payload.getStatus() != null && !VALID_STATUS.contains(payload.getStatus())) {
            throw new IllegalArgumentException("Status de escala invalido: " + payload.getStatus());
        }
        entity.setStatus(payload.getStatus() != null ? payload.getStatus() : EscalaOperacional.STATUS_PLANEJADA);
        entity.setOrigin(payload.getOrigin() != null ? payload.getOrigin() : EscalaOperacional.ORIGIN_MANUAL);
        entity.setCompanyId(TenantContext.get() != null ? TenantContext.get() : null);

        List<String> violacoes = checkViolations(entity, null);
        if (!violacoes.isEmpty()) {
            throw new IllegalArgumentException(String.join(" | ", violacoes));
        }
        return EscalaOperacionalDTO.from(escalaRepository.save(entity));
    }

    @Transactional
    public EscalaOperacionalDTO update(UUID id, EscalaOperacional payload) {
        EscalaOperacional entity = getEntity(id);
        EscalaOperacional candidate = resolve(payload);
        if (payload.getScaleDate() != null) {
            entity.setScaleDate(payload.getScaleDate());
        }
        if (candidate.getRoute() != null) {
            entity.setRoute(candidate.getRoute());
        }
        if (payload.getDepartureTime() != null) {
            entity.setDepartureTime(payload.getDepartureTime());
        }
        entity.setTimeSlot(candidate.getTimeSlot());
        entity.setVehicle(candidate.getVehicle());
        entity.setDriver(candidate.getDriver());
        if (payload.getStatus() != null) {
            if (!VALID_STATUS.contains(payload.getStatus())) {
                throw new IllegalArgumentException("Status de escala invalido: " + payload.getStatus());
            }
            entity.setStatus(payload.getStatus());
        }

        List<String> violacoes = checkViolations(entity, id);
        if (!violacoes.isEmpty()) {
            throw new IllegalArgumentException(String.join(" | ", violacoes));
        }
        return EscalaOperacionalDTO.from(escalaRepository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        escalaRepository.delete(getEntity(id));
    }

    /**
     * Dry-run de validacao: nao grava nada, retorna {violacoes, alertas}.
     */
    @Transactional(readOnly = true)
    public Map<String, List<String>> validate(EscalaOperacional payload) {
        EscalaOperacional candidate = resolve(payload);
        candidate.setScaleDate(payload.getScaleDate());
        candidate.setDepartureTime(payload.getDepartureTime());
        candidate.setStatus(payload.getStatus() != null ? payload.getStatus() : EscalaOperacional.STATUS_PLANEJADA);

        Map<String, List<String>> result = new LinkedHashMap<>();
        List<String> violacoes = new ArrayList<>();
        List<String> alertas = new ArrayList<>();

        if (candidate.getScaleDate() == null) {
            violacoes.add("A data da escala e obrigatoria.");
        }
        if (candidate.getRoute() == null) {
            violacoes.add("A linha (routeId) e obrigatoria.");
        }
        if (candidate.getDepartureTime() == null) {
            violacoes.add("O horario de partida e obrigatorio.");
        }
        if (candidate.getScaleDate() != null && candidate.getRoute() != null && candidate.getDepartureTime() != null) {
            checkConflicts(candidate, null, violacoes, alertas);
        }
        result.put("violacoes", violacoes);
        result.put("alertas", alertas);
        return result;
    }

    /**
     * Gera as escalas do dia a partir dos horarios ativos da data (apos excecoes de feriado).
     * Escalas ja existentes para (data, linha, horario) sao mantidas.
     */
    @Transactional
    public Map<String, Object> generate(LocalDate date) {
        if (date == null) {
            throw new IllegalArgumentException("A data e obrigatoria para gerar escalas.");
        }
        String dayType = lineTimeSlotService.resolveEffectiveDayType(date);
        List<LineTimeSlot> slots = lineTimeSlotService.findActiveSlotsForDate(date);
        int generated = 0;
        int skipped = 0;
        for (LineTimeSlot slot : slots) {
            Route route = slot.getRoute();
            if (route == null || !ROUTE_STATUS_ATIVA.equals(route.getStatus())) {
                skipped++;
                continue;
            }
            if (escalaRepository.existsByScaleDateAndRouteIdAndDepartureTime(
                    date, route.getId(), slot.getDepartureTime())) {
                skipped++;
                continue;
            }
            escalaRepository.save(EscalaOperacional.builder()
                    .companyId(TenantContext.get())
                    .scaleDate(date)
                    .route(route)
                    .timeSlot(slot)
                    .departureTime(slot.getDepartureTime())
                    .status(EscalaOperacional.STATUS_PLANEJADA)
                    .origin(EscalaOperacional.ORIGIN_GERADA)
                    .build());
            generated++;
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date", date.toString());
        result.put("dayType", dayType);
        result.put("generated", generated);
        result.put("skipped", skipped);
        return result;
    }

    // ---------------------------------------------------------------
    // Internos
    // ---------------------------------------------------------------

    private EscalaOperacional getEntity(UUID id) {
        return escalaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Escala nao encontrada com ID: " + id));
    }

    /** Resolve as referencias (linha, veiculo, motorista, horario) vindas do payload. */
    private EscalaOperacional resolve(EscalaOperacional payload) {
        EscalaOperacional entity = new EscalaOperacional();
        if (payload.getRoute() != null && payload.getRoute().getId() != null) {
            Route route = routeRepository.findById(payload.getRoute().getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Linha nao encontrada com ID: " + payload.getRoute().getId()));
            entity.setRoute(route);
        }
        if (payload.getVehicle() != null && payload.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(payload.getVehicle().getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Veiculo nao encontrado com ID: " + payload.getVehicle().getId()));
            entity.setVehicle(vehicle);
        }
        if (payload.getDriver() != null && payload.getDriver().getId() != null) {
            Driver driver = driverRepository.findById(payload.getDriver().getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Motorista nao encontrado com ID: " + payload.getDriver().getId()));
            entity.setDriver(driver);
        }
        if (payload.getTimeSlot() != null && payload.getTimeSlot().getId() != null) {
            LineTimeSlot slot = lineTimeSlotService.findById(payload.getTimeSlot().getId());
            entity.setTimeSlot(slot);
        }
        return entity;
    }

    private List<String> checkViolations(EscalaOperacional candidate, UUID ignoreId) {
        List<String> violacoes = new ArrayList<>();
        List<String> alertas = new ArrayList<>();
        checkConflicts(candidate, ignoreId, violacoes, alertas);
        return violacoes;
    }

    private void checkConflicts(EscalaOperacional candidate, UUID ignoreId,
                                List<String> violacoes, List<String> alertas) {
        LocalDate date = candidate.getScaleDate();
        Route route = candidate.getRoute();
        LocalTime departure = candidate.getDepartureTime();
        if (date == null || route == null || departure == null) {
            return;
        }

        // Status do cadastro
        if (candidate.getDriver() != null && !DRIVER_STATUS_ATIVO.equals(candidate.getDriver().getStatus())) {
            violacoes.add("Motorista " + candidate.getDriver().getName() + " esta INATIVO.");
        }
        if (candidate.getVehicle() != null && candidate.getVehicle().getStatus() != null
                && candidate.getVehicle().getStatus() != Vehicle.VehicleStatus.ACTIVE) {
            violacoes.add("Veiculo " + candidate.getVehicle().getPlate() + " nao esta ativo ("
                    + candidate.getVehicle().getStatus().name() + ").");
        }

        // Sobreposicao de agenda (motorista e veiculo)
        long startMin = toMinutes(departure);
        long endMin = startMin + durationMinutes(route);
        List<EscalaOperacional> sameDay = escalaRepository
                .findByScaleDateAndStatusNotOrderByDepartureTimeAsc(date, EscalaOperacional.STATUS_CANCELADA);
        for (EscalaOperacional other : sameDay) {
            if (ignoreId != null && ignoreId.equals(other.getId())) {
                continue;
            }
            if (!ACTIVE_STATUS.contains(other.getStatus())) {
                continue;
            }
            long otherStart = toMinutes(other.getDepartureTime());
            long otherEnd = otherStart + durationMinutes(other.getRoute());
            boolean overlap = startMin < otherEnd && otherStart < endMin;
            if (!overlap) {
                continue;
            }
            String window = other.getDepartureTime() + " as " + toTime(otherEnd);
            if (candidate.getDriver() != null && other.getDriver() != null
                    && candidate.getDriver().getId().equals(other.getDriver().getId())) {
                violacoes.add("Motorista " + candidate.getDriver().getName() + " ja escalado das " + window
                        + " na linha " + other.getRoute().getName() + ".");
            }
            if (candidate.getVehicle() != null && other.getVehicle() != null
                    && candidate.getVehicle().getId().equals(other.getVehicle().getId())) {
                violacoes.add("Veiculo " + candidate.getVehicle().getPlate() + " escalado das " + window
                        + " na linha " + other.getRoute().getName() + ".");
            }
        }

        // Alertas
        if (candidate.getVehicle() != null && route.getCapacity() != null
                && candidate.getVehicle().getPassengerCapacity() != null
                && candidate.getVehicle().getPassengerCapacity() < route.getCapacity()) {
            alertas.add("Onibus com capacidade " + candidate.getVehicle().getPassengerCapacity()
                    + " passageiros menor que a capacidade da linha (" + route.getCapacity() + ").");
        }
        if (candidate.getTimeSlot() == null) {
            boolean withinSlots = lineTimeSlotService.findActiveSlotsForDate(date).stream()
                    .anyMatch(s -> route.getId().equals(s.getRoute().getId())
                            && s.getDepartureTime().equals(departure));
            if (!withinSlots) {
                alertas.add("Horario " + departure + " fora dos horarios ativos da linha "
                        + route.getName() + " para " + date + ".");
            }
        }
    }

    private static long durationMinutes(Route route) {
        Duration duration = route != null ? route.getEstimatedDuration() : null;
        return duration != null ? duration.toMinutes() : DEFAULT_DURATION_MINUTES;
    }

    private static long toMinutes(LocalTime time) {
        return time.getHour() * 60L + time.getMinute();
    }

    private static LocalTime toTime(long minutesOfDay) {
        long normalized = minutesOfDay % (24 * 60L);
        return LocalTime.of((int) (normalized / 60), (int) (normalized % 60));
    }
}
