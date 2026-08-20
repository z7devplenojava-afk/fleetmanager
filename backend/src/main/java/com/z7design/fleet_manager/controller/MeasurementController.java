package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.MeasurementBulletinDTO;
import com.z7design.fleet_manager.dto.CalculationMemoryDTO;
import com.z7design.fleet_manager.model.enums.MeasurementStatus;
import com.z7design.fleet_manager.service.MeasurementService;
import com.z7design.fleet_manager.service.MeasurementReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/measurements")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Boletins de MediÃ§Ã£o", description = "Endpoints para gestÃ£o de boletins de mediÃ§Ã£o")
public class MeasurementController {
    
    private final MeasurementService measurementService;
    private final MeasurementReportService measurementReportService;
    
    @GetMapping
    @Operation(summary = "Listar todos os boletins", description = "Retorna uma lista paginada de todos os boletins de mediÃ§Ã£o")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de boletins retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<MeasurementBulletinDTO>> getAll(
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        return ResponseEntity.ok(measurementService.getBulletinsWithFilters(null, null, null, null, null, null, pageable));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os boletins (sem paginaÃ§Ã£o)", description = "Retorna uma lista completa de todos os boletins de mediÃ§Ã£o")
    public ResponseEntity<List<MeasurementBulletinDTO>> getAllWithoutPagination() {
        return ResponseEntity.ok(measurementService.getAllBulletins());
    }
    
    @GetMapping("/test")
    @Operation(summary = "Teste de dados", description = "Endpoint para testar se hÃ¡ dados no banco")
    public ResponseEntity<Map<String, Object>> testData() {
        Map<String, Object> result = Map.of(
            "totalCount", measurementService.getBulletinCount(),
            "hasData", measurementService.getBulletinCount() > 0,
            "message", measurementService.getBulletinCount() > 0 ? "Dados encontrados" : "Nenhum dado encontrado"
        );
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar boletim por ID", description = "Retorna um boletim especÃ­fico pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Boletim encontrado"),
            @ApiResponse(responseCode = "404", description = "Boletim nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<MeasurementBulletinDTO> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(measurementService.getBulletinById(UUID.fromString(id)));
    }
    
    @GetMapping("/contract/{contractId}")
    @Operation(summary = "Buscar boletins por contrato", description = "Retorna boletins de um contrato especÃ­fico")
    public ResponseEntity<List<MeasurementBulletinDTO>> getByContract(@PathVariable("contractId") String contractId) {
        return ResponseEntity.ok(measurementService.getBulletinsByContract(contractId));
    }
    
    @GetMapping("/date/{date}")
    @Operation(summary = "Buscar boletins por data", description = "Retorna boletins de uma data especÃ­fica")
    public ResponseEntity<List<MeasurementBulletinDTO>> getByDate(@PathVariable("date") String date) {
        LocalDate localDate = LocalDate.parse(date);
        // Usar mÃ©todo de filtros com perÃ­odo especÃ­fico
        return ResponseEntity.ok(measurementService.getBulletinsWithFilters(null, null, null, null, localDate, localDate, Pageable.unpaged()).getContent());
    }
    
    @GetMapping("/period")
    @Operation(summary = "Buscar boletins por perÃ­odo", description = "Retorna boletins em um perÃ­odo especÃ­fico")
    public ResponseEntity<List<MeasurementBulletinDTO>> getByPeriod(
            @RequestParam(value = "startDate") @Parameter(description = "Data inicial") LocalDate startDate,
            @RequestParam(value = "endDate") @Parameter(description = "Data final") LocalDate endDate) {
        return ResponseEntity.ok(measurementService.getBulletinsWithFilters(null, null, null, null, startDate, endDate, Pageable.unpaged()).getContent());
    }
    
    @PostMapping("/test")
    @Operation(summary = "Teste de criaÃ§Ã£o", description = "Endpoint para testar criaÃ§Ã£o de boletim")
    public ResponseEntity<Map<String, Object>> testCreate(@RequestBody Map<String, Object> data) {
        try {
            Map<String, Object> result = Map.of(
                "message", "Dados recebidos com sucesso",
                "receivedData", data,
                "timestamp", java.time.LocalDateTime.now()
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = Map.of(
                "error", e.getMessage(),
                "timestamp", java.time.LocalDateTime.now()
            );
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @PostMapping
    @Operation(summary = "Criar novo boletim", description = "Cria um novo boletim de mediÃ§Ã£o no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Boletim criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<MeasurementBulletinDTO> create(@RequestBody MeasurementBulletinDTO measurementDTO) {
        MeasurementBulletinDTO saved = measurementService.createBulletin(measurementDTO);
        return ResponseEntity.status(201).body(saved);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar boletim", description = "Atualiza os dados de um boletim existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Boletim atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "Boletim nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<MeasurementBulletinDTO> update(@PathVariable("id") String id, @Valid @RequestBody MeasurementBulletinDTO measurementDTO) {
        try {
            log.info("Recebendo requisiÃ§Ã£o para atualizar boletim {} com dados: {}", id, measurementDTO);
            MeasurementBulletinDTO updated = measurementService.updateBulletin(UUID.fromString(id), measurementDTO);
            log.info("Boletim {} atualizado com sucesso", id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Erro ao atualizar boletim {}: {}", id, e.getMessage(), e);
            throw e; // Re-throw para ser capturado pelo GlobalExceptionHandler
        }
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar boletins com filtros", description = "Busca boletins aplicando filtros especÃ­ficos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Busca realizada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<MeasurementBulletinDTO>> searchWithFilters(
            @RequestParam(value = "status", required = false) @Parameter(description = "Status do boletim") MeasurementStatus status,
            @RequestParam(value = "contractNumber", required = false) @Parameter(description = "NÃºmero do contrato") String contractNumber,
            @RequestParam(value = "clientId", required = false) @Parameter(description = "ID do cliente") String clientId,
            @RequestParam(value = "unitId", required = false) @Parameter(description = "ID da unidade") String unitId,
            @RequestParam(value = "periodStart", required = false) @Parameter(description = "Data inicial do perÃ­odo") LocalDate periodStart,
            @RequestParam(value = "periodEnd", required = false) @Parameter(description = "Data final do perÃ­odo") LocalDate periodEnd,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        
        UUID clientUuid = clientId != null ? UUID.fromString(clientId) : null;
        UUID unitUuid = unitId != null ? UUID.fromString(unitId) : null;
        
        Page<MeasurementBulletinDTO> result = measurementService.getBulletinsWithFilters(
                status, contractNumber, clientUuid, unitUuid, periodStart, periodEnd, pageable);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/search-text")
    @Operation(summary = "Buscar boletins por texto", description = "Busca boletins por termo de pesquisa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Busca realizada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<MeasurementBulletinDTO>> searchByText(
            @RequestParam(value = "searchTerm") @Parameter(description = "Termo de pesquisa") String searchTerm) {
        List<MeasurementBulletinDTO> result = measurementService.searchBulletins(searchTerm);
        return ResponseEntity.ok(result);
    }
    
    @PatchMapping("/{id}/validate")
    @Operation(summary = "Validar boletim", description = "Valida um boletim de mediÃ§Ã£o")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Boletim validado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Boletim nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<MeasurementBulletinDTO> validate(
            @PathVariable("id") String id,
            @RequestParam(value = "validatedBy") @Parameter(description = "UsuÃ¡rio que validou") String validatedBy,
            @RequestParam(value = "checkedBy") @Parameter(description = "UsuÃ¡rio que verificou") String checkedBy) {
        MeasurementBulletinDTO result = measurementService.validateBulletin(UUID.fromString(id), validatedBy, checkedBy);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/report")
    @Operation(summary = "Gerar relatÃ³rio", description = "Gera relatÃ³rio de estatÃ­sticas dos boletins")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio gerado com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Map<String, Object>> getReport() {
        Map<String, Object> report = measurementService.getReport();
        return ResponseEntity.ok(report);
    }
    
    @PostMapping("/{id}/calculation-memory")
    @Operation(summary = "Salvar memÃ³ria de cÃ¡lculo", description = "Salva a memÃ³ria de cÃ¡lculo de um boletim")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "MemÃ³ria salva com sucesso"),
            @ApiResponse(responseCode = "404", description = "Boletim nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<CalculationMemoryDTO> saveCalculationMemory(
            @PathVariable("id") String id,
            @Valid @RequestBody CalculationMemoryDTO calculationMemoryDTO) {
        CalculationMemoryDTO result = measurementService.saveCalculationMemory(UUID.fromString(id), calculationMemoryDTO);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/test-pdf")
    @Operation(summary = "Teste de geraÃ§Ã£o de PDF", description = "Endpoint para testar geraÃ§Ã£o de PDF simples")
    public ResponseEntity<byte[]> testPDF() {
        try {
            byte[] pdfBytes = measurementReportService.generateTestPDF();
            String fileName = "teste_pdf.pdf";
            
            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("Erro no teste de PDF: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Gerar PDF do boletim", description = "Gera PDF de um boletim especÃ­fico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PDF gerado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Boletim nÃ£o encontrado"),
            @ApiResponse(responseCode = "500", description = "Erro ao gerar PDF"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<byte[]> generatePDF(@PathVariable("id") String id) {
        try {
            byte[] pdfBytes = measurementReportService.generateBulletinPDF(UUID.fromString(id));
            String fileName = "boletim_medicao_" + id + ".pdf";
            
            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("Erro ao gerar PDF para boletim {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
    
    @GetMapping("/{id}/excel")
    @Operation(summary = "Gerar Excel do boletim", description = "Gera arquivo Excel de um boletim especÃ­fico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Excel gerado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Boletim nÃ£o encontrado"),
            @ApiResponse(responseCode = "500", description = "Erro ao gerar Excel"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<byte[]> generateExcel(@PathVariable("id") String id) {
        try {
            byte[] excelBytes = measurementReportService.generateBulletinExcel(UUID.fromString(id));
            String fileName = "boletim_medicao_" + id + ".xlsx";
            
            return ResponseEntity.ok()
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                    .body(excelBytes);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    
    @PostMapping("/bulk/pdf")
    @Operation(summary = "Gerar PDFs em lote", description = "Gera PDFs de mÃºltiplos boletins selecionados")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PDFs gerados com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro ao gerar PDFs"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<byte[]> generateBulkPDF(@RequestBody List<String> bulletinIds) {
        try {
            List<UUID> uuids = bulletinIds.stream().map(UUID::fromString).toList();
            byte[] pdfBytes = measurementReportService.generateBulkBulletinsPDF(uuids);
            String fileName = "boletins_medicao_" + java.time.LocalDate.now() + ".pdf";
            
            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    
    @PostMapping("/bulk/excel")
    @Operation(summary = "Gerar Excel em lote", description = "Gera arquivo Excel com mÃºltiplos boletins")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Excel gerado com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro ao gerar Excel"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<byte[]> generateBulkExcel(@RequestBody List<String> bulletinIds) {
        try {
            List<UUID> uuids = bulletinIds.stream().map(UUID::fromString).toList();
            byte[] excelBytes = measurementReportService.generateBulkBulletinsExcel(uuids);
            String fileName = "boletins_medicao_" + java.time.LocalDate.now() + ".xlsx";
            
            return ResponseEntity.ok()
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                    .body(excelBytes);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir boletim", description = "Exclui um boletim do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Boletim excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "404", description = "Boletim nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        measurementService.deleteBulletin(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
}
