package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Supplier;
import com.z7design.fleet_manager.tenant.TenantContext;
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
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
    
    // Buscar fornecedores ativos
    List<Supplier> findByIsActiveTrue();
    
    // Buscar fornecedores ativos com paginaÃ§Ã£o
    Page<Supplier> findByIsActiveTrue(Pageable pageable);
    
    // Buscar por CNPJ (com LIMIT 1 para evitar NonUniqueResultException)
    @Query(value = "SELECT * FROM suppliers WHERE cnpj = :cnpj LIMIT 1", nativeQuery = true)
    Optional<Supplier> findByCnpj(@Param("cnpj") String cnpj);

    // Buscar primeiro por CNPJ (limita a 1 resultado para evitar NonUniqueResultException em multi-empresa)
    Optional<Supplier> findFirstByCnpj(String cnpj);

    // Buscar primeiro por empresa e CNPJ
    Optional<Supplier> findFirstByCompanyIdAndCnpj(UUID companyId, String cnpj);

    // Buscar por CNPJ limpo via query nativa (ignora formatações, respeitando a empresa)
    @Query(value = "SELECT * FROM suppliers WHERE REPLACE(REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', ''), ' ', '') = :cleanCnpj " +
            "AND (CAST(:companyId AS uuid) IS NULL OR company_id = CAST(:companyId AS uuid)) LIMIT 1", nativeQuery = true)
    Optional<Supplier> findByCleanCnpjNativeScoped(@Param("cleanCnpj") String cleanCnpj,
            @Param("companyId") UUID companyId);

    default Optional<Supplier> findByCleanCnpjNative(String cleanCnpj) {
        return findByCleanCnpjNativeScoped(cleanCnpj, TenantContext.get());
    }

    // Buscar por nome exato
    Optional<Supplier> findFirstByNameIgnoreCase(String name);
    
    // Buscar por nome (contendo)
    List<Supplier> findByNameContainingIgnoreCase(String name);
    
    // Buscar por nome com paginaÃ§Ã£o
    Page<Supplier> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    // Buscar por cidade
    List<Supplier> findByCityIgnoreCase(String city);
    
    // Buscar por estado
    List<Supplier> findByStateIgnoreCase(String state);
    
    // Buscar por email
    Optional<Supplier> findByEmail(String email);
    
    // Buscar fornecedores por status
    List<Supplier> findByIsActive(Boolean isActive);
    
    // Buscar fornecedores por status com paginaÃ§Ã£o
    Page<Supplier> findByIsActive(Boolean isActive, Pageable pageable);
    
    // Busca avanÃ§ada
    @Query("SELECT s FROM Supplier s WHERE " +
           "(:name IS NULL OR s.name LIKE %:name%) AND " +
           "(:cnpj IS NULL OR s.cnpj LIKE %:cnpj%) AND " +
           "(:city IS NULL OR s.city LIKE %:city%) AND " +
           "(:state IS NULL OR s.state LIKE %:state%) AND " +
           "(:isActive IS NULL OR s.isActive = :isActive)")
    Page<Supplier> findByFilters(
        @Param("name") String name,
        @Param("cnpj") String cnpj,
        @Param("city") String city,
        @Param("state") String state,
        @Param("isActive") Boolean isActive,
        Pageable pageable
    );
    
    // Contar fornecedores ativos
    long countByIsActiveTrue();
    
    // Contar fornecedores inativos
    long countByIsActiveFalse();
} 
