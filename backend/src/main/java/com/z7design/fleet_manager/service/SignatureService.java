package com.z7design.fleet_manager.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.model.DocumentSignature;
import com.z7design.fleet_manager.model.Document;
import com.z7design.fleet_manager.repository.SignatureRepository;
import com.z7design.fleet_manager.repository.DocumentRepository;
import com.z7design.fleet_manager.exception.BusinessException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SignatureService {

    private final SignatureRepository signatureRepository;
    private final DocumentRepository documentRepository;

    @Transactional
    public DocumentSignature createSignature(
            UUID documentId,
            String signerName,
            String signerCpf,
            String signerRole,
            String signerIp,
            String createdBy) {
        
        // Verificar se o documento existe
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new BusinessException("Documento nÃ£o encontrado"));
        
        // Verificar se jÃ¡ existe uma assinatura para este documento
        if (signatureRepository.existsByDocumentId(documentId)) {
            throw new BusinessException("Documento jÃ¡ possui uma assinatura registrada");
        }
        
        // Gerar hash Ãºnico para a assinatura
        String signatureHash = generateSignatureHash(documentId, signerName, signerCpf, signerRole, signerIp);
        
        // Criar a assinatura
        DocumentSignature signature = new DocumentSignature();
        signature.setDocument(document);
        signature.setSignerName(signerName);
        signature.setSignerCpf(signerCpf);
        signature.setSignerRole(signerRole);
        signature.setSignerIp(signerIp);
        signature.setSignatureHash(signatureHash);
        signature.setSignatureDate(LocalDateTime.now());
        signature.setCreatedBy(createdBy);
        signature.setCreatedAt(LocalDateTime.now());
        
        // Salvar a assinatura
        DocumentSignature savedSignature = signatureRepository.save(signature);
        
        // Atualizar o documento para marcar como assinado
        document.setSigned(true);
        document.setSignatureDate(LocalDateTime.now());
        document.setSignedBy(signerName);
        documentRepository.save(document);
        
        log.info("Assinatura eletrÃ´nica criada para o documento {} por {}", documentId, signerName);
        
        return savedSignature;
    }

    public List<DocumentSignature> findByDocumentId(UUID documentId) {
        return signatureRepository.findByDocumentIdOrderBySignatureDateDesc(documentId);
    }

    public DocumentSignature findById(UUID id) {
        return signatureRepository.findById(id)
            .orElseThrow(() -> new BusinessException("Assinatura nÃ£o encontrada"));
    }

    public List<DocumentSignature> findAll() {
        return signatureRepository.findAllByOrderBySignatureDateDesc();
    }

    public boolean validateSignature(UUID signatureId) {
        try {
            DocumentSignature signature = findById(signatureId);
            
            // Recalcular o hash para validaÃ§Ã£o
            String recalculatedHash = generateSignatureHash(
                signature.getDocument().getId(),
                signature.getSignerName(),
                signature.getSignerCpf(),
                signature.getSignerRole(),
                signature.getSignerIp()
            );
            
            // Comparar com o hash armazenado
            return signature.getSignatureHash().equals(recalculatedHash);
            
        } catch (Exception e) {
            log.error("Erro ao validar assinatura: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Gera um hash Ãºnico para a assinatura baseado nos dados do signatÃ¡rio e documento
     */
    private String generateSignatureHash(
            UUID documentId,
            String signerName,
            String signerCpf,
            String signerRole,
            String signerIp) {
        
        try {
            // Concatenar todos os dados relevantes
            String dataToHash = String.format("%s|%s|%s|%s|%s|%s",
                documentId.toString(),
                signerName,
                signerCpf,
                signerRole,
                signerIp,
                LocalDateTime.now().toString() // Timestamp para garantir unicidade
            );
            
            // Gerar hash SHA-256
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(dataToHash.getBytes(StandardCharsets.UTF_8));
            
            // Converter para string hexadecimal
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString();
            
        } catch (NoSuchAlgorithmException e) {
            log.error("Erro ao gerar hash da assinatura: {}", e.getMessage(), e);
            throw new BusinessException("Erro interno ao gerar assinatura");
        }
    }
} 
