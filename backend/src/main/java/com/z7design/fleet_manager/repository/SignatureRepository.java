package com.z7design.fleet_manager.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.DocumentSignature;

@Repository
public interface SignatureRepository extends JpaRepository<DocumentSignature, UUID> {
    
    /**
     * Busca todas as assinaturas de um documento especÃ­fico, ordenadas por data de assinatura (mais recente primeiro)
     */
    List<DocumentSignature> findByDocumentIdOrderBySignatureDateDesc(UUID documentId);
    
    /**
     * Verifica se existe uma assinatura para um documento especÃ­fico
     */
    boolean existsByDocumentId(UUID documentId);
    
    /**
     * Busca todas as assinaturas ordenadas por data de assinatura (mais recente primeiro)
     */
    List<DocumentSignature> findAllByOrderBySignatureDateDesc();
    
    /**
     * Busca assinaturas por CPF do signatÃ¡rio
     */
    List<DocumentSignature> findBySignerCpfOrderBySignatureDateDesc(String signerCpf);
    
    /**
     * Busca assinaturas por nome do signatÃ¡rio (busca parcial)
     */
    List<DocumentSignature> findBySignerNameContainingIgnoreCaseOrderBySignatureDateDesc(String signerName);
} 
