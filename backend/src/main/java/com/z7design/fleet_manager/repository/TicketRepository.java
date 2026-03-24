package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findAllByRegularTripId(UUID tripId);

    List<Ticket> findAllByPassengerDocument(String document);

    boolean existsByRegularTripIdAndSeatNumberAndStatusIn(UUID tripId, String seatNumber, List<String> statuses);
}
