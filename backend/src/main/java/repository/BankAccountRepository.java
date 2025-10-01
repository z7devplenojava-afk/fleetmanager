package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, UUID> {
    
    List<BankAccount> findByStatus(BankAccount.BankAccountStatus status);
    
    Optional<BankAccount> findByBankNameAndAccountNumber(String bankName, String accountNumber);
    
    @Query("SELECT ba FROM BankAccount ba WHERE ba.bankName ILIKE %:bankName%")
    List<BankAccount> findByBankNameContainingIgnoreCase(@Param("bankName") String bankName);
    
    @Query("SELECT ba FROM BankAccount ba WHERE ba.accountNumber ILIKE %:accountNumber%")
    List<BankAccount> findByAccountNumberContainingIgnoreCase(@Param("accountNumber") String accountNumber);
    
    @Query("SELECT DISTINCT ba.bankName FROM BankAccount ba ORDER BY ba.bankName")
    List<String> findDistinctBankNames();
    
    @Query("SELECT COUNT(ba) FROM BankAccount ba WHERE ba.status = :status")
    Long countByStatus(@Param("status") BankAccount.BankAccountStatus status);
}
