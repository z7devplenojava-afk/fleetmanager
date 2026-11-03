package com.z7design.fleet_manager.controller.kiosk;

import com.z7design.fleet_manager.dto.kiosk.KioskMediaAssetDTO;
import com.z7design.fleet_manager.model.kiosk.KioskMediaAsset;
import com.z7design.fleet_manager.service.kiosk.KioskMediaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/kiosk-media")
@RequiredArgsConstructor
@Tag(name = "Kiosk Media", description = "Biblioteca de mídias e assets para os totens")
public class KioskMediaController {

    private final KioskMediaService mediaService;

    @GetMapping
    @Operation(summary = "Listar mídias do tenant")
    @PreAuthorize("hasAnyAuthority('KIOSK_READ', 'KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL', 'VENDAS', 'CLIENT_MANAGER', 'CLIENT_USER')")
    public ResponseEntity<List<KioskMediaAssetDTO>> getAllMedia() {
        return ResponseEntity.ok(mediaService.findAll());
    }

    @GetMapping("/page")
    @Operation(summary = "Listar mídias paginadas com filtro por tipo")
    @PreAuthorize("hasAnyAuthority('KIOSK_READ', 'KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<Page<KioskMediaAssetDTO>> getMediaPaged(
            @RequestParam(required = false, defaultValue = "ALL") String mediaType,
            Pageable pageable) {
        return ResponseEntity.ok(mediaService.findAllPaged(mediaType, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter dados de uma mídia por ID")
    @PreAuthorize("hasAnyAuthority('KIOSK_READ', 'KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL', 'VENDAS', 'CLIENT_MANAGER', 'CLIENT_USER')")
    public ResponseEntity<KioskMediaAssetDTO> getMediaById(@PathVariable UUID id) {
        return ResponseEntity.ok(mediaService.findById(id));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Fazer upload de nova mídia (imagem, vídeo, áudio ou documento)")
    @PreAuthorize("hasAnyAuthority('KIOSK_EDIT', 'KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'COMERCIAL', 'GESTOR_COMERCIAL')")
    public ResponseEntity<KioskMediaAssetDTO> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name) {
        KioskMediaAssetDTO saved = mediaService.uploadMedia(file, name);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir arquivo de mídia")
    @PreAuthorize("hasAnyAuthority('KIOSK_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN')")
    public ResponseEntity<Void> deleteMedia(@PathVariable UUID id) {
        mediaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/content")
    @Operation(summary = "Stream de conteúdo da mídia")
    public ResponseEntity<Resource> getMediaContent(@PathVariable UUID id) {
        KioskMediaAsset asset = mediaService.getMediaAssetEntity(id);
        Resource resource = mediaService.loadFileAsResource(id);

        String contentType = asset.getMimeType() != null ? asset.getMimeType() : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + asset.getName() + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .header("ETag", "\"" + asset.getChecksumSha256() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/thumbnail")
    @Operation(summary = "Stream de thumbnail da mídia")
    public ResponseEntity<Resource> getMediaThumbnail(@PathVariable UUID id) {
        KioskMediaAsset asset = mediaService.getMediaAssetEntity(id);
        Resource resource = mediaService.loadThumbnailAsResource(id);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"thumb_" + asset.getName() + ".jpg\"")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(resource);
    }
}
