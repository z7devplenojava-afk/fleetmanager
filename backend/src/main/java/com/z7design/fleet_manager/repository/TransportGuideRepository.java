package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TransportGuide;
import com.z7design.fleet_manager.model.enums.TransportGuideStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransportGuideRepository extends JpaRepository<TransportGuide, Long> {
    
    List<TransportGuide> findByStatus(TransportGuideStatus status);
    
    List<TransportGuide> findByEmpresa(String empresa);
    
    List<TransportGuide> findByCnpj(String cnpj);
    
    List<TransportGuide> findByCreatedBy(String createdBy);
    
    List<TransportGuide> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    List<TransportGuide> findByNumeroArmaContainingIgnoreCase(String numeroArma);
}




























