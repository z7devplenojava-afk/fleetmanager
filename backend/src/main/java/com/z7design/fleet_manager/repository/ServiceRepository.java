package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Service;
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
public interface ServiceRepository extends JpaRepository<Service, UUID> {
    
    // Buscar por status
    List<Service> findByStatus(Service.ServiceStatus status);
    
    Page<Service> findByStatus(Service.ServiceStatus status, Pageable pageable);
    
    // Buscar por categoria
    List<Service> findByCategory(String category);
    
    Page<Service> findByCategory(String category, Pageable pageable);
    
    // Buscar por cÃ³digo
    Optional<Service> findByCode(String code);
    
    boolean existsByCode(String code);
    
    // Buscar por nome (case insensitive)
    @Query("SELECT s FROM Service s WHERE s.name ILIKE %:name%")
    List<Service> findByNameContainingIgnoreCase(@Param("name") String name);
    
    @Query("SELECT s FROM Service s WHERE s.name ILIKE %:name%")
    Page<Service> findByNameContainingIgnoreCase(@Param("name") String name, Pageable pageable);
    
    // Buscar por descriÃ§Ã£o (case insensitive)
    @Query("SELECT s FROM Service s WHERE s.description ILIKE %:description%")
    List<Service> findByDescriptionContainingIgnoreCase(@Param("description") String description);
    
    // Buscar serviÃ§os ativos
    @Query("SELECT s FROM Service s WHERE s.status = 'ACTIVE'")
    List<Service> findActiveServices();
    
    @Query("SELECT s FROM Service s WHERE s.status = 'ACTIVE'")
    Page<Service> findActiveServices(Pageable pageable);
    
    // Buscar serviÃ§os faturÃ¡veis
    @Query("SELECT s FROM Service s WHERE s.isBillable = true AND s.status = 'ACTIVE'")
    List<Service> findBillableServices();
    
    // Buscar serviÃ§os que requerem equipamento
    @Query("SELECT s FROM Service s WHERE s.requiresEquipment = true")
    List<Service> findServicesRequiringEquipment();
    
    // Buscar serviÃ§os que requerem certificaÃ§Ã£o
    @Query("SELECT s FROM Service s WHERE s.requiresCertification = true")
    List<Service> findServicesRequiringCertification();
    
    // Buscar por faixa de preÃ§o
    @Query("SELECT s FROM Service s WHERE s.unitPrice BETWEEN :minPrice AND :maxPrice")
    List<Service> findByPriceRange(@Param("minPrice") java.math.BigDecimal minPrice, 
                                  @Param("maxPrice") java.math.BigDecimal maxPrice);
    
    // Buscar por duraÃ§Ã£o estimada
    @Query("SELECT s FROM Service s WHERE s.estimatedDurationHours BETWEEN :minHours AND :maxHours")
    List<Service> findByDurationRange(@Param("minHours") Integer minHours, 
                                     @Param("maxHours") Integer maxHours);
    
    // Buscar por nÃºmero de funcionÃ¡rios
    @Query("SELECT s FROM Service s WHERE s.minEmployeesRequired <= :employeeCount AND (s.maxEmployeesAllowed IS NULL OR s.maxEmployeesAllowed >= :employeeCount)")
    List<Service> findByEmployeeCount(@Param("employeeCount") Integer employeeCount);
    
    // Buscar categorias distintas
    @Query("SELECT DISTINCT s.category FROM Service s WHERE s.category IS NOT NULL ORDER BY s.category")
    List<String> findDistinctCategories();
    
    // Contar por status
    @Query("SELECT COUNT(s) FROM Service s WHERE s.status = :status")
    Long countByStatus(@Param("status") Service.ServiceStatus status);
    
    // Contar serviÃ§os ativos
    @Query("SELECT COUNT(s) FROM Service s WHERE s.status = 'ACTIVE'")
    Long countActiveServices();
    
    // Contar serviÃ§os faturÃ¡veis
    @Query("SELECT COUNT(s) FROM Service s WHERE s.isBillable = true AND s.status = 'ACTIVE'")
    Long countBillableServices();
    
    // Buscar com filtros combinados
    @Query("SELECT s FROM Service s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:category IS NULL OR s.category = :category) AND " +
           "(:isBillable IS NULL OR s.isBillable = :isBillable) AND " +
           "(:searchTerm IS NULL OR " +
           "s.name ILIKE %:searchTerm% OR " +
           "s.description ILIKE %:searchTerm% OR " +
           "s.code ILIKE %:searchTerm%)")
    Page<Service> findByFilters(@Param("status") Service.ServiceStatus status,
                               @Param("category") String category,
                               @Param("isBillable") Boolean isBillable,
                               @Param("searchTerm") String searchTerm,
                               Pageable pageable);
    
    // Buscar com filtros (sem paginaÃ§Ã£o)
    @Query("SELECT s FROM Service s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:category IS NULL OR s.category = :category) AND " +
           "(:isBillable IS NULL OR s.isBillable = :isBillable) AND " +
           "(:searchTerm IS NULL OR " +
           "s.name ILIKE %:searchTerm% OR " +
           "s.description ILIKE %:searchTerm% OR " +
           "s.code ILIKE %:searchTerm%)")
    List<Service> findByFiltersList(@Param("status") Service.ServiceStatus status,
                                   @Param("category") String category,
                                   @Param("isBillable") Boolean isBillable,
                                   @Param("searchTerm") String searchTerm);
    
    // Ordenar por nome
    @Query("SELECT s FROM Service s ORDER BY s.name ASC")
    List<Service> findAllOrderByName();
    
    @Query("SELECT s FROM Service s ORDER BY s.name ASC")
    Page<Service> findAllOrderByName(Pageable pageable);
    
    // Ordenar por data de criaÃ§Ã£o (mais recentes primeiro)
    @Query("SELECT s FROM Service s ORDER BY s.createdAt DESC")
    List<Service> findAllOrderByCreatedAtDesc();
    
    @Query("SELECT s FROM Service s ORDER BY s.createdAt DESC")
    Page<Service> findAllOrderByCreatedAtDesc(Pageable pageable);
}

