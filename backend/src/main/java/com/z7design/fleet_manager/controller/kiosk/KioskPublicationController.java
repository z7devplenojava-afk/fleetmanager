package com.z7design.fleet_manager.controller.kiosk;

import com.z7design.fleet_manager.dto.kiosk.KioskPublicationDTO;
import com.z7design.fleet_manager.model.kiosk.KioskPublication;
import com.z7design.fleet_manager.repository.kiosk.KioskDeviceRepository;
import com.z7design.fleet_manager.repository.kiosk.KioskPublicationRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/kiosk-publications")
@RequiredArgsConstructor
@Tag(name = "Kiosk Publications", description = "Monitoramento e histórico de publicações enviadas aos totens")
public class KioskPublicationController {

    private final KioskPublicationRepository publicationRepository;
    private final KioskDeviceRepository deviceRepository;

    @GetMapping
    @Operation(summary = "Listar todas as publicações de totens do tenant")
    @PreAuthorize("hasAnyAuthority('KIOSK_READ', 'KIOSK_PUBLISH', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<List<KioskPublicationDTO>> getAllPublications() {
        UUID companyId = TenantContext.getCurrentTenant();
        List<UUID> deviceIds = deviceRepository.findByCompanyId(companyId).stream()
                .map(d -> d.getId())
                .toList();

        List<KioskPublicationDTO> pubs = publicationRepository.findAll().stream()
                .filter(p -> deviceIds.contains(p.getDeviceId()))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(KioskPublicationDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(pubs);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancelar publicação pendente")
    @PreAuthorize("hasAnyAuthority('KIOSK_PUBLISH', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN')")
    public ResponseEntity<Void> cancelPublication(@PathVariable UUID id) {
        KioskPublication pub = publicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Publicação não encontrada: " + id));

        if ("QUEUED".equals(pub.getStatus()) || "NOTIFIED".equals(pub.getStatus())) {
            pub.setStatus("CANCELLED");
            publicationRepository.save(pub);
        }
        return ResponseEntity.ok().build();
    }
}
