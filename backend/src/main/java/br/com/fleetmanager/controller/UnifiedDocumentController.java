package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.UnifiedDocumentService;
import br.com.fleetmanager.service.EmailService;
import br.com.fleetmanager.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/unified-documents")
@RequiredArgsConstructor
@Slf4j
public class UnifiedDocumentController {

    private final UnifiedDocumentService unifiedDocumentService;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;

    /**
     * Cria documento unificado para um funcionário específico
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createUnifiedDocument(
            @RequestParam String employeeName,
            @RequestParam int month,
            @RequestParam int year) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🎯 Criando documento unificado para: {} - {}/{}", employeeName, month, year);
            
            String unifiedPdfPath = unifiedDocumentService.createUnifiedDocumentForEmployee(employeeName, month, year);
            
            response.put("sucesso", true);
            response.put("mensagem", "Documento unificado criado com sucesso");
            response.put("filePath", unifiedPdfPath);
            response.put("employeeName", employeeName);
            response.put("month", month);
            response.put("year", year);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro ao criar documento unificado: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao criar documento unificado: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Testa criação de documento unificado
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testUnifiedDocument() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🧪 Testando criação de documento unificado...");
            
            // Teste com dados mock
            String unifiedPdfPath = unifiedDocumentService.createUnifiedDocumentForEmployee("RICARDO XAVIER DE ANDRADE", 7, 2025);
            
            response.put("sucesso", true);
            response.put("mensagem", "Teste de documento unificado realizado com sucesso");
            response.put("filePath", unifiedPdfPath);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro no teste de documento unificado: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no teste: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Endpoint público para teste
     */
    @GetMapping("/public/test")
    public ResponseEntity<Map<String, Object>> testUnifiedDocumentPublic() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🌐 Teste público de documento unificado...");
            
            // Teste com dados mock
            String unifiedPdfPath = unifiedDocumentService.createUnifiedDocumentForEmployee("TESTE FUNCIONARIO", 7, 2025);
            
