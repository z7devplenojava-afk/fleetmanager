package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.PassengerDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.Passenger;
import com.z7design.fleet_manager.model.Route;
import com.z7design.fleet_manager.model.RoutePoint;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.PassengerRepository;
import com.z7design.fleet_manager.repository.RoutePointRepository;
import com.z7design.fleet_manager.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
        if (dto.getRouteId() != null) {
            Route route = routeRepository.findById(dto.getRouteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + dto.getRouteId()));
            existing.setRoute(route);
        }
        if (dto.getBoardingPointId() != null) {
            RoutePoint boardingPoint = routePointRepository.findById(dto.getBoardingPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("RoutePoint not found with id: " + dto.getBoardingPointId()));
            existing.setBoardingPoint(boardingPoint);
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

        Passenger saved = passengerRepository.save(existing);
        return toDTO(saved);
    }

    @Transactional
    @CacheEvict(value = {"passengers", "passengers-by-company"}, allEntries = true)
    public void delete(UUID id) {
        Passenger passenger = findById(id);
        passengerRepository.delete(passenger);
    }

    @Cacheable(value = "passengers", key = "#id")
    public PassengerDTO getById(UUID id) {
        Passenger passenger = findById(id);
        return toDTO(passenger);
    }

    @Cacheable(value = "passengers-by-company", key = "#companyId")
    public List<PassengerDTO> getByCompanyId(UUID companyId) {
        List<Passenger> passengers = passengerRepository.findByCompanyId(companyId);
        return passengers.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<PassengerDTO> getByRouteId(UUID routeId) {
        List<Passenger> passengers = passengerRepository.findByRouteId(routeId);
        return passengers.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<PassengerDTO> getActiveByCompanyId(UUID companyId) {
        List<Passenger> passengers = passengerRepository.findByActiveTrueAndCompanyId(companyId);
        return passengers.stream().map(this::toDTO).collect(Collectors.toList());
    }

    private Passenger findById(UUID id) {
        return passengerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with id: " + id));
    }

    private PassengerDTO toDTO(Passenger passenger) {
        return PassengerDTO.builder()
                .id(passenger.getId())
                .registration(passenger.getRegistration())
                .name(passenger.getName())
                .employeeId(passenger.getEmployee() != null ? passenger.getEmployee().getId() : null)
                .companyId(passenger.getCompanyId())
                .routeId(passenger.getRoute() != null ? passenger.getRoute().getId() : null)
                .boardingPointId(passenger.getBoardingPoint() != null ? passenger.getBoardingPoint().getId() : null)
                .shift(passenger.getShift())
                .active(passenger.getActive())
                .costCenter(passenger.getCostCenter())
                .createdAt(passenger.getCreatedAt())
                .updatedAt(passenger.getUpdatedAt())
                .build();
    }

    private Passenger toEntity(PassengerDTO dto) {
        Passenger passenger = new Passenger();
        passenger.setRegistration(dto.getRegistration());
        passenger.setName(dto.getName());
        passenger.setCompanyId(dto.getCompanyId());
        passenger.setShift(dto.getShift());
        passenger.setActive(dto.getActive() != null ? dto.getActive() : true);
        passenger.setCostCenter(dto.getCostCenter());

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

        if (dto.getBoardingPointId() != null) {
            RoutePoint boardingPoint = routePointRepository.findById(dto.getBoardingPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("RoutePoint not found with id: " + dto.getBoardingPointId()));
            passenger.setBoardingPoint(boardingPoint);
        }

        return passenger;
    }
}
