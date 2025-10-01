package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Company;
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
public interface CompanyRepository extends JpaRepository<Company, UUID> {

    // Buscar por nome
    List<Company> findByNameContainingIgnoreCase(String name);

    // Buscar por CNPJ
    Optional<Company> findByCnpj(String cnpj);

    // Buscar por status
    List<Company> findByStatus(Company.CompanyStatus status);

    // Buscar por cidade
    List<Company> findByCityContainingIgnoreCase(String city);

    // Buscar por estado
    List<Company> findByState(String state);

    // Buscar por setor
    List<Company> findBySectorContainingIgnoreCase(String sector);

    // Buscar por tipo
    List<Company> findByType(String type);

    // Buscar por tamanho
    List<Company> findBySize(String size);

    // Buscar empresas ativas
    List<Company> findByStatusOrderByName(Company.CompanyStatus status);

    // Busca avançada com múltiplos critérios
    @Query("SELECT c FROM Company c WHERE " +
           "(:name IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:cnpj IS NULL OR c.cnpj LIKE CONCAT('%', :cnpj, '%')) AND " +
           "(:city IS NULL OR LOWER(c.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:state IS NULL OR c.state = :state) AND " +
           "(:sector IS NULL OR LOWER(c.sector) LIKE LOWER(CONCAT('%', :sector, '%'))) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:type IS NULL OR c.type = :type)")
    Page<Company> findByAdvancedFilters(
            @Param("name") String name,
            @Param("cnpj") String cnpj,
            @Param("city") String city,
            @Param("state") String state,
            @Param("sector") String sector,
            @Param("status") Company.CompanyStatus status,
            @Param("type") String type,
            Pageable pageable
    );

    // Busca por texto (busca em nome, CNPJ, cidade, setor)
    @Query("SELECT c FROM Company c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.tradeName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "c.cnpj LIKE CONCAT('%', :searchTerm, '%') OR " +
           "LOWER(c.city) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.sector) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.contactPerson) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Company> findBySearchTerm(@Param("searchTerm") String searchTerm);

    // Contar empresas por status
    long countByStatus(Company.CompanyStatus status);

    // Contar empresas por estado
    long countByState(String state);

    // Contar empresas por setor
    long countBySector(String sector);

    // Contar empresas por tipo
    long countByType(String type);

    // Contar empresas por tamanho
    long countBySize(String size);

    // Verificar se CNPJ existe
    boolean existsByCnpj(String cnpj);

    // Verificar se nome existe
    boolean existsByName(String name);
} 