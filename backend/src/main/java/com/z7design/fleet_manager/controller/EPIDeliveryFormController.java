package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateEPIDeliveryFormDTO;
import com.z7design.fleet_manager.dto.EPIDeliveryFormDTO;
import com.z7design.fleet_manager.service.EPIDeliveryFormService;
import com.z7design.fleet_manager.service.EPIDeliveryPdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/epi-delivery-forms")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Fichas de Entrega de EPI", description = "Endpoints para gestÃ£o de fichas de entrega de EPI")
@SecurityRequirement(name = "bearerAuth")
public class EPIDeliveryFormController {

    private final EPIDeliveryFormService epiDeliveryFormService;
    private final EPIDeliveryPdfService epiDeliveryPdfService;

    @Operation(summary = "Cria uma nova ficha de entrega de EPI")
    @PostMapping
    public ResponseEntity<EPIDeliveryFormDTO> create(
            @RequestBody CreateEPIDeliveryFormDTO dto,
            Authentication authentication) {
        log.info("ðŸ“ Recebendo requisiÃ§Ã£o para criar ficha de entrega de EPI");
        
        UUID createdByUserId = null;
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            // Aqui vocÃª precisaria buscar o UUID do usuÃ¡rio pelo username
            // Por enquanto, vamos deixar null
        }
        
        EPIDeliveryFormDTO created = epiDeliveryFormService.create(dto, createdByUserId);
        return ResponseEntity.ok(created);
    }

    @Operation(summary = "Busca uma ficha de entrega de EPI por ID")
    @GetMapping("/{id}")
    public ResponseEntity<EPIDeliveryFormDTO> findById(@PathVariable UUID id) {
        EPIDeliveryFormDTO form = epiDeliveryFormService.findById(id);
        return ResponseEntity.ok(form);
    }

    @Operation(summary = "Lista todas as fichas de entrega de EPI com paginaÃ§Ã£o")
    @GetMapping
    public ResponseEntity<Page<EPIDeliveryFormDTO>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<EPIDeliveryFormDTO> forms = epiDeliveryFormService.findAll(pageable);
        return ResponseEntity.ok(forms);
    }

    @Operation(summary = "Busca fichas de entrega de EPI com filtros")
    @GetMapping("/search")
    public ResponseEntity<Page<EPIDeliveryFormDTO>> search(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<EPIDeliveryFormDTO> forms = epiDeliveryFormService.findByFilters(employeeId, companyId, startDate, endDate, pageable);
        return ResponseEntity.ok(forms);
    }

    @Operation(summary = "Busca fichas de entrega de EPI por funcionÃ¡rio")
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EPIDeliveryFormDTO>> findByEmployeeId(@PathVariable UUID employeeId) {
        List<EPIDeliveryFormDTO> forms = epiDeliveryFormService.findByEmployeeId(employeeId);
        return ResponseEntity.ok(forms);
    }

    @Operation(summary = "Busca fichas de entrega de EPI por empresa")
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<EPIDeliveryFormDTO>> findByCompanyId(@PathVariable UUID companyId) {
        List<EPIDeliveryFormDTO> forms = epiDeliveryFormService.findByCompanyId(companyId);
        return ResponseEntity.ok(forms);
    }

    @Operation(summary = "Deleta uma ficha de entrega de EPI")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        epiDeliveryFormService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Gerar PDF da ficha de entrega de EPI e salvar no banco", 
               description = "Gera o PDF da ficha de entrega de EPI, salva o registro no banco e retorna o PDF")
    @PostMapping("/generate-pdf")
    public ResponseEntity<byte[]> generateAndSaveEPIDeliveryPdf(
            @RequestBody CreateEPIDeliveryFormDTO dto,
            Authentication authentication) {
        try {
            log.info("ðŸ“„ Gerando PDF de ficha de entrega de EPI para funcionÃ¡rio: {}", dto.getEmployeeId());
            
            UUID createdByUserId = null;
            if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                // Buscar UUID do usuÃ¡rio pelo username se necessÃ¡rio
            }
            
            // Primeiro, salvar a ficha no banco
            EPIDeliveryFormDTO savedForm = epiDeliveryFormService.create(dto, createdByUserId);
            log.info("âœ… Ficha de entrega de EPI salva no banco com ID: {}", savedForm.getId());
            
            // Buscar a ficha completa para gerar o PDF
            com.z7design.fleet_manager.model.EPIDeliveryForm form = 
                epiDeliveryFormService.findByIdEntity(savedForm.getId());
            
            // Gerar PDF
            byte[] pdf = epiDeliveryPdfService.generateEPIDeliveryPdfFromForm(form);
            
            String fileName = "ficha-entrega-epi-" + savedForm.getId() + ".pdf";
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .body(pdf);
        } catch (Exception e) {
            log.error("âŒ Erro ao gerar PDF de ficha de entrega de EPI: {}", e.getMessage(), e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Gerar Excel da ficha de entrega de EPI e salvar no banco",
               description = "Gera o Excel da ficha de entrega de EPI, salva o registro no banco e retorna o arquivo")
    @PostMapping("/generate-excel")
    public ResponseEntity<byte[]> generateAndSaveEPIDeliveryExcel(
            @RequestBody CreateEPIDeliveryFormDTO dto,
            Authentication authentication) {
        try {
            log.info("ðŸ“Š Gerando Excel de ficha de entrega de EPI para funcionÃ¡rio: {}", dto.getEmployeeId());

            UUID createdByUserId = null;
            if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                // Buscar UUID do usuÃ¡rio pelo username se necessÃ¡rio
            }

            EPIDeliveryFormDTO savedForm = epiDeliveryFormService.create(dto, createdByUserId);
            log.info("âœ… Ficha de entrega de EPI salva no banco com ID: {}", savedForm.getId());

            com.z7design.fleet_manager.model.EPIDeliveryForm form =
                epiDeliveryFormService.findByIdEntity(savedForm.getId());

            byte[] excel = epiDeliveryPdfService.generateEPIDeliveryExcelFromForm(form);

            String fileName = "ficha-entrega-epi-" + savedForm.getId() + ".xlsx";

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excel);
        } catch (Exception e) {
            log.error("âŒ Erro ao gerar Excel de ficha de entrega de EPI: {}", e.getMessage(), e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}



