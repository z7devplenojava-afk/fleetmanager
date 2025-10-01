package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.RemanejamentoHistoricoService;

import br.com.fleetmanager.model.AcaoHistorico;
import br.com.fleetmanager.model.RemanejamentoHistorico;
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
@Tag(name = "Histórico de Remanejamentos", description = "Endpoints para consulta do histórico detalhado de remanejamentos")
public class RemanejamentoHistoricoController {
    
    @Autowired
    private RemanejamentoHistoricoService historicoService;
    
    @Operation(summary = "Busca histórico por ID",
               description = "Retorna um registro específico do histórico de remanejamento pelo seu ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "404", description = "Histórico não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<RemanejamentoHistorico> findById(@PathVariable UUID id) {
        Optional<RemanejamentoHistorico> historico = historicoService.findById(id);
        return historico.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @Operation(summary = "Busca todo o histórico",
               description = "Retorna todos os registros do histórico de remanejamentos.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de histórico",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping
    public ResponseEntity<List<RemanejamentoHistorico>> findAll() {
        return ResponseEntity.ok(historicoService.findAll());
    }
    
    @Operation(summary = "Busca histórico por remanejamento",
               description = "Retorna todo o histórico de um remanejamento específico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico do remanejamento",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/remanejamento/{remanejamentoId}")
    public ResponseEntity<List<RemanejamentoHistorico>> findByRemanejamentoId(@PathVariable UUID remanejamentoId) {
        return ResponseEntity.ok(historicoService.findByRemanejamentoId(remanejamentoId));
    }
    
    @Operation(summary = "Busca histórico por funcionário",
               description = "Retorna todo o histórico de remanejamentos de um funcionário específico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/funcionario/{employeeId}")
    public ResponseEntity<List<RemanejamentoHistorico>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(historicoService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca histórico por funcionário com paginação",
               description = "Retorna o histórico de remanejamentos de um funcionário com paginação.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico paginado do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/funcionario/{employeeId}/pagina")
    public ResponseEntity<Page<RemanejamentoHistorico>> findByEmployeeIdPaginated(
            @PathVariable UUID employeeId, Pageable pageable) {
        return ResponseEntity.ok(historicoService.findByEmployeeId(employeeId, pageable));
    }
    
    @Operation(summary = "Busca histórico por tipo de ação",
               description = "Retorna todo o histórico de remanejamentos por tipo de ação (CRIACAO, EDICAO, EXCLUSAO, etc.).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico por ação",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/acao/{acao}")
    public ResponseEntity<List<RemanejamentoHistorico>> findByAcao(@PathVariable AcaoHistorico acao) {
        return ResponseEntity.ok(historicoService.findByAcao(acao));
    }
    
    @Operation(summary = "Busca histórico por usuário que executou",
               description = "Retorna todo o histórico de remanejamentos executados por um usuário específico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico por usuário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<RemanejamentoHistorico>> findByUsuarioQueExecutou(@PathVariable UUID usuarioId) {
        return ResponseEntity.ok(historicoService.findByUsuarioQueExecutou(usuarioId));
    }
    
    @Operation(summary = "Busca histórico por período",
               description = "Retorna todo o histórico de remanejamentos em um período específico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico por período",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/periodo")
    public ResponseEntity<List<RemanejamentoHistorico>> findByPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        return ResponseEntity.ok(historicoService.findByPeriodo(dataInicio, dataFim));
    }
    
    @Operation(summary = "Busca histórico por funcionário e período",
               description = "Retorna o histórico de remanejamentos de um funcionário em um período específico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico do funcionário por período",
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
    
    @Operation(summary = "Busca histórico com filtros múltiplos",
               description = "Retorna o histórico de remanejamentos com múltiplos filtros aplicados.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico filtrado",
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
    
    @Operation(summary = "Busca última ação de um remanejamento",
               description = "Retorna a última ação realizada em um remanejamento específico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Última ação encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "404", description = "Nenhuma ação encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/remanejamento/{remanejamentoId}/ultima-acao")
    public ResponseEntity<RemanejamentoHistorico> findLastActionByRemanejamentoId(@PathVariable UUID remanejamentoId) {
        Optional<RemanejamentoHistorico> historico = historicoService.findLastActionByRemanejamentoId(remanejamentoId);
        return historico.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @Operation(summary = "Gera relatório de atividades por período",
               description = "Gera um relatório completo de todas as atividades de remanejamento em um período.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Relatório gerado",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = RemanejamentoHistorico.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/relatorio/atividades")
    public ResponseEntity<List<RemanejamentoHistorico>> gerarRelatorioAtividades(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        return ResponseEntity.ok(historicoService.gerarRelatorioAtividades(dataInicio, dataFim));
    }
    
    @Operation(summary = "Gera relatório de atividades por funcionário",
               description = "Gera um relatório completo das atividades de remanejamento de um funcionário em um período.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Relatório do funcionário gerado",
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
    
    @Operation(summary = "Estatísticas do histórico",
               description = "Retorna estatísticas do histórico de remanejamentos.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Estatísticas calculadas"),
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