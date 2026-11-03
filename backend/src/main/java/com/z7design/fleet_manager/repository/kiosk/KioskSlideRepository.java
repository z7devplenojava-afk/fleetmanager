package com.z7design.fleet_manager.repository.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskSlide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KioskSlideRepository extends JpaRepository<KioskSlide, UUID> {

    List<KioskSlide> findByPresentationIdOrderByPositionAsc(UUID presentationId);

    void deleteByPresentationId(UUID presentationId);
}

