package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.PaymentReceipt;
import br.com.fleetmanager.model.PaymentReceiptStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentReceiptRepository extends JpaRepository<PaymentReceipt, UUID> {
    
    // Buscar por ano
    List<PaymentReceipt> findByYear(Integer year);
    
    // Buscar por ano e mês
    List<PaymentReceipt> findByYearAndMonth(Integer year, Integer month);
    
    // Buscar por nome do funcionário
    List<PaymentReceipt> findByEmployeeNameContainingIgnoreCase(String employeeName);
    
    // Buscar por status
    List<PaymentReceipt> findByStatus(PaymentReceiptStatus status);
    
    // Buscar por data de pagamento
    List<PaymentReceipt> findByPaymentDate(LocalDateTime paymentDate);
    
    // Buscar por ano e status
    List<PaymentReceipt> findByYearAndStatus(Integer year, PaymentReceiptStatus status);
    
    // Buscar por ano, mês e status
    List<PaymentReceipt> findByYearAndMonthAndStatus(Integer year, Integer month, PaymentReceiptStatus status);
    
    // Buscar por nome do arquivo
    Optional<PaymentReceipt> findByFileName(String fileName);
    
    // Buscar por caminho do arquivo
    Optional<PaymentReceipt> findByFilePath(String filePath);
    
    // Buscar todos os anos únicos
    @Query("SELECT DISTINCT p.year FROM PaymentReceipt p ORDER BY p.year DESC")
    List<Integer> findDistinctYears();
    
    // Buscar todos os meses únicos para um ano
    @Query("SELECT DISTINCT p.month FROM PaymentReceipt p WHERE p.year = :year ORDER BY p.month")
    List<Integer> findDistinctMonthsByYear(@Param("year") Integer year);
    
    // Contar por ano
    long countByYear(Integer year);
    
    // Contar por ano e mês
    long countByYearAndMonth(Integer year, Integer month);
    
    // Contar por status
    long countByStatus(PaymentReceiptStatus status);
    
    // Buscar com paginação
    @NonNull
    Page<PaymentReceipt> findAll(@NonNull Pageable pageable);
    
    // Buscar por ano com paginação
    Page<PaymentReceipt> findByYear(Integer year, Pageable pageable);
    
    // Buscar por ano e mês com paginação
    Page<PaymentReceipt> findByYearAndMonth(Integer year, Integer month, Pageable pageable);
    
    // Buscar por status com paginação
    Page<PaymentReceipt> findByStatus(PaymentReceiptStatus status, Pageable pageable);
    
    // Buscar por nome do funcionário com paginação
    Page<PaymentReceipt> findByEmployeeNameContainingIgnoreCase(String employeeName, Pageable pageable);
    
    // Buscar comprovantes processados hoje
    @Query("SELECT p FROM PaymentReceipt p WHERE CAST(p.paymentDate AS date) = CURRENT_DATE AND p.status = 'PROCESSED'")
    List<PaymentReceipt> findProcessedToday();
    
    // Contar comprovantes processados hoje
    @Query("SELECT COUNT(p) FROM PaymentReceipt p WHERE CAST(p.paymentDate AS date) = CURRENT_DATE AND p.status = 'PROCESSED'")
    long countProcessedToday();
    
    // Buscar por período (data de pagamento)
    @Query("SELECT p FROM PaymentReceipt p WHERE p.paymentDate BETWEEN :startDate AND :endDate")
    List<PaymentReceipt> findByPaymentDateBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Verificar se existe comprovante com o mesmo nome de arquivo
    boolean existsByFileName(String fileName);
    
    // Verificar se existe comprovante com o mesmo caminho de arquivo
    boolean existsByFilePath(String filePath);
    
    // Buscar por múltiplos IDs
    List<PaymentReceipt> findByIdIn(List<UUID> ids);
    
    // Buscar por múltiplos IDs e status
    List<PaymentReceipt> findByIdInAndStatus(List<UUID> ids, PaymentReceiptStatus status);
    
    // Buscar por funcionário
    List<PaymentReceipt> findByEmployeeId(UUID employeeId);
    
    // Buscar por funcionário e ano
    List<PaymentReceipt> findByEmployeeIdAndYear(UUID employeeId, Integer year);
    
    // Buscar por funcionário, ano e mês
    List<PaymentReceipt> findByEmployeeIdAndYearAndMonth(UUID employeeId, Integer year, Integer month);
}