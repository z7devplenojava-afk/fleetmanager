package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.PassengerDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.LinkedHashSet;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PassengerService {

    private final PassengerRepository passengerRepository;
    private final EmployeeRepository employeeRepository;
    private final RouteRepository routeRepository;
    private final RoutePointRepository routePointRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    @Transactional
    @CacheEvict(value = {"passengers", "passengers-by-company"}, allEntries = true)
    public PassengerDTO create(PassengerDTO dto) {
        Passenger passenger = toEntity(dto);
        Passenger saved = passengerRepository.save(passenger);
        return toDTO(saved);
    }

    @Transactional
    @CacheEvict(value = {"passengers", "passengers-by-company"}, allEntries = true)
    public PassengerDTO update(UUID id, PassengerDTO dto) {
        Passenger existing = findById(id);

        if (dto.getRegistration() != null) {
            existing.setRegistration(dto.getRegistration());
        }
        if (dto.getName() != null) {
            existing.setName(dto.getName());
        }
        if (dto.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(dto.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + dto.getEmployeeId()));
            existing.setEmployee(employee);
        }
        if (dto.getClientId() != null) {
            existing.setClientId(dto.getClientId());
        }
        if (dto.getRouteId() != null) {
            Route route = routeRepository.findById(dto.getRouteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + dto.getRouteId()));
            existing.setRoute(route);
        }
        if (dto.getReturnRouteId() != null) {
            Route returnRoute = routeRepository.findById(dto.getReturnRouteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Return Route not found with id: " + dto.getReturnRouteId()));
            existing.setReturnRoute(returnRoute);
        }
        if (dto.getBoardingPointId() != null) {
            RoutePoint boardingPoint = routePointRepository.findById(dto.getBoardingPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("RoutePoint not found with id: " + dto.getBoardingPointId()));
            existing.setBoardingPoint(boardingPoint);
        }
        if (dto.getReturnBoardingPointId() != null) {
            RoutePoint returnBoardingPoint = routePointRepository.findById(dto.getReturnBoardingPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("Return RoutePoint not found with id: " + dto.getReturnBoardingPointId()));
            existing.setReturnBoardingPoint(returnBoardingPoint);
        }
        if (dto.getShift() != null) {
            existing.setShift(dto.getShift());
        }
        if (dto.getActive() != null) {
            existing.setActive(dto.getActive());
        }
        if (dto.getCostCenter() != null) {
            existing.setCostCenter(dto.getCostCenter());
        }
        if (dto.getCpf() != null) {
            existing.setCpf(dto.getCpf());
        }
        if (dto.getPhone() != null) {
            existing.setPhone(dto.getPhone());
        }
        if (dto.getEmail() != null) {
            existing.setEmail(dto.getEmail());
        }
        if (dto.getPassengerType() != null) {
            existing.setPassengerType(dto.getPassengerType());
        }
        if (dto.getPreferredTime() != null) {
            existing.setPreferredTime(dto.getPreferredTime());
        }
        if (dto.getNotificationsEnabled() != null) {
            existing.setNotificationsEnabled(dto.getNotificationsEnabled());
        }
        if (dto.getDisembarkPointId() != null) {
            RoutePoint disembarkPoint = routePointRepository.findById(dto.getDisembarkPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("RoutePoint not found with id: " + dto.getDisembarkPointId()));
            existing.setDisembarkPoint(disembarkPoint);
        }
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus().toUpperCase().trim());
        }
        if (dto.getMultipleRoutesAllowed() != null) {
            existing.setMultipleRoutesAllowed(dto.getMultipleRoutesAllowed());
        }
        if (dto.getQrCodeToken() != null) {
            existing.setQrCodeToken(dto.getQrCodeToken());
        }
        if (dto.getAdmissionDate() != null) {
            existing.setAdmissionDate(dto.getAdmissionDate());
        }
        if (dto.getDismissalDate() != null) {
            existing.setDismissalDate(dto.getDismissalDate());
            existing.setStatus("DEMITIDO");
            existing.setActive(false);
        }
        if (dto.getIsPcd() != null) {
            existing.setIsPcd(dto.getIsPcd());
        }
        if (dto.getDisabilityType() != null) {
            existing.setDisabilityType(dto.getDisabilityType());
        }
        if (dto.getDisabilityDescription() != null) {
            existing.setDisabilityDescription(dto.getDisabilityDescription());
        }

        // SEGURANÇA E BLOQUEIO IMEDIATO PARA DEMITIDOS/BLOQUEADOS:
        if ("DEMITIDO".equalsIgnoreCase(existing.getStatus()) || "BLOQUEADO".equalsIgnoreCase(existing.getStatus()) || Boolean.FALSE.equals(existing.getActive())) {
            existing.setActive(false);
            if (existing.getUserId() != null) {
                userRepository.findById(existing.getUserId()).ifPresent(u -> {
                    u.setActive(false);
                    u.setBlocked(true);
                    userRepository.save(u);
                    log.warn("🔒 Usuário {} bloqueado instantaneamente devido à demissão/bloqueio do passageiro {}", u.getUsername(), existing.getName());
                });
            }
        }

        Passenger saved = passengerRepository.save(existing);
        return toDTO(saved);
    }

    @Transactional
    @CacheEvict(value = {"passengers", "passengers-by-company"}, allEntries = true)
    public void delete(UUID id) {
        Passenger passenger = findById(id);
        // Ao deletar ou marcar demissão, garantir revogação de credenciais
        if (passenger.getUserId() != null) {
            userRepository.findById(passenger.getUserId()).ifPresent(u -> {
                u.setActive(false);
                u.setBlocked(true);
                userRepository.save(u);
            });
        }
        passengerRepository.delete(passenger);
    }

    @Cacheable(value = "passengers", key = "#id")
    public PassengerDTO getById(UUID id) {
        Passenger passenger = findById(id);
        return toDTO(passenger);
    }

    public List<PassengerDTO> getAll() {
        List<Passenger> passengers = passengerRepository.findAll();
        return passengers.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Cacheable(value = "passengers-by-company", key = "#companyId")
    public List<PassengerDTO> getByCompanyId(UUID companyId) {
        List<Passenger> passengers = passengerRepository.findByCompanyId(companyId);
        return passengers.stream().map(this::toDTO).collect(Collectors.toList());
    }

        public List<PassengerDTO> getByRouteId(UUID routeId) {
        return getByRouteIdAndDirection(routeId, null);
    }

    public List<PassengerDTO> getByRouteIdAndDirection(UUID routeId, String direction) {
        List<Passenger> ida = passengerRepository.findByRouteId(routeId);
        List<Passenger> volta = passengerRepository.findByReturnRouteId(routeId);
        
        Set<Passenger> set = new LinkedHashSet<>();
        if (direction != null && direction.equalsIgnoreCase("RETORNO")) {
            set.addAll(volta);
            if (set.isEmpty()) {
                set.addAll(ida);
            }
        } else if (direction != null && direction.equalsIgnoreCase("IDA")) {
            set.addAll(ida);
        } else {
            set.addAll(ida);
            set.addAll(volta);
        }

        return set.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<PassengerDTO> getActiveByCompanyId(UUID companyId) {
        List<Passenger> passengers = passengerRepository.findByActiveTrueAndCompanyId(companyId);
        return passengers.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public int assignPassengersToRoute(UUID routeId, List<UUID> passengerIds, String direction, Boolean returnSame) {
        if (routeId == null) {
            return 0;
        }
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Rota não encontrada"));

        java.util.Set<UUID> targetIds = (passengerIds != null) ? new java.util.HashSet<>(passengerIds) : java.util.Collections.emptySet();
        boolean applyReturn = returnSame == null || Boolean.TRUE.equals(returnSame);

        // Desvincular passageiros que foram removidos da rota
        List<Passenger> previouslyAssigned = passengerRepository.findByRouteId(routeId);
        for (Passenger prev : previouslyAssigned) {
            if (!targetIds.contains(prev.getId())) {
                prev.setRoute(null);
                if (applyReturn && prev.getReturnRoute() != null && routeId.equals(prev.getReturnRoute().getId())) {
                    prev.setReturnRoute(null);
                }
                passengerRepository.save(prev);
            }
        }

        if (targetIds.isEmpty()) {
            return 0;
        }

        List<Passenger> passengers = passengerRepository.findAllById(targetIds);
        for (Passenger p : passengers) {
            if ("RETORNO".equalsIgnoreCase(direction)) {
                p.setReturnRoute(route);
            } else if ("AMBOS".equalsIgnoreCase(direction)) {
                p.setRoute(route);
                if (applyReturn) {
                    p.setReturnRoute(route);
                }
            } else {
                p.setRoute(route);
                if (applyReturn) {
                    p.setReturnRoute(route);
                }
            }
        }
        passengerRepository.saveAll(passengers);
        return passengers.size();
    }

    public List<PassengerDTO> getByClientId(UUID clientId) {
        List<Passenger> passengers = passengerRepository.findByClientId(clientId);
        return passengers.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = {"passengers", "passengers-by-company"}, allEntries = true)
    public PassengerDTO toggleMultipleRoutes(UUID id, boolean allowed) {
        Passenger passenger = findById(id);
        passenger.setMultipleRoutesAllowed(allowed);
        Passenger saved = passengerRepository.save(passenger);
        log.info("🔄 Permissão de múltiplas linhas alterada para {} (Passageiro: {})", allowed, passenger.getName());
        return toDTO(saved);
    }

    private Passenger findById(UUID id) {
        return passengerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with id: " + id));
    }

    public PassengerDTO toDTO(Passenger passenger) {
        return PassengerDTO.builder()
                .id(passenger.getId())
                .registration(passenger.getRegistration())
                .name(passenger.getName())
                .employeeId(passenger.getEmployee() != null ? passenger.getEmployee().getId() : null)
                .companyId(passenger.getCompanyId())
                .clientId(passenger.getClientId())
                .clientName(passenger.getClient() != null ? passenger.getClient().getName() : null)
                .userId(passenger.getUserId())
                .routeId(passenger.getRoute() != null ? passenger.getRoute().getId() : null)
                .boardingPointId(passenger.getBoardingPoint() != null ? passenger.getBoardingPoint().getId() : null)
                .returnRouteId(passenger.getReturnRoute() != null ? passenger.getReturnRoute().getId() : null)
                .returnRouteName(passenger.getReturnRoute() != null ? passenger.getReturnRoute().getName() : null)
                .returnBoardingPointId(passenger.getReturnBoardingPoint() != null ? passenger.getReturnBoardingPoint().getId() : null)
                .returnBoardingPointName(passenger.getReturnBoardingPoint() != null ? passenger.getReturnBoardingPoint().getName() : null)
                .shift(passenger.getShift())
                .active(passenger.getActive())
                .status(passenger.getStatus())
                .multipleRoutesAllowed(passenger.getMultipleRoutesAllowed())
                .costCenter(passenger.getCostCenter())
                .cpf(passenger.getCpf())
                .phone(passenger.getPhone())
                .email(passenger.getEmail())
                .passengerType(passenger.getPassengerType())
                .preferredTime(passenger.getPreferredTime())
                .notificationsEnabled(passenger.getNotificationsEnabled())
                .disembarkPointId(passenger.getDisembarkPoint() != null ? passenger.getDisembarkPoint().getId() : null)
                .qrCodeToken(passenger.getQrCodeToken())
                .admissionDate(passenger.getAdmissionDate())
                .dismissalDate(passenger.getDismissalDate())
                .isPcd(passenger.getIsPcd())
                .disabilityType(passenger.getDisabilityType())
                .disabilityDescription(passenger.getDisabilityDescription())
                .createdAt(passenger.getCreatedAt())
                .updatedAt(passenger.getUpdatedAt())
                .build();
    }

    private Passenger toEntity(PassengerDTO dto) {
        Passenger passenger = new Passenger();
        passenger.setRegistration(dto.getRegistration());
        passenger.setName(dto.getName());
        passenger.setCompanyId(dto.getCompanyId());
        passenger.setClientId(dto.getClientId());
        passenger.setShift(dto.getShift());
        passenger.setActive(dto.getActive() != null ? dto.getActive() : true);
        passenger.setStatus(dto.getStatus() != null ? dto.getStatus().toUpperCase().trim() : "ATIVO");
        passenger.setMultipleRoutesAllowed(Boolean.TRUE.equals(dto.getMultipleRoutesAllowed()));
        passenger.setCostCenter(dto.getCostCenter());
        passenger.setCpf(dto.getCpf());
        passenger.setPhone(dto.getPhone());
        passenger.setEmail(dto.getEmail());
        passenger.setPassengerType(dto.getPassengerType() != null ? dto.getPassengerType() : "COMUM");
        passenger.setPreferredTime(dto.getPreferredTime());
        passenger.setNotificationsEnabled(dto.getNotificationsEnabled() != null ? dto.getNotificationsEnabled() : true);
        passenger.setQrCodeToken(dto.getQrCodeToken());
        passenger.setAdmissionDate(dto.getAdmissionDate());
        passenger.setDismissalDate(dto.getDismissalDate());
        passenger.setIsPcd(dto.getIsPcd() != null ? dto.getIsPcd() : false);
        passenger.setDisabilityType(dto.getDisabilityType());
        passenger.setDisabilityDescription(dto.getDisabilityDescription());

        if (dto.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(dto.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + dto.getEmployeeId()));
            passenger.setEmployee(employee);
        }

        if (dto.getRouteId() != null) {
            Route route = routeRepository.findById(dto.getRouteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + dto.getRouteId()));
            passenger.setRoute(route);
        }

        if (dto.getReturnRouteId() != null) {
            Route returnRoute = routeRepository.findById(dto.getReturnRouteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Return route not found with id: " + dto.getReturnRouteId()));
            passenger.setReturnRoute(returnRoute);
        }

        if (dto.getBoardingPointId() != null) {
            RoutePoint boardingPoint = routePointRepository.findById(dto.getBoardingPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("RoutePoint not found with id: " + dto.getBoardingPointId()));
            passenger.setBoardingPoint(boardingPoint);
        }

        if (dto.getReturnBoardingPointId() != null) {
            RoutePoint returnPoint = routePointRepository.findById(dto.getReturnBoardingPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("Return RoutePoint not found with id: " + dto.getReturnBoardingPointId()));
            passenger.setReturnBoardingPoint(returnPoint);
        }

        if (dto.getDisembarkPointId() != null) {
            RoutePoint disembarkPoint = routePointRepository.findById(dto.getDisembarkPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("RoutePoint not found with id: " + dto.getDisembarkPointId()));
            passenger.setDisembarkPoint(disembarkPoint);
        }

        return passenger;
    }
}
