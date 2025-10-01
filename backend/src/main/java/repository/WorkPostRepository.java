package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.WorkPost;
import br.com.fleetmanager.model.enums.WorkPostStatus;
import br.com.fleetmanager.model.enums.WorkPostType;
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
public interface WorkPostRepository extends JpaRepository<WorkPost, java.util.UUID> {
    
    // Buscar todos os postos com relacionamentos carregados
    @Query("SELECT DISTINCT wp FROM WorkPost wp " +
           "LEFT JOIN FETCH wp.client c " +
           "LEFT JOIN FETCH wp.contract ct " +
           "LEFT JOIN FETCH wp.responsible r " +
           "ORDER BY wp.name")
    List<WorkPost> findAllWithRelations();
    
    // Buscar por código do posto
    Optional<WorkPost> findByPostCode(String postCode);
    
    // Buscar por status
    List<WorkPost> findByStatus(WorkPostStatus status);
    Page<WorkPost> findByStatus(WorkPostStatus status, Pageable pageable);
    
    // Buscar por tipo
    List<WorkPost> findByType(WorkPostType type);
    Page<WorkPost> findByType(WorkPostType type, Pageable pageable);
    
    // Buscar por cliente
    List<WorkPost> findByClientId(UUID clientId);
    Page<WorkPost> findByClientId(UUID clientId, Pageable pageable);
    
    // Buscar por contrato
    List<WorkPost> findByContractId(UUID contractId);
    Page<WorkPost> findByContractId(UUID contractId, Pageable pageable);
    
    // Buscar por cliente e status
    List<WorkPost> findByClientIdAndStatus(UUID clientId, WorkPostStatus status);
    Page<WorkPost> findByClientIdAndStatus(UUID clientId, WorkPostStatus status, Pageable pageable);
    
    // Buscar por responsável
    List<WorkPost> findByResponsibleId(UUID responsibleId);
    Page<WorkPost> findByResponsibleId(UUID responsibleId, Pageable pageable);
    
    // Buscar postos em implantação
    List<WorkPost> findByStatusAndImplementationDateBetween(
        WorkPostStatus status, LocalDate startDate, LocalDate endDate);
    
    // Buscar por nome (busca parcial)
    List<WorkPost> findByNameContainingIgnoreCase(String name);
    Page<WorkPost> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    // Buscar por endereço (busca parcial)
    List<WorkPost> findByAddressContainingIgnoreCase(String address);
    Page<WorkPost> findByAddressContainingIgnoreCase(String address, Pageable pageable);
    
    // Buscar por cidade
    List<WorkPost> findByCityIgnoreCase(String city);
    Page<WorkPost> findByCityIgnoreCase(String city, Pageable pageable);
    
    // Buscar por estado
    List<WorkPost> findByStateIgnoreCase(String state);
    Page<WorkPost> findByStateIgnoreCase(String state, Pageable pageable);
    
    // Busca com filtros combinados
    @Query("SELECT wp FROM WorkPost wp WHERE " +
           "(:clientId IS NULL OR wp.client.id = :clientId) AND " +
           "(:status IS NULL OR wp.status = :status) AND " +
           "(:type IS NULL OR wp.type = :type) AND " +
           "(:searchTerm IS NULL OR LOWER(wp.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(wp.postCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(wp.address) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<WorkPost> findByFilters(@Param("clientId") UUID clientId, 
                                @Param("status") WorkPostStatus status, 
                                @Param("type") WorkPostType type,
                                @Param("searchTerm") String searchTerm, 
                                Pageable pageable);
    
    // Contar postos por status
    long countByStatus(WorkPostStatus status);
    
    // Contar postos por cliente
    long countByClientId(UUID clientId);
    
    // Contar postos por tipo
    long countByType(WorkPostType type);
    
    // Buscar postos que serão implantados em um período
    @Query("SELECT wp FROM WorkPost wp WHERE wp.implementationDate BETWEEN :startDate AND :endDate")
    List<WorkPost> findPostsToBeImplementedBetween(@Param("startDate") LocalDate startDate, 
                                                   @Param("endDate") LocalDate endDate);
    
    // Verificar se código do posto já existe
    boolean existsByPostCode(String postCode);
}