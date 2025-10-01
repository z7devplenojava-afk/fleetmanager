package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Client;
import br.com.fleetmanager.model.enums.ClientStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, java.util.UUID> {
    
    Optional<Client> findByCnpj(String cnpj);
    
    boolean existsByCnpj(String cnpj);
    
    List<Client> findByStatus(ClientStatus status);
    
    Page<Client> findByStatus(ClientStatus status, Pageable pageable);
    
    @Query("SELECT c FROM Client c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.cnpj) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.contactName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Client> findBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    @Query("SELECT c FROM Client c WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.cnpj) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.contactName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Client> findByStatusAndSearchTerm(@Param("status") ClientStatus status, 
                                          @Param("searchTerm") String searchTerm, 
                                          Pageable pageable);
    
    @Query("SELECT COUNT(c) FROM Client c WHERE c.status = :status")
    long countByStatus(@Param("status") ClientStatus status);
} 