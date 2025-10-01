package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Agency;
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
public interface AgencyRepository extends JpaRepository<Agency, UUID> {
    
    List<Agency> findByBankId(UUID bankId);
    
    Optional<Agency> findByBankIdAndCode(UUID bankId, String code);
    
    List<Agency> findByStatus(Agency.AgencyStatus status);
    
    @Query("SELECT a FROM Agency a WHERE a.bank.id = :bankId AND a.status = :status ORDER BY a.name ASC")
    List<Agency> findByBankIdAndStatus(@Param("bankId") UUID bankId, @Param("status") Agency.AgencyStatus status);
    
    @Query("SELECT a FROM Agency a WHERE a.name ILIKE %:name%")
    List<Agency> findByNameContainingIgnoreCase(@Param("name") String name);
    
    @Query("SELECT a FROM Agency a WHERE a.code ILIKE %:code%")
    List<Agency> findByCodeContainingIgnoreCase(@Param("code") String code);
    
    @Query("SELECT a FROM Agency a WHERE a.bank.name ILIKE %:bankName%")
    List<Agency> findByBankNameContainingIgnoreCase(@Param("bankName") String bankName);
    
    @Query("SELECT a FROM Agency a WHERE a.city ILIKE %:city%")
    List<Agency> findByCityContainingIgnoreCase(@Param("city") String city);
    
    @Query("SELECT a FROM Agency a WHERE a.state = :state")
    List<Agency> findByState(@Param("state") String state);
    
    @Query("SELECT a FROM Agency a ORDER BY a.bank.name ASC, a.name ASC")
    Page<Agency> findAllOrderByBankNameAndName(Pageable pageable);
    
    @Query("SELECT a FROM Agency a WHERE a.bank.id = :bankId ORDER BY a.name ASC")
    Page<Agency> findByBankIdOrderByName(@Param("bankId") UUID bankId, Pageable pageable);
    
    @Query("SELECT a FROM Agency a WHERE a.status = :status ORDER BY a.bank.name ASC, a.name ASC")
    Page<Agency> findByStatusOrderByBankNameAndName(@Param("status") Agency.AgencyStatus status, Pageable pageable);
    
    @Query("SELECT COUNT(a) FROM Agency a WHERE a.status = :status")
    Long countByStatus(@Param("status") Agency.AgencyStatus status);
    
    @Query("SELECT COUNT(a) FROM Agency a WHERE a.bank.id = :bankId")
    Long countByBankId(@Param("bankId") UUID bankId);
    
    @Query("SELECT DISTINCT a.city FROM Agency a WHERE a.city IS NOT NULL ORDER BY a.city")
    List<String> findDistinctCities();
    
    @Query("SELECT DISTINCT a.state FROM Agency a WHERE a.state IS NOT NULL ORDER BY a.state")
    List<String> findDistinctStates();
}
