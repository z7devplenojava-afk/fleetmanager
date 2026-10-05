package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.LineTimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LineTimeSlotRepository extends JpaRepository<LineTimeSlot, UUID> {
    List<LineTimeSlot> findByRouteIdAndDayTypeOrderByDepartureTimeAsc(UUID routeId, String dayType);
    List<LineTimeSlot> findByDayTypeOrderByDepartureTimeAsc(String dayType);
    List<LineTimeSlot> findByRouteIdOrderByDepartureTimeAsc(UUID routeId);
    List<LineTimeSlot> findAllByOrderByDepartureTimeAsc();
    boolean existsByRouteIdAndDayTypeAndDepartureTime(UUID routeId, String dayType, LocalTime departureTime);
    boolean existsByRouteIdAndDayTypeAndDepartureTimeAndIdNot(UUID routeId, String dayType, LocalTime departureTime, UUID id);
    void deleteByRouteId(UUID routeId);
}
