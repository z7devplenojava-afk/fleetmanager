package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.EscalaOperacional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface EscalaOperacionalRepository extends JpaRepository<EscalaOperacional, UUID> {

    List<EscalaOperacional> findByScaleDateOrderByDepartureTimeAsc(LocalDate scaleDate);

    List<EscalaOperacional> findByScaleDateAndStatusNotOrderByDepartureTimeAsc(LocalDate scaleDate, String status);

    boolean existsByScaleDateAndRouteIdAndDepartureTime(LocalDate scaleDate, UUID routeId, LocalTime departureTime);

    boolean existsByScaleDateAndRouteIdAndDepartureTimeAndIdNot(
            LocalDate scaleDate, UUID routeId, LocalTime departureTime, UUID id);

    void deleteByScaleDateAndRouteIdAndDepartureTimeAndIdNot(
            LocalDate scaleDate, UUID routeId, LocalTime departureTime, UUID id);
}
