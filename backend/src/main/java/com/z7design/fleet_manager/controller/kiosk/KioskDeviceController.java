package com.z7design.fleet_manager.controller.kiosk;

import com.z7design.fleet_manager.dto.kiosk.CreateKioskDeviceRequest;
import com.z7design.fleet_manager.dto.kiosk.KioskDeviceDTO;
import com.z7design.fleet_manager.dto.kiosk.PairingCodeResponse;
import com.z7design.fleet_manager.dto.kiosk.UpdateKioskDeviceRequest;
import com.z7design.fleet_manager.service.kiosk.KioskDeviceService;
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
@RequestMapping("/api/kiosks")
@RequiredArgsConstructor
@Tag(name = "Kiosk Devices", description = "Gerenciamento de totens e equipamentos interativos")
public class KioskDeviceController {

    private final KioskDeviceService deviceService;

    @GetMapping
    @Operation(summary = "Listar totens cadastrados no tenant atual")
    @PreAuthorize("hasAnyAuthority('KIOSK_READ', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL', 'VENDAS', 'CLIENT_MANAGER', 'CLIENT_USER')")
    public ResponseEntity<List<KioskDeviceDTO>> getAllDevices() {
        return ResponseEntity.ok(deviceService.findAll());
    }

    @GetMapping("/page")
    @Operation(summary = "Listar totens paginados")
    @PreAuthorize("hasAnyAuthority('KIOSK_READ', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<Page<KioskDeviceDTO>> getDevicesPaged(Pageable pageable) {
        return ResponseEntity.ok(deviceService.findAll(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter detalhes de um totem por ID")
    @PreAuthorize("hasAnyAuthority('KIOSK_READ', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL', 'VENDAS', 'CLIENT_MANAGER', 'CLIENT_USER')")
    public ResponseEntity<KioskDeviceDTO> getDeviceById(@PathVariable UUID id) {
        return ResponseEntity.ok(deviceService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Cadastrar um novo totem")
    @PreAuthorize("hasAnyAuthority('KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<KioskDeviceDTO> createDevice(@Valid @RequestBody CreateKioskDeviceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deviceService.create(request));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Atualizar configurações de um totem")
    @PreAuthorize("hasAnyAuthority('KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<KioskDeviceDTO> updateDevice(
            @PathVariable UUID id,
            @RequestBody UpdateKioskDeviceRequest request) {
        return ResponseEntity.ok(deviceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir um totem")
    @PreAuthorize("hasAnyAuthority('KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN')")
    public ResponseEntity<Void> deleteDevice(@PathVariable UUID id) {
        deviceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/pairing-code")
    @Operation(summary = "Gerar código temporário de pareamento e QR Code para o totem")
    @PreAuthorize("hasAnyAuthority('KIOSK_ADMIN', 'KIOSK_EDIT', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<PairingCodeResponse> generatePairingCode(@PathVariable UUID id) {
        return ResponseEntity.ok(deviceService.generatePairingCode(id));
    }

    @PostMapping("/{id}/revoke")
    @Operation(summary = "Revogar credenciais de um totem")
    @PreAuthorize("hasAnyAuthority('KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN')")
    public ResponseEntity<Void> revokeDevice(@PathVariable UUID id) {
        deviceService.revokeDevice(id);
        return ResponseEntity.ok().build();
    }
}
