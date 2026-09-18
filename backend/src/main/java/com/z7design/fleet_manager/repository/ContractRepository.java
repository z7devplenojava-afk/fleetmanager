package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.enums.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, java.util.UUID> {
    
    // Buscar por status
    List<Contract> findByStatus(ContractStatus status);
    Page<Contract> findByStatus(ContractStatus status, Pageable pageable);

    @Query("SELECT c FROM Contract c WHERE c.client.companyId = :companyId")
    List<Contract> findByCompanyId(@Param("companyId") UUID companyId);
    
    // Buscar por cliente
    List<Contract> findByClientId(UUID clientId);
    Page<Contract> findByClientId(UUID clientId, Pageable pageable);
    
    // Buscar por nÃºmero do contrato
    Optional<Contract> findByContractNumber(String contractNumber);
    
    // Buscar por data de inÃ­cio
    List<Contract> findByStartDate(LocalDate startDate);
    List<Contract> findByStartDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Buscar por data de tÃ©rmino
    List<Contract> findByEndDate(LocalDate endDate);
    List<Contract> findByEndDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Buscar contratos ativos
    List<Contract> findByStatusAndEndDateAfter(ContractStatus status, LocalDate date);
    
    // Buscar contratos expirados
    List<Contract> findByStatusAndEndDateBefore(ContractStatus status, LocalDate date);
    
    // Buscar por cliente e status
    List<Contract> findByClientIdAndStatus(UUID clientId, ContractStatus status);
    Page<Contract> findByClientIdAndStatus(UUID clientId, ContractStatus status, Pageable pageable);
    
    // Busca com filtros combinados
    @Query("SELECT c FROM Contract c WHERE " +
           "(:clientId IS NULL OR c.client.id = :clientId) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:searchTerm IS NULL OR LOWER(c.contractNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Contract> findByFilters(@Param("clientId") UUID clientId, 
                                @Param("status") ContractStatus status, 
                                @Param("searchTerm") String searchTerm, 
                                Pageable pageable);
    
    // Contar contratos por status
    long countByStatus(ContractStatus status);
    
    // Contar contratos por cliente
    long countByClientId(UUID clientId);
    
    // Buscar contratos que vencem em um perÃ­odo
    @Query("SELECT c FROM Contract c WHERE c.endDate BETWEEN :startDate AND :endDate")
    List<Contract> findContractsExpiringBetween(@Param("startDate") LocalDate startDate, 
                                               @Param("endDate") LocalDate endDate);
} 
