package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.enums.ClientStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, java.util.UUID>, JpaSpecificationExecutor<Client> {
    
    Optional<Client> findByCnpj(String cnpj);

    Optional<Client> findByEmail(String email);

    Optional<Client> findByCnpjAndCompanyId(String cnpj, java.util.UUID companyId);
    
    boolean existsByCnpj(String cnpj);

    boolean existsByCnpjAndCompanyId(String cnpj, java.util.UUID companyId);
    
    List<Client> findByCompanyId(java.util.UUID companyId);

    Page<Client> findByCompanyId(java.util.UUID companyId, Pageable pageable);

    @Query("SELECT c FROM Client c WHERE (:companyId IS NULL OR c.companyId = :companyId OR c.companyId IS NULL) ORDER BY c.name ASC")
    Page<Client> findByCompanyIdOrCompanyIdIsNull(@Param("companyId") java.util.UUID companyId, Pageable pageable);

    @Query("SELECT c FROM Client c WHERE (:companyId IS NULL OR c.companyId = :companyId OR c.companyId IS NULL) ORDER BY c.name ASC")
    List<Client> findByCompanyIdOrCompanyIdIsNull(@Param("companyId") java.util.UUID companyId);

    List<Client> findByStatus(ClientStatus status);

    List<Client> findByStatusAndCompanyId(ClientStatus status, java.util.UUID companyId);

    @Query("SELECT c FROM Client c WHERE (:companyId IS NULL OR c.companyId = :companyId OR c.companyId IS NULL) AND " +
           "(:status IS NULL OR c.status = :status) ORDER BY c.name ASC")
    List<Client> findByStatusAndCompanyIdOrCompanyIdIsNull(@Param("status") ClientStatus status, @Param("companyId") java.util.UUID companyId);
    
    Page<Client> findByStatus(ClientStatus status, Pageable pageable);

    Page<Client> findByStatusAndCompanyId(ClientStatus status, java.util.UUID companyId, Pageable pageable);

    @Query("SELECT c FROM Client c WHERE (:companyId IS NULL OR c.companyId = :companyId OR c.companyId IS NULL) AND " +
           "(:status IS NULL OR c.status = :status) ORDER BY c.name ASC")
    Page<Client> findByStatusAndCompanyIdOrCompanyIdIsNull(@Param("status") ClientStatus status, 
                                                          @Param("companyId") java.util.UUID companyId, 
                                                          Pageable pageable);
    
    @Query("SELECT c FROM Client c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.cnpj) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.contactName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Client> findBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);

    @Query("SELECT c FROM Client c WHERE (:companyId IS NULL OR c.companyId = :companyId OR c.companyId IS NULL) AND (" +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.cnpj) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.contactName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) ORDER BY c.name ASC")
    Page<Client> findBySearchTermAndCompanyId(@Param("searchTerm") String searchTerm,
                                              @Param("companyId") java.util.UUID companyId,
                                              Pageable pageable);
    
    @Query("SELECT c FROM Client c WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.cnpj) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.contactName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Client> findByStatusAndSearchTerm(@Param("status") ClientStatus status, 
                                           @Param("searchTerm") String searchTerm, 
                                           Pageable pageable);

    @Query("SELECT c FROM Client c WHERE (:companyId IS NULL OR c.companyId = :companyId OR c.companyId IS NULL) AND " +
           "(:status IS NULL OR c.status = :status) AND (" +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.cnpj) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.contactName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) ORDER BY c.name ASC")
    Page<Client> findByStatusAndSearchTermAndCompanyId(@Param("status") ClientStatus status, 
                                                       @Param("searchTerm") String searchTerm, 
                                                       @Param("companyId") java.util.UUID companyId, 
                                                       Pageable pageable);
    
    @Query("SELECT COUNT(c) FROM Client c WHERE c.status = :status")
    long countByStatus(@Param("status") ClientStatus status);

    @Query("SELECT COUNT(c) FROM Client c WHERE (:companyId IS NULL OR c.companyId = :companyId OR c.companyId IS NULL) AND c.status = :status")
    long countByStatusAndCompanyId(@Param("status") ClientStatus status, @Param("companyId") java.util.UUID companyId);

    Optional<Client> findByIdAndCompanyId(java.util.UUID id, java.util.UUID companyId);
}
