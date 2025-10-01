package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Bank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankRepository extends JpaRepository<Bank, UUID> {
    
    Optional<Bank> findByCode(String code);
    
    List<Bank> findByStatus(Bank.BankStatus status);
    
    @Query("SELECT b FROM Bank b WHERE b.name ILIKE %:name%")
    List<Bank> findByNameContainingIgnoreCase(@Param("name") String name);
    
    @Query("SELECT b FROM Bank b WHERE b.code ILIKE %:code%")
    List<Bank> findByCodeContainingIgnoreCase(@Param("code") String code);
    
    @Query("SELECT b FROM Bank b WHERE b.cnpj = :cnpj")
    Optional<Bank> findByCnpj(@Param("cnpj") String cnpj);
    
    @Query("SELECT b FROM Bank b ORDER BY b.name ASC")
    Page<Bank> findAllOrderByName(Pageable pageable);
    
    @Query("SELECT b FROM Bank b WHERE b.status = :status ORDER BY b.name ASC")
    Page<Bank> findByStatusOrderByName(@Param("status") Bank.BankStatus status, Pageable pageable);
    
    @Query("SELECT COUNT(b) FROM Bank b WHERE b.status = :status")
    Long countByStatus(@Param("status") Bank.BankStatus status);
    
    @Query("SELECT DISTINCT b.state FROM Bank b WHERE b.state IS NOT NULL ORDER BY b.state")
    List<String> findDistinctStates();
    
    @Query("SELECT b FROM Bank b WHERE b.state = :state ORDER BY b.name ASC")
    List<Bank> findByState(@Param("state") String state);
}
