package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.QuoteService;

import br.com.fleetmanager.dto.QuoteDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Quote;
import br.com.fleetmanager.model.enums.QuoteStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
@Tag(name = "Quotes", description = "Endpoints para gerenciamento de Cotações")
public class QuoteController {

    private final QuoteService quoteService;

    @GetMapping
    @Operation(summary = "Listar todos os orçamentos", description = "Retorna uma lista paginada de todos os orçamentos")
    public ResponseEntity<Page<Quote>> getAllQuotes(Pageable pageable) {
        Page<Quote> quotes = quoteService.findAll(pageable);
        return ResponseEntity.ok(quotes);
    }

    @GetMapping("/all")
    @Operation(summary = "Listar todos os orçamentos sem paginação", description = "Retorna uma lista completa de todos os orçamentos")
    public ResponseEntity<List<Quote>> getAllQuotesList() {
        List<Quote> quotes = quoteService.findAll();
        return ResponseEntity.ok(quotes);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar orçamento por ID", description = "Retorna um orçamento específico pelo ID")
    public ResponseEntity<Quote> getQuoteById(@PathVariable String id) {
        Quote quote = quoteService.findById(UUID.fromString(id));
        return ResponseEntity.ok(quote);
    }

    @PostMapping
    @Operation(summary = "Criar novo orçamento", description = "Cria um novo orçamento no sistema")
    public ResponseEntity<Quote> createQuote(@RequestBody QuoteDTO quoteDTO) {
        // TODO: Obter ID do usuário logado do contexto de segurança
        UUID currentUserId = UUID.randomUUID(); // Temporário
        Quote createdQuote = quoteService.create(quoteDTO, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdQuote);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar orçamento", description = "Atualiza um orçamento existente")
    public ResponseEntity<Quote> updateQuote(@PathVariable String id, @RequestBody QuoteDTO quoteDTO) {
        Quote updated = quoteService.update(UUID.fromString(id), quoteDTO);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status do orçamento", description = "Atualiza apenas o status de um orçamento")
    public ResponseEntity<Quote> updateQuoteStatus(@PathVariable String id, @RequestBody Map<String, String> statusUpdate) {
        String status = statusUpdate.get("status");
        Quote updated = quoteService.updateStatus(UUID.fromString(id), status);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir orçamento", description = "Exclui um orçamento do sistema")
    public ResponseEntity<Void> deleteQuote(@PathVariable String id) {
        quoteService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar orçamentos por status", description = "Retorna orçamentos filtrados por status")
    public ResponseEntity<List<Quote>> getQuotesByStatus(@PathVariable String status) {
        QuoteStatus quoteStatus = QuoteStatus.valueOf(status.toUpperCase());
        List<Quote> quotes = quoteService.findByStatus(quoteStatus);
        return ResponseEntity.ok(quotes);
    }

    @GetMapping("/client/{clientId}")
    @Operation(summary = "Buscar orçamentos por cliente", description = "Retorna orçamentos de um cliente específico")
    public ResponseEntity<List<Quote>> getQuotesByClient(@PathVariable String clientId) {
        return ResponseEntity.ok(quoteService.findByClient(UUID.fromString(clientId)));
    }

    @GetMapping("/lead/{leadId}")
    @Operation(summary = "Buscar orçamentos por lead", description = "Retorna orçamentos de um lead específico")
    public ResponseEntity<List<Quote>> getQuotesByLead(@PathVariable String leadId) {
        return ResponseEntity.ok(quoteService.findByLead(UUID.fromString(leadId)));
    }

    @GetMapping("/assigned/{userId}")
    @Operation(summary = "Buscar orçamentos por responsável", description = "Retorna orçamentos atribuídos a um usuário específico")
    public ResponseEntity<List<Quote>> getQuotesByAssignedTo(@PathVariable String userId) {
        return ResponseEntity.ok(quoteService.findByAssignedTo(UUID.fromString(userId)));
    }

    @GetMapping("/created/{userId}")
    @Operation(summary = "Buscar orçamentos por criador", description = "Retorna orçamentos criados por um usuário específico")
    public ResponseEntity<List<Quote>> getQuotesByCreatedBy(@PathVariable String userId) {
        return ResponseEntity.ok(quoteService.findByCreatedBy(UUID.fromString(userId)));
    }

    @GetMapping("/expired")
    @Operation(summary = "Buscar orçamentos expirados", description = "Retorna orçamentos que já expiraram")
    public ResponseEntity<List<Quote>> getExpiredQuotes() {
        List<Quote> quotes = quoteService.findExpiredQuotes();
        return ResponseEntity.ok(quotes);
    }

    @GetMapping("/expiring-soon/{days}")
    @Operation(summary = "Buscar orçamentos expirando em breve", description = "Retorna orçamentos que expiram nos próximos X dias")
    public ResponseEntity<List<Quote>> getQuotesExpiringSoon(@PathVariable int days) {
        List<Quote> quotes = quoteService.findQuotesExpiringSoon(days);
        return ResponseEntity.ok(quotes);
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar orçamentos", description = "Busca orçamentos por termo de pesquisa")
    public ResponseEntity<List<Quote>> searchQuotes(@RequestParam String term) {
        List<Quote> quotes = quoteService.searchQuotes(term);
        return ResponseEntity.ok(quotes);
    }

    @GetMapping("/stats/count-by-status")
    @Operation(summary = "Estatísticas por status", description = "Retorna contagem de orçamentos por status")
    public ResponseEntity<Map<String, Long>> getCountByStatus() {
        Map<String, Long> stats = Map.of(
            "DRAFT", quoteService.countByStatus(QuoteStatus.DRAFT),
            "SENT", quoteService.countByStatus(QuoteStatus.SENT),
            "UNDER_REVIEW", quoteService.countByStatus(QuoteStatus.UNDER_REVIEW),
            "APPROVED", quoteService.countByStatus(QuoteStatus.APPROVED),
            "REJECTED", quoteService.countByStatus(QuoteStatus.REJECTED),
            "EXPIRED", quoteService.countByStatus(QuoteStatus.EXPIRED),
            "CONVERTED", quoteService.countByStatus(QuoteStatus.CONVERTED)
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/total-value-by-status")
    @Operation(summary = "Valor total por status", description = "Retorna valor total dos orçamentos por status")
    public ResponseEntity<Map<String, BigDecimal>> getTotalValueByStatus() {
        Map<String, BigDecimal> stats = Map.of(
            "DRAFT", quoteService.getTotalValueByStatus(QuoteStatus.DRAFT),
            "SENT", quoteService.getTotalValueByStatus(QuoteStatus.SENT),
            "UNDER_REVIEW", quoteService.getTotalValueByStatus(QuoteStatus.UNDER_REVIEW),
            "APPROVED", quoteService.getTotalValueByStatus(QuoteStatus.APPROVED),
            "REJECTED", quoteService.getTotalValueByStatus(QuoteStatus.REJECTED),
            "EXPIRED", quoteService.getTotalValueByStatus(QuoteStatus.EXPIRED),
            "CONVERTED", quoteService.getTotalValueByStatus(QuoteStatus.CONVERTED)
        );
        return ResponseEntity.ok(stats);
    }
} 