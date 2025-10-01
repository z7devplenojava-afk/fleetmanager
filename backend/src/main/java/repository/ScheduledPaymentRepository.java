package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.ScheduledPayment;
import br.com.fleetmanager.model.enums.ScheduledPaymentStatus;
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
public interface ScheduledPaymentRepository extends JpaRepository<ScheduledPayment, UUID> {
    
    // Buscar por cliente
    List<ScheduledPayment> findByClientId(UUID clientId);
    
    // Buscar por status
    List<ScheduledPayment> findByStatus(ScheduledPaymentStatus status);
    
    // Buscar por data de agendamento
    List<ScheduledPayment> findByScheduledDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Buscar pagamentos agendados para uma data específica
    List<ScheduledPayment> findByScheduledDateAndStatus(LocalDate scheduledDate, ScheduledPaymentStatus status);
    
    // Buscar pagamentos vencendo em X dias
    @Query("SELECT sp FROM ScheduledPayment sp WHERE sp.scheduledDate = :targetDate AND sp.status = 'SCHEDULED'")
    List<ScheduledPayment> findPaymentsDueOnDate(@Param("targetDate") LocalDate targetDate);
    
    // Buscar pagamentos vencendo em 3 dias
    @Query("SELECT sp FROM ScheduledPayment sp WHERE sp.scheduledDate = :threeDaysFromNow AND sp.status = 'SCHEDULED'")
    List<ScheduledPayment> findPaymentsDueInThreeDays(@Param("threeDaysFromNow") LocalDate threeDaysFromNow);
    
    // Buscar pagamentos vencidos
    @Query("SELECT sp FROM ScheduledPayment sp WHERE sp.scheduledDate < :currentDate AND sp.status = 'SCHEDULED'")
    List<ScheduledPayment> findOverduePayments(@Param("currentDate") LocalDate currentDate);
    
    // Buscar por cliente e status
    List<ScheduledPayment> findByClientIdAndStatus(UUID clientId, ScheduledPaymentStatus status);
    
    // Buscar pagamentos com alerta não enviado
    @Query("SELECT sp FROM ScheduledPayment sp WHERE sp.scheduledDate = :targetDate AND sp.status = 'SCHEDULED' AND (sp.alertSent = false OR sp.alertSent IS NULL)")
    List<ScheduledPayment> findPaymentsDueOnDateWithoutAlert(@Param("targetDate") LocalDate targetDate);
    
    // Buscar por número da fatura
    List<ScheduledPayment> findByInvoiceNumberContainingIgnoreCase(String invoiceNumber);
    
    // Buscar pagamentos agendados ordenados por data
    Page<ScheduledPayment> findByStatusOrderByScheduledDateAsc(ScheduledPaymentStatus status, Pageable pageable);
    
    // Buscar todos os pagamentos agendados ordenados por data
    Page<ScheduledPayment> findAllByOrderByScheduledDateAsc(Pageable pageable);
}
