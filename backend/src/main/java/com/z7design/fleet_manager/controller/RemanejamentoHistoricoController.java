package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.AcaoHistorico;
import com.z7design.fleet_manager.model.RemanejamentoHistorico;
import com.z7design.fleet_manager.service.RemanejamentoHistoricoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/remanejamentos-historico")
@Tag(name = "HistÃ³rico de Remanejamentos", description = "Endpoints para consulta do histÃ³rico detalhado de remanejamentos")
public class RemanejamentoHistoricoController {
    
    @Autowired
    private RemanejamentoHistoricoService historicoService;
    
    @Operation(summary = "Busca histÃ³rico por ID",
               description = "Retorna um registro especÃ­fico do histÃ³rico de remanejamento pelo seu ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "404", description = "HistÃ³rico nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<RemanejamentoHistorico> findById(@PathVariable UUID id) {
        Optional<RemanejamentoHistorico> historico = historicoService.findById(id);
        return historico.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @Operation(summary = "Busca todo o histÃ³rico",
               description = "Retorna todos os registros do histÃ³rico de remanejamentos.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de histÃ³rico",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping
    public ResponseEntity<List<RemanejamentoHistorico>> findAll() {
        return ResponseEntity.ok(historicoService.findAll());
    }
    
    @Operation(summary = "Busca histÃ³rico por remanejamento",
               description = "Retorna todo o histÃ³rico de um remanejamento especÃ­fico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico do remanejamento",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/remanejamento/{remanejamentoId}")
    public ResponseEntity<List<RemanejamentoHistorico>> findByRemanejamentoId(@PathVariable UUID remanejamentoId) {
        return ResponseEntity.ok(historicoService.findByRemanejamentoId(remanejamentoId));
    }
    
    @Operation(summary = "Busca histÃ³rico por funcionÃ¡rio",
               description = "Retorna todo o histÃ³rico de remanejamentos de um funcionÃ¡rio especÃ­fico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/funcionario/{employeeId}")
    public ResponseEntity<List<RemanejamentoHistorico>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(historicoService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca histÃ³rico por funcionÃ¡rio com paginaÃ§Ã£o",
               description = "Retorna o histÃ³rico de remanejamentos de um funcionÃ¡rio com paginaÃ§Ã£o.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico paginado do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/funcionario/{employeeId}/pagina")
    public ResponseEntity<Page<RemanejamentoHistorico>> findByEmployeeIdPaginated(
            @PathVariable UUID employeeId, Pageable pageable) {
        return ResponseEntity.ok(historicoService.findByEmployeeId(employeeId, pageable));
    }
    
    @Operation(summary = "Busca histÃ³rico por tipo de aÃ§Ã£o",
               description = "Retorna todo o histÃ³rico de remanejamentos por tipo de aÃ§Ã£o (CRIACAO, EDICAO, EXCLUSAO, etc.).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico por aÃ§Ã£o",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/acao/{acao}")
    public ResponseEntity<List<RemanejamentoHistorico>> findByAcao(@PathVariable AcaoHistorico acao) {
        return ResponseEntity.ok(historicoService.findByAcao(acao));
    }
    
    @Operation(summary = "Busca histÃ³rico por usuÃ¡rio que executou",
               description = "Retorna todo o histÃ³rico de remanejamentos executados por um usuÃ¡rio especÃ­fico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico por usuÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<RemanejamentoHistorico>> findByUsuarioQueExecutou(@PathVariable UUID usuarioId) {
        return ResponseEntity.ok(historicoService.findByUsuarioQueExecutou(usuarioId));
    }
    
    @Operation(summary = "Busca histÃ³rico por perÃ­odo",
               description = "Retorna todo o histÃ³rico de remanejamentos em um perÃ­odo especÃ­fico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico por perÃ­odo",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/periodo")
    public ResponseEntity<List<RemanejamentoHistorico>> findByPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        return ResponseEntity.ok(historicoService.findByPeriodo(dataInicio, dataFim));
    }
    
    @Operation(summary = "Busca histÃ³rico por funcionÃ¡rio e perÃ­odo",
               description = "Retorna o histÃ³rico de remanejamentos de um funcionÃ¡rio em um perÃ­odo especÃ­fico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico do funcionÃ¡rio por perÃ­odo",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/funcionario/{employeeId}/periodo")
    public ResponseEntity<List<RemanejamentoHistorico>> findByEmployeeIdAndPeriodo(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        return ResponseEntity.ok(historicoService.findByEmployeeIdAndPeriodo(employeeId, dataInicio, dataFim));
    }
    
    @Operation(summary = "Busca histÃ³rico com filtros mÃºltiplos",
               description = "Retorna o histÃ³rico de remanejamentos com mÃºltiplos filtros aplicados.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico filtrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/filtros")
    public ResponseEntity<Page<RemanejamentoHistorico>> findWithFilters(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) AcaoHistorico acao,
            @RequestParam(required = false) UUID usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim,
            Pageable pageable) {
        return ResponseEntity.ok(historicoService.findWithFilters(employeeId, acao, usuarioId, dataInicio, dataFim, pageable));
    }
    
    @Operation(summary = "Busca Ãºltima aÃ§Ã£o de um remanejamento",
               description = "Retorna a Ãºltima aÃ§Ã£o realizada em um remanejamento especÃ­fico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ãšltima aÃ§Ã£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "404", description = "Nenhuma aÃ§Ã£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/remanejamento/{remanejamentoId}/ultima-acao")
    public ResponseEntity<RemanejamentoHistorico> findLastActionByRemanejamentoId(@PathVariable UUID remanejamentoId) {
        Optional<RemanejamentoHistorico> historico = historicoService.findLastActionByRemanejamentoId(remanejamentoId);
        return historico.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @Operation(summary = "Gera relatÃ³rio de atividades por perÃ­odo",
               description = "Gera um relatÃ³rio completo de todas as atividades de remanejamento em um perÃ­odo.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio gerado",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/relatorio/atividades")
    public ResponseEntity<List<RemanejamentoHistorico>> gerarRelatorioAtividades(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        return ResponseEntity.ok(historicoService.gerarRelatorioAtividades(dataInicio, dataFim));
    }
    
    @Operation(summary = "Gera relatÃ³rio de atividades por funcionÃ¡rio",
               description = "Gera um relatÃ³rio completo das atividades de remanejamento de um funcionÃ¡rio em um perÃ­odo.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio do funcionÃ¡rio gerado",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/relatorio/funcionario/{employeeId}")
    public ResponseEntity<List<RemanejamentoHistorico>> gerarRelatorioFuncionario(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        return ResponseEntity.ok(historicoService.gerarRelatorioFuncionario(employeeId, dataInicio, dataFim));
    }
    
    @Operation(summary = "EstatÃ­sticas do histÃ³rico",
               description = "Retorna estatÃ­sticas do histÃ³rico de remanejamentos.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "EstatÃ­sticas calculadas"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/estatisticas")
    public ResponseEntity<Map<String, Object>> getEstatisticas(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) AcaoHistorico acao,
            @RequestParam(required = false) UUID usuarioId) {
        
        long totalPorFuncionario = employeeId != null ? historicoService.countByEmployeeId(employeeId) : 0;
        long totalPorAcao = acao != null ? historicoService.countByAcao(acao) : 0;
        long totalPorUsuario = usuarioId != null ? historicoService.countByUsuarioQueExecutou(usuarioId) : 0;
        
        return ResponseEntity.ok(Map.of(
            "totalPorFuncionario", totalPorFuncionario,
            "totalPorAcao", totalPorAcao,
            "totalPorUsuario", totalPorUsuario
        ));
    }
} 
