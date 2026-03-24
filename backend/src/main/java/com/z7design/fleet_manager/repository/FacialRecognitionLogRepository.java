package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FacialRecognitionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FacialRecognitionLogRepository extends JpaRepository<FacialRecognitionLog, UUID> {
    
    List<FacialRecognitionLog> findByEmployeeId(UUID employeeId);
    
    List<FacialRecognitionLog> findByCpf(String cpf);
    
    List<FacialRecognitionLog> findByRecognitionType(FacialRecognitionLog.RecognitionType type);
    
    List<FacialRecognitionLog> findByRecognitionStatus(FacialRecognitionLog.RecognitionStatus status);
    
    Page<FacialRecognitionLog> findByEmployeeId(UUID employeeId, Pageable pageable);
    
    Page<FacialRecognitionLog> findByCpf(String cpf, Pageable pageable);
    
    @Query("SELECT frl FROM FacialRecognitionLog frl WHERE frl.employeeId = :employeeId AND frl.createdAt >= :startDate AND frl.createdAt <= :endDate")
    List<FacialRecognitionLog> findByEmployeeIdAndDateRange(
        @Param("employeeId") UUID employeeId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT COUNT(frl) FROM FacialRecognitionLog frl WHERE frl.employeeId = :employeeId AND frl.recognitionStatus = 'SUCCESS'")
    long countSuccessfulRecognitionsByEmployeeId(@Param("employeeId") UUID employeeId);
    
    @Query("SELECT COUNT(frl) FROM FacialRecognitionLog frl WHERE frl.employeeId = :employeeId AND frl.recognitionStatus = 'FAILED'")
    long countFailedRecognitionsByEmployeeId(@Param("employeeId") UUID employeeId);
    
    @Query("SELECT frl FROM FacialRecognitionLog frl WHERE frl.createdAt >= :startDate AND frl.createdAt <= :endDate ORDER BY frl.createdAt DESC")
    List<FacialRecognitionLog> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}

