package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.AccountsReceivable;
import com.z7design.fleet_manager.model.enums.ReceivableStatus;
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
public interface AccountsReceivableRepository extends JpaRepository<AccountsReceivable, UUID> {
    
    // Buscar por cliente
    List<AccountsReceivable> findByClientId(UUID clientId);
    
    // Buscar por status
    List<AccountsReceivable> findByStatus(ReceivableStatus status);
    
    // Buscar por perÃ­odo
    List<AccountsReceivable> findByIssueDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Buscar por data de vencimento
    List<AccountsReceivable> findByDueDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Buscar contas vencidas
    @Query("SELECT ar FROM AccountsReceivable ar WHERE ar.dueDate < :currentDate AND ar.status != 'PAID'")
    List<AccountsReceivable> findOverdueAccounts(@Param("currentDate") LocalDate currentDate);
    
    // Buscar por nÃºmero da fatura
    List<AccountsReceivable> findByInvoiceNumberContainingIgnoreCase(String invoiceNumber);
    
    // Buscar por número da medição
    List<AccountsReceivable> findByMeasurementNumberContainingIgnoreCase(String measurementNumber);
    
    // Buscar por ID da medição
    List<AccountsReceivable> findByMeasurementId(UUID measurementId);
    
    // Buscar por cliente e status
    List<AccountsReceivable> findByClientIdAndStatus(UUID clientId, ReceivableStatus status);
    
    // Buscar contas pendentes por cliente
    @Query("SELECT ar FROM AccountsReceivable ar WHERE ar.client.id = :clientId AND ar.status IN ('PENDING', 'OVERDUE')")
    List<AccountsReceivable> findPendingByClient(@Param("clientId") UUID clientId);
    
    // Buscar contas vencidas por cliente
    @Query("SELECT ar FROM AccountsReceivable ar WHERE ar.client.id = :clientId AND ar.dueDate < :currentDate AND ar.status != 'PAID'")
    List<AccountsReceivable> findOverdueByClient(@Param("clientId") UUID clientId, @Param("currentDate") LocalDate currentDate);
    
    // Buscar com paginaÃ§Ã£o
    Page<AccountsReceivable> findByClientId(UUID clientId, Pageable pageable);
    
    // Buscar por status com paginaÃ§Ã£o
    Page<AccountsReceivable> findByStatus(ReceivableStatus status, Pageable pageable);
    
    // Buscar por perÃ­odo com paginaÃ§Ã£o
    Page<AccountsReceivable> findByIssueDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    // Buscar todas as contas com paginaÃ§Ã£o
    @Query("SELECT ar FROM AccountsReceivable ar ORDER BY ar.dueDate ASC")
    Page<AccountsReceivable> findAllOrderByDueDate(Pageable pageable);
    
    // Contar contas por status
    @Query("SELECT COUNT(ar) FROM AccountsReceivable ar WHERE ar.status = :status")
    Long countByStatus(@Param("status") ReceivableStatus status);
    
    // Contar contas vencidas
    @Query("SELECT COUNT(ar) FROM AccountsReceivable ar WHERE ar.dueDate < :currentDate AND ar.status != 'PAID'")
    Long countOverdueAccounts(@Param("currentDate") LocalDate currentDate);
    
    // Somar valores por status
    @Query("SELECT SUM(ar.amount) FROM AccountsReceivable ar WHERE ar.status = :status")
    Double sumAmountByStatus(@Param("status") ReceivableStatus status);
    
    // Somar valores pendentes
    @Query("SELECT SUM(ar.amount - ar.amountPaid) FROM AccountsReceivable ar WHERE ar.status IN ('PENDING', 'OVERDUE')")
    Double sumPendingAmount();
}

