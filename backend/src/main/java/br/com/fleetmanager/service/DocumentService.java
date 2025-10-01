package br.com.fleetmanager.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import br.com.fleetmanager.model.Document;
import br.com.fleetmanager.model.enums.DocumentType;
import br.com.fleetmanager.repository.DocumentRepository;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;
import org.springframework.beans.factory.annotation.Autowired;
import java.io.ByteArrayOutputStream;

@Service
public class DocumentService {
    
    private final DocumentRepository documentRepository;
    private final Path uploadPath = Paths.get("uploads/documents");
    
    @Autowired
    private TemplateEngine templateEngine;
    
    public DocumentService(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Não foi possível criar o diretório de uploads", e);
        }
    }
    
    @Transactional
    public Document create(Document document) {
        return documentRepository.save(document);
    }
    
    @Transactional
    public Document update(UUID id, Document document) {
        Document existingDocument = findById(id);
        document.setId(id);
        return documentRepository.save(document);
    }
    
    @Transactional
    public void delete(UUID id) {
        Document document = findById(id);
        documentRepository.delete(document);
    }
    
    public Document findById(UUID id) {
        return documentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Documento não encontrado"));
    }
    
    public List<Document> findByEmployeeId(UUID employeeId) {
        return documentRepository.findByEmployeeId(employeeId);
    }
    
    public List<Document> findByType(DocumentType type) {
        return documentRepository.findByType(type);
    }
    
    public List<Document> findExpiredDocuments() {
        return documentRepository.findByExpirationDateBefore(LocalDateTime.now());
    }
    
    public List<Document> findByEmployeeIdAndType(UUID employeeId, DocumentType type) {
        return documentRepository.findByEmployeeIdAndType(employeeId, type);
    }
    
    public List<Document> findAll() {
        return documentRepository.findAll();
    }
    
    public List<Document> findExpiringDocuments() {
        LocalDateTime threeMonthsFromNow = LocalDateTime.now().plusMonths(3);
        return documentRepository.findByExpirationDateBefore(threeMonthsFromNow);
    }
    
    // Métodos de contagem para estatísticas
    public long countAll() {
        return documentRepository.count();
    }
    
    public long countSigned() {
        return documentRepository.countBySignedTrue();
    }
    
    public long countPending() {
        return documentRepository.countBySignedFalse();
    }
    
    public long countExpired() {
        return documentRepository.countByExpirationDateBefore(LocalDateTime.now());
    }
    
    @Transactional
    public Document uploadFile(UUID documentId, MultipartFile file) {
        Document document = findById(documentId);
        
        if (file.isEmpty()) {
            throw new RuntimeException("Arquivo vazio");
        }
        
        // Validar tipo de arquivo
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        if (originalFilename.contains("..")) {
            throw new RuntimeException("Nome de arquivo inválido");
        }
        
        // Gerar nome único para o arquivo
        String fileExtension = "";
        if (originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFilename = documentId.toString() + fileExtension;
        
        try {
            // Salvar arquivo
            Path targetLocation = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Atualizar documento
            document.setFileUrl(targetLocation.toString());
            document.setFileName(originalFilename);
            
            return documentRepository.save(document);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arquivo", e);
        }
    }
    
    public Resource getFile(UUID documentId) {
        Document document = findById(documentId);
        
        if (document.getFileUrl() == null || document.getFileUrl().isEmpty()) {
            throw new RuntimeException("Arquivo não encontrado para este documento");
        }
        
        try {
            Path filePath = Paths.get(document.getFileUrl());
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Arquivo não pode ser lido");
            }
        } catch (IOException e) {
            throw new RuntimeException("Erro ao acessar arquivo", e);
        }
    }

    public byte[] generatePdf(String templateName, java.util.Map<String, Object> data) {
        try {
            // 1. Preencher template HTML
            Context context = new Context();
            context.setVariables(data);
            String html = templateEngine.process(templateName, context);
            
            // Log para debug
            System.out.println("Template processado: " + templateName);
            System.out.println("HTML gerado: " + html.substring(0, Math.min(html.length(), 200)) + "...");
            
            // 2. Converter HTML para PDF (Flying Saucer)
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                ITextRenderer renderer = new ITextRenderer();
                renderer.setDocumentFromString(html);
                renderer.layout();
                renderer.createPDF(outputStream);
                
                byte[] pdfBytes = outputStream.toByteArray();
                System.out.println("PDF gerado com sucesso. Tamanho: " + pdfBytes.length + " bytes");
                return pdfBytes;
            }
        } catch (Exception e) {
            System.err.println("Erro ao gerar PDF: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao gerar PDF: " + e.getMessage(), e);
        }
    }

} 