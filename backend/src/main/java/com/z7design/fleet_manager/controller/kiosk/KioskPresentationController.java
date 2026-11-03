package com.z7design.fleet_manager.controller.kiosk;

import com.z7design.fleet_manager.dto.kiosk.*;
import com.z7design.fleet_manager.service.kiosk.KioskPresentationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/kiosk-presentations")
@RequiredArgsConstructor
@Tag(name = "Kiosk Presentations", description = "Criação, edição e publicação de apresentações para totens")
public class KioskPresentationController {

    private final KioskPresentationService presentationService;

    @GetMapping
    @Operation(summary = "Listar apresentações do tenant")
    @PreAuthorize("hasAnyAuthority('KIOSK_READ', 'KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL', 'VENDAS', 'CLIENT_MANAGER', 'CLIENT_USER')")
    public ResponseEntity<List<KioskPresentationDTO>> getAllPresentations() {
        return ResponseEntity.ok(presentationService.findAll());
    }

    @GetMapping("/page")
    @Operation(summary = "Listar apresentações paginadas")
    @PreAuthorize("hasAnyAuthority('KIOSK_READ', 'KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<Page<KioskPresentationDTO>> getPresentationsPaged(Pageable pageable) {
        return ResponseEntity.ok(presentationService.findAllPaged(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter apresentação completa com slides e elementos")
    @PreAuthorize("hasAnyAuthority('KIOSK_READ', 'KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL', 'VENDAS', 'CLIENT_MANAGER', 'CLIENT_USER')")
    public ResponseEntity<KioskPresentationDTO> getPresentationById(@PathVariable UUID id) {
        return ResponseEntity.ok(presentationService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Criar nova apresentação")
    @PreAuthorize("hasAnyAuthority('KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<KioskPresentationDTO> createPresentation(@Valid @RequestBody CreateKioskPresentationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(presentationService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar dados da apresentação")
    @PreAuthorize("hasAnyAuthority('KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<KioskPresentationDTO> updatePresentation(
            @PathVariable UUID id,
            @Valid @RequestBody CreateKioskPresentationRequest request) {
        return ResponseEntity.ok(presentationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir apresentação")
    @PreAuthorize("hasAnyAuthority('KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN')")
    public ResponseEntity<Void> deletePresentation(@PathVariable UUID id) {
        presentationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/slides")
    @Operation(summary = "Salvar ou atualizar slide na apresentação")
    @PreAuthorize("hasAnyAuthority('KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<KioskSlideDTO> saveSlide(
            @PathVariable UUID id,
            @RequestBody SaveSlideRequest request) {
        return ResponseEntity.ok(presentationService.saveSlide(id, request));
    }

    @DeleteMapping("/{id}/slides/{slideId}")
    @Operation(summary = "Remover slide da apresentação")
    @PreAuthorize("hasAnyAuthority('KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<Void> deleteSlide(
            @PathVariable UUID id,
            @PathVariable UUID slideId) {
        presentationService.deleteSlide(id, slideId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publicar apresentação para totens gerando manifesto e versão imutável")
    @PreAuthorize("hasAnyAuthority('KIOSK_PUBLISH', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<List<KioskPublicationDTO>> publishPresentation(
            @PathVariable UUID id,
            @RequestBody PublishPresentationRequest request) {
        return ResponseEntity.ok(presentationService.publish(id, request));
    }
}

