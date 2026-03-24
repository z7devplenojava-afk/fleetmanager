package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Invoice;
import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ExpenseType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, java.util.UUID> {
    
    // Buscar por status
    List<Invoice> findByStatus(ExpenseStatus status);
    Page<Invoice> findByStatus(ExpenseStatus status, Pageable pageable);
    
    // Buscar por tipo
    List<Invoice> findByType(ExpenseType type);
    Page<Invoice> findByType(ExpenseType type, Pageable pageable);
    
    // Buscar por fornecedor
    List<Invoice> findBySupplierId(java.util.UUID supplierId);
    Page<Invoice> findBySupplierId(java.util.UUID supplierId, Pageable pageable);
    
    // Buscar por cliente
    List<Invoice> findByClientId(java.util.UUID clientId);
    Page<Invoice> findByClientId(java.util.UUID clientId, Pageable pageable);
    
    // Buscar por contrato
    List<Invoice> findByContractId(java.util.UUID contractId);
    Page<Invoice> findByContractId(java.util.UUID contractId, Pageable pageable);
    
    // Buscar por data de vencimento
    List<Invoice> findByDueDate(LocalDate dueDate);
    List<Invoice> findByDueDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Buscar por data de pagamento
    List<Invoice> findByPaymentDate(LocalDate paymentDate);
    List<Invoice> findByPaymentDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Buscar por categoria
    List<Invoice> findByCategory(String category);
    Page<Invoice> findByCategory(String category, Pageable pageable);
    
    // Buscar por nÃºmero da fatura
    List<Invoice> findByInvoiceNumberContaining(String invoiceNumber);
    
    // Buscar por descriÃ§Ã£o
    List<Invoice> findByDescriptionContainingIgnoreCase(String description);
    
    // Buscar por cÃ³digo de barras
    List<Invoice> findByBarcode(String barcode);
    
    // Buscar faturas vencidas
    @Query("SELECT i FROM Invoice i WHERE i.dueDate < :date AND i.status NOT IN ('PAGA', 'CANCELADA')")
    List<Invoice> findOverdueInvoices(@Param("date") LocalDate date);
    
    // Buscar faturas vencidas por unidade
    @Query("SELECT i FROM Invoice i WHERE i.unit.id = :unitId AND i.dueDate < :date AND i.status NOT IN ('PAGA', 'CANCELADA')")
    List<Invoice> findOverdueInvoicesByUnit(@Param("unitId") UUID unitId, @Param("date") LocalDate date);
    
    // Buscar faturas vencendo em breve
    @Query("SELECT i FROM Invoice i WHERE i.dueDate BETWEEN :startDate AND :endDate AND i.status NOT IN ('PAGA', 'CANCELADA')")
    List<Invoice> findInvoicesDueSoon(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Buscar faturas vencendo em breve por unidade
    @Query("SELECT i FROM Invoice i WHERE i.unit.id = :unitId AND i.dueDate BETWEEN :startDate AND :endDate AND i.status NOT IN ('PAGA', 'CANCELADA')")
    List<Invoice> findInvoicesDueSoonByUnit(@Param("unitId") UUID unitId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Buscar faturas pagas em um perÃ­odo
    @Query("SELECT i FROM Invoice i WHERE i.paymentDate BETWEEN :startDate AND :endDate AND i.status = 'PAGA'")
    List<Invoice> findPaidInvoicesInPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Buscar faturas pagas em um perÃ­odo por unidade
    @Query("SELECT i FROM Invoice i WHERE i.unit.id = :unitId AND i.paymentDate BETWEEN :startDate AND :endDate AND i.status = 'PAGA'")
    List<Invoice> findPaidInvoicesInPeriodByUnit(@Param("unitId") UUID unitId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Buscar por categoria e unidade
    List<Invoice> findByCategoryAndUnitId(String category, UUID unitId);
    Page<Invoice> findByCategoryAndUnitId(String category, UUID unitId, Pageable pageable);
    
    // Buscar por nÃºmero da fatura e unidade
    List<Invoice> findByInvoiceNumberContainingAndUnitId(String invoiceNumber, UUID unitId);
    
    // Buscar por descriÃ§Ã£o e unidade
    List<Invoice> findByDescriptionContainingIgnoreCaseAndUnitId(String description, UUID unitId);
    
    // Buscar por cÃ³digo de barras e unidade
    List<Invoice> findByBarcodeAndUnitId(String barcode, UUID unitId);
    
    // Buscar por unidade
    List<Invoice> findByUnitId(UUID unitId);
    Page<Invoice> findByUnitId(UUID unitId, Pageable pageable);
    
    // Buscar por unidade e status
    List<Invoice> findByUnitIdAndStatus(UUID unitId, ExpenseStatus status);
    Page<Invoice> findByUnitIdAndStatus(UUID unitId, ExpenseStatus status, Pageable pageable);
    
    // Buscar por unidade e tipo
    List<Invoice> findByUnitIdAndType(UUID unitId, ExpenseType type);
    Page<Invoice> findByUnitIdAndType(UUID unitId, ExpenseType type, Pageable pageable);
    
    // Buscar por mÃºltiplas unidades
    List<Invoice> findByUnitIdIn(List<UUID> unitIds);
    Page<Invoice> findByUnitIdIn(List<UUID> unitIds, Pageable pageable);
    
    // Buscar por mÃºltiplas unidades e status
    List<Invoice> findByUnitIdInAndStatus(List<UUID> unitIds, ExpenseStatus status);
    Page<Invoice> findByUnitIdInAndStatus(List<UUID> unitIds, ExpenseStatus status, Pageable pageable);
    
    // Buscar por mÃºltiplas unidades e perÃ­odo
    List<Invoice> findByUnitIdInAndDueDateBetween(List<UUID> unitIds, LocalDate startDate, LocalDate endDate);
    Page<Invoice> findByUnitIdInAndDueDateBetween(List<UUID> unitIds, LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    // Busca avanÃ§ada com mÃºltiplos filtros
    @Query("SELECT i FROM Invoice i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:type IS NULL OR i.type = :type) AND " +
           "(:supplierId IS NULL OR i.supplier.id = :supplierId) AND " +
           "(:clientId IS NULL OR i.client.id = :clientId) AND " +
           "(:unitId IS NULL OR i.unit.id = :unitId) AND " +
           "(:category IS NULL OR i.category = :category) AND " +
           "(:description IS NULL OR i.description LIKE %:description%) AND " +
           "(:startDate IS NULL OR i.dueDate >= :startDate) AND " +
           "(:endDate IS NULL OR i.dueDate <= :endDate)")
    Page<Invoice> findByAdvancedFilters(
        @Param("status") ExpenseStatus status,
        @Param("type") ExpenseType type,
        @Param("supplierId") java.util.UUID supplierId,
        @Param("clientId") java.util.UUID clientId,
        @Param("unitId") UUID unitId,
        @Param("category") String category,
        @Param("description") String description,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );
    
    // Calcular valor total por status
    @Query("SELECT i.status, SUM(i.amount) FROM Invoice i GROUP BY i.status")
    List<Object[]> sumAmountByStatus();
    
    // Calcular valor total por status e unidade
    @Query("SELECT i.status, SUM(i.amount) FROM Invoice i WHERE i.unit.id = :unitId GROUP BY i.status")
    List<Object[]> sumAmountByStatusAndUnit(@Param("unitId") UUID unitId);
    
    // Calcular valor total por tipo
    @Query("SELECT i.type, SUM(i.amount) FROM Invoice i GROUP BY i.type")
    List<Object[]> sumAmountByType();
    
    // Calcular valor total por tipo e unidade
    @Query("SELECT i.type, SUM(i.amount) FROM Invoice i WHERE i.unit.id = :unitId GROUP BY i.type")
    List<Object[]> sumAmountByTypeAndUnit(@Param("unitId") UUID unitId);
    
    // Calcular valor total por fornecedor
    @Query("SELECT i.supplier.name, SUM(i.amount) FROM Invoice i WHERE i.supplier IS NOT NULL GROUP BY i.supplier.name")
    List<Object[]> sumAmountBySupplier();
    
    // Calcular valor total por fornecedor e unidade
    @Query("SELECT i.supplier.name, SUM(i.amount) FROM Invoice i WHERE i.unit.id = :unitId AND i.supplier IS NOT NULL GROUP BY i.supplier.name")
    List<Object[]> sumAmountBySupplierAndUnit(@Param("unitId") UUID unitId);
    
    // Calcular valor total por categoria
    @Query("SELECT i.category, SUM(i.amount) FROM Invoice i WHERE i.category IS NOT NULL GROUP BY i.category")
    List<Object[]> sumAmountByCategory();
    
    // Calcular valor total por categoria e unidade
    @Query("SELECT i.category, SUM(i.amount) FROM Invoice i WHERE i.unit.id = :unitId AND i.category IS NOT NULL GROUP BY i.category")
    List<Object[]> sumAmountByCategoryAndUnit(@Param("unitId") UUID unitId);
    
    // Contar faturas por status
    @Query("SELECT i.status, COUNT(i) FROM Invoice i GROUP BY i.status")
    List<Object[]> countByStatus();
    
    // Contar faturas por status e unidade
    @Query("SELECT i.status, COUNT(i) FROM Invoice i WHERE i.unit.id = :unitId GROUP BY i.status")
    List<Object[]> countByStatusAndUnit(@Param("unitId") UUID unitId);
    
    // Contar faturas por tipo
    @Query("SELECT i.type, COUNT(i) FROM Invoice i GROUP BY i.type")
    List<Object[]> countByType();
    
    // Contar faturas por tipo e unidade
    @Query("SELECT i.type, COUNT(i) FROM Invoice i WHERE i.unit.id = :unitId GROUP BY i.type")
    List<Object[]> countByTypeAndUnit(@Param("unitId") UUID unitId);
    
    // Valor total de faturas pagas em um perÃ­odo
    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.paymentDate BETWEEN :startDate AND :endDate AND i.status = 'PAGA'")
    BigDecimal getTotalPaidInPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Valor total de faturas pagas em um perÃ­odo por unidade
    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.unit.id = :unitId AND i.paymentDate BETWEEN :startDate AND :endDate AND i.status = 'PAGA'")
    BigDecimal getTotalPaidInPeriodByUnit(@Param("unitId") UUID unitId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Valor total de faturas pendentes
    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.status = 'PENDENTE'")
    BigDecimal getTotalPending();
    
    // Valor total de faturas pendentes por unidade
    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.unit.id = :unitId AND i.status = 'PENDENTE'")
    BigDecimal getTotalPendingByUnit(@Param("unitId") UUID unitId);
    
    // Valor total de faturas vencidas
    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.dueDate < :date AND i.status NOT IN ('PAGA', 'CANCELADA')")
    BigDecimal getTotalOverdue(@Param("date") LocalDate date);
    
    // Valor total de faturas vencidas por unidade
    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.unit.id = :unitId AND i.dueDate < :date AND i.status NOT IN ('PAGA', 'CANCELADA')")
    BigDecimal getTotalOverdueByUnit(@Param("unitId") UUID unitId, @Param("date") LocalDate date);

    // Nota: manter assinaturas herdadas; o EntityGraph nÃ£o altera nullability
    @Override
    @EntityGraph(attributePaths = {"supplier", "client", "contract", "unit"})
    List<Invoice> findAll();

    @Override
    @EntityGraph(attributePaths = {"supplier", "client", "contract", "unit"})
    Page<Invoice> findAll(@org.springframework.lang.NonNull Pageable pageable);

    // ---- Centros de Custo ----
    long countByCentroCusto(String centroCusto);

    @Query("SELECT COALESCE(SUM(i.amount),0) FROM Invoice i WHERE (:centro IS NULL OR i.centroCusto = :centro) AND (:start IS NULL OR i.dueDate >= :start) AND (:end IS NULL OR i.dueDate <= :end)")
    BigDecimal sumByCentroCustoAndPeriod(@Param("centro") String centro,
                                         @Param("start") LocalDate start,
                                         @Param("end") LocalDate end);

    @Query("SELECT i FROM Invoice i WHERE (:centro IS NULL OR i.centroCusto = :centro) AND (:start IS NULL OR i.dueDate >= :start) AND (:end IS NULL OR i.dueDate <= :end)")
    List<Invoice> findByCentroCustoAndPeriod(@Param("centro") String centro,
                                             @Param("start") LocalDate start,
                                             @Param("end") LocalDate end);
    
    // Buscar categorias Ãºnicas
    @Query("SELECT DISTINCT i.category FROM Invoice i WHERE i.category IS NOT NULL ORDER BY i.category")
    List<String> findDistinctCategories();
    
    // Buscar centros de custo Ãºnicos
    @Query("SELECT DISTINCT i.centroCusto FROM Invoice i WHERE i.centroCusto IS NOT NULL ORDER BY i.centroCusto")
    List<String> findDistinctCostCenters();
    
    // Buscar centros de custo da tabela cost_centers
    @Query("SELECT cc.name FROM CostCenter cc WHERE cc.status = 'ACTIVE' ORDER BY cc.name")
    List<String> findActiveCostCenterNames();
    
    // Buscar todos os centros de custo da tabela cost_centers (incluindo inativos)
    @Query("SELECT cc.name FROM CostCenter cc ORDER BY cc.name")
    List<String> findAllCostCenterNames();
    
    // Buscar invoice por ID com todos os relacionamentos carregados (evita LazyInitializationException)
    @EntityGraph(attributePaths = {"supplier", "client", "contract", "unit"})
    @Query("SELECT i FROM Invoice i WHERE i.id = :id")
    Optional<Invoice> findByIdWithRelations(@Param("id") UUID id);
} 
