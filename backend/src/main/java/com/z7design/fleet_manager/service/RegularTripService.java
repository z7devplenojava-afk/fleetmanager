package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegularTripService {

    private final RegularTripRepository regularTripRepository;
    private final TicketRepository ticketRepository;
    private final SeatReservationService seatReservationService;

    @Transactional(readOnly = true)
    public List<RegularTrip> findTrips(UUID routeId, LocalDateTime date) {
        LocalDateTime startOfDay = date.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = date.toLocalDate().atTime(23, 59, 59);
        return regularTripRepository.findAllByRouteIdAndDepartureTimeBetween(routeId, startOfDay, endOfDay);
    }

    @Transactional(readOnly = true)
    public List<String> getOccupiedSeats(UUID tripId) {
        List<Ticket> tickets = ticketRepository.findAllByRegularTripId(tripId);
        return tickets.stream()
                .filter(t -> !"CANCELLED".equals(t.getStatus()))
                .map(Ticket::getSeatNumber)
                .collect(Collectors.toList());
    }

    public boolean isSeatAvailable(UUID tripId, String seatNumber) {
        boolean inDb = ticketRepository.existsByRegularTripIdAndSeatNumberAndStatusIn(
                tripId, seatNumber, List.of("PAID", "RESERVED", "USED"));

        if (inDb)
            return false;

        return !seatReservationService.isSeatLocked(tripId, seatNumber);
    }

    @Transactional
    public RegularTrip createTrip(RegularTrip trip) {
        log.info("Creating regular trip {} for route {}", trip.getTripCode(), trip.getRoute().getId());
        return regularTripRepository.save(trip);
    }
}
