package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DocumentPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentPageRepository extends JpaRepository<DocumentPage, UUID> {
    
    List<DocumentPage> findByJobId(UUID jobId);
    
    List<DocumentPage> findByJobIdAndType(UUID jobId, DocumentPage.DocumentType type);
    
    // Retorna lista porque pode haver mÃºltiplas pÃ¡ginas com o mesmo hash (pÃ¡ginas duplicadas)
    List<DocumentPage> findByHash(String hash);
    
    @Query("SELECT d FROM DocumentPage d WHERE d.cpf = :cpf AND d.liquidValue = :value AND d.period = :period")
    List<DocumentPage> findByCpfAndValueAndPeriod(
        @Param("cpf") String cpf,
        @Param("value") BigDecimal value,
        @Param("period") String period
    );
    
    @Query("SELECT d FROM DocumentPage d WHERE d.type = :type AND d.liquidValue = :value AND d.period = :period")
    List<DocumentPage> findByTypeAndValueAndPeriod(
        @Param("type") DocumentPage.DocumentType type,
        @Param("value") BigDecimal value,
        @Param("period") String period
    );
    
    List<DocumentPage> findByStatus(DocumentPage.DocumentPageStatus status);
    
    long countByType(DocumentPage.DocumentType type);
    
    long countByStatus(DocumentPage.DocumentPageStatus status);
}


