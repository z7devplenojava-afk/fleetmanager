package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.StockItem;
import com.z7design.fleet_manager.model.enums.StockCategory;
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
public interface StockItemRepository extends JpaRepository<StockItem, UUID> {

    // Buscar por código
    Optional<StockItem> findByCode(String code);

    // Buscar por nome contendo (case insensitive)
    List<StockItem> findByNameContainingIgnoreCase(String name);

    // Buscar por empresa e código
    Optional<StockItem> findByCompanyIdAndCode(UUID companyId, String code);

    // Buscar por código sem empresa (legado/admin)
    Optional<StockItem> findByCodeAndCompanyIdIsNull(String code);

    // Buscar por QR Code
    Optional<StockItem> findByQrCode(String qrCode);

    // Buscar por categoria
    List<StockItem> findByCategory(StockCategory category);

    // Buscar ativos
    List<StockItem> findByActiveTrue();

    // Buscar por categoria e ativos
    List<StockItem> findByCategoryAndActiveTrue(StockCategory category);

    // Buscar itens com baixo estoque
    @Query("SELECT si FROM StockItem si WHERE si.active = true AND si.currentQuantity <= si.minimumQuantity")
    List<StockItem> findLowStockItems();

    // Buscar itens sem estoque
    @Query("SELECT si FROM StockItem si WHERE si.active = true AND si.currentQuantity = 0")
    List<StockItem> findOutOfStockItems();

    // Buscar por unidade
    List<StockItem> findByUnitId(UUID unitId);

    // Busca com filtros múltiplos
    @Query("SELECT si FROM StockItem si WHERE " +
           "(CAST(:category AS string) IS NULL OR si.category = :category) AND " +
           "(CAST(:active AS boolean) IS NULL OR si.active = :active) AND " +
           "(CAST(:unitId AS uuid) IS NULL OR si.unit.id = :unitId) AND " +
           "(CAST(:lowStock AS boolean) IS NULL OR CAST(:lowStock AS boolean) = false OR (CAST(:lowStock AS boolean) = true AND si.currentQuantity <= si.minimumQuantity)) AND " +
           "(CAST(:searchTerm AS string) IS NULL OR " +
           "LOWER(si.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(si.code) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(COALESCE(si.description, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(COALESCE(si.sizeVariation, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(COALESCE(si.notes, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(COALESCE(si.barcode, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<StockItem> findByFilters(
            @Param("category") StockCategory category,
            @Param("active") Boolean active,
            @Param("unitId") UUID unitId,
            @Param("lowStock") Boolean lowStock,
            @Param("searchTerm") String searchTerm,
            Pageable pageable
    );

    // Busca por texto
    @Query("SELECT si FROM StockItem si WHERE " +
           "LOWER(si.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(si.code) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(COALESCE(si.description, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(COALESCE(si.sizeVariation, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(COALESCE(si.notes, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(COALESCE(si.barcode, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<StockItem> findBySearchTerm(@Param("searchTerm") String searchTerm);

    // EstatÃ­sticas por categoria
    @Query("SELECT si.category, COUNT(si), SUM(si.currentQuantity) FROM StockItem si WHERE si.active = true GROUP BY si.category")
    List<Object[]> getStatisticsByCategory();

    // Valor total do estoque
    @Query("SELECT SUM(si.currentQuantity * si.unitCost) FROM StockItem si WHERE si.active = true AND si.unitCost IS NOT NULL")
    Double getTotalStockValue();

    // Contar itens por categoria
    Long countByCategoryAndActiveTrue(StockCategory category);

    // Verificar se cÃ³digo jÃ¡ existe
    boolean existsByCodeAndIdNot(String code, UUID id);

    // Verificar se cÃ³digo existe
    boolean existsByCode(String code);
}
