package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ScheduleDTO;
import com.z7design.fleet_manager.dto.EmployeeScheduleDTO;
import com.z7design.fleet_manager.dto.CreateScheduleDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Schedule;
import com.z7design.fleet_manager.model.EmployeeSchedule;
import com.z7design.fleet_manager.model.Location;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.Position;
import com.z7design.fleet_manager.model.Route;
import com.z7design.fleet_manager.model.Patrol;
import com.z7design.fleet_manager.repository.ScheduleRepository;
import com.z7design.fleet_manager.repository.EmployeeScheduleRepository;
import com.z7design.fleet_manager.repository.LocationRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.PositionRepository;
import com.z7design.fleet_manager.repository.RouteRepository;
import com.z7design.fleet_manager.repository.PatrolRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.TravelTrip;
import com.z7design.fleet_manager.repository.TravelTripRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final EmployeeScheduleRepository employeeScheduleRepository;
    private final LocationRepository locationRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkPostRepository workPostRepository;
    private final PositionRepository positionRepository;
    private final RouteRepository routeRepository;
    private final PatrolRepository patrolRepository;
    private final UnitRepository unitRepository;
    private final VehicleRepository vehicleRepository;
    private final TravelTripRepository travelTripRepository;
    private final DriverJourneyService driverJourneyService;

    @Transactional
    public Schedule create(Schedule schedule) {
        return scheduleRepository.save(schedule);
    }

    @Transactional
    public Schedule createFromDTO(CreateScheduleDTO dto) {
        try {
            if (dto.getLocationId() == null && dto.getWorkPostId() == null
                    && dto.getTravelTripId() == null && dto.getRouteId() == null) {
                throw new IllegalArgumentException("Rota, Viagem, Posto de Trabalho ou Localização é obrigatório");
            }

            Employee employee = employeeRepository.findById(dto.getEmployeeId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Employee not found with ID: " + dto.getEmployeeId()));

            Location location = null;
            WorkPost workPost = null;

            if (dto.getWorkPostId() != null) {
                workPost = workPostRepository.findById(dto.getWorkPostId()).orElse(null);
            }

            if (location == null && dto.getLocationId() != null && workPost == null) {
                location = locationRepository.findById(dto.getLocationId()).orElse(null);
                if (location == null) {
                    workPost = workPostRepository.findById(dto.getLocationId()).orElse(null);
                }
            }

            if (workPost != null) {
                if (dto.getLocationId() != null) {
                    location = locationRepository.findById(dto.getLocationId()).orElse(null);
                }

                if (location == null) {
                    List<Location> allLocations = locationRepository.findAll();
                    for (Location loc : allLocations) {
                        if (loc.getName() != null && loc.getName().equals(workPost.getName())) {
                            location = loc;
                            break;
                        }
                    }
                }

                if (location == null && workPost.getClient() != null) {
                    List<Unit> units = unitRepository.findByClientId(workPost.getClient().getId());
                    for (Unit unit : units) {
                        List<Location> unitLocations = locationRepository.findByUnitId(unit.getId());
                        if (!unitLocations.isEmpty()) {
                            location = unitLocations.get(0);
                            break;
                        }
                    }
                }

                if (location == null && workPost.getClient() != null) {
                    List<Unit> units = unitRepository.findByClientId(workPost.getClient().getId());
                    Unit unit = units.isEmpty() ? null : units.get(0);

                    if (unit == null) {
                        String unitName = workPost.getClient().getName() != null
                                ? "Unidade Principal - " + workPost.getClient().getName()
                                : "Unidade Principal";
                        String unitAddress = (workPost.getAddress() != null && !workPost.getAddress().trim().isEmpty())
                                ? workPost.getAddress()
                                : "Endereço não informado";

                        unit = Unit.builder()
                                .name(unitName)
                                .description("Unidade criada automaticamente para o Cliente: " +
                                        (workPost.getClient().getName() != null ? workPost.getClient().getName()
                                                : "Sem nome"))
                                .address(unitAddress)
                                .client(workPost.getClient())
                                .active(true)
                                .build();
                        unit = unitRepository.save(unit);
                    }

                    if (unit != null) {
                        List<Location> existingLocations = locationRepository.findByUnitId(unit.getId());
                        for (Location loc : existingLocations) {
                            if (loc.getName() != null && loc.getName().equals(workPost.getName())) {
                                location = loc;
                                break;
                            }
                        }

                        if (location == null) {
                            String address = (workPost.getAddress() != null && !workPost.getAddress().trim().isEmpty())
                                    ? workPost.getAddress()
                                    : "Endereço não informado";

                            location = Location.builder()
                                    .name(workPost.getName())
                                    .description("Location criada automaticamente para o Posto de Trabalho: "
                                            + workPost.getName())
                                    .address(address)
                                    .unit(unit)
                                    .build();
                            location = locationRepository.save(location);
                        }
                    }
                }
            }

            if (location == null && dto.getLocationId() != null) {
                location = locationRepository.findById(dto.getLocationId()).orElse(null);
            }

            if (location == null && dto.getTravelTripId() == null && dto.getRouteId() == null && workPost == null) {
                if (dto.getLocationId() != null) {
                    throw new EntityNotFoundException(
                            "Location not found with ID: " + dto.getLocationId() +
                                    ". Se você forneceu um workPostId, verifique se ele está correto.");
                } else {
                    throw new EntityNotFoundException("Rota, Viagem, Posto de Trabalho ou Localização é obrigatório");
                }
            }

            TravelTrip travelTrip = null;
            if (dto.getTravelTripId() != null) {
                travelTrip = travelTripRepository.findById(dto.getTravelTripId()).orElse(null);
            }

            Schedule schedule = Schedule.builder()
                    .employee(employee)
                    .location(location)
                    .workPost(workPost)
                    .travelTrip(travelTrip)
                    .legs(dto.getLegs())
                    .scheduleDate(dto.getScheduleDate())
                    .shift(dto.getShift())
                    .startTime(dto.getStartTime())
                    .endTime(dto.getEndTime())
                    .initialKm(dto.getInitialKm())
                    .finalKm(dto.getFinalKm())
                    .pointStatus(dto.getPointStatus() != null ? dto.getPointStatus() : "NONE")
                    .pointJustification(dto.getPointJustification())
                    .tripPhotosJson(dto.getTripPhotosJson())
                    .clientName(dto.getClientName())
                    .routeCode(dto.getRouteCode())
                    .passengersCount(dto.getPassengersCount())
                    .status(dto.getStatus())
                    .observations(dto.getObservations())
                    .route(dto.getRouteId() != null ? routeRepository.findById(dto.getRouteId()).orElse(null) : null)
                    .vehicle(dto.getVehicleId() != null ? vehicleRepository.findById(dto.getVehicleId()).orElse(null)
                            : null)
                    .build();

            if (employee.getUser() != null) {
                LocalDateTime start = resolveScheduleDateTime(dto.getScheduleDate(), dto.getStartTime(), dto.getShift(), true);
                LocalDateTime end = resolveScheduleDateTime(dto.getScheduleDate(), dto.getEndTime(), dto.getShift(), false);
                if (!end.isAfter(start)) {
                    end = end.plusDays(1);
                }

                try {
                    driverJourneyService.validateJourney(employee.getUser().getId(), start, end, null);
                } catch (IllegalArgumentException e) {
                    log.warn("Validação de jornada: {} - Permitindo criação da escala", e.getMessage());
                }
            }

            Schedule savedSchedule = scheduleRepository.save(schedule);

            if (employee.getUser() != null) {
                LocalDateTime journeyStart = resolveScheduleDateTime(dto.getScheduleDate(), dto.getStartTime(), dto.getShift(), true);
                LocalDateTime journeyEnd = resolveScheduleDateTime(dto.getScheduleDate(), dto.getEndTime(), dto.getShift(), false);
                if (!journeyEnd.isAfter(journeyStart)) {
                    journeyEnd = journeyEnd.plusDays(1);
                }

                try {
                    driverJourneyService.syncFromSchedule(savedSchedule.getId(), employee.getUser().getId(),
                            journeyStart, journeyEnd, "Schedule " + savedSchedule.getId());
                } catch (Exception e) {
                    log.warn("Falha ao sincronizar DriverJourney: {}", e.getMessage());
                }
            }

            return savedSchedule;
        } catch (Exception e) {
            log.error("Erro ao criar Schedule: {}", e.getMessage(), e);
            throw e;
        }
    }

    private LocalDateTime resolveScheduleDateTime(
            LocalDate date,
            String timeStr,
            com.z7design.fleet_manager.model.enums.Shift shift,
            boolean isStart) {
        LocalDate baseDate = date != null ? date : LocalDate.now();
        if (timeStr != null && timeStr.trim().length() >= 5) {
            try {
                LocalTime lt = LocalTime.parse(timeStr.trim().substring(0, 5));
                return LocalDateTime.of(baseDate, lt);
            } catch (Exception ignored) {
            }
        }
        if (shift == com.z7design.fleet_manager.model.enums.Shift.NIGHT) {
            return isStart ? baseDate.atTime(22, 0) : baseDate.plusDays(1).atTime(6, 0);
        }
        if (shift == com.z7design.fleet_manager.model.enums.Shift.MIXED) {
            return isStart ? baseDate.atTime(14, 0) : baseDate.atTime(22, 0);
        }
        return isStart ? baseDate.atTime(8, 0) : baseDate.atTime(17, 0);
    }

    @Transactional
    public Schedule updateFromDTO(UUID id, CreateScheduleDTO dto) {
        Schedule existingSchedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));

        if (dto.getEmployeeId() != null) {
            employeeRepository.findById(dto.getEmployeeId())
                    .ifPresent(existingSchedule::setEmployee);
        }
        if (dto.getScheduleDate() != null) {
            existingSchedule.setScheduleDate(dto.getScheduleDate());
        }
        if (dto.getShift() != null) {
            existingSchedule.setShift(dto.getShift());
        }
        if (dto.getStartTime() != null) {
            existingSchedule.setStartTime(dto.getStartTime());
        }
        if (dto.getEndTime() != null) {
            existingSchedule.setEndTime(dto.getEndTime());
        }
        if (dto.getStatus() != null) {
            existingSchedule.setStatus(dto.getStatus());
        }
        if (dto.getLegs() != null) {
            existingSchedule.setLegs(dto.getLegs());
        }
        if (dto.getObservations() != null) {
            existingSchedule.setObservations(dto.getObservations());
        }
        if (dto.getWorkPostId() != null) {
            WorkPost wp = workPostRepository.findById(dto.getWorkPostId()).orElse(null);
            existingSchedule.setWorkPost(wp);
        }
        if (dto.getLocationId() != null) {
            Location loc = locationRepository.findById(dto.getLocationId()).orElse(null);
            if (loc != null) {
                existingSchedule.setLocation(loc);
            }
        }
        if (dto.getTravelTripId() != null) {
            TravelTrip tt = travelTripRepository.findById(dto.getTravelTripId()).orElse(null);
            existingSchedule.setTravelTrip(tt);
        }
        if (dto.getRouteId() != null) {
            Route route = routeRepository.findById(dto.getRouteId()).orElse(null);
            existingSchedule.setRoute(route);
        }
        if (dto.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId()).orElse(null);
            existingSchedule.setVehicle(vehicle);
        }
        if (dto.getInitialKm() != null) {
            existingSchedule.setInitialKm(dto.getInitialKm());
        }
        if (dto.getFinalKm() != null) {
            existingSchedule.setFinalKm(dto.getFinalKm());
        }
        if (dto.getPointStatus() != null) {
            existingSchedule.setPointStatus(dto.getPointStatus());
        }
        if (dto.getPointJustification() != null) {
            existingSchedule.setPointJustification(dto.getPointJustification());
        }
        if (dto.getTripPhotosJson() != null) {
            existingSchedule.setTripPhotosJson(dto.getTripPhotosJson());
        }
        if (dto.getClientName() != null) {
            existingSchedule.setClientName(dto.getClientName());
        }
        if (dto.getRouteCode() != null) {
            existingSchedule.setRouteCode(dto.getRouteCode());
        }
        if (dto.getPassengersCount() != null) {
            existingSchedule.setPassengersCount(dto.getPassengersCount());
        }

        Schedule saved = scheduleRepository.save(existingSchedule);

        if (saved.getEmployee() != null && saved.getEmployee().getUser() != null && saved.getScheduleDate() != null) {
            try {
                LocalDateTime start = resolveScheduleDateTime(saved.getScheduleDate(), saved.getStartTime(), saved.getShift(), true);
                LocalDateTime end = resolveScheduleDateTime(saved.getScheduleDate(), saved.getEndTime(), saved.getShift(), false);
                if (!end.isAfter(start)) {
                    end = end.plusDays(1);
                }
                driverJourneyService.syncFromSchedule(saved.getId(), saved.getEmployee().getUser().getId(), start, end,
                        "Schedule " + saved.getId());
            } catch (Exception e) {
                log.warn("Falha ao sincronizar DriverJourney na atualização: {}", e.getMessage());
            }
        }

        return saved;
    }

    @Transactional
    public Schedule registerPoint(
            UUID id,
            Double initialKm,
            Boolean forgotPoint,
            String justification,
            String photosJson,
            String startTime,
            String endTime,
            String clientName,
            String routeCode,
            Integer passengersCount,
            UUID vehicleId) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));

        LocalDateTime now = LocalDateTime.now();
        boolean isWithinTolerance = true;

        if (Boolean.TRUE.equals(forgotPoint)) {
            isWithinTolerance = false;
        }

        if (!isWithinTolerance && (justification == null || justification.isBlank())) {
            justification = "Registro realizado fora da tolerância de horário pelo motorista";
        }

        if (initialKm != null) {
            schedule.setInitialKm(initialKm);
        }
        if (startTime != null && !startTime.isBlank()) {
            schedule.setStartTime(startTime);
        }
        if (endTime != null && !endTime.isBlank()) {
            schedule.setEndTime(endTime);
        }
        if (clientName != null && !clientName.isBlank()) {
            schedule.setClientName(clientName);
        }
        if (routeCode != null && !routeCode.isBlank()) {
            schedule.setRouteCode(routeCode);
        }
        if (passengersCount != null) {
            schedule.setPassengersCount(passengersCount);
        }
        if (vehicleId != null) {
            vehicleRepository.findById(vehicleId).ifPresent(schedule::setVehicle);
        }
        if (photosJson != null && !photosJson.isBlank()) {
            schedule.setTripPhotosJson(photosJson);
        }
        schedule.setPointRegisteredAt(now);

        if (isWithinTolerance) {
            schedule.setPointStatus("APPROVED");
            schedule.setStatus(com.z7design.fleet_manager.model.enums.ScheduleStatus.IN_PROGRESS);
        } else {
            schedule.setPointStatus("PENDING_TRAFFIC_APPROVAL");
            schedule.setPointJustification(justification);
        }

        return scheduleRepository.save(schedule);
    }

    @Transactional
    public Schedule approvePoint(UUID id, boolean approved, String approvedBy, String managerNotes) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));

        schedule.setPointApprovedBy(approvedBy != null ? approvedBy : "Gestor de Tráfego");
        schedule.setPointApprovedAt(LocalDateTime.now());

        if (approved) {
            schedule.setPointStatus("APPROVED");
            if (schedule.getFinalKm() != null) {
                schedule.setStatus(com.z7design.fleet_manager.model.enums.ScheduleStatus.COMPLETED);
            } else {
                schedule.setStatus(com.z7design.fleet_manager.model.enums.ScheduleStatus.IN_PROGRESS);
            }
        } else {
            schedule.setPointStatus("REJECTED");
            if (managerNotes != null && !managerNotes.isBlank()) {
                String obs = schedule.getObservations() != null ? schedule.getObservations() + " | " : "";
                schedule.setObservations(obs + "Ponto rejeitado: " + managerNotes);
            }
        }

        return scheduleRepository.save(schedule);
    }

    @Transactional
    public Schedule finishTrip(
            UUID id,
            Double finalKm,
            String photosJson,
            String observations,
            String endTime,
            Integer passengersCount) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));

        if (finalKm == null) {
            throw new IllegalArgumentException("KM Final é obrigatório para finalizar a viagem.");
        }
        if (schedule.getInitialKm() != null && finalKm < schedule.getInitialKm()) {
            throw new IllegalArgumentException(
                    "O KM Final não pode ser menor que o KM Inicial (" + schedule.getInitialKm() + ").");
        }

        schedule.setFinalKm(finalKm);
        if (endTime != null && !endTime.isBlank()) {
            schedule.setEndTime(endTime);
        }
        if (passengersCount != null) {
            schedule.setPassengersCount(passengersCount);
        }
        if (photosJson != null && !photosJson.isBlank()) {
            schedule.setTripPhotosJson(photosJson);
        }
        if (observations != null && !observations.isBlank()) {
            schedule.setObservations(observations);
        }

        if (!"PENDING_TRAFFIC_APPROVAL".equals(schedule.getPointStatus())) {
            schedule.setStatus(com.z7design.fleet_manager.model.enums.ScheduleStatus.COMPLETED);
        }

        return scheduleRepository.save(schedule);
    }

    @Transactional
    public Schedule update(UUID id, Schedule schedule) {
        Schedule existingSchedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));

        if (schedule.getEmployee() != null) {
            existingSchedule.setEmployee(schedule.getEmployee());
        }
        if (schedule.getScheduleDate() != null) {
            existingSchedule.setScheduleDate(schedule.getScheduleDate());
        }
        if (schedule.getShift() != null) {
            existingSchedule.setShift(schedule.getShift());
        }
        if (schedule.getStartTime() != null) {
            existingSchedule.setStartTime(schedule.getStartTime());
        }
        if (schedule.getEndTime() != null) {
            existingSchedule.setEndTime(schedule.getEndTime());
        }
        if (schedule.getLocation() != null) {
            existingSchedule.setLocation(schedule.getLocation());
        }
        if (schedule.getWorkPost() != null) {
            existingSchedule.setWorkPost(schedule.getWorkPost());
        }
        if (schedule.getTravelTrip() != null) {
            existingSchedule.setTravelTrip(schedule.getTravelTrip());
        }
        if (schedule.getStatus() != null) {
            existingSchedule.setStatus(schedule.getStatus());
        }
        if (schedule.getRoute() != null) {
            existingSchedule.setRoute(schedule.getRoute());
        }
        if (schedule.getPatrol() != null) {
            existingSchedule.setPatrol(schedule.getPatrol());
        }
        if (schedule.getVehicle() != null) {
            existingSchedule.setVehicle(schedule.getVehicle());
        }
        if (schedule.getObservations() != null) {
            existingSchedule.setObservations(schedule.getObservations());
        }

        return scheduleRepository.save(existingSchedule);
    }

    @Transactional
    public void delete(UUID id) {
        try {
            driverJourneyService.deleteByScheduleId(id);

            List<EmployeeSchedule> employeeSchedules = employeeScheduleRepository.findByScheduleId(id);
            if (!employeeSchedules.isEmpty()) {
                employeeScheduleRepository.deleteAll(employeeSchedules);
            }

            scheduleRepository.deleteById(id);
        } catch (org.hibernate.FetchNotFoundException
                | org.springframework.orm.jpa.JpaObjectRetrievalFailureException e) {
            try {
                scheduleRepository.deleteByIdNative(id);
            } catch (Exception e2) {
                throw new RuntimeException("Erro ao excluir escala: " + e2.getMessage(), e2);
            }
        } catch (jakarta.persistence.EntityNotFoundException e) {
            throw new EntityNotFoundException("Schedule not found with ID: " + id);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException(
                    "Não é possível excluir esta escala pois ela possui relacionamentos que impedem a exclusão.",
                    e);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao excluir escala: " + e.getMessage(), e);
        }
    }

    public Schedule findById(UUID id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));
    }

    public List<Schedule> findByEmployeeId(UUID employeeId) {
        return scheduleRepository.findByEmployeeId(employeeId);
    }

    public List<Schedule> findByDate(LocalDate date) {
        return scheduleRepository.findByScheduleDate(date);
    }

    @Transactional(readOnly = true)
    public Employee resolveEmployeeForUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResourceNotFoundException("Usuário não autenticado");
        }

        try {
            Optional<Employee> byUserId = employeeRepository.findByUserId(user.getId());
            if (byUserId.isPresent()) {
                return byUserId.get();
            }
        } catch (Exception ignored) {
        }

        try {
            Optional<Employee> byUserGlobal = employeeRepository.findByUserIdGlobal(user.getId());
            if (byUserGlobal.isPresent()) {
                return byUserGlobal.get();
            }
        } catch (Exception ignored) {
        }

        try {
            Optional<Employee> byUser = employeeRepository.findByUser(user).stream().findFirst();
            if (byUser.isPresent()) {
                return byUser.get();
            }
        } catch (Exception ignored) {
        }

        if (user.getName() != null && !user.getName().isBlank()) {
            String trimmedName = user.getName().trim();
            try {
                Optional<Employee> byExact = employeeRepository.findByNameExactGlobal(trimmedName);
                if (byExact.isPresent()) {
                    return byExact.get();
                }
            } catch (Exception ignored) {
            }
            try {
                List<Employee> byContaining = employeeRepository.findByNameContainingIgnoreCase(trimmedName);
                if (!byContaining.isEmpty()) {
                    return byContaining.get(0);
                }
            } catch (Exception ignored) {
            }

            // Fallback por primeiro nome + correspondência flexível (ex: Fernando Silva Santos <-> Fernando Santos)
            try {
                String[] words = normalizeNameForMatch(trimmedName).split("\\s+");
                if (words.length > 0 && words[0].length() > 2) {
                    List<Employee> candidates = employeeRepository.findByNameContainingIgnoreCase(words[0]);
                    for (Employee cand : candidates) {
                        if (cand != null && isDriverNameMatch(trimmedName, cand.getName())) {
                            return cand;
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        throw new ResourceNotFoundException(
                "Funcionário não vinculado ao seu usuário. Solicite ao RH o vínculo do perfil para acessar suas escalas.");
    }

    private String normalizeNameForMatch(String name) {
        if (name == null) return "";
        String normalized = java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.trim().toLowerCase();
    }

    private boolean isPreposition(String word) {
        if (word == null) return false;
        String w = word.trim().toLowerCase();
        return w.equals("de") || w.equals("da") || w.equals("do") || w.equals("das") || w.equals("dos") || w.equals("e");
    }

    private boolean isDriverNameMatch(String nameA, String nameB) {
        if (nameA == null || nameB == null) return false;
        String a = normalizeNameForMatch(nameA);
        String b = normalizeNameForMatch(nameB);
        if (a.isEmpty() || b.isEmpty()) return false;
        if (a.equals(b) || a.contains(b) || b.contains(a)) return true;

        String[] tokensA = java.util.Arrays.stream(a.split("\\s+"))
                .filter(t -> t.length() > 2 && !isPreposition(t))
                .toArray(String[]::new);
        String[] tokensB = java.util.Arrays.stream(b.split("\\s+"))
                .filter(t -> t.length() > 2 && !isPreposition(t))
                .toArray(String[]::new);

        if (tokensA.length == 0 || tokensB.length == 0) return false;

        // Primeiro nome deve coincidir (ex: Fernando)
        if (!tokensA[0].equals(tokensB[0])) return false;

        // Se um deles só tem primeiro nome
        if (tokensA.length == 1 || tokensB.length == 1) return true;

        // Se o último sobrenome coincide (ex: Santos)
        if (tokensA[tokensA.length - 1].equals(tokensB[tokensB.length - 1])) return true;

        // Ou se qualquer outro token relevante coincide
        for (int i = 1; i < tokensA.length; i++) {
            for (int j = 1; j < tokensB.length; j++) {
                if (tokensA[i].equals(tokensB[j])) return true;
            }
        }
        return false;
    }

    @Transactional(readOnly = true)
    public List<Schedule> findMySchedules(User user, LocalDate startDate, LocalDate endDate) {
        if (user == null) {
            return java.util.Collections.emptyList();
        }

        java.util.Set<UUID> employeeIds = new java.util.HashSet<>();
        String userName = user.getName() != null ? user.getName().trim() : "";

        try {
            Employee resolved = resolveEmployeeForUser(user);
            if (resolved != null && resolved.getId() != null) {
                employeeIds.add(resolved.getId());
            }
        } catch (Exception ignored) {
        }

        if (!userName.isBlank()) {
            try {
                String[] words = normalizeNameForMatch(userName).split("\\s+");
                if (words.length > 0 && words[0].length() > 2) {
                    List<Employee> matchingByName = employeeRepository.findByNameContainingIgnoreCase(words[0]);
                    for (Employee emp : matchingByName) {
                        if (emp.getId() != null && isDriverNameMatch(userName, emp.getName())) {
                            employeeIds.add(emp.getId());
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        List<Schedule> allSchedules = findAll();

        return allSchedules.stream()
                .filter(s -> {
                    String empName = s.getEmployee() != null ? s.getEmployee().getName() : null;
                    UUID empId = s.getEmployee() != null ? s.getEmployee().getId() : null;

                    boolean matchesId = empId != null && employeeIds.contains(empId);
                    boolean matchesName = isDriverNameMatch(userName, empName);
                    boolean matchesObs = s.getObservations() != null && isDriverNameMatch(userName, s.getObservations());
                    boolean matchesClient = s.getClientName() != null && isDriverNameMatch(userName, s.getClientName());

                    if (!matchesId && !matchesName && !matchesObs && !matchesClient) {
                        return false;
                    }

                    if (startDate != null && s.getScheduleDate() != null) {
                        LocalDate schedDate = s.getScheduleDate();
                        LocalDate weekStart = startDate.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                        LocalDate weekEnd = startDate.with(java.time.temporal.TemporalAdjusters.nextOrSame(java.time.DayOfWeek.SUNDAY));
                        boolean inSameWeek = !schedDate.isBefore(weekStart) && !schedDate.isAfter(weekEnd);
                        if (!inSameWeek && schedDate.isBefore(startDate)) {
                            long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(schedDate, startDate);
                            if (daysDiff > 35) {
                                return false;
                            }
                        }
                    }
                    if (endDate != null && s.getScheduleDate() != null && s.getScheduleDate().isAfter(endDate.plusDays(7))) {
                        return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(Schedule::getScheduleDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public byte[] generateMyPDFReport(User user, LocalDate startDate, LocalDate endDate) throws IOException {
        Employee employee = resolveEmployeeForUser(user);
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : start.withDayOfMonth(start.lengthOfMonth());
        return generatePDFReport(start, end, employee.getId(), null, null);
    }

    @Transactional(readOnly = true)
    public List<Schedule> findAll() {
        try {
            List<Schedule> schedules = scheduleRepository.findAllWithRelations();
            for (Schedule schedule : schedules) {
                initializeScheduleRelations(schedule);
            }

            if (schedules == null || schedules.isEmpty()) {
                List<Schedule> allSchedules = scheduleRepository.findAll();
                if (allSchedules != null) {
                    for (Schedule schedule : allSchedules) {
                        initializeScheduleRelations(schedule);
                    }
                }
                return allSchedules != null ? allSchedules : new java.util.ArrayList<>();
            }

            return schedules;
        } catch (Exception e) {
            log.error("Erro ao buscar escalas com relacionamentos", e);
            try {
                List<Schedule> allSchedules = scheduleRepository.findAll();
                for (Schedule schedule : allSchedules) {
                    initializeScheduleRelations(schedule);
                }
                return allSchedules;
            } catch (Exception e2) {
                log.error("Erro também no método padrão", e2);
                return new java.util.ArrayList<>();
            }
        }
    }

    private void initializeScheduleRelations(Schedule schedule) {
        try {
            if (schedule.getEmployee() != null) {
                schedule.getEmployee().getName();
                schedule.getEmployee().getId();
            }
        } catch (Exception ignored) {
        }
        try {
            if (schedule.getLocation() != null) {
                schedule.getLocation().getName();
                schedule.getLocation().getId();
            }
        } catch (Exception ignored) {
        }
        try {
            if (schedule.getWorkPost() != null) {
                schedule.getWorkPost().getName();
                schedule.getWorkPost().getId();
                if (schedule.getWorkPost().getClient() != null) {
                    schedule.getWorkPost().getClient().getName();
                    schedule.getWorkPost().getClient().getId();
                }
            }
        } catch (Exception ignored) {
        }
        try {
            if (schedule.getRoute() != null) {
                schedule.getRoute().getName();
                schedule.getRoute().getId();
            }
        } catch (Exception ignored) {
        }
        try {
            if (schedule.getVehicle() != null) {
                schedule.getVehicle().getPlate();
                schedule.getVehicle().getId();
            }
        } catch (Exception ignored) {
        }
        try {
            if (schedule.getTravelTrip() != null) {
                schedule.getTravelTrip().getName();
                schedule.getTravelTrip().getId();
            }
        } catch (Exception ignored) {
        }
    }

    @Transactional
    public Schedule createSchedule(ScheduleDTO dto) {
        Location location = locationRepository.findById(dto.getLocationId())
                .orElseThrow(() -> new EntityNotFoundException("Location not found"));

        Route route = routeRepository.findById(dto.getRouteId())
                .orElseThrow(() -> new EntityNotFoundException("Route not found"));

        Patrol patrol = patrolRepository.findById(dto.getPatrolId())
                .orElseThrow(() -> new EntityNotFoundException("Patrol not found"));

        Schedule schedule = new Schedule();
        schedule.setScheduleDate(dto.getScheduleDate());
        schedule.setShift(dto.getShift());
        schedule.setLocation(location);
        schedule.setStatus(dto.getStatus());
        schedule.setRoute(route);
        schedule.setPatrol(patrol);

        if (dto.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new EntityNotFoundException("Vehicle not found"));
            schedule.setVehicle(vehicle);
        }

        schedule.setObservations(dto.getObservations());

        return scheduleRepository.save(schedule);
    }

    @Transactional
    public EmployeeSchedule createEmployeeSchedule(EmployeeScheduleDTO dto) {
        Schedule schedule = scheduleRepository.findById(dto.getScheduleId())
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));

        Position position = positionRepository.findById(dto.getPositionId())
                .orElseThrow(() -> new EntityNotFoundException("Position not found"));

        EmployeeSchedule employeeSchedule = new EmployeeSchedule();
        employeeSchedule.setSchedule(schedule);
        employeeSchedule.setPosition(position);
        employeeSchedule.setObservations(dto.getObservations());

        return employeeScheduleRepository.save(employeeSchedule);
    }

    public List<Schedule> findByPeriod(LocalDate startDate, LocalDate endDate) {
        return scheduleRepository.findByScheduleDateBetween(startDate, endDate);
    }

    public List<EmployeeSchedule> findByScheduleId(UUID scheduleId) {
        return employeeScheduleRepository.findByScheduleId(scheduleId);
    }

    @Transactional(readOnly = true)
    public byte[] generatePDFReport(LocalDate startDate, LocalDate endDate, UUID employeeId, UUID workPostId,
            String status) throws IOException {
        List<Schedule> schedules;
        if (startDate != null && endDate != null) {
            schedules = scheduleRepository.findByScheduleDateBetween(startDate, endDate);
        } else {
            schedules = scheduleRepository.findAllWithRelations();
        }

        if (employeeId != null) {
            schedules = schedules.stream()
                    .filter(s -> s.getEmployee() != null && s.getEmployee().getId().equals(employeeId))
                    .toList();
        }

        if (workPostId != null) {
            schedules = schedules.stream()
                    .filter(s -> s.getWorkPost() != null && s.getWorkPost().getId().equals(workPostId))
                    .toList();
        }

        if (status != null && !status.isEmpty()) {
            try {
                com.z7design.fleet_manager.model.enums.ScheduleStatus statusEnum = com.z7design.fleet_manager.model.enums.ScheduleStatus
                        .valueOf(status);
                schedules = schedules.stream()
                        .filter(s -> s.getStatus() == statusEnum)
                        .toList();
            } catch (IllegalArgumentException e) {
                log.warn("Status inválido: {}", status);
            }
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = null;
        PdfDocument pdfDoc = null;
        Document document = null;

        try {
            writer = new PdfWriter(baos);
            pdfDoc = new PdfDocument(writer);
            document = new Document(pdfDoc);
            document.setMargins(50, 50, 50, 50);

            Paragraph companyHeader = new Paragraph("RELATÓRIO DE ESCALAS DE TRABALHO")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(18)
                    .setBold()
                    .setMarginTop(10)
                    .setMarginBottom(20);
            document.add(companyHeader);

            Paragraph reportInfo = new Paragraph(
                    "Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(10)
                    .setMarginBottom(10);
            document.add(reportInfo);

            Paragraph totalInfo = new Paragraph("Total de escalas: " + schedules.size())
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(totalInfo);

            if (schedules.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhuma escala encontrada com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                float[] columnWidths = { 2, 4, 3, 4, 2, 2, 2 };
                Table table = new Table(UnitValue.createPercentArray(columnWidths))
                        .setWidth(UnitValue.createPercentValue(100));

                table.addHeaderCell(createHeaderCell("Data"));
                table.addHeaderCell(createHeaderCell("Funcionário"));
                table.addHeaderCell(createHeaderCell("Cliente"));
                table.addHeaderCell(createHeaderCell("Local / Rota"));
                table.addHeaderCell(createHeaderCell("Veículo"));
                table.addHeaderCell(createHeaderCell("Horário / Turno"));
                table.addHeaderCell(createHeaderCell("Status"));

                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

                for (Schedule schedule : schedules) {
                    table.addCell(createCell(
                            schedule.getScheduleDate() != null ? schedule.getScheduleDate().format(dateFormatter)
                                    : ""));
                    table.addCell(createCell(schedule.getEmployee() != null ? schedule.getEmployee().getName() : ""));

                    String clientName = "";
                    if (schedule.getWorkPost() != null && schedule.getWorkPost().getClient() != null) {
                        clientName = schedule.getWorkPost().getClient().getName();
                    } else if (schedule.getTravelTrip() != null && schedule.getTravelTrip().getClient() != null) {
                        clientName = schedule.getTravelTrip().getClient().getName();
                    } else if (schedule.getLocation() != null && schedule.getLocation().getUnit() != null
                            && schedule.getLocation().getUnit().getClient() != null) {
                        clientName = schedule.getLocation().getUnit().getClient().getName();
                    }
                    table.addCell(createCell(clientName));

                    String description = "";
                    if (schedule.getRoute() != null) {
                        description = "Rota: " + schedule.getRoute().getName();
                    } else if (schedule.getTravelTrip() != null) {
                        description = "Viagem: "
                                + (schedule.getTravelTrip().getName() != null ? schedule.getTravelTrip().getName()
                                        : "Sem nome");
                    } else if (schedule.getWorkPost() != null) {
                        description = schedule.getWorkPost().getName();
                    } else if (schedule.getLocation() != null) {
                        description = schedule.getLocation().getName();
                    }
                    table.addCell(createCell(description));

                    String vehicleInfo = "";
                    if (schedule.getVehicle() != null) {
                        vehicleInfo = schedule.getVehicle().getPlate();
                    }
                    table.addCell(createCell(vehicleInfo));

                    String timeOrShift = schedule.getStartTime() != null && !schedule.getStartTime().isBlank()
                            ? schedule.getStartTime() + (schedule.getEndTime() != null ? " - " + schedule.getEndTime() : "")
                            : (schedule.getShift() != null ? getShiftLabel(schedule.getShift()) : "");
                    table.addCell(createCell(timeOrShift));

                    table.addCell(createCell(schedule.getStatus() != null ? getStatusLabel(schedule.getStatus()) : ""));
                }

                document.add(table);
            }

            Paragraph footer = new Paragraph("Documento gerado automaticamente pelo sistema FluxBus")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(8)
                    .setMarginTop(30);
            document.add(footer);

        } catch (Exception e) {
            log.error("Erro ao gerar PDF de escalas: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatório PDF: " + e.getMessage(), e);
        } finally {
            if (document != null) {
                document.close();
            }
            if (pdfDoc != null) {
                pdfDoc.close();
            }
            if (writer != null) {
                writer.close();
            }
        }

        return baos.toByteArray();
    }

    private String getShiftLabel(com.z7design.fleet_manager.model.enums.Shift shift) {
        if (shift == null)
            return "";
        switch (shift) {
            case DAY:
                return "Diurno";
            case NIGHT:
                return "Noturno";
            case MIXED:
                return "Misto";
            default:
                return shift.toString();
        }
    }

    private String getStatusLabel(com.z7design.fleet_manager.model.enums.ScheduleStatus status) {
        if (status == null)
            return "";
        switch (status) {
            case PENDING:
                return "Pendente";
            case APPROVED:
                return "Aprovada";
            case REJECTED:
                return "Rejeitada";
            case IN_PROGRESS:
                return "Em Andamento";
            case COMPLETED:
                return "Concluída";
            case CANCELLED:
                return "Cancelada";
            default:
                return status.toString();
        }
    }

    private Cell createHeaderCell(String text) {
        return new Cell()
                .add(new Paragraph(text).setBold().setFontSize(10))
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY);
    }

    private Cell createCell(String text) {
        return new Cell()
                .add(new Paragraph(text != null ? text : "").setFontSize(9))
                .setTextAlignment(TextAlignment.LEFT);
    }
}
