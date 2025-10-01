package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.BankTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface BankTransactionRepository extends JpaRepository<BankTransaction, UUID> {
    
    List<BankTransaction> findByBankFileId(UUID bankFileId);
    
    List<BankTransaction> findByStatus(BankTransaction.ReconciliationStatus status);
    
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankFile.id = :bankFileId ORDER BY bt.transactionDate DESC")
    List<BankTransaction> findByBankFileIdOrderByTransactionDateDesc(@Param("bankFileId") UUID bankFileId);
    
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.transactionDate BETWEEN :startDate AND :endDate")
    List<BankTransaction> findByTransactionDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.description ILIKE %:description%")
    List<BankTransaction> findByDescriptionContainingIgnoreCase(@Param("description") String description);
    
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.referenceNumber = :referenceNumber")
    List<BankTransaction> findByReferenceNumber(@Param("referenceNumber") String referenceNumber);
    
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.systemTransactionId IS NOT NULL")
    List<BankTransaction> findMatchedTransactions();
    
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.systemTransactionId IS NULL")
    List<BankTransaction> findUnmatchedTransactions();
    
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankFile.id = :bankFileId AND bt.status = :status")
    List<BankTransaction> findByBankFileIdAndStatus(@Param("bankFileId") UUID bankFileId, @Param("status") BankTransaction.ReconciliationStatus status);
    
    @Query("SELECT COUNT(bt) FROM BankTransaction bt WHERE bt.status = :status")
    Long countByStatus(@Param("status") BankTransaction.ReconciliationStatus status);
    
    @Query("SELECT COUNT(bt) FROM BankTransaction bt WHERE bt.bankFile.id = :bankFileId AND bt.status = :status")
    Long countByBankFileIdAndStatus(@Param("bankFileId") UUID bankFileId, @Param("status") BankTransaction.ReconciliationStatus status);
}
