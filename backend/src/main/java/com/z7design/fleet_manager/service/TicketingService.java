package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.RegularTrip;
import com.z7design.fleet_manager.model.Ticket;
import com.z7design.fleet_manager.repository.RegularTripRepository;
import com.z7design.fleet_manager.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketingService {

    private final TicketRepository ticketRepository;
    private final RegularTripRepository regularTripRepository;
    private final SeatReservationService seatReservationService;

    @Transactional
    public Ticket reserveTicket(UUID tripId, String seatNumber, String passengerName, String passengerDoc,
            String userId) {
        if (!seatReservationService.reserveSeat(tripId, seatNumber, userId)) {
            throw new RuntimeException("Seat already locked by another user.");
        }

        RegularTrip trip = regularTripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        Ticket ticket = Ticket.builder()
                .regularTrip(trip)
                .seatNumber(seatNumber)
                .passengerName(passengerName)
                .passengerDocument(passengerDoc)
                .salePrice(trip.getBasePrice())
                .status("RESERVED")
                .ticketNumber("T" + System.currentTimeMillis())
                .companyId(trip.getCompanyId())
                .build();

        return ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public List<Ticket> getTicketsByTrip(UUID tripId) {
        return ticketRepository.findAllByRegularTripId(tripId);
    }

    @Transactional
    public Ticket confirmPurchase(UUID ticketId, String paymentMethod, String paymentId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setStatus("PAID");
        ticket.setPaymentMethod(paymentMethod);
        ticket.setPaymentId(paymentId);
        ticket.setIssuedAt(LocalDateTime.now());

        // Release temporary lock after permanent save
        seatReservationService.releaseSeat(ticket.getRegularTrip().getId(), ticket.getSeatNumber());

        return ticketRepository.save(ticket);
    }
}
