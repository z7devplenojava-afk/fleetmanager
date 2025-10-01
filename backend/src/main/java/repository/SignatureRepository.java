package br.com.fleetmanager.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.fleetmanager.model.DocumentSignature;

@Repository
public interface SignatureRepository extends JpaRepository<DocumentSignature, UUID> {
    
    /**
     * Busca todas as assinaturas de um documento específico, ordenadas por data de assinatura (mais recente primeiro)
     */
    List<DocumentSignature> findByDocumentIdOrderBySignatureDateDesc(UUID documentId);
    
    /**
     * Verifica se existe uma assinatura para um documento específico
     */
    boolean existsByDocumentId(UUID documentId);
    
    /**
     * Busca todas as assinaturas ordenadas por data de assinatura (mais recente primeiro)
     */
    List<DocumentSignature> findAllByOrderBySignatureDateDesc();
    
    /**
     * Busca assinaturas por CPF do signatário
     */
    List<DocumentSignature> findBySignerCpfOrderBySignatureDateDesc(String signerCpf);
    
    /**
     * Busca assinaturas por nome do signatário (busca parcial)
     */
    List<DocumentSignature> findBySignerNameContainingIgnoreCaseOrderBySignatureDateDesc(String signerName);
} 