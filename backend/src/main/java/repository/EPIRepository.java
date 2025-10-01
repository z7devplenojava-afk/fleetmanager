package br.com.fleetmanager.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.fleetmanager.model.EPI;
import br.com.fleetmanager.model.EPIStatus;

@Repository
public interface EPIRepository extends JpaRepository<EPI, UUID> {
    
    List<EPI> findByEmployeeId(UUID employeeId);
    
    List<EPI> findByPositionId(UUID positionId);
    
    List<EPI> findByStatus(EPIStatus status);
    
    List<EPI> findByExpirationDateBefore(LocalDateTime date);
    
    List<EPI> findByEmployeeIdAndStatus(UUID employeeId, EPIStatus status);
    
    List<EPI> findByPositionIdAndStatus(UUID positionId, EPIStatus status);
} 