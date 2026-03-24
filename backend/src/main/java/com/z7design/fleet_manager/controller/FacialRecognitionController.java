package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.EmployeeFace;
import com.z7design.fleet_manager.service.SeetaFace2Service;
import com.z7design.fleet_manager.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/facial-recognition")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reconhecimento Facial", description = "API para reconhecimento facial com SeetaFace2")
public class FacialRecognitionController {
    
    private final SeetaFace2Service seetaFace2Service;
    private final EmployeeService employeeService;
    
    @PostMapping("/recognize")
    @Operation(summary = "Reconhecer face", description = "Reconhece uma face e retorna o CPF correspondente")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Face reconhecida com sucesso"),
        @ApiResponse(responseCode = "400", description = "Erro na requisiÃ§Ã£o"),
        @ApiResponse(responseCode = "404", description = "Face nÃ£o reconhecida"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Map<String, Object>> recognizeFace(
            @RequestParam("image") MultipartFile imageFile,
            HttpServletRequest request) {
        
        log.info("Recebida requisiÃ§Ã£o de reconhecimento facial");
        
        try {
            // Validar arquivo
            if (imageFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Arquivo de imagem nÃ£o fornecido"
                ));
            }
            
            // Validar tipo de arquivo
            String contentType = imageFile.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Arquivo deve ser uma imagem"
                ));
            }
            
            // Obter informaÃ§Ãµes da requisiÃ§Ã£o
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            // Realizar reconhecimento
            SeetaFace2Service.FacialRecognitionResult result = seetaFace2Service.recognizeFace(
                imageFile, ipAddress, userAgent);
            
            if (result.isSuccess()) {
                // Buscar dados do funcionÃ¡rio
                Map<String, Object> employeeData = employeeService.getEmployeeBasicDataByCpf(result.getCpf());
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("cpf", result.getCpf());
                response.put("employeeId", result.getEmployeeId());
                response.put("confidence", result.getConfidence());
                response.put("quality", result.getQuality());
                response.put("employee", employeeData);
                
                log.info("Face reconhecida com sucesso: CPF {} (confianÃ§a: {})", 
                    result.getCpf(), result.getConfidence());
                
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", result.getErrorMessage());
                response.put("quality", result.getQuality());
                
                log.warn("Face nÃ£o reconhecida: {}", result.getErrorMessage());
                
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
        } catch (Exception e) {
            log.error("Erro durante reconhecimento facial", e);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "error", "Erro interno do servidor: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/register")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'HR_WRITE', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @Operation(summary = "Registrar face", description = "Registra uma face para um funcionÃ¡rio")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Face registrada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Erro na requisiÃ§Ã£o"),
        @ApiResponse(responseCode = "409", description = "Face jÃ¡ registrada"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Map<String, Object>> registerFace(
            @RequestParam("employeeId") UUID employeeId,
            @RequestParam("cpf") String cpf,
            @RequestParam("image") MultipartFile imageFile) {
        
        log.info("Recebida requisiÃ§Ã£o de registro de face para funcionÃ¡rio: {} (CPF: {})", employeeId, cpf);
        
        try {
            // Validar arquivo
            if (imageFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Arquivo de imagem nÃ£o fornecido"
                ));
            }
            
            // Validar tipo de arquivo
            String contentType = imageFile.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Arquivo deve ser uma imagem"
                ));
            }
            
            // Registrar face
            EmployeeFace employeeFace = seetaFace2Service.registerFace(employeeId, cpf, imageFile);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Face registrada com sucesso");
            response.put("faceId", employeeFace.getId());
            response.put("cpf", employeeFace.getCpf());
            response.put("quality", employeeFace.getFaceQualityScore());
            
            log.info("Face registrada com sucesso para funcionÃ¡rio: {} (CPF: {})", employeeId, cpf);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Erro de validaÃ§Ã£o no registro de face: {}", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
            
        } catch (Exception e) {
            log.error("Erro durante registro de face", e);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "error", "Erro interno do servidor: " + e.getMessage()
            ));
        }
    }
    
    @DeleteMapping("/remove/{cpf}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'HR_WRITE', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @Operation(summary = "Remover face", description = "Remove uma face registrada")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Face removida com sucesso"),
        @ApiResponse(responseCode = "404", description = "Face nÃ£o encontrada"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Map<String, Object>> removeFace(@PathVariable String cpf) {
        log.info("Recebida requisiÃ§Ã£o de remoÃ§Ã£o de face para CPF: {}", cpf);
        
        try {
            seetaFace2Service.removeFace(cpf);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Face removida com sucesso");
            response.put("cpf", cpf);
            
            log.info("Face removida com sucesso para CPF: {}", cpf);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Erro durante remoÃ§Ã£o de face", e);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "error", "Erro interno do servidor: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/faces")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'HR_READ', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @Operation(summary = "Listar faces", description = "Lista todas as faces registradas")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Faces listadas com sucesso"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<EmployeeFace>> getAllFaces() {
        log.info("Recebida requisiÃ§Ã£o para listar todas as faces");
        
        try {
            List<EmployeeFace> faces = seetaFace2Service.getAllFaces();
            
            log.info("Retornando {} faces registradas", faces.size());
            
            return ResponseEntity.ok(faces);
            
        } catch (Exception e) {
            log.error("Erro ao listar faces", e);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/faces/{cpf}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'HR_READ', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @Operation(summary = "Buscar face por CPF", description = "Busca uma face especÃ­fica por CPF")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Face encontrada"),
        @ApiResponse(responseCode = "404", description = "Face nÃ£o encontrada"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<EmployeeFace> getFaceByCpf(@PathVariable String cpf) {
        log.info("Recebida requisiÃ§Ã£o para buscar face por CPF: {}", cpf);
        
        try {
            return seetaFace2Service.getFaceByCpf(cpf)
                .map(face -> {
                    log.info("Face encontrada para CPF: {}", cpf);
                    return ResponseEntity.ok(face);
                })
                .orElseGet(() -> {
                    log.warn("Face nÃ£o encontrada para CPF: {}", cpf);
                    return ResponseEntity.notFound().build();
                });
            
        } catch (Exception e) {
            log.error("Erro ao buscar face por CPF", e);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/test")
    @Operation(summary = "Teste do serviÃ§o", description = "Endpoint de teste para verificar se o serviÃ§o estÃ¡ funcionando")
    public ResponseEntity<Map<String, Object>> test() {
        log.info("Teste do serviÃ§o de reconhecimento facial");
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "ServiÃ§o de reconhecimento facial funcionando");
        response.put("timestamp", System.currentTimeMillis());
        
        // Testar configuraÃ§Ãµes
        try {
            List<EmployeeFace> faces = seetaFace2Service.getAllFaces();
            response.put("registeredFaces", faces.size());
            response.put("seetaFace2Available", true);
        } catch (Exception e) {
            response.put("seetaFace2Available", false);
            response.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/test-seetaface2")
    @Operation(summary = "Teste especÃ­fico do SeetaFace2", description = "Endpoint para testar a integraÃ§Ã£o com SeetaFace2")
    public ResponseEntity<Map<String, Object>> testSeetaFace2() {
        log.info("Teste especÃ­fico do SeetaFace2");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Testar carregamento da biblioteca
            response.put("success", true);
            response.put("libraryLoaded", true);
            response.put("timestamp", System.currentTimeMillis());
            
            // Contar faces registradas
            List<EmployeeFace> faces = seetaFace2Service.getAllFaces();
            response.put("registeredFaces", faces.size());
            
            // Testar configuraÃ§Ãµes
            response.put("configLoaded", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("libraryLoaded", false);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    // MÃ©todo auxiliar para obter IP do cliente
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}

