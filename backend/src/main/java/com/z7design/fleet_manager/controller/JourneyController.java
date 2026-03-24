package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.DriverJourneyDTO;
import com.z7design.fleet_manager.model.DriverJourney;
import com.z7design.fleet_manager.repository.DriverJourneyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/driver-journeys")
@RequiredArgsConstructor
public class JourneyController {

    private final DriverJourneyRepository driverJourneyRepository;

    @GetMapping
    public ResponseEntity<List<DriverJourneyDTO>> list(
            @RequestParam(required = false) UUID driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<DriverJourney> journeys;
        if (driverId != null && date != null) {
            journeys = driverJourneyRepository.findByDriverIdAndDateRange(driverId, date.atStartOfDay(),
                    date.atTime(LocalTime.MAX));
        } else {
            journeys = driverJourneyRepository.findAll();
        }

        List<DriverJourneyDTO> dtos = journeys.stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    private DriverJourneyDTO toDTO(DriverJourney entity) {
        long duration = 0;
        if (entity.getStartTime() != null) {
            LocalDateTime end = entity.getEndTime() != null ? entity.getEndTime() : LocalDateTime.now();
            duration = Duration.between(entity.getStartTime(), end).toMinutes();
        }

        return DriverJourneyDTO.builder()
                .id(entity.getId())
                .driverId(entity.getDriver().getId())
                .driverName(entity.getDriver().getName())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .type(entity.getType())
                .source(entity.getSource())
                .notes(entity.getNotes())
                .durationMinutes(duration)
                .build();
    }
}
