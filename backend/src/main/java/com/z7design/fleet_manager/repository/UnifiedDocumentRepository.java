package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.UnifiedDocument;
import com.z7design.fleet_manager.tenant.TenantContext;
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
    
    @Query("SELECT ud FROM UnifiedDocument ud WHERE ud.payslip.id = :payslipId AND ud.receipt.id = :receiptId")
    Optional<UnifiedDocument> findByPayslipIdAndReceiptId(@Param("payslipId") UUID payslipId, @Param("receiptId") UUID receiptId);
    
    @Query("SELECT ud FROM UnifiedDocument ud WHERE ud.payslip.id = :payslipId")
    Optional<UnifiedDocument> findByPayslipId(@Param("payslipId") UUID payslipId);
    
    @Query("SELECT ud FROM UnifiedDocument ud WHERE ud.payslip.id = :payslipId")
    List<UnifiedDocument> findAllByPayslipId(@Param("payslipId") UUID payslipId);
    
    @Query("SELECT ud FROM UnifiedDocument ud WHERE ud.receipt.id = :receiptId")
    Optional<UnifiedDocument> findByReceiptId(@Param("receiptId") UUID receiptId);
    
    @Query("SELECT ud FROM UnifiedDocument ud WHERE ud.receipt.id = :receiptId")
    List<UnifiedDocument> findAllByReceiptId(@Param("receiptId") UUID receiptId);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "UPDATE unified_documents SET receipt_id = NULL WHERE receipt_id = :receiptId " +
            "AND (CAST(:companyId AS uuid) IS NULL " +
            "OR payslip_id IN (SELECT p.id FROM payslips p WHERE p.company_id = CAST(:companyId AS uuid)) " +
            "OR employee_id IN (SELECT e.id FROM employees e WHERE e.company_id = CAST(:companyId AS uuid)))", nativeQuery = true)
    int removeReceiptReferenceScoped(@Param("receiptId") UUID receiptId, @Param("companyId") UUID companyId);

    default int removeReceiptReference(UUID receiptId) {
        return removeReceiptReferenceScoped(receiptId, TenantContext.get());
    }
    
    /**
     * Query otimizada para buscar unified documents com payslips relacionados
     * Usa LEFT JOIN FETCH para carregar o payslip junto e evitar LazyInitializationException
     */
    @Query("SELECT DISTINCT ud FROM UnifiedDocument ud " +
           "LEFT JOIN FETCH ud.payslip p " +
           "WHERE ud.employeeName IS NOT NULL AND ud.month IS NOT NULL AND ud.year IS NOT NULL " +
           "ORDER BY ud.year DESC, ud.month DESC, ud.employeeName ASC")
    List<UnifiedDocument> findAllWithPayslipOptimized();
    
    /**
     * Busca documentos unificados por nome do arquivo
     */
    List<UnifiedDocument> findByFileName(String fileName);
    
    /**
     * Exclui documentos unificados por nome do arquivo
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM unified_documents WHERE file_name = :fileName " +
            "AND (CAST(:companyId AS uuid) IS NULL " +
            "OR payslip_id IN (SELECT p.id FROM payslips p WHERE p.company_id = CAST(:companyId AS uuid)) " +
            "OR employee_id IN (SELECT e.id FROM employees e WHERE e.company_id = CAST(:companyId AS uuid)))", nativeQuery = true)
    int deleteByFileNameScoped(@Param("fileName") String fileName, @Param("companyId") UUID companyId);

    default void deleteByFileName(String fileName) {
        deleteByFileNameScoped(fileName, TenantContext.get());
    }
} 
