package com.z7design.fleet_manager.repository.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskSlideElement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KioskSlideElementRepository extends JpaRepository<KioskSlideElement, UUID> {

    @Query("select e from KioskSlideElement e where e.slideId = :slideId order by e.zIndex asc")
    List<KioskSlideElement> findBySlideIdOrderByZIndexAsc(@Param("slideId") UUID slideId);

    void deleteBySlideId(UUID slideId);
}