            response.put("sucesso", true);
            response.put("mensagem", "Teste público realizado com sucesso");
            response.put("filePath", unifiedPdfPath);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro no teste público: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no teste público: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Endpoint público para servir arquivos PDF de documentos unificados
     */
    @GetMapping("/public/file/{fileName:.+}")
    public ResponseEntity<Resource> serveUnifiedDocumentFile(@PathVariable String fileName) {
        try {
            log.info("📄 Servindo arquivo público: {}", fileName);
            
            // Procurar o arquivo recursivamente nas subpastas
            Path basePath = Paths.get("uploads", "unified");
            Path filePath = findFileRecursively(basePath, fileName);
            
            if (filePath == null) {
                log.warn("⚠️ Arquivo não encontrado: {}", fileName);
                return ResponseEntity.notFound().build();
            }
            
            log.info("✅ Arquivo encontrado em: {}", filePath);
            
            // Verificar se é um arquivo PDF
            if (!fileName.toLowerCase().endsWith(".pdf")) {
                log.warn("⚠️ Tipo de arquivo não permitido: {}", fileName);
                return ResponseEntity.badRequest().build();
            }
            
            // Criar recurso do arquivo
            Resource resource = new FileSystemResource(filePath.toFile());
            
            // Configurar headers para download/visualização
            return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "inline; filename=\"" + fileName + "\"")
                .body(resource);
                
        } catch (Exception e) {
            log.error("💥 Erro ao servir arquivo: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Método auxiliar para encontrar arquivo recursivamente
     */
    private Path findFileRecursively(Path basePath, String fileName) {
        try {
            if (!Files.exists(basePath)) {
                return null;
            }
            
            // Procurar diretamente no diretório base
            Path directPath = basePath.resolve(fileName);
            if (Files.exists(directPath)) {
                return directPath;
            }
            
            // Procurar recursivamente nas subpastas
            return Files.walk(basePath)
                .filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString().equals(fileName))
                .findFirst()
                .orElse(null);
                
        } catch (IOException e) {
            log.error("💥 Erro ao procurar arquivo recursivamente: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Envia documento unificado por email
     */
    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendUnifiedDocumentByEmail(
            @RequestParam String toEmail,
            @RequestParam String employeeName,
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam String filePath) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("📧 Enviando documento unificado por email para: {}", toEmail);
            
            boolean emailSent = emailService.sendUnifiedDocument(toEmail, employeeName, String.valueOf(month), String.valueOf(year), filePath);
            
            if (emailSent) {
                response.put("sucesso", true);
                response.put("mensagem", "Documento unificado enviado por email com sucesso");
                response.put("toEmail", toEmail);
                response.put("employeeName", employeeName);
                return ResponseEntity.ok(response);
            } else {
                response.put("sucesso", false);
                response.put("mensagem", "Erro ao enviar email");
                return ResponseEntity.internalServerError().body(response);
            }
            
        } catch (Exception e) {
            log.error("💥 Erro ao enviar email: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao enviar email: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Gera link do WhatsApp para envio de documento
     */
    @PostMapping("/whatsapp-link")
    public ResponseEntity<Map<String, Object>> generateWhatsAppLink(
            @RequestParam String phoneNumber,
            @RequestParam String employeeName,
            @RequestParam int month,
            @RequestParam int year) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("📱 Gerando link do WhatsApp para: {}", phoneNumber);
            
            // Validar número de telefone
            if (!whatsAppService.isValidPhoneNumber(phoneNumber)) {
                response.put("sucesso", false);
                response.put("mensagem", "Número de telefone inválido");
                return ResponseEntity.badRequest().body(response);
            }
            
            String whatsappLink = whatsAppService.generateWhatsAppLink(phoneNumber, employeeName, String.valueOf(month), String.valueOf(year));
            
            if (whatsappLink != null) {
                response.put("sucesso", true);
                response.put("mensagem", "Link do WhatsApp gerado com sucesso");
                response.put("whatsappLink", whatsappLink);
                response.put("phoneNumber", whatsAppService.formatPhoneNumber(phoneNumber));
                response.put("employeeName", employeeName);
                return ResponseEntity.ok(response);
            } else {
                response.put("sucesso", false);
                response.put("mensagem", "Erro ao gerar link do WhatsApp");
                return ResponseEntity.internalServerError().body(response);
            }
            
        } catch (Exception e) {
            log.error("💥 Erro ao gerar link do WhatsApp: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao gerar link do WhatsApp: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Testa configuração de email
     */
    @GetMapping("/test-email")
    public ResponseEntity<Map<String, Object>> testEmailConfiguration() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🧪 Testando configuração de email...");
            
            boolean emailWorking = emailService.testEmailConfiguration();
            
            response.put("sucesso", emailWorking);
            response.put("mensagem", emailWorking ? "Configuração de email funcionando" : "Erro na configuração de email");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro no teste de email: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no teste de email: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Testa configuração do WhatsApp
     */
    @GetMapping("/test-whatsapp")
    public ResponseEntity<Map<String, Object>> testWhatsAppConfiguration() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🧪 Testando configuração do WhatsApp...");
            
            boolean whatsappWorking = whatsAppService.testWhatsAppConfiguration();
            
            response.put("sucesso", whatsappWorking);
            response.put("mensagem", whatsappWorking ? "Configuração do WhatsApp funcionando" : "Erro na configuração do WhatsApp");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro no teste do WhatsApp: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no teste do WhatsApp: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Endpoint de teste para verificar se os serviços estão funcionando
     */
    @GetMapping("/test-services")
    public ResponseEntity<Map<String, Object>> testServices() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🧪 Testando serviços...");
            
            Map<String, Object> testResult = unifiedDocumentService.testServices();
            
            response.put("sucesso", testResult.get("success"));
            response.put("mensagem", testResult.get("message"));
            response.put("dados", testResult);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro no teste de serviços: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no teste: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lista todos os documentos unificados disponíveis
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> listUnifiedDocuments() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("📋 Listando documentos unificados...");
            
            List<Map<String, Object>> documents = unifiedDocumentService.listAllUnifiedDocuments();
            
            response.put("sucesso", true);
            response.put("mensagem", "Documentos unificados listados com sucesso");
            response.put("documents", documents);
            response.put("total", documents.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro ao listar documentos unificados: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao listar documentos unificados: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lista documentos unificados por período
     */
    @GetMapping("/list-by-period")
    public ResponseEntity<Map<String, Object>> listUnifiedDocumentsByPeriod(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("📋 Listando documentos unificados por período: {}/{}", month, year);
            
            List<Map<String, Object>> documents = unifiedDocumentService.listUnifiedDocumentsByPeriod(month, year);
            
            response.put("sucesso", true);
            response.put("mensagem", "Documentos unificados listados com sucesso");
            response.put("documents", documents);
            response.put("total", documents.size());
            response.put("month", month);
            response.put("year", year);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro ao listar documentos unificados por período: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao listar documentos unificados por período: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Busca documentos unificados por nome do funcionário
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchUnifiedDocuments(
            @RequestParam String employeeName) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🔍 Buscando documentos unificados para: {}", employeeName);
            
            List<Map<String, Object>> documents = unifiedDocumentService.searchUnifiedDocumentsByEmployee(employeeName);
            
            response.put("sucesso", true);
            response.put("mensagem", "Busca realizada com sucesso");
            response.put("documents", documents);
            response.put("total", documents.size());
            response.put("employeeName", employeeName);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro na busca de documentos unificados: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro na busca: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Exclui um documento unificado pelo nome do arquivo
     */
    @DeleteMapping("/delete/{fileName:.+}")
    public ResponseEntity<Map<String, Object>> deleteUnifiedDocument(@PathVariable String fileName) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🗑️ Excluindo documento unificado: {}", fileName);
            
            boolean deleted = unifiedDocumentService.deleteUnifiedDocument(fileName);
            
            if (deleted) {
                response.put("sucesso", true);
                response.put("mensagem", "Documento unificado excluído com sucesso");
                response.put("fileName", fileName);
                return ResponseEntity.ok(response);
            } else {
                response.put("sucesso", false);
                response.put("mensagem", "Documento não encontrado ou não pôde ser excluído");
                response.put("fileName", fileName);
                return ResponseEntity.status(404).body(response);
            }
            
        } catch (Exception e) {
            log.error("💥 Erro ao excluir documento unificado: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao excluir documento: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Exclui múltiplos documentos unificados
     */
    @DeleteMapping("/delete-multiple")
    public ResponseEntity<Map<String, Object>> deleteMultipleUnifiedDocuments(@RequestBody List<String> fileNames) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🗑️ Excluindo {} documentos unificados", fileNames.size());
            
            int deletedCount = 0;
            List<String> failedFiles = new ArrayList<>();
            
            for (String fileName : fileNames) {
                try {
                    if (unifiedDocumentService.deleteUnifiedDocument(fileName)) {
                        deletedCount++;
                    } else {
                        failedFiles.add(fileName);
                    }
                } catch (Exception e) {
                    log.error("💥 Erro ao excluir arquivo {}: {}", fileName, e.getMessage());
                    failedFiles.add(fileName);
                }
            }
            
            response.put("sucesso", true);
            response.put("mensagem", String.format("Excluídos %d de %d documentos", deletedCount, fileNames.size()));
            response.put("deletedCount", deletedCount);
            response.put("totalCount", fileNames.size());
            response.put("failedFiles", failedFiles);
            
            if (failedFiles.isEmpty()) {
                return ResponseEntity.ok(response);
            } else {
                response.put("sucesso", false);
                response.put("mensagem", String.format("Excluídos %d de %d documentos. %d falharam.", deletedCount, fileNames.size(), failedFiles.size()));
                return ResponseEntity.status(207).body(response); // Multi-Status
            }
            
        } catch (Exception e) {
            log.error("💥 Erro ao excluir múltiplos documentos: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao excluir documentos: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Cria documentos unificados automaticamente para todos os funcionários
     */
    @PostMapping("/create-all")
    public ResponseEntity<Map<String, Object>> createAllUnifiedDocuments() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🎯 Criando documentos unificados para todos os funcionários...");
            
            List<String> createdDocuments = unifiedDocumentService.createAllUnifiedDocuments();
            
            response.put("sucesso", true);
            response.put("mensagem", String.format("Documentos unificados criados com sucesso! %d documentos gerados.", createdDocuments.size()));
            response.put("unifiedDocuments", createdDocuments);
            response.put("count", createdDocuments.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro ao criar documentos unificados: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao criar documentos unificados: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Cria holerites expandidos automaticamente para todos os funcionários
     */
    @PostMapping("/create-expanded-holerites")
    public ResponseEntity<Map<String, Object>> createExpandedHolerites() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🎯 Criando holerites expandidos para todos os funcionários...");
            
            List<String> createdDocuments = unifiedDocumentService.createAllUnifiedDocuments();
            
            response.put("sucesso", true);
            response.put("mensagem", String.format("Holerites expandidos criados com sucesso! %d documentos gerados.", createdDocuments.size()));
            response.put("expandedHolerites", createdDocuments);
            response.put("count", createdDocuments.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro ao criar holerites expandidos: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao criar holerites expandidos: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }
} 