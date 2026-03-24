package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ExtractedHoleriteData;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ExtractedHoleriteDataRepository extends JpaRepository<ExtractedHoleriteData, UUID> {
} 
