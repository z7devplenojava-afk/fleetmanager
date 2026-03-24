package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.TravelTrip;
import com.z7design.fleet_manager.repository.TravelTripRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
public class TravelTripService {

    @Autowired
    private TravelTripRepository repository;

    public List<TravelTrip> findAll() {
        return repository.findAll();
    }

    public List<TravelTrip> findActive() {
        return repository.findByStatusOrderByNameAsc(TravelTrip.TravelTripStatus.ACTIVE);
    }

    public TravelTrip findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada: " + id));
    }

    public List<TravelTrip> findByType(TravelTrip.TripType type) {
        return repository.findByTripType(type);
    }

    public List<TravelTrip> findByClient(UUID clientId) {
        return repository.findByClientId(clientId);
    }

    @Transactional
    public TravelTrip create(TravelTrip trip) {
        // Gerar código automaticamente
        if (trip.getCode() == null || trip.getCode().isEmpty()) {
            String prefix = trip.getTripType() == TravelTrip.TripType.TURISTICO ? "TUR" : "FRT";
            long count = repository.count() + 1;
            trip.setCode(prefix + "-" + String.format("%04d", count));
        }

        // Ajustar multiplicador conforme tipo
        if (trip.getTripType() == TravelTrip.TripType.TURISTICO && trip.getDurationMultiplier() == null) {
            trip.setDurationMultiplier(1.5); // Turístico: 50% mais tempo
        } else if (trip.getTripType() == TravelTrip.TripType.FRETADO && trip.getDurationMultiplier() == null) {
            trip.setDurationMultiplier(1.0);
        }

        // Calcular duração estimada ajustada pelo multiplicador
        if (trip.getEstimatedDuration() != null && trip.getDurationMultiplier() != null) {
            long adjustedMinutes = (long) (trip.getEstimatedDuration().toMinutes() * trip.getDurationMultiplier());
            trip.setEstimatedDuration(Duration.ofMinutes(adjustedMinutes));
        }

        return repository.save(trip);
    }

    @Transactional
    public TravelTrip update(UUID id, TravelTrip details) {
        TravelTrip trip = findById(id);
        trip.setName(details.getName());
        trip.setTripType(details.getTripType());
        trip.setLegs(details.getLegs());
        trip.setLeg1Description(details.getLeg1Description());
        trip.setLeg2Description(details.getLeg2Description());
        trip.setLeg3Description(details.getLeg3Description());
        trip.setLeg4Description(details.getLeg4Description());
        trip.setEstimatedDuration(details.getEstimatedDuration());
        trip.setDurationMultiplier(details.getDurationMultiplier());
        trip.setDistanceKm(details.getDistanceKm());
        trip.setRoute(details.getRoute());
        trip.setClient(details.getClient());
        trip.setOriginAddress(details.getOriginAddress());
        trip.setDestinationAddress(details.getDestinationAddress());
        trip.setObservations(details.getObservations());
        trip.setStatus(details.getStatus());
        return repository.save(trip);
    }

    @Transactional
    public void delete(UUID id) {
        TravelTrip trip = findById(id);
        repository.delete(trip);
    }
}
