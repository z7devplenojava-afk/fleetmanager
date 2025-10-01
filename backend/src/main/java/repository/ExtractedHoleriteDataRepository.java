package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.ExtractedHoleriteData;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ExtractedHoleriteDataRepository extends JpaRepository<ExtractedHoleriteData, UUID> {
} 