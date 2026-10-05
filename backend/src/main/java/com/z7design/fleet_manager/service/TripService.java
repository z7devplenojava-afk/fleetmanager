package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.TripEventDTO;
import com.z7design.fleet_manager.dto.TripFinishRequestDTO;
import com.z7design.fleet_manager.dto.TripOperacionalDTO;
import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.model.EscalaOperacional;
import com.z7design.fleet_manager.model.ParteDiaria;
import com.z7design.fleet_manager.model.Route;
import com.z7design.fleet_manager.model.Trip;
import com.z7design.fleet_manager.model.TripEvent;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.DailyLogRepository;
import com.z7design.fleet_manager.repository.EscalaOperacionalRepository;
import com.z7design.fleet_manager.repository.ParteDiariaRepository;
import com.z7design.fleet_manager.repository.TripEventRepository;
import com.z7design.fleet_manager.repository.TripRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing Trips and their lifecycle.
 * PRD Viasao Sao Silvestre - Fase 3: viagens operacionais ligadas as escalas.
 */
@Service
@RequiredArgsConstructor
public class TripService {

    private static final Set<Trip.TripStatus> ACTIVE_TRIP_STATUSES = Set.of(
            Trip.TripStatus.PLANNED, Trip.TripStatus.STARTING, Trip.TripStatus.BOARDING,
            Trip.TripStatus.ARRIVING, Trip.TripStatus.IN_PROGRESS, Trip.TripStatus.PAUSED);

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final TripRepository tripRepository;
    private final TripEventRepository tripEventRepository;
    private final EscalaOperacionalRepository escalaRepository;
    private final DailyLogRepository dailyLogRepository;
    private final ParteDiariaRepository parteDiariaRepository;

    // ---------------------------------------------------------------
    // Ciclo de vida (PRD VSS - Fase 3)
    // ---------------------------------------------------------------

    /** Cria a viagem a partir de uma escala operacional. */
    @Transactional
    public TripOperacionalDTO createFromScale(UUID scaleId) {
        EscalaOperacional escala = escalaRepository.findById(scaleId)
                .orElseThrow(() -> new IllegalArgumentException("Escala nao encontrada com ID: " + scaleId));
        if (tripRepository.existsByEscalaIdAndStatusIn(escala.getId(), ACTIVE_TRIP_STATUSES)) {
            throw new IllegalArgumentException("Ja existe uma viagem ativa para esta escala.");
        }
        Route route = escala.getRoute();
        Vehicle vehicle = escala.getVehicle();

        LocalTime arrival = null;
        if (route != null && route.getEstimatedDuration() != null && escala.getDepartureTime() != null) {
            arrival = escala.getDepartureTime().plus(route.getEstimatedDuration());
        }

        Trip trip = Trip.builder()
                .escala(escala)
                .route(route)
                .vehicle(vehicle)
                .driver(escala.getDriver())
                .tripDate(escala.getScaleDate())
                .plannedDepartureTime(escala.getDepartureTime())
                .plannedArrivalTime(arrival)
                .passengersExpected(route != null ? route.getCapacity() : null)
                .initialKm(vehicle != null ? vehicle.getCurrentMileage() : null)
                .status(Trip.TripStatus.PLANNED)
                .build();
        trip = tripRepository.save(trip);

        escala.setTripId(trip.getId());
        escalaRepository.save(escala);
        return TripOperacionalDTO.from(trip);
    }

