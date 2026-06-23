package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.DisembarkingDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Boarding;
import com.z7design.fleet_manager.model.Disembarking;
import com.z7design.fleet_manager.model.RoutePoint;
import com.z7design.fleet_manager.repository.BoardingRepository;
import com.z7design.fleet_manager.repository.DisembarkingRepository;
import com.z7design.fleet_manager.repository.RoutePointRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisembarkingService {

    private final DisembarkingRepository disembarkingRepository;
    private final BoardingRepository boardingRepository;
    private final RoutePointRepository routePointRepository;

    @Transactional
    public DisembarkingDTO create(DisembarkingDTO dto) {
        Disembarking disembarking = toEntity(dto);
        Disembarking saved = disembarkingRepository.save(disembarking);
        return toDTO(saved);
    }

    @Transactional
    public DisembarkingDTO update(UUID id, DisembarkingDTO dto) {
        Disembarking existing = findById(id);

        if (dto.getBoardingId() != null) {
            Boarding boarding = boardingRepository.findById(dto.getBoardingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Boarding not found with id: " + dto.getBoardingId()));
            existing.setBoarding(boarding);
        }
        if (dto.getDisembarkingTime() != null) {
            existing.setDisembarkingTime(dto.getDisembarkingTime());
        }
        if (dto.getDisembarkingLatitude() != null) {
            existing.setDisembarkingLatitude(dto.getDisembarkingLatitude());
        }
        if (dto.getDisembarkingLongitude() != null) {
            existing.setDisembarkingLongitude(dto.getDisembarkingLongitude());
        }
        if (dto.getDisembarkingPointId() != null) {
            RoutePoint disembarkingPoint = routePointRepository.findById(dto.getDisembarkingPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("RoutePoint not found with id: " + dto.getDisembarkingPointId()));
            existing.setDisembarkingPoint(disembarkingPoint);
        }

        Disembarking saved = disembarkingRepository.save(existing);
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Disembarking disembarking = findById(id);
        disembarkingRepository.delete(disembarking);
    }

    public DisembarkingDTO getById(UUID id) {
        Disembarking disembarking = findById(id);
        return toDTO(disembarking);
    }

    public Optional<DisembarkingDTO> getByBoardingId(UUID boardingId) {
        Optional<Disembarking> disembarking = disembarkingRepository.findByBoardingId(boardingId);
        return disembarking.map(this::toDTO);
    }

    @Transactional
    public DisembarkingDTO checkOut(UUID boardingId, Double latitude, Double longitude) {
        Boarding boarding = boardingRepository.findById(boardingId)
                .orElseThrow(() -> new ResourceNotFoundException("Boarding not found with id: " + boardingId));

        // Check if already checked out
        Optional<Disembarking> existing = disembarkingRepository.findByBoardingId(boardingId);
        if (existing.isPresent()) {
            throw new RuntimeException("Passenger already checked out");
        }

        Disembarking disembarking = new Disembarking();
        disembarking.setBoarding(boarding);
        disembarking.setDisembarkingTime(LocalDateTime.now());
        disembarking.setDisembarkingLatitude(latitude);
        disembarking.setDisembarkingLongitude(longitude);

        Disembarking saved = disembarkingRepository.save(disembarking);
        return toDTO(saved);
    }

    private Disembarking findById(UUID id) {
        return disembarkingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disembarking not found with id: " + id));
    }

    private DisembarkingDTO toDTO(Disembarking disembarking) {
        return DisembarkingDTO.builder()
                .id(disembarking.getId())
                .boardingId(disembarking.getBoarding() != null ? disembarking.getBoarding().getId() : null)
                .disembarkingTime(disembarking.getDisembarkingTime())
                .disembarkingLatitude(disembarking.getDisembarkingLatitude())
                .disembarkingLongitude(disembarking.getDisembarkingLongitude())
                .disembarkingPointId(disembarking.getDisembarkingPoint() != null ? disembarking.getDisembarkingPoint().getId() : null)
                .createdAt(disembarking.getCreatedAt())
                .updatedAt(disembarking.getUpdatedAt())
                .build();
    }

    private Disembarking toEntity(DisembarkingDTO dto) {
        Disembarking disembarking = new Disembarking();

        if (dto.getBoardingId() != null) {
            Boarding boarding = boardingRepository.findById(dto.getBoardingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Boarding not found with id: " + dto.getBoardingId()));
            disembarking.setBoarding(boarding);
        }

        disembarking.setDisembarkingTime(dto.getDisembarkingTime());
        disembarking.setDisembarkingLatitude(dto.getDisembarkingLatitude());
        disembarking.setDisembarkingLongitude(dto.getDisembarkingLongitude());

        if (dto.getDisembarkingPointId() != null) {
            RoutePoint disembarkingPoint = routePointRepository.findById(dto.getDisembarkingPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("RoutePoint not found with id: " + dto.getDisembarkingPointId()));
            disembarking.setDisembarkingPoint(disembarkingPoint);
        }

        return disembarking;
    }
}
