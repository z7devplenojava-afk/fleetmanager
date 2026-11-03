package com.z7design.fleet_manager.repository.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskSlideElement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KioskSlideElementRepository extends JpaRepository<KioskSlideElement, UUID> {

    List<KioskSlideElement> findBySlideIdOrderByZIndexAsc(UUID slideId);

    void deleteBySlideId(UUID slideId);
}

