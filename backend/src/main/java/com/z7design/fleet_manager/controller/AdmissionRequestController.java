package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.AdmissionRequestDTO;
import com.z7design.fleet_manager.dto.CreateAdmissionRequestDTO;
import com.z7design.fleet_manager.model.enums.AdmissionRequestStatus;
import com.z7design.fleet_manager.model.enums.AdmissionRequestType;
import com.z7design.fleet_manager.service.AdmissionRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admission-requests")
@RequiredArgsConstructor
@Tag(name = "Admission Requests", description = "API para gerenciamento de solicitaÃ§Ãµes de admissÃ£o e demissÃ£o")
public class AdmissionRequestController {
    
    private final AdmissionRequestService admissionRequestService;
    
    /**
     * Valida e converte uma string para UUID
     * @param id String a ser convertida
     * @return UUID vÃ¡lido
     * @throws IllegalArgumentException se o formato nÃ£o for vÃ¡lido
     */
    private UUID parseUUID(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("ID invÃ¡lido. Esperado formato UUID, recebido: " + id);
        }
    }
    
    @GetMapping
    @Operation(summary = "Listar solicitaÃ§Ãµes", description = "Lista todas as solicitaÃ§Ãµes de admissÃ£o/demissÃ£o")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<List<AdmissionRequestDTO>> list() {
        List<AdmissionRequestDTO> requests = admissionRequestService.findAll();
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar solicitaÃ§Ã£o por ID", description = "Retorna uma solicitaÃ§Ã£o especÃ­fica")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<AdmissionRequestDTO> findById(@PathVariable String id) {
        AdmissionRequestDTO request = admissionRequestService.findById(parseUUID(id));
        return ResponseEntity.ok(request);
    }
    
    @PostMapping
    @Operation(summary = "Criar solicitaÃ§Ã£o", description = "Cria uma nova solicitaÃ§Ã£o de admissÃ£o ou demissÃ£o")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<AdmissionRequestDTO> create(@Valid @RequestBody CreateAdmissionRequestDTO dto) {
        AdmissionRequestDTO createdRequest = admissionRequestService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRequest);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar solicitaÃ§Ã£o", description = "Atualiza uma solicitaÃ§Ã£o existente")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<AdmissionRequestDTO> update(
            @PathVariable String id,
            @Valid @RequestBody CreateAdmissionRequestDTO dto) {
        AdmissionRequestDTO updatedRequest = admissionRequestService.update(UUID.fromString(id), dto);
        return ResponseEntity.ok(updatedRequest);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir solicitaÃ§Ã£o", description = "Exclui uma solicitaÃ§Ã£o")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        admissionRequestService.delete(parseUUID(id));
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/approve")
    @Operation(summary = "Aprovar solicitaÃ§Ã£o", description = "Aprova uma solicitaÃ§Ã£o pendente")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<AdmissionRequestDTO> approve(
            @PathVariable String id,
            @RequestParam(required = false) String approverName,
            @RequestParam(required = false) String approvalNotes) {
        AdmissionRequestDTO approvedRequest = admissionRequestService.approve(
            parseUUID(id),
            approverName,
            approvalNotes
        );
        return ResponseEntity.ok(approvedRequest);
    }
    
    @PostMapping("/{id}/reject")
    @Operation(summary = "Rejeitar solicitaÃ§Ã£o", description = "Rejeita uma solicitaÃ§Ã£o pendente")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<AdmissionRequestDTO> reject(
            @PathVariable String id,
            @RequestParam String rejectorName,
            @RequestParam String rejectionReason) {
        AdmissionRequestDTO rejectedRequest = admissionRequestService.reject(
            parseUUID(id),
            rejectorName,
            rejectionReason
        );
        return ResponseEntity.ok(rejectedRequest);
    }
    
    @PostMapping("/{id}/complete")
    @Operation(summary = "Completar solicitaÃ§Ã£o", description = "Marca uma solicitaÃ§Ã£o aprovada como completada")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<AdmissionRequestDTO> complete(@PathVariable String id) {
        AdmissionRequestDTO completedRequest = admissionRequestService.complete(parseUUID(id));
        return ResponseEntity.ok(completedRequest);
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar por status", description = "Lista solicitaÃ§Ãµes por status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<List<AdmissionRequestDTO>> findByStatus(@PathVariable String status) {
        AdmissionRequestStatus requestStatus = AdmissionRequestStatus.valueOf(status.toUpperCase());
        List<AdmissionRequestDTO> requests = admissionRequestService.findByStatus(requestStatus);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/type/{type}")
    @Operation(summary = "Buscar por tipo", description = "Lista solicitaÃ§Ãµes por tipo (ADMISSION ou DISMISSAL)")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<List<AdmissionRequestDTO>> findByType(@PathVariable String type) {
        AdmissionRequestType requestType = AdmissionRequestType.valueOf(type.toUpperCase());
        List<AdmissionRequestDTO> requests = admissionRequestService.findByType(requestType);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/priority/{priority}")
    @Operation(summary = "Buscar por prioridade", description = "Lista solicitaÃ§Ãµes por prioridade")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<List<AdmissionRequestDTO>> findByPriority(@PathVariable String priority) {
        // Implementar se necessÃ¡rio
        return ResponseEntity.ok(List.of());
    }
    
    @GetMapping("/requester/{requesterId}")
    @Operation(summary = "Buscar por solicitante", description = "Lista solicitaÃ§Ãµes de um solicitante especÃ­fico")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<List<AdmissionRequestDTO>> findByRequester(@PathVariable String requesterId) {
        // Implementar se necessÃ¡rio
        return ResponseEntity.ok(List.of());
    }
    
    @GetMapping("/approver/{approverId}")
    @Operation(summary = "Buscar por aprovador", description = "Lista solicitaÃ§Ãµes de um aprovador especÃ­fico")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<List<AdmissionRequestDTO>> findByApprover(@PathVariable String approverId) {
        // Implementar se necessÃ¡rio
        return ResponseEntity.ok(List.of());
    }
    
    @GetMapping("/unit/{unitId}")
    @Operation(summary = "Buscar por unidade", description = "Lista solicitaÃ§Ãµes de uma unidade especÃ­fica")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<List<AdmissionRequestDTO>> findByUnit(@PathVariable String unitId) {
        // Implementar se necessÃ¡rio
        return ResponseEntity.ok(List.of());
    }
    
    @GetMapping("/pending-approval")
    @Operation(summary = "Buscar pendentes de aprovaÃ§Ã£o", description = "Lista solicitaÃ§Ãµes pendentes de aprovaÃ§Ã£o")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<List<AdmissionRequestDTO>> findPendingApproval() {
        List<AdmissionRequestDTO> requests = admissionRequestService.findPendingApprovalRequests();
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar com filtros", description = "Busca solicitaÃ§Ãµes com filtros opcionais")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<List<AdmissionRequestDTO>> search(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AdmissionRequestDTO> requests = admissionRequestService.searchRequests(
            type,
            searchTerm,
            startDate,
            endDate
        );
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/stats/count/{status}")
    @Operation(summary = "Contar por status", description = "Retorna a quantidade de solicitaÃ§Ãµes por status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<Long> countByStatus(@PathVariable String status) {
        AdmissionRequestStatus requestStatus = AdmissionRequestStatus.valueOf(status.toUpperCase());
        long count = admissionRequestService.countByStatus(requestStatus);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/stats/type-count/{type}")
    @Operation(summary = "Contar por tipo", description = "Retorna a quantidade de solicitaÃ§Ãµes por tipo")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<Long> countByType(@PathVariable String type) {
        AdmissionRequestType requestType = AdmissionRequestType.valueOf(type.toUpperCase());
        long count = admissionRequestService.countByType(requestType);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/{id}/pdf")
    @Operation(summary = "Gerar PDF da solicitaÃ§Ã£o", description = "Gera e retorna o PDF da solicitaÃ§Ã£o de admissÃ£o/demissÃ£o")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<byte[]> generatePDF(@PathVariable String id) {
        try {
            UUID requestId = parseUUID(id);
            byte[] pdfBytes = admissionRequestService.generatePDF(requestId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "solicitacao-" + id + ".pdf");
            headers.setContentLength(pdfBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/report/pdf")
    @Operation(summary = "Gerar relatÃ³rio PDF com filtros", description = "Gera relatÃ³rio PDF de solicitaÃ§Ãµes com filtros opcionais")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<byte[]> generatePDFReport(
            @RequestParam(required = false) String employeeName,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status) {
        try {
            AdmissionRequestType requestType = null;
            if (type != null && !type.isEmpty()) {
                try {
                    requestType = AdmissionRequestType.valueOf(type.toUpperCase());
                } catch (IllegalArgumentException e) {
                    // Tipo invÃ¡lido, ignorar
                }
            }
            
            AdmissionRequestStatus requestStatus = null;
            if (status != null && !status.isEmpty()) {
                try {
                    requestStatus = AdmissionRequestStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    // Status invÃ¡lido, ignorar
                }
            }
            
            byte[] pdfBytes = admissionRequestService.generatePDFReport(
                    employeeName, requestType, startDate, endDate, requestStatus);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String fileName = "relatorio-solicitacoes-" + LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".pdf";
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setContentLength(pdfBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}









