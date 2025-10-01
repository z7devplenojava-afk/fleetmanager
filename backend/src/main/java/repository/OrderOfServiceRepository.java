package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.OrderOfService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderOfServiceRepository extends JpaRepository<OrderOfService, UUID> {
    
    List<OrderOfService> findByEmployeeId(UUID employeeId);
    
    List<OrderOfService> findBySigned(Boolean signed);
    
    @Query("SELECT os FROM OrderOfService os WHERE os.employeeName LIKE %:searchTerm% OR os.role LIKE %:searchTerm% OR os.company LIKE %:searchTerm% OR os.client LIKE %:searchTerm%")
    List<OrderOfService> searchByTerm(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT os FROM OrderOfService os WHERE os.employeeId = :employeeId AND os.signed = :signed")
    List<OrderOfService> findByEmployeeIdAndSigned(@Param("employeeId") UUID employeeId, @Param("signed") Boolean signed);
} 