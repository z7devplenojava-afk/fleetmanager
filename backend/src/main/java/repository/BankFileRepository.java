package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.BankFile;
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
public interface BankFileRepository extends JpaRepository<BankFile, UUID> {
    
    List<BankFile> findByStatus(BankFile.ProcessingStatus status);
    
    List<BankFile> findByBankName(String bankName);
    
    List<BankFile> findByAccountNumber(String accountNumber);
    
    @Query("SELECT bf FROM BankFile bf WHERE bf.fileName ILIKE %:fileName%")
    List<BankFile> findByFileNameContainingIgnoreCase(@Param("fileName") String fileName);
    
    @Query("SELECT bf FROM BankFile bf WHERE bf.bankName ILIKE %:bankName%")
    List<BankFile> findByBankNameContainingIgnoreCase(@Param("bankName") String bankName);
    
    @Query("SELECT bf FROM BankFile bf WHERE bf.createdAt BETWEEN :startDate AND :endDate")
    List<BankFile> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT bf FROM BankFile bf ORDER BY bf.createdAt DESC")
    Page<BankFile> findAllOrderByCreatedAtDesc(Pageable pageable);
    
    @Query("SELECT COUNT(bf) FROM BankFile bf WHERE bf.status = :status")
    Long countByStatus(@Param("status") BankFile.ProcessingStatus status);
    
    @Query("SELECT SUM(bf.totalRecords) FROM BankFile bf WHERE bf.status = 'COMPLETED'")
    Long sumTotalRecordsByCompletedStatus();
    
    @Query("SELECT SUM(bf.matchedRecords) FROM BankFile bf WHERE bf.status = 'COMPLETED'")
    Long sumMatchedRecordsByCompletedStatus();
    
    @Query("SELECT SUM(bf.unmatchedRecords) FROM BankFile bf WHERE bf.status = 'COMPLETED'")
    Long sumUnmatchedRecordsByCompletedStatus();
}
