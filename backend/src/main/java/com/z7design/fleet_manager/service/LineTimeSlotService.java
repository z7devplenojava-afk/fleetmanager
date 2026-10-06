package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.LineTimeSlot;
import com.z7design.fleet_manager.model.Route;
import com.z7design.fleet_manager.model.ScheduleDateOverride;
import com.z7design.fleet_manager.repository.LineTimeSlotRepository;
import com.z7design.fleet_manager.repository.RouteRepository;
import com.z7design.fleet_manager.repository.ScheduleDateOverrideRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Horarios de partida por linha e tipo de dia (PRD Viasao Sao Silvestre - Fase 1).
 */
@Service
@RequiredArgsConstructor
public class LineTimeSlotService {

    private static final Set<String> VALID_DAY_TYPES = Set.of(
            LineTimeSlot.DIA_UTIL, LineTimeSlot.SABADO, LineTimeSlot.DOMINGO_FERIADO);
    private static final Set<String> VALID_STATUSES = Set.of(
            LineTimeSlot.STATUS_ATIVO, LineTimeSlot.STATUS_INATIVO);

    private final LineTimeSlotRepository lineTimeSlotRepository;
    private final ScheduleDateOverrideRepository scheduleDateOverrideRepository;
    private final RouteRepository routeRepository;

    @Transactional(readOnly = true)
    public List<LineTimeSlot> findAll() {
        return lineTimeSlotRepository.findAllByOrderByDepartureTimeAsc();
    }

    @Transactional(readOnly = true)
    public List<LineTimeSlot> findByRoute(UUID routeId) {
        return lineTimeSlotRepository.findByRouteIdOrderByDepartureTimeAsc(routeId);
    }

    @Transactional(readOnly = true)
    public List<LineTimeSlot> findByRouteAndDayType(UUID routeId, String dayType) {
        return lineTimeSlotRepository.findByRouteIdAndDayTypeOrderByDepartureTimeAsc(routeId, dayType);
    }

    @Transactional(readOnly = true)
    public LineTimeSlot findById(UUID id) {
        return lineTimeSlotRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horario nao encontrado com ID: " + id));
    }

    @Transactional
    public LineTimeSlot create(LineTimeSlot slot) {
        validate(slot, null);
        Route route = routeRepository.findById(slot.getRoute().getId())
                .orElseThrow(() -> new IllegalArgumentException("Linha nao encontrada com ID: " + slot.getRoute().getId()));
        LineTimeSlot entity = LineTimeSlot.builder()
                .companyId(TenantContext.get() != null ? TenantContext.get() : route.getCompanyId())
                .route(route)
                .dayType(slot.getDayType())
                .departureTime(slot.getDepartureTime())
                .status(slot.getStatus() != null && VALID_STATUSES.contains(slot.getStatus())
                        ? slot.getStatus() : LineTimeSlot.STATUS_ATIVO)
                .build();
        return lineTimeSlotRepository.save(entity);
    }

    @Transactional
    public LineTimeSlot update(UUID id, LineTimeSlot details) {
        LineTimeSlot slot = findById(id);
        validate(details, id);
        Route route = slot.getRoute();
        if (details.getRoute() != null && details.getRoute().getId() != null
                && !details.getRoute().getId().equals(route.getId())) {
            route = routeRepository.findById(details.getRoute().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Linha nao encontrada com ID: " + details.getRoute().getId()));
            slot.setRoute(route);
        }
        slot.setDayType(details.getDayType());
        slot.setDepartureTime(details.getDepartureTime());
        if (details.getStatus() != null && VALID_STATUSES.contains(details.getStatus())) {
            slot.setStatus(details.getStatus());
        }
        return lineTimeSlotRepository.save(slot);
    }

    @Transactional
    public void delete(UUID id) {
        LineTimeSlot slot = findById(id);
        lineTimeSlotRepository.delete(slot);
    }

    private void validate(LineTimeSlot slot, UUID ignoreId) {
        if (slot.getRoute() == null || slot.getRoute().getId() == null) {
            throw new IllegalArgumentException("A linha (routeId) e obrigatoria.");
        }
        if (slot.getDayType() == null || !VALID_DAY_TYPES.contains(slot.getDayType())) {
            throw new IllegalArgumentException("Tipo de dia invalido. Use DIA_UTIL, SABADO ou DOMINGO_FERIADO.");
        }
        if (slot.getDepartureTime() == null) {
            throw new IllegalArgumentException("O horario de partida e obrigatorio.");
        }
        boolean duplicate = ignoreId == null
                ? lineTimeSlotRepository.existsByRouteIdAndDayTypeAndDepartureTime(
                        slot.getRoute().getId(), slot.getDayType(), slot.getDepartureTime())
                : lineTimeSlotRepository.existsByRouteIdAndDayTypeAndDepartureTimeAndIdNot(
                        slot.getRoute().getId(), slot.getDayType(), slot.getDepartureTime(), ignoreId);
        if (duplicate) {
            throw new IllegalArgumentException("Ja existe horario " + slot.getDepartureTime()
                    + " para esta linha no tipo de dia " + slot.getDayType() + ".");
        }
    }

    // ---------------------------------------------------------------
    // Excecoes de calendario (feriado -> horario de domingo)
    // ---------------------------------------------------------------

    public List<ScheduleDateOverride> findAllOverrides() {
        return scheduleDateOverrideRepository.findAll();
    }

    @Transactional
    public ScheduleDateOverride saveOverride(ScheduleDateOverride override) {
        if (override.getOverrideDate() == null) {
            throw new IllegalArgumentException("A data da excecao e obrigatoria.");
        }
        if (override.getAppliesDayType() == null || !VALID_DAY_TYPES.contains(override.getAppliesDayType())) {
            throw new IllegalArgumentException("Tipo de dia da excecao invalido.");
        }
        scheduleDateOverrideRepository.findByOverrideDate(override.getOverrideDate()).ifPresent(existing -> {
            override.setId(existing.getId());
        });
        if (override.getCompanyId() == null) {
            override.setCompanyId(TenantContext.get());
        }
        return scheduleDateOverrideRepository.save(override);
    }

    @Transactional
    public void deleteOverride(UUID id) {
        ScheduleDateOverride override = scheduleDateOverrideRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Excecao nao encontrada com ID: " + id));
        scheduleDateOverrideRepository.delete(override);
    }

    /**
     * Resolve o tipo de dia efetivo de uma data, considerando excecoes
     * (ex.: feriado utiliza horarios de DOMINGO_FERIADO).
     */
    public String resolveEffectiveDayType(LocalDate date) {
        return scheduleDateOverrideRepository.findByOverrideDate(date)
                .map(ScheduleDateOverride::getAppliesDayType)
                .orElseGet(() -> defaultDayType(date));
    }

    private static String defaultDayType(LocalDate date) {
        return switch (date.getDayOfWeek().getValue()) {
            case 6 -> LineTimeSlot.SABADO;
            case 7 -> LineTimeSlot.DOMINGO_FERIADO;
            default -> LineTimeSlot.DIA_UTIL;
        };
    }

    /**
     * Horarios ativos de uma data (apos excecoes), ordenados.
     */
    public List<LineTimeSlot> findActiveSlotsForDate(LocalDate date) {
        String dayType = resolveEffectiveDayType(date);
        return lineTimeSlotRepository.findByDayTypeOrderByDepartureTimeAsc(dayType).stream()
                .filter(s -> LineTimeSlot.STATUS_ATIVO.equals(s.getStatus()))
                .toList();
    }
}
