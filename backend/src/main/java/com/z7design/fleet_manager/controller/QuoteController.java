package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.QuoteDTO;
import com.z7design.fleet_manager.model.Quote;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.QuoteStatus;
import com.z7design.fleet_manager.service.QuoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
@Tag(name = "Quotes", description = "Endpoints para gerenciamento de CotaÃ§Ãµes")
public class QuoteController {

    private final QuoteService quoteService;

    @GetMapping
    @Operation(summary = "Listar todos os orÃ§amentos", description = "Retorna uma lista paginada de todos os orÃ§amentos")
    public ResponseEntity<Page<QuoteDTO>> getAllQuotes(Pageable pageable) {
        Page<Quote> quotes = quoteService.findAll(pageable);
        Page<QuoteDTO> quoteDTOs = quoteService.convertToDTOPage(quotes);
        return ResponseEntity.ok(quoteDTOs);
    }

    @GetMapping("/all")
    @Operation(summary = "Listar todos os orÃ§amentos sem paginaÃ§Ã£o", description = "Retorna uma lista completa de todos os orÃ§amentos")
    public ResponseEntity<List<QuoteDTO>> getAllQuotesList() {
        List<Quote> quotes = quoteService.findAll();
        List<QuoteDTO> quoteDTOs = quoteService.convertToDTOList(quotes);
        return ResponseEntity.ok(quoteDTOs);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar orÃ§amento por ID", description = "Retorna um orÃ§amento especÃ­fico pelo ID")
    public ResponseEntity<QuoteDTO> getQuoteById(@PathVariable("id") String id) {
        Quote quote = quoteService.findById(UUID.fromString(id));
        QuoteDTO quoteDTO = quoteService.convertToDTO(quote);
        return ResponseEntity.ok(quoteDTO);
    }

    @PostMapping
    @Operation(summary = "Criar novo orÃ§amento", description = "Cria um novo orÃ§amento no sistema")
    public ResponseEntity<QuoteDTO> createQuote(@RequestBody QuoteDTO quoteDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User currentUser = (User) authentication.getPrincipal();
        UUID currentUserId = currentUser.getId();
        
        Quote createdQuote = quoteService.create(quoteDTO, currentUserId);
        QuoteDTO createdDTO = quoteService.convertToDTO(createdQuote);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDTO);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar orÃ§amento", description = "Atualiza um orÃ§amento existente")
    public ResponseEntity<QuoteDTO> updateQuote(@PathVariable("id") String id, @RequestBody QuoteDTO quoteDTO) {
        Quote updated = quoteService.update(UUID.fromString(id), quoteDTO);
        QuoteDTO updatedDTO = quoteService.convertToDTO(updated);
        return ResponseEntity.ok(updatedDTO);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status do orÃ§amento", description = "Atualiza apenas o status de um orÃ§amento")
    public ResponseEntity<QuoteDTO> updateQuoteStatus(@PathVariable("id") String id, @RequestBody Map<String, String> statusUpdate) {
        String status = statusUpdate.get("status");
        Quote updated = quoteService.updateStatus(UUID.fromString(id), status);
        QuoteDTO updatedDTO = quoteService.convertToDTO(updated);
        return ResponseEntity.ok(updatedDTO);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir orÃ§amento", description = "Exclui um orÃ§amento do sistema")
    public ResponseEntity<Void> deleteQuote(@PathVariable("id") String id) {
        quoteService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar orÃ§amentos por status", description = "Retorna orÃ§amentos filtrados por status")
    public ResponseEntity<List<QuoteDTO>> getQuotesByStatus(@PathVariable("status") String status) {
        QuoteStatus quoteStatus = QuoteStatus.valueOf(status.toUpperCase());
        List<Quote> quotes = quoteService.findByStatus(quoteStatus);
        List<QuoteDTO> quoteDTOs = quoteService.convertToDTOList(quotes);
        return ResponseEntity.ok(quoteDTOs);
    }

    @GetMapping("/client/{clientId}")
    @Operation(summary = "Buscar orÃ§amentos por cliente", description = "Retorna orÃ§amentos de um cliente especÃ­fico")
    public ResponseEntity<List<QuoteDTO>> getQuotesByClient(@PathVariable("clientId") String clientId) {
        List<Quote> quotes = quoteService.findByClient(UUID.fromString(clientId));
        List<QuoteDTO> quoteDTOs = quoteService.convertToDTOList(quotes);
        return ResponseEntity.ok(quoteDTOs);
    }

    @GetMapping("/lead/{leadId}")
    @Operation(summary = "Buscar orÃ§amentos por lead", description = "Retorna orÃ§amentos de um lead especÃ­fico")
    public ResponseEntity<List<QuoteDTO>> getQuotesByLead(@PathVariable("leadId") String leadId) {
        List<Quote> quotes = quoteService.findByLead(UUID.fromString(leadId));
        List<QuoteDTO> quoteDTOs = quoteService.convertToDTOList(quotes);
        return ResponseEntity.ok(quoteDTOs);
    }

    @GetMapping("/assigned/{userId}")
    @Operation(summary = "Buscar orÃ§amentos por responsÃ¡vel", description = "Retorna orÃ§amentos atribuÃ­dos a um usuÃ¡rio especÃ­fico")
    public ResponseEntity<List<QuoteDTO>> getQuotesByAssignedTo(@PathVariable("userId") String userId) {
        List<Quote> quotes = quoteService.findByAssignedTo(UUID.fromString(userId));
        List<QuoteDTO> quoteDTOs = quoteService.convertToDTOList(quotes);
        return ResponseEntity.ok(quoteDTOs);
    }

    @GetMapping("/created/{userId}")
    @Operation(summary = "Buscar orÃ§amentos por criador", description = "Retorna orÃ§amentos criados por um usuÃ¡rio especÃ­fico")
    public ResponseEntity<List<QuoteDTO>> getQuotesByCreatedBy(@PathVariable("userId") String userId) {
        List<Quote> quotes = quoteService.findByCreatedBy(UUID.fromString(userId));
        List<QuoteDTO> quoteDTOs = quoteService.convertToDTOList(quotes);
        return ResponseEntity.ok(quoteDTOs);
    }

    @GetMapping("/expired")
    @Operation(summary = "Buscar orÃ§amentos expirados", description = "Retorna orÃ§amentos que jÃ¡ expiraram")
    public ResponseEntity<List<QuoteDTO>> getExpiredQuotes() {
        List<Quote> quotes = quoteService.findExpiredQuotes();
        List<QuoteDTO> quoteDTOs = quoteService.convertToDTOList(quotes);
        return ResponseEntity.ok(quoteDTOs);
    }

    @GetMapping("/expiring-soon/{days}")
    @Operation(summary = "Buscar orÃ§amentos expirando em breve", description = "Retorna orÃ§amentos que expiram nos prÃ³ximos X dias")
    public ResponseEntity<List<QuoteDTO>> getQuotesExpiringSoon(@PathVariable("days") int days) {
        List<Quote> quotes = quoteService.findQuotesExpiringSoon(days);
        List<QuoteDTO> quoteDTOs = quoteService.convertToDTOList(quotes);
        return ResponseEntity.ok(quoteDTOs);
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar orÃ§amentos", description = "Busca orÃ§amentos por termo de pesquisa")
    public ResponseEntity<List<QuoteDTO>> searchQuotes(@RequestParam(value = "term") String term) {
        List<Quote> quotes = quoteService.searchQuotes(term);
        List<QuoteDTO> quoteDTOs = quoteService.convertToDTOList(quotes);
        return ResponseEntity.ok(quoteDTOs);
    }

    @GetMapping("/stats/count-by-status")
    @Operation(summary = "EstatÃ­sticas por status", description = "Retorna contagem de orÃ§amentos por status")
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
    @Operation(summary = "Valor total por status", description = "Retorna valor total dos orÃ§amentos por status")
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
