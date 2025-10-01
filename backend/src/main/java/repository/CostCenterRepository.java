package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.CostCenter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CostCenterRepository extends JpaRepository<CostCenter, UUID> {
    
    Optional<CostCenter> findByCode(String code);
    
    boolean existsByCode(String code);
    
    List<CostCenter> findByStatus(CostCenter.CostCenterStatus status);
    
    List<CostCenter> findByDepartment(String department);
    
    List<CostCenter> findByResponsible(String responsible);
    
    @Query("SELECT cc FROM CostCenter cc WHERE cc.name ILIKE %:name%")
    List<CostCenter> findByNameContainingIgnoreCase(@Param("name") String name);
    
    @Query("SELECT cc FROM CostCenter cc WHERE cc.code ILIKE %:code%")
    List<CostCenter> findByCodeContainingIgnoreCase(@Param("code") String code);
    
    @Query("SELECT cc FROM CostCenter cc WHERE cc.responsible ILIKE %:responsible%")
    List<CostCenter> findByResponsibleContainingIgnoreCase(@Param("responsible") String responsible);
    
    @Query("SELECT cc FROM CostCenter cc WHERE cc.department ILIKE %:department%")
    List<CostCenter> findByDepartmentContainingIgnoreCase(@Param("department") String department);
    
    @Query("SELECT cc FROM CostCenter cc WHERE " +
           "cc.name ILIKE %:searchTerm% OR " +
           "cc.code ILIKE %:searchTerm% OR " +
           "cc.responsible ILIKE %:searchTerm% OR " +
           "cc.department ILIKE %:searchTerm%")
    List<CostCenter> findBySearchTerm(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT cc FROM CostCenter cc WHERE " +
           "(:status IS NULL OR cc.status = :status) AND " +
           "(:department IS NULL OR cc.department = :department) AND " +
           "(:searchTerm IS NULL OR " +
           "cc.name ILIKE %:searchTerm% OR " +
           "cc.code ILIKE %:searchTerm% OR " +
           "cc.responsible ILIKE %:searchTerm% OR " +
           "cc.department ILIKE %:searchTerm%)")
    Page<CostCenter> findByFilters(
            @Param("status") CostCenter.CostCenterStatus status,
            @Param("department") String department,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);
    
    @Query("SELECT cc FROM CostCenter cc WHERE " +
           "(:status IS NULL OR cc.status = :status) AND " +
           "(:department IS NULL OR cc.department = :department) AND " +
           "(:searchTerm IS NULL OR " +
           "cc.name ILIKE %:searchTerm% OR " +
           "cc.code ILIKE %:searchTerm% OR " +
           "cc.responsible ILIKE %:searchTerm% OR " +
           "cc.department ILIKE %:searchTerm%)")
    List<CostCenter> findByFiltersList(
            @Param("status") CostCenter.CostCenterStatus status,
            @Param("department") String department,
            @Param("searchTerm") String searchTerm);
    
    @Query("SELECT DISTINCT cc.department FROM CostCenter cc WHERE cc.department IS NOT NULL ORDER BY cc.department")
    List<String> findDistinctDepartments();
    
    @Query("SELECT COUNT(cc) FROM CostCenter cc WHERE cc.status = :status")
    Long countByStatus(@Param("status") CostCenter.CostCenterStatus status);
    
    @Query("SELECT COUNT(cc) FROM CostCenter cc")
    Long countAllCenters();
    
    @Query("SELECT SUM(cc.budget) FROM CostCenter cc WHERE cc.budget IS NOT NULL")
    BigDecimal sumTotalBudget();
    
    @Query("SELECT SUM(cc.currentSpent) FROM CostCenter cc WHERE cc.currentSpent IS NOT NULL")
    BigDecimal sumTotalSpent();
    
    @Query("SELECT cc FROM CostCenter cc WHERE cc.budget IS NOT NULL AND cc.currentSpent IS NOT NULL " +
           "AND cc.currentSpent > cc.budget ORDER BY (cc.currentSpent - cc.budget) DESC")
    List<CostCenter> findOverBudgetCenters();
    
    @Query("SELECT cc FROM CostCenter cc WHERE cc.budget IS NOT NULL AND cc.currentSpent IS NOT NULL " +
           "AND (cc.currentSpent / cc.budget) >= 0.9 ORDER BY (cc.currentSpent / cc.budget) DESC")
    List<CostCenter> findNearBudgetLimitCenters();
    
    @Query("SELECT cc FROM CostCenter cc WHERE cc.budget IS NOT NULL AND cc.currentSpent IS NOT NULL " +
           "ORDER BY (cc.currentSpent / cc.budget) DESC")
    List<CostCenter> findTopUtilizedCenters(Pageable pageable);
    
    @Query("SELECT cc FROM CostCenter cc WHERE cc.status = 'ATIVO' ORDER BY cc.name ASC")
    List<CostCenter> findActiveCentersOrderByName();
    
    @Query("SELECT cc FROM CostCenter cc ORDER BY cc.name ASC")
    Page<CostCenter> findAllOrderByName(Pageable pageable);
}