package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ProspectingLead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProspectingLeadRepository extends JpaRepository<ProspectingLead, UUID> {

    List<ProspectingLead> findByStatus(String status);

    List<ProspectingLead> findByCityContainingIgnoreCase(String city);

    List<ProspectingLead> findByCnae(String cnae);

    List<ProspectingLead> findByCnpj(String cnpj);

    List<ProspectingLead> findBySearchTerm(String searchTerm);

    List<ProspectingLead> findBySource(String source);

    long countByStatus(String status);

    long countByCityContainingIgnoreCase(String city);

    @Query("SELECT p FROM ProspectingLead p WHERE " +
           "(:city IS NULL OR LOWER(p.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:cnae IS NULL OR p.cnae = :cnae) AND " +
           "(:activity IS NULL OR LOWER(p.activity) LIKE LOWER(CONCAT('%', :activity, '%'))) AND " +
           "(:status IS NULL OR p.status = :status)")
    List<ProspectingLead> findByFilters(
        @Param("city") String city,
        @Param("cnae") String cnae,
        @Param("activity") String activity,
        @Param("status") String status
    );

    @Query("SELECT p FROM ProspectingLead p WHERE " +
           "LOWER(p.companyName) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(p.tradeName) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(p.cnpj) LIKE CONCAT('%', :term, '%') OR " +
           "LOWER(p.activity) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(p.city) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(p.cnaeDescription) LIKE LOWER(CONCAT('%', :term, '%'))")
    List<ProspectingLead> searchProspectedLeads(@Param("term") String term);

    boolean existsByGooglePlaceId(String googlePlaceId);

    boolean existsByCnpjAndStatusNot(String cnpj, String excludedStatus);
}
