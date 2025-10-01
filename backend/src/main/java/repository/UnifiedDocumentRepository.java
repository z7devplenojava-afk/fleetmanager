package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.UnifiedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnifiedDocumentRepository extends JpaRepository<UnifiedDocument, UUID> {

    @Query("SELECT ud FROM UnifiedDocument ud WHERE ud.employee.id = :employeeId AND ud.month = :month AND ud.year = :year")
    Optional<UnifiedDocument> findByEmployeeAndMonthYear(@Param("employeeId") UUID employeeId, 
                                                        @Param("month") Integer month, 
                                                        @Param("year") Integer year);

    @Query("SELECT ud FROM UnifiedDocument ud WHERE ud.month = :month AND ud.year = :year")
    List<UnifiedDocument> findByMonthAndYear(@Param("month") Integer month, @Param("year") Integer year);

    @Query("SELECT ud FROM UnifiedDocument ud WHERE ud.status = :status")
    List<UnifiedDocument> findByStatus(@Param("status") UnifiedDocument.UnifiedDocumentStatus status);

    @Query("SELECT ud FROM UnifiedDocument ud WHERE ud.employeeName LIKE %:employeeName%")
    List<UnifiedDocument> findByEmployeeNameContaining(@Param("employeeName") String employeeName);

    @Query("SELECT ud FROM UnifiedDocument ud WHERE ud.matchingConfidence < :threshold")
    List<UnifiedDocument> findByLowConfidence(@Param("threshold") Double threshold);
} 