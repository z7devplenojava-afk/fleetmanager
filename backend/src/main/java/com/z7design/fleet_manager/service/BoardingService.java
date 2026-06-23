package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.BoardingDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Boarding;
import com.z7design.fleet_manager.model.Passenger;
import com.z7design.fleet_manager.model.RoutePoint;
import com.z7design.fleet_manager.model.Trip;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.enums.BoardingStatus;
import com.z7design.fleet_manager.repository.BoardingRepository;
import com.z7design.fleet_manager.repository.PassengerRepository;
import com.z7design.fleet_manager.repository.RoutePointRepository;
import com.z7design.fleet_manager.repository.TripRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BoardingService {

    private final BoardingRepository boardingRepository;
    private final TripRepository tripRepository;
    private final PassengerRepository passengerRepository;
    private final VehicleRepository vehicleRepository;
    private final RoutePointRepository routePointRepository;

    @Transactional
    public BoardingDTO create(BoardingDTO dto) {
        Boarding boarding = toEntity(dto);
        Boarding saved = boardingRepository.save(boarding);
        return toDTO(saved);
    }

    @Transactional
    public BoardingDTO update(UUID id, BoardingDTO dto) {
        Boarding existing = findById(id);

        if (dto.getTripId() != null) {
            Trip trip = tripRepository.findById(dto.getTripId())
                    .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + dto.getTripId()));
            existing.setTrip(trip);
        }
        if (dto.getPassengerId() != null) {
            Passenger passenger = passengerRepository.findById(dto.getPassengerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with id: " + dto.getPassengerId()));
            existing.setPassenger(passenger);
        }
        if (dto.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + dto.getVehicleId()));
            existing.setVehicle(vehicle);
        }
        if (dto.getBoardingTime() != null) {
            existing.setBoardingTime(dto.getBoardingTime());
        }
        if (dto.getBoardingLatitude() != null) {
            existing.setBoardingLatitude(dto.getBoardingLatitude());
        }
        if (dto.getBoardingLongitude() != null) {
            existing.setBoardingLongitude(dto.getBoardingLongitude());
        }
        if (dto.getBoardingPointId() != null) {
            RoutePoint boardingPoint = routePointRepository.findById(dto.getBoardingPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("RoutePoint not found with id: " + dto.getBoardingPointId()));
            existing.setBoardingPoint(boardingPoint);
        }
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }

        Boarding saved = boardingRepository.save(existing);
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Boarding boarding = findById(id);
        boardingRepository.delete(boarding);
    }

    public BoardingDTO getById(UUID id) {
        Boarding boarding = findById(id);
        return toDTO(boarding);
    }

    public List<BoardingDTO> getByTripId(UUID tripId) {
        List<Boarding> boardings = boardingRepository.findByTripId(tripId);
        return boardings.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<BoardingDTO> getByPassengerId(UUID passengerId) {
        List<Boarding> boardings = boardingRepository.findByPassengerId(passengerId);
        return boardings.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public BoardingDTO checkIn(UUID tripId, UUID passengerId, Double latitude, Double longitude) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
        Passenger passenger = passengerRepository.findById(passengerId)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with id: " + passengerId));

        Boarding boarding = new Boarding();
        boarding.setTrip(trip);
        boarding.setPassenger(passenger);
        boarding.setVehicle(trip.getSchedule() != null ? trip.getSchedule().getVehicle() : null);
        boarding.setBoardingTime(LocalDateTime.now());
        boarding.setBoardingLatitude(latitude);
        boarding.setBoardingLongitude(longitude);
        boarding.setBoardingPoint(passenger.getBoardingPoint());
        boarding.setStatus(BoardingStatus.BOARDED);

        Boarding saved = boardingRepository.save(boarding);
        return toDTO(saved);
    }

    private Boarding findById(UUID id) {
        return boardingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boarding not found with id: " + id));
    }

    private BoardingDTO toDTO(Boarding boarding) {
        return BoardingDTO.builder()
                .id(boarding.getId())
                .tripId(boarding.getTrip() != null ? boarding.getTrip().getId() : null)
                .passengerId(boarding.getPassenger() != null ? boarding.getPassenger().getId() : null)
                .vehicleId(boarding.getVehicle() != null ? boarding.getVehicle().getId() : null)
                .boardingTime(boarding.getBoardingTime())
                .boardingLatitude(boarding.getBoardingLatitude())
                .boardingLongitude(boarding.getBoardingLongitude())
                .boardingPointId(boarding.getBoardingPoint() != null ? boarding.getBoardingPoint().getId() : null)
                .status(boarding.getStatus())
                .createdAt(boarding.getCreatedAt())
                .updatedAt(boarding.getUpdatedAt())
                .build();
    }

    private Boarding toEntity(BoardingDTO dto) {
        Boarding boarding = new Boarding();

        if (dto.getTripId() != null) {
            Trip trip = tripRepository.findById(dto.getTripId())
                    .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + dto.getTripId()));
            boarding.setTrip(trip);
        }

        if (dto.getPassengerId() != null) {
            Passenger passenger = passengerRepository.findById(dto.getPassengerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with id: " + dto.getPassengerId()));
            boarding.setPassenger(passenger);
        }

        if (dto.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + dto.getVehicleId()));
            boarding.setVehicle(vehicle);
        }

        boarding.setBoardingTime(dto.getBoardingTime());
        boarding.setBoardingLatitude(dto.getBoardingLatitude());
        boarding.setBoardingLongitude(dto.getBoardingLongitude());

        if (dto.getBoardingPointId() != null) {
            RoutePoint boardingPoint = routePointRepository.findById(dto.getBoardingPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("RoutePoint not found with id: " + dto.getBoardingPointId()));
            boarding.setBoardingPoint(boardingPoint);
        }

        boarding.setStatus(dto.getStatus() != null ? dto.getStatus() : BoardingStatus.BOARDED);

        return boarding;
    }
}