    @Transactional(readOnly = true)
    public List<TripOperacionalDTO> findAll(LocalDate date, UUID routeId) {
        List<Trip> trips;
        if (date != null && routeId != null) {
            trips = tripRepository.findByTripDateAndRouteIdOrderByPlannedDepartureTimeAsc(date, routeId);
        } else if (date != null) {
            trips = tripRepository.findByTripDateOrderByPlannedDepartureTimeAsc(date);
        } else {
            trips = tripRepository.findAll();
        }
        return trips.stream().map(TripOperacionalDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public TripOperacionalDTO findById(UUID id) {
        return TripOperacionalDTO.from(getEntity(id));
    }

    @Transactional
    public TripOperacionalDTO confirmDriver(UUID id) {
        Trip trip = getEntity(id);
        requireStatus(trip, Set.of(Trip.TripStatus.PLANNED));
        trip.setDriverConfirmedAt(LocalDateTime.now());
        return TripOperacionalDTO.from(tripRepository.save(trip));
    }

    @Transactional
    public TripOperacionalDTO confirmVehicle(UUID id) {
        Trip trip = getEntity(id);
        requireStatus(trip, Set.of(Trip.TripStatus.PLANNED));
        trip.setVehicleConfirmedAt(LocalDateTime.now());
        return TripOperacionalDTO.from(tripRepository.save(trip));
    }

    @Transactional
    public TripOperacionalDTO start(UUID id) {
        Trip trip = getEntity(id);
        requireStatus(trip, Set.of(Trip.TripStatus.PLANNED));
        if (trip.getDriverConfirmedAt() == null || trip.getVehicleConfirmedAt() == null) {
            throw new IllegalArgumentException("Confirme o motorista e o veiculo antes de iniciar a viagem.");
        }
        trip.setStatus(Trip.TripStatus.BOARDING);
        trip.setStartTime(LocalDateTime.now());
        Trip saved = tripRepository.save(trip);
        updateEscalaStatus(saved, EscalaOperacional.STATUS_EXECUTANDO);
        recordEvent(saved, TripEvent.TripEventType.TRIP_START, "Viagem iniciada");
        return TripOperacionalDTO.from(saved);
    }

    @Transactional
    public TripOperacionalDTO arrive(UUID id) {
        Trip trip = getEntity(id);
        requireStatus(trip, Set.of(Trip.TripStatus.BOARDING));
        trip.setStatus(Trip.TripStatus.ARRIVING);
        return TripOperacionalDTO.from(tripRepository.save(trip));
    }

    /** Finaliza a viagem e gera o DailyLog + Parte Diaria encadeados. */
    @Transactional
    public TripOperacionalDTO finish(UUID id, TripFinishRequestDTO request) {
        Trip trip = getEntity(id);
        requireStatus(trip, Set.of(Trip.TripStatus.BOARDING, Trip.TripStatus.ARRIVING));
        if (request == null || request.getFinalKm() == null) {
            throw new IllegalArgumentException("O km final e obrigatorio para finalizar a viagem.");
        }
        if (trip.getInitialKm() != null && request.getFinalKm() < trip.getInitialKm()) {
            throw new IllegalArgumentException("O km final nao pode ser menor que o km inicial ("
                    + trip.getInitialKm() + ").");
        }
        if (trip.getVehicle() == null) {
            throw new IllegalArgumentException("A viagem nao possui veiculo atribuido; nao e possivel gerar a Parte Diaria.");
        }

        LocalDateTime now = LocalDateTime.now();
        trip.setFinalKm(request.getFinalKm());
        if (request.getPassengersRealized() != null) {
            trip.setPassengersRealized(request.getPassengersRealized());
        }
        if (request.getOccurrence() != null && !request.getOccurrence().isBlank()) {
            trip.setOccurrence(request.getOccurrence());
        }
        trip.setStatus(Trip.TripStatus.FINISHED);
        trip.setEndTime(now);
        Trip saved = tripRepository.save(trip);
        updateEscalaStatus(saved, EscalaOperacional.STATUS_CONCLUIDA);
        recordEvent(saved, TripEvent.TripEventType.TRIP_END, "Viagem finalizada");

        DailyLog dailyLog = createDailyLog(saved, now);
        ParteDiaria parteDiaria = createParteDiaria(saved, dailyLog, now);

        TripOperacionalDTO dto = TripOperacionalDTO.from(saved);
        dto.setDailyLogId(dailyLog.getId());
        dto.setParteDiariaId(parteDiaria.getId());
        dto.setParteDiariaNumber(parteDiaria.getNumber());
        return dto;
    }

    @Transactional
    public TripOperacionalDTO cancel(UUID id, String reason) {
        Trip trip = getEntity(id);
        requireStatus(trip, Set.of(Trip.TripStatus.PLANNED, Trip.TripStatus.BOARDING, Trip.TripStatus.ARRIVING));
        if (reason != null && !reason.isBlank()) {
            trip.setOccurrence(reason);
        }
        trip.setStatus(Trip.TripStatus.CANCELLED);
        trip.setEndTime(LocalDateTime.now());
        Trip saved = tripRepository.save(trip);
        updateEscalaStatus(saved, EscalaOperacional.STATUS_CANCELADA);
        return TripOperacionalDTO.from(saved);
    }

    // ---------------------------------------------------------------
    // Legado (viagens a partir de Schedule)
    // ---------------------------------------------------------------

    @Transactional
    public Trip startTrip(UUID scheduleId) {
        // Basic start trip logic - to be expanded
        Trip trip = Trip.builder()
                // .schedule(scheduleRepository.findById(scheduleId)...)
                .status(Trip.TripStatus.STARTING)
                .startTime(LocalDateTime.now())
                .build();

        trip = tripRepository.save(trip);

        recordEvent(trip, TripEvent.TripEventType.TRIP_START, "Viagem iniciada");

        return trip;
    }

    @Transactional(readOnly = true)
    public List<TripEventDTO> getEvents() {
        return tripEventRepository.findAllByOrderByTimestampDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private TripEventDTO convertToDTO(TripEvent event) {
        String tripName = "N/A";
        if (event.getTrip() != null && event.getTrip().getSchedule() != null
                && event.getTrip().getSchedule().getRoute() != null) {
            tripName = event.getTrip().getSchedule().getRoute().getName();
        }

        String driverName = "N/A";
        if (event.getDriver() != null) {
            driverName = event.getDriver().getName();
        } else if (event.getTrip() != null && event.getTrip().getSchedule() != null
                && event.getTrip().getSchedule().getEmployee() != null) {
            driverName = event.getTrip().getSchedule().getEmployee().getName();
        }

        String vehiclePlate = "N/A";
        if (event.getVehicle() != null) {
            vehiclePlate = event.getVehicle().getPlate();
        } else if (event.getTrip() != null && event.getTrip().getSchedule() != null
                && event.getTrip().getSchedule().getVehicle() != null) {
            vehiclePlate = event.getTrip().getSchedule().getVehicle().getPlate();
        }

        return TripEventDTO.builder()
                .id(event.getId())
                .tripId(event.getTrip() != null ? event.getTrip().getId() : null)
                .tripName(tripName)
                .type(event.getType())
                .timestamp(event.getTimestamp())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .observations(event.getObservations())
                .driverName(driverName)
                .vehiclePlate(vehiclePlate)
                .build();
    }

    @Transactional
    public void recordEvent(Trip trip, TripEvent.TripEventType type, String observations) {
        TripEvent event = TripEvent.builder()
                .trip(trip)
                .type(type)
                .timestamp(LocalDateTime.now())
                .observations(observations)
                .build();
        tripEventRepository.save(event);
    }

    // ---------------------------------------------------------------
    // Internos
    // ---------------------------------------------------------------

    private Trip getEntity(UUID id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Viagem nao encontrada com ID: " + id));
    }

    private static void requireStatus(Trip trip, Set<Trip.TripStatus> allowed) {
        if (!allowed.contains(trip.getStatus())) {
            throw new IllegalArgumentException("Acao nao permitida para a viagem no status " + trip.getStatus() + ".");
        }
    }

    private void updateEscalaStatus(Trip trip, String newStatus) {
        EscalaOperacional escala = trip.getEscala();
        if (escala != null) {
            escala.setStatus(newStatus);
            escalaRepository.save(escala);
        }
    }

    private DailyLog createDailyLog(Trip trip, LocalDateTime now) {
        Vehicle vehicle = trip.getVehicle();
        Route route = trip.getRoute();
        DailyLog log = new DailyLog();
        log.setTrip(trip);
        log.setDate(trip.getTripDate() != null ? trip.getTripDate() : now.toLocalDate());
        log.setVehicle(vehicle);
        log.setRoute(route != null ? route.getName() : null);
        log.setShift(route != null ? route.getShift() : null);
        log.setInitialKm(trip.getInitialKm() != null ? trip.getInitialKm() : 0);
        log.setFinalKm(trip.getFinalKm());
        log.setDriverName(trip.getDriver() != null ? trip.getDriver().getName() : null);
        log.setStartTime(trip.getStartTime() != null ? trip.getStartTime() : now);
        log.setEndTime(now);
        log.setActivityDescription("Viagem " + (route != null ? route.getName() : trip.getId())
                + " - partida " + (trip.getPlannedDepartureTime() != null ? trip.getPlannedDepartureTime().format(HH_MM) : "-"));
        log.setNotes(trip.getOccurrence());
        return dailyLogRepository.save(log);
    }

    private ParteDiaria createParteDiaria(Trip trip, DailyLog dailyLog, LocalDateTime now) {
        Vehicle vehicle = trip.getVehicle();
        ParteDiaria pd = new ParteDiaria();
        pd.setNumber("PD-" + String.format("%05d", System.currentTimeMillis() % 100000));
        pd.setCompanyId(TenantContext.get());
        pd.setDate(dailyLog.getDate());
        pd.setDailyLog(dailyLog);
        pd.setVehicle(vehicle);
        pd.setVehiclePlate(vehicle.getPlate());
        pd.setVehicleModel(vehicle.getBrand() != null && vehicle.getModel() != null
                ? vehicle.getBrand() + " " + vehicle.getModel()
                : vehicle.getModel());
        pd.setDriver(trip.getDriver());
        pd.setDriverName(trip.getDriver() != null ? trip.getDriver().getName() : "Motorista Operacional");
        pd.setRouteName(trip.getRoute() != null ? trip.getRoute().getName() : null);
        pd.setStartTime(trip.getPlannedDepartureTime() != null
                ? trip.getPlannedDepartureTime().format(HH_MM)
                : (trip.getStartTime() != null ? trip.getStartTime().format(HH_MM) : now.format(HH_MM)));
        pd.setEndTime(now.format(HH_MM));
        pd.setStartKm(trip.getInitialKm() != null ? BigDecimal.valueOf(trip.getInitialKm()) : BigDecimal.ZERO);
        pd.setEndKm(trip.getFinalKm() != null ? BigDecimal.valueOf(trip.getFinalKm()) : BigDecimal.ZERO);
        pd.setStatus("LANÇADA");
        pd.setNotes(trip.getOccurrence());
        pd.setCreatedBy("Operacao");
        pd.calculateKms();
        return parteDiariaRepository.save(pd);
    }
}
