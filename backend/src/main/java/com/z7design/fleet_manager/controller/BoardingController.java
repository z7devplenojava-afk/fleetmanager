package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.BoardingDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.AuthenticationService;
import com.z7design.fleet_manager.service.BoardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/boardings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Embarques", description = "Endpoints para gestão de embarques")
public class BoardingController {

    private final BoardingService boardingService;
    private final AuthenticationService authenticationService;

    @PostMapping
    @Operation(summary = "Criar embarque", description = "Cria um novo registro de embarque")
    public ResponseEntity<BoardingDTO> create(@RequestBody BoardingDTO dto) {
        BoardingDTO created = boardingService.create(dto);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/check-in")
    @Operation(summary = "Realizar check-in", description = "Registra o embarque de um passageiro em uma viagem")
    public ResponseEntity<BoardingDTO> checkIn(@RequestBody Map<String, Object> request) {
        UUID tripId = UUID.fromString((String) request.get("tripId"));
        UUID passengerId = UUID.fromString((String) request.get("passengerId"));
        Double latitude = request.get("latitude") != null ? Double.parseDouble(request.get("latitude").toString()) : null;
        Double longitude = request.get("longitude") != null ? Double.parseDouble(request.get("longitude").toString()) : null;

        BoardingDTO boarding = boardingService.checkIn(tripId, passengerId, latitude, longitude);
        return ResponseEntity.ok(boarding);
    }

    @PostMapping("/validate-qr")
    @Operation(summary = "Validar QR Code de embarque", description = "Valida QR Code (do passageiro ou do motorista), verifica status de demissão e permissões de rota")
    public ResponseEntity<BoardingDTO> validateQr(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        User currentUser = null;
        try {
            currentUser = authenticationService.getCurrentUser(authentication);
        } catch (Exception ignored) {}

        UUID companyId = currentUser != null ? currentUser.getCompanyId() : null;
        UUID currentUserId = currentUser != null ? currentUser.getId() : null;

        BoardingDTO boarding = boardingService.validateQrAndBoard(request, currentUserId, companyId);
        return ResponseEntity.ok(boarding);
    }

    @PostMapping("/batch-sync")
    @Operation(summary = "Sincronização offline em lote", description = "Recebe lista de embarques coletados offline e sincroniza no banco de dados")
    public ResponseEntity<List<BoardingDTO>> batchSync(
            @RequestBody List<BoardingDTO> boardings,
            Authentication authentication) {
        User currentUser = null;
        try {
            currentUser = authenticationService.getCurrentUser(authentication);
        } catch (Exception ignored) {}

        UUID companyId = currentUser != null ? currentUser.getCompanyId() : null;
        List<BoardingDTO> synced = boardingService.batchSync(boardings, companyId);
        return ResponseEntity.ok(synced);
    }

    @GetMapping("/my-history")
    @Operation(summary = "Meu histórico de embarques", description = "Retorna histórico de embarques do passageiro autenticado")
    public ResponseEntity<List<BoardingDTO>> getMyHistory(Authentication authentication) {
        User currentUser = null;
        try {
            currentUser = authenticationService.getCurrentUser(authentication);
        } catch (Exception ignored) {}

        if (currentUser == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<BoardingDTO> history = boardingService.getMyHistory(currentUser.getId());
        return ResponseEntity.ok(history);
    }

    @GetMapping
    @Operation(summary = "Listar embarques com filtros", description = "Filtragem por cliente, passageiro e período para Gestão de Tráfego e RH")
    public ResponseEntity<List<BoardingDTO>> getFiltered(
            @RequestParam(name = "clientId", required = false) UUID clientId,
            @RequestParam(name = "passengerId", required = false) UUID passengerId,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        User currentUser = null;
        try {
            currentUser = authenticationService.getCurrentUser(authentication);
        } catch (Exception ignored) {}

        UUID companyId = currentUser != null ? currentUser.getCompanyId() : null;
        List<BoardingDTO> boardings = boardingService.getFilteredBoardings(companyId, clientId, passengerId, startDate, endDate);
        return ResponseEntity.ok(boardings);
    }

    @GetMapping("/filtered")
    @Operation(summary = "Listar embarques com filtros (alias)", description = "Alias para listagem de embarques")
    public ResponseEntity<List<BoardingDTO>> getFilteredAlias(
            @RequestParam(name = "clientId", required = false) UUID clientId,
            @RequestParam(name = "passengerId", required = false) UUID passengerId,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        return getFiltered(clientId, passengerId, startDate, endDate, authentication);
    }

    @GetMapping("/report/pdf")
    @Operation(summary = "Relatório em PDF de Embarques", description = "Gera relatório em PDF da movimentação de embarques para o gestor de tráfego e RH")
    public ResponseEntity<ByteArrayResource> generatePdfReport(
            @RequestParam(name = "clientId", required = false) UUID clientId,
            @RequestParam(name = "passengerId", required = false) UUID passengerId,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        User currentUser = null;
        try {
            currentUser = authenticationService.getCurrentUser(authentication);
        } catch (Exception ignored) {}

        UUID companyId = currentUser != null ? currentUser.getCompanyId() : null;
        byte[] pdfBytes = boardingService.generatePdfReport(companyId, clientId, passengerId, startDate, endDate);
        ByteArrayResource resource = new ByteArrayResource(pdfBytes);

        String fileName = "relatorio_embarques_" + System.currentTimeMillis() + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(resource);
    }

    @GetMapping("/trip/{tripId}")
    @Operation(summary = "Listar embarques por viagem", description = "Retorna todos os embarques de uma viagem")
    public ResponseEntity<List<BoardingDTO>> getByTripId(@PathVariable("tripId") UUID tripId) {
        List<BoardingDTO> boardings = boardingService.getByTripId(tripId);
        return ResponseEntity.ok(boardings);
    }

    @GetMapping("/passenger/{passengerId}")
    @Operation(summary = "Listar embarques por passageiro", description = "Retorna todos os embarques de um passageiro")
    public ResponseEntity<List<BoardingDTO>> getByPassengerId(@PathVariable("passengerId") UUID passengerId) {
        List<BoardingDTO> boardings = boardingService.getByPassengerId(passengerId);
        return ResponseEntity.ok(boardings);
    }

    @GetMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Buscar embarque por ID", description = "Retorna um registro de embarque pelo ID")
    public ResponseEntity<BoardingDTO> getById(@PathVariable("id") UUID id) {
        BoardingDTO boarding = boardingService.getById(id);
        return ResponseEntity.ok(boarding);
    }

    @PutMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Atualizar embarque", description = "Atualiza um registro de embarque existente")
    public ResponseEntity<BoardingDTO> update(@PathVariable("id") UUID id, @RequestBody BoardingDTO dto) {
        BoardingDTO updated = boardingService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Excluir embarque", description = "Exclui um registro de embarque")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        boardingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
