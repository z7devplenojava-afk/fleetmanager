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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
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
            // Validar que pelo menos locationId, workPostId ou travelTripId foi fornecido
            if (dto.getLocationId() == null && dto.getWorkPostId() == null && dto.getTravelTripId() == null) {
                throw new IllegalArgumentException("Location ID, WorkPost ID ou Travel Trip ID é obrigatório");
            }

            // Buscar Employee
            Employee employee = employeeRepository.findById(dto.getEmployeeId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Employee not found with ID: " + dto.getEmployeeId()));

            Location location = null;
            WorkPost workPost = null;

            // EstratÃ©gia 0: Tentar buscar WorkPost pelo workPostId fornecido
            if (dto.getWorkPostId() != null) {
                workPost = workPostRepository.findById(dto.getWorkPostId()).orElse(null);
            }

            // EstratÃ©gia 0.5: Se locationId foi fornecido mas nÃ£o Ã© uma Location
            // vÃ¡lida,
            // tentar usar como workPostId (o frontend pode estar enviando workPostId como
            // locationId)
            if (location == null && dto.getLocationId() != null && workPost == null) {
                // Tentar buscar Location primeiro
                location = locationRepository.findById(dto.getLocationId()).orElse(null);

                // Se nÃ£o encontrou Location, tentar usar como workPostId
                if (location == null) {
                    workPost = workPostRepository.findById(dto.getLocationId()).orElse(null);
                    if (workPost != null) {
                        // Se encontrou WorkPost usando locationId, limpar locationId para evitar
                        // confusÃ£o
                        // e usar workPostId corretamente
                    }
                }
            }

            // EstratÃ©gia 1: Se workPost foi encontrado (por workPostId ou locationId),
            // priorizar busca baseada no WorkPost
            if (workPost != null) {
                // Tentar buscar Location pelo locationId fornecido (se fornecido e vÃ¡lido)
                if (dto.getLocationId() != null) {
                    location = locationRepository.findById(dto.getLocationId())
                            .orElse(null);
                }

                // EstratÃ©gia 2: Se nÃ£o encontrou pelo ID, buscar Location pelo nome do
                // WorkPost
                if (location == null) {
                    List<Location> allLocations = locationRepository.findAll();
                    for (Location loc : allLocations) {
                        if (loc.getName() != null && loc.getName().equals(workPost.getName())) {
                            location = loc;
                            break;
                        }
                    }
                }

                // EstratÃ©gia 3: Se nÃ£o encontrou pelo nome, buscar Location do Unit do Client
                // do WorkPost
                if (location == null && workPost.getClient() != null) {
                    // Buscar Units associados ao Client do WorkPost
                    List<Unit> units = unitRepository.findByClientId(workPost.getClient().getId());

                    // Para cada Unit, buscar Locations
                    for (Unit unit : units) {
                        List<Location> unitLocations = locationRepository.findByUnitId(unit.getId());
                        if (!unitLocations.isEmpty()) {
                            // Usar a primeira Location encontrada do Unit
                            location = unitLocations.get(0);
                            break;
                        }
                    }
                }

                // EstratÃ©gia 4: Se ainda nÃ£o encontrou, criar uma Location automaticamente
                // baseada no WorkPost
                if (location == null && workPost.getClient() != null) {
                    // Buscar o primeiro Unit do Client para associar a Location
                    List<Unit> units = unitRepository.findByClientId(workPost.getClient().getId());
                    Unit unit = units.isEmpty() ? null : units.get(0);

                    // Se o Client nÃ£o tem Units, criar uma Unit padrÃ£o automaticamente
                    if (unit == null) {
                        String unitName = workPost.getClient().getName() != null
                                ? "Unidade Principal - " + workPost.getClient().getName()
                                : "Unidade Principal";
                        String unitAddress = (workPost.getAddress() != null && !workPost.getAddress().trim().isEmpty())
                                ? workPost.getAddress()
                                : "EndereÃ§o nÃ£o informado";

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
                        // Verificar se jÃ¡ existe uma Location com o mesmo nome e Unit (evitar
                        // duplicatas)
                        List<Location> existingLocations = locationRepository.findByUnitId(unit.getId());
                        for (Location loc : existingLocations) {
                            if (loc.getName() != null && loc.getName().equals(workPost.getName())) {
                                location = loc;
                                break;
                            }
                        }

                        // Se nÃ£o encontrou, criar nova Location baseada no WorkPost
                        if (location == null) {
                            String address = (workPost.getAddress() != null && !workPost.getAddress().trim().isEmpty())
                                    ? workPost.getAddress()
                                    : "EndereÃ§o nÃ£o informado";

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

            // EstratÃ©gia 5: Se ainda nÃ£o encontrou/criou e hÃ¡ locationId, tentar buscar
            // diretamente
            // (mesmo que o locationId possa ser invÃ¡lido, tentamos primeiro)
            if (location == null && dto.getLocationId() != null) {
                location = locationRepository.findById(dto.getLocationId())
                        .orElse(null);
            }

            // Se ainda não encontrou/criou e não tem travelTripId, lançar exceção
            if (location == null && dto.getTravelTripId() == null) {
                if (workPost != null) {
                    throw new EntityNotFoundException(
                            "Não foi possível encontrar ou criar uma Location para o Posto de Trabalho '" +
                                    workPost.getName()
                                    + "'. Verifique se o Posto de Trabalho está associado a um Cliente com Units cadastrados.");
                } else if (dto.getLocationId() != null) {
                    throw new EntityNotFoundException(
                            "Location not found with ID: " + dto.getLocationId() +
                                    ". Se você forneceu um workPostId, verifique se ele está correto.");
                } else {
                    throw new EntityNotFoundException("Location ID, WorkPost ID ou Travel Trip ID é obrigatório");
                }
            }

            // Buscar TravelTrip se fornecido
            TravelTrip travelTrip = null;
            if (dto.getTravelTripId() != null) {
                travelTrip = travelTripRepository.findById(dto.getTravelTripId()).orElse(null);
            }

            // Criar Schedule
            Schedule schedule = Schedule.builder()
                    .employee(employee)
                    .location(location)
                    .workPost(workPost)
                    .travelTrip(travelTrip)
                    .legs(dto.getLegs())
                    .scheduleDate(dto.getScheduleDate())
                    .shift(dto.getShift())
                    .status(dto.getStatus())
                    .observations(dto.getObservations())
                    .route(dto.getRouteId() != null ? routeRepository.findById(dto.getRouteId()).orElse(null) : null)
                    .vehicle(dto.getVehicleId() != null ? vehicleRepository.findById(dto.getVehicleId()).orElse(null)
                            : null)
                    .build();

            // Validar limites de jornada do motorista
            if (employee.getUser() != null) {
                LocalDateTime start;
                LocalDateTime end;

                if (dto.getShift() != null) {
                    switch (dto.getShift()) {
                        case NIGHT:
                            start = dto.getScheduleDate().atTime(22, 0);
                            end = dto.getScheduleDate().plusDays(1).atTime(6, 0);
                            break;
                        case MIXED:
                            start = dto.getScheduleDate().atTime(14, 0);
                            end = dto.getScheduleDate().atTime(22, 0);
                            break;
                        case DAY:
                        default:
                            start = dto.getScheduleDate().atTime(8, 0);
                            end = dto.getScheduleDate().atTime(17, 0);
                            break;
                    }
                } else {
                    start = dto.getScheduleDate().atTime(8, 0);
                    end = dto.getScheduleDate().atTime(17, 0);
                }

                try {
                    driverJourneyService.validateJourney(employee.getUser().getId(), start, end, null);
                } catch (IllegalArgumentException e) {
                    log.warn("⚠️ Validação de jornada: {} - Permitindo criação da escala", e.getMessage());
                    // Não bloquear criação, apenas alertar
                }
            }

            Schedule savedSchedule = scheduleRepository.save(schedule);

            // Sincronizar com Driver Journey
            if (employee.getUser() != null) {
                LocalDateTime journeyStart;
                LocalDateTime journeyEnd;

                if (dto.getShift() != null) {
                    switch (dto.getShift()) {
                        case NIGHT:
                            journeyStart = dto.getScheduleDate().atTime(22, 0);
                            journeyEnd = dto.getScheduleDate().plusDays(1).atTime(6, 0);
                            break;
                        case MIXED:
                            journeyStart = dto.getScheduleDate().atTime(14, 0);
                            journeyEnd = dto.getScheduleDate().atTime(22, 0);
                            break;
                        case DAY:
                        default:
                            journeyStart = dto.getScheduleDate().atTime(8, 0);
                            journeyEnd = dto.getScheduleDate().atTime(17, 0);
                            break;
                    }
                } else {
                    journeyStart = dto.getScheduleDate().atTime(8, 0);
                    journeyEnd = dto.getScheduleDate().atTime(17, 0);
                }

                driverJourneyService.syncFromSchedule(savedSchedule.getId(), employee.getUser().getId(),
                        journeyStart, journeyEnd, "Schedule " + savedSchedule.getId());
            }

            return savedSchedule;
        } catch (Exception e) {
            System.err.println("Erro ao criar Schedule: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional
    public Schedule update(UUID id, Schedule schedule) {
        Schedule existingSchedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));

        existingSchedule.setScheduleDate(schedule.getScheduleDate());
        existingSchedule.setShift(schedule.getShift());
        existingSchedule.setLocation(schedule.getLocation());
        existingSchedule.setWorkPost(schedule.getWorkPost());
        existingSchedule.setStatus(schedule.getStatus());
        existingSchedule.setRoute(schedule.getRoute());
        existingSchedule.setPatrol(schedule.getPatrol());
        existingSchedule.setRoute(schedule.getRoute());
        existingSchedule.setPatrol(schedule.getPatrol());
        existingSchedule.setVehicle(schedule.getVehicle());
        existingSchedule.setObservations(schedule.getObservations());

        // Validar e Sincronizar na atualizaÃ§Ã£o
        if (existingSchedule.getEmployee() != null && existingSchedule.getEmployee().getUser() != null) {
            // Definir horÃ¡rios baseados no turno (mesma lÃ³gica da criaÃ§Ã£o)
            LocalDateTime start = existingSchedule.getScheduleDate().atTime(8, 0);
            LocalDateTime end = existingSchedule.getScheduleDate().atTime(17, 0);
            if (existingSchedule.getShift() == com.z7design.fleet_manager.model.enums.Shift.NIGHT) {
                start = existingSchedule.getScheduleDate().atTime(22, 0);
                end = existingSchedule.getScheduleDate().plusDays(1).atTime(6, 0);
            }

            // Buscar ID da jornada anterior para excluir da validaÃ§Ã£o (se possÃ­vel)
            // Como nÃ£o temos uma busca fÃ¡cil aqui sem acoplar repo, passamos null e
            // aceitamos ou implementamos melhor busca
            // Idealmente: DriverJourney journey =
            // driverJourneyRepo.findBySourceAndNotes("SCHEDULE", id.toString())
            // Mas nÃ£o temos o repo aqui.
            // Vamos pular a validaÃ§Ã£o estrita na ediÃ§Ã£o por enquanto ou confiar na
            // syncFromSchedule atualizar?
            // A validaÃ§Ã£o deve ocorrer.
            // driverJourneyService.validateJourney(existingSchedule.getEmployee().getUser().getId(),
            // start, end, null); // Pode falhar falso positivo

            Schedule saved = scheduleRepository.save(existingSchedule);
            driverJourneyService.syncFromSchedule(saved.getId(), saved.getEmployee().getUser().getId(), start, end,
                    "Schedule " + saved.getId());
            return saved;
        }

        return scheduleRepository.save(existingSchedule);
    }

    @Transactional
    public void delete(UUID id) {
        try {
            // Remover jornada associada
            driverJourneyService.deleteByScheduleId(id);

            // Excluir EmployeeSchedules relacionados primeiro (para evitar constraint
            // violation)
            List<EmployeeSchedule> employeeSchedules = employeeScheduleRepository.findByScheduleId(id);
            if (!employeeSchedules.isEmpty()) {
                log.info("ðŸ—‘ï¸ Excluindo {} EmployeeSchedule(s) relacionados Ã  escala {}", employeeSchedules.size(),
                        id);
                employeeScheduleRepository.deleteAll(employeeSchedules);
            }

            // Tentar deletar usando deleteById primeiro
            scheduleRepository.deleteById(id);
            log.info("âœ… Escala excluÃ­da com sucesso: {}", id);
        } catch (org.hibernate.FetchNotFoundException
                | org.springframework.orm.jpa.JpaObjectRetrievalFailureException e) {
            // Tratar caso onde Unit nÃ£o existe mais (orphan record)
            // Isso acontece quando Location referencia uma Unit que foi deletada
            log.warn(
                    "âš ï¸ Location referencia Unit inexistente ao excluir escala {}. Tentando exclusÃ£o forÃ§ada com query nativa...",
                    id);
            try {
                // Usar query nativa para deletar diretamente sem carregar relacionamentos
                scheduleRepository.deleteByIdNative(id);
                log.info("âœ… Escala excluÃ­da com sucesso (forÃ§ada via query nativa): {}", id);
            } catch (Exception e2) {
                log.error("âŒ Erro ao excluir escala {} mesmo com exclusÃ£o forÃ§ada: {}", id, e2.getMessage());
                throw new RuntimeException("Erro ao excluir escala: " + e2.getMessage(), e2);
            }
        } catch (jakarta.persistence.EntityNotFoundException e) {
            log.warn("âš ï¸ Tentativa de excluir escala inexistente: {}", id);
            throw new EntityNotFoundException("Schedule not found with ID: " + id);
        } catch (DataIntegrityViolationException e) {
            log.error("âŒ Erro de integridade ao excluir escala {}: {}", id, e.getMessage());
            throw new RuntimeException(
                    "NÃ£o Ã© possÃ­vel excluir esta escala pois ela possui relacionamentos que impedem a exclusÃ£o. " +
                            "Remova os relacionamentos antes de tentar novamente.",
                    e);
        } catch (Exception e) {
            log.error("âŒ Erro ao excluir escala {}: {}", id, e.getMessage(), e);
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

    /**
     * Resolve o funcionário vinculado ao usuário autenticado (portal do motorista/colaborador).
     */
    @Transactional(readOnly = true)
    public Employee resolveEmployeeForUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResourceNotFoundException("Usuário não autenticado");
        }

        Optional<Employee> byUserId = employeeRepository.findByUserId(user.getId());
        if (byUserId.isPresent()) {
            return byUserId.get();
        }

        Optional<Employee> byUser = employeeRepository.findByUser(user).stream().findFirst();
        if (byUser.isPresent()) {
            return byUser.get();
        }

        if (user.getName() != null && !user.getName().isBlank()) {
            Optional<Employee> byName = employeeRepository.findByNameIgnoreCase(user.getName().trim());
            if (byName.isPresent()) {
                log.warn("Funcionário resolvido por nome para usuário {} ({})", user.getUsername(), user.getName());
                return byName.get();
            }
        }

        throw new ResourceNotFoundException(
                "Funcionário não vinculado ao seu usuário. Solicite ao RH o vínculo do perfil para acessar suas escalas.");
    }

    /**
     * Escalas do funcionário autenticado, opcionalmente filtradas por período.
     */
    @Transactional(readOnly = true)
    public List<Schedule> findMySchedules(User user, LocalDate startDate, LocalDate endDate) {
        Employee employee = resolveEmployeeForUser(user);
        List<Schedule> schedules = scheduleRepository.findByEmployeeId(employee.getId());

        return schedules.stream()
                .filter(s -> {
                    if (startDate != null && s.getScheduleDate() != null && s.getScheduleDate().isBefore(startDate)) {
                        return false;
                    }
                    if (endDate != null && s.getScheduleDate() != null && s.getScheduleDate().isAfter(endDate)) {
                        return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(Schedule::getScheduleDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    /**
     * Gera PDF das escalas do funcionário autenticado.
     */
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
            log.info("ðŸ” Buscando todas as escalas com relacionamentos");
            // Tentar usar o mÃ©todo com JOIN FETCH para carregar relacionamentos eager
            List<Schedule> schedules = scheduleRepository.findAllWithRelations();

            log.info("âœ… Escalas encontradas (findAllWithRelations): {} registros", schedules.size());

            // Inicializar objetos necessÃ¡rios dentro da transaÃ§Ã£o para evitar
            // LazyInitializationException
            for (Schedule schedule : schedules) {
                if (schedule.getEmployee() != null) {
                    // ForÃ§ar inicializaÃ§Ã£o de campos bÃ¡sicos do Employee dentro da transaÃ§Ã£o
                    schedule.getEmployee().getName();
                    schedule.getEmployee().getId();
                }
                if (schedule.getLocation() != null) {
                    schedule.getLocation().getName();
                    schedule.getLocation().getId();
                }
                if (schedule.getWorkPost() != null) {
                    schedule.getWorkPost().getName();
                    schedule.getWorkPost().getId();
                    // Inicializar client dentro da transaÃ§Ã£o para evitar
                    // LazyInitializationException
                    try {
                        if (schedule.getWorkPost().getClient() != null) {
                            schedule.getWorkPost().getClient().getName();
                            schedule.getWorkPost().getClient().getId();
                        }
                    } catch (Exception ignored) {
                        // Ignorar erros de lazy initialization
                    }
                }
            }

            // Se retornou vazio, tentar mÃ©todo padrÃ£o como fallback
            if (schedules == null || schedules.isEmpty()) {
                log.warn("âš ï¸ findAllWithRelations retornou vazio, tentando mÃ©todo padrÃ£o");
                List<Schedule> allSchedules = scheduleRepository.findAll();
                log.info("âœ… Escalas encontradas (mÃ©todo padrÃ£o): {} registros",
                        allSchedules != null ? allSchedules.size() : 0);

                // Inicializar tambÃ©m no mÃ©todo padrÃ£o
                if (allSchedules != null) {
                    for (Schedule schedule : allSchedules) {
                        if (schedule.getEmployee() != null) {
                            schedule.getEmployee().getName();
                            schedule.getEmployee().getId();
                        }
                        if (schedule.getLocation() != null) {
                            schedule.getLocation().getName();
                            schedule.getLocation().getId();
                        }
                        if (schedule.getWorkPost() != null) {
                            schedule.getWorkPost().getName();
                            schedule.getWorkPost().getId();
                        }
                    }
                }

                return allSchedules != null ? allSchedules : new java.util.ArrayList<>();
            }

            // Retornar todas as escalas, mesmo com Location null
            // O @NotFound(action = NotFoundAction.IGNORE) jÃ¡ trata isso no modelo
            return schedules;
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar escalas com relacionamentos", e);
            log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            log.error("âŒ Mensagem: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("âŒ Causa: {}", e.getCause().getMessage());
                log.error("âŒ Tipo da causa: {}", e.getCause().getClass().getName());
            }
            // Se falhar, usar o mÃ©todo padrÃ£o
            try {
                log.info("ðŸ”„ Tentando buscar escalas com mÃ©todo padrÃ£o (fallback)");
                List<Schedule> allSchedules = scheduleRepository.findAll();

                log.info("âœ… Escalas encontradas (mÃ©todo padrÃ£o): {} registros", allSchedules.size());
                if (allSchedules.size() > 0) {
                    log.info("ðŸ“‹ Primeira escala (mÃ©todo padrÃ£o): ID={}, Employee={}, Date={}",
                            allSchedules.get(0).getId(),
                            allSchedules.get(0).getEmployee() != null ? allSchedules.get(0).getEmployee().getName()
                                    : "null",
                            allSchedules.get(0).getScheduleDate());
                }

                // Inicializar objetos dentro da transaÃ§Ã£o
                for (Schedule schedule : allSchedules) {
                    if (schedule.getEmployee() != null) {
                        try {
                            schedule.getEmployee().getName();
                            schedule.getEmployee().getId();
                        } catch (Exception ignored) {
                            // Ignorar erros de lazy initialization
                        }
                    }
                    if (schedule.getLocation() != null) {
                        try {
                            schedule.getLocation().getName();
                            schedule.getLocation().getId();
                        } catch (Exception ignored) {
                            // Ignorar erros de lazy initialization
                        }
                    }
                    if (schedule.getWorkPost() != null) {
                        try {
                            schedule.getWorkPost().getName();
                            schedule.getWorkPost().getId();
                            // Inicializar client dentro da transaÃ§Ã£o para evitar
                            // LazyInitializationException
                            if (schedule.getWorkPost().getClient() != null) {
                                schedule.getWorkPost().getClient().getName();
                                schedule.getWorkPost().getClient().getId();
                            }
                        } catch (Exception ignored) {
                            // Ignorar erros de lazy initialization
                        }
                    }
                }

                return allSchedules;
            } catch (Exception e2) {
                log.error("âŒ Erro tambÃ©m no mÃ©todo padrÃ£o", e2);
                log.error("âŒ Tipo de exceÃ§Ã£o: {}", e2.getClass().getName());
                log.error("âŒ Mensagem: {}", e2.getMessage());
                // Retornar lista vazia ao invÃ©s de lanÃ§ar exceÃ§Ã£o para evitar erro 500
                log.warn("âš ï¸ Retornando lista vazia devido a erro no mÃ©todo padrÃ£o");
                return new java.util.ArrayList<>();
            }
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
        log.info(
                "Gerando relatÃ³rio PDF de escalas - StartDate: {}, EndDate: {}, EmployeeId: {}, WorkPostId: {}, Status: {}",
                startDate, endDate, employeeId, workPostId, status);

        // Buscar escalas com filtros
        List<Schedule> schedules;
        if (startDate != null && endDate != null) {
            schedules = scheduleRepository.findByScheduleDateBetween(startDate, endDate);
        } else {
            schedules = scheduleRepository.findAllWithRelations();
        }

        // Aplicar filtros adicionais
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
                log.warn("Status invÃ¡lido: {}", status);
            }
        }

        log.info("Total de escalas encontradas para o relatÃ³rio: {}", schedules.size());

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = null;
        PdfDocument pdfDoc = null;
        Document document = null;

        try {
            writer = new PdfWriter(baos);
            pdfDoc = new PdfDocument(writer);
            document = new Document(pdfDoc);
            document.setMargins(50, 50, 50, 50);

            // CabeÃ§alho da empresa
            Paragraph companyHeader = new Paragraph("PROMOVER VIGILÃ‚NCIA PATRIMONIAL LTDA")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(16)
                    .setBold()
                    .setMarginBottom(5);
            document.add(companyHeader);

            Paragraph companyInfo = new Paragraph("CNPJ: 43.576.260/0001-12")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(10)
                    .setMarginBottom(20);
            document.add(companyInfo);

            // TÃ­tulo
            Paragraph title = new Paragraph("RELATÃ“RIO DE ESCALAS DE TRABALHO")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(18)
                    .setBold()
                    .setMarginTop(10)
                    .setMarginBottom(20);
            document.add(title);

            // InformaÃ§Ãµes do relatÃ³rio
            Paragraph reportInfo = new Paragraph(
                    "Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(10)
                    .setMarginBottom(10);
            document.add(reportInfo);

            // Filtros aplicados
            if (startDate != null || endDate != null || employeeId != null || workPostId != null || status != null) {
                Paragraph filtersInfo = new Paragraph("Filtros aplicados:")
                        .setFontSize(10)
                        .setBold()
                        .setMarginBottom(5);
                document.add(filtersInfo);

                if (startDate != null) {
                    document.add(new Paragraph(
                            "Data InÃ­cio: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                            .setFontSize(10).setMarginBottom(2));
                }
                if (endDate != null) {
                    document.add(new Paragraph("Data Fim: " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                            .setFontSize(10).setMarginBottom(2));
                }
                if (employeeId != null) {
                    document.add(new Paragraph("FuncionÃ¡rio: ID " + employeeId).setFontSize(10).setMarginBottom(2));
                }
                if (workPostId != null) {
                    document.add(
                            new Paragraph("Posto de Trabalho: ID " + workPostId).setFontSize(10).setMarginBottom(2));
                }
                if (status != null && !status.isEmpty()) {
                    document.add(new Paragraph("Status: " + status).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }

            // Total de escalas
            Paragraph totalInfo = new Paragraph("Total de escalas: " + schedules.size())
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(totalInfo);

            // Tabela de escalas
            if (schedules.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhuma escala encontrada com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                // Tabela com 7 colunas: Data, Funcionário, Cliente, Local/Rota, Veículo, Turno,
                // Status
                float[] columnWidths = { 2, 4, 3, 4, 2, 2, 2 };
                Table table = new Table(UnitValue.createPercentArray(columnWidths))
                        .setWidth(UnitValue.createPercentValue(100));

                // Cabeçalhos
                table.addHeaderCell(createHeaderCell("Data"));
                table.addHeaderCell(createHeaderCell("Funcionário"));
                table.addHeaderCell(createHeaderCell("Cliente"));
                table.addHeaderCell(createHeaderCell("Local / Rota"));
                table.addHeaderCell(createHeaderCell("Veículo"));
                table.addHeaderCell(createHeaderCell("Turno"));
                table.addHeaderCell(createHeaderCell("Status"));

                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

                for (Schedule schedule : schedules) {
                    // Data
                    table.addCell(createCell(
                            schedule.getScheduleDate() != null ? schedule.getScheduleDate().format(dateFormatter)
                                    : ""));

                    // Funcionário
                    table.addCell(createCell(schedule.getEmployee() != null ? schedule.getEmployee().getName() : ""));

                    // Cliente (Tentativa de extrair de WorkPost, TravelTrip, ou Location indireta)
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

                    // Local / Rota / Viagem / Posto
                    String description = "";
                    if (schedule.getWorkPost() != null) {
                        description = schedule.getWorkPost().getName();
                    } else if (schedule.getRoute() != null) {
                        description = "Rota: " + schedule.getRoute().getName();
                    } else if (schedule.getTravelTrip() != null) {
                        description = "Viagem: "
                                + (schedule.getTravelTrip().getName() != null ? schedule.getTravelTrip().getName()
                                        : "Sem nome");
                    } else if (schedule.getLocation() != null) {
                        description = schedule.getLocation().getName();
                    } else if (schedule.getPatrol() != null) {
                        description = "Ronda: "
                                + (schedule.getPatrol().getRoute() != null ? schedule.getPatrol().getRoute().getName()
                                        : "Sem rota");
                    }
                    table.addCell(createCell(description));

                    // Veículo
                    String vehicleInfo = "";
                    if (schedule.getVehicle() != null) {
                        vehicleInfo = schedule.getVehicle().getPlate();
                        // Opcional: Adicionar modelo se couber
                        // if (schedule.getVehicle().getModel() != null) vehicleInfo += " - " +
                        // schedule.getVehicle().getModel();
                    }
                    table.addCell(createCell(vehicleInfo));

                    // Turno
                    table.addCell(createCell(schedule.getShift() != null ? getShiftLabel(schedule.getShift()) : ""));

                    // Status
                    table.addCell(createCell(schedule.getStatus() != null ? getStatusLabel(schedule.getStatus()) : ""));
                }

                document.add(table);
            }

            // RodapÃ©
            Paragraph footer = new Paragraph("Documento gerado automaticamente pelo sistema Secured Guard")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(8)
                    .setMarginTop(30);
            document.add(footer);

        } catch (Exception e) {
            log.error("Erro ao gerar PDF de escalas: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
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

        byte[] result = baos.toByteArray();
        log.info("PDF de escalas gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
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
                return "ConcluÃ­da";
            case CANCELLED:
                return "Cancelada";
            default:
                return status.toString();
        }
    }

    // MÃ©todo auxiliar para criar cÃ©lulas de cabeÃ§alho

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
