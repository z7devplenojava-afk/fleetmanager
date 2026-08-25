package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.TravelTrip;
import com.z7design.fleet_manager.service.TravelTripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/travel-trips")
public class TravelTripController {

    @Autowired
    private TravelTripService service;

    @GetMapping
    public List<TravelTrip> getAll() {
        return service.findAll();
    }

    @GetMapping("/active")
    public List<TravelTrip> getActive() {
        return service.findActive();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TravelTrip> getById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/type/{type}")
    public List<TravelTrip> getByType(@PathVariable("type") TravelTrip.TripType type) {
        return service.findByType(type);
    }

    @GetMapping("/client/{clientId}")
    public List<TravelTrip> getByClient(@PathVariable("clientId") UUID clientId) {
        return service.findByClient(clientId);
    }

    @PostMapping
    public ResponseEntity<TravelTrip> create(@RequestBody TravelTrip trip) {
        return ResponseEntity.ok(service.create(trip));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TravelTrip> update(@PathVariable("id") UUID id, @RequestBody TravelTrip trip) {
        return ResponseEntity.ok(service.update(id, trip));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
