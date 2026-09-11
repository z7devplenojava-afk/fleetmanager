package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.EmailMessageDTO;
import com.z7design.fleet_manager.model.email.EmailMessageAttachment;
import com.z7design.fleet_manager.service.email.EmailMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class EmailMessageController {

    private final EmailMessageService emailMessageService;

    @GetMapping("/folders/{folderId}/messages")
    public ResponseEntity<?> listByFolder(@PathVariable("folderId") UUID folderId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "25") int size) {
        try {
            Page<EmailMessageDTO> result = emailMessageService.listByFolder(folderId, page, size);
            return ResponseEntity.ok(Map.of("success", true, "data", result));
        } catch (Exception e) {
            log.error("Erro ao listar mensagens da pasta {}: {}", folderId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/accounts/{accountId}/messages")
    public ResponseEntity<?> listByAccount(@PathVariable("accountId") UUID accountId,
            @RequestParam(value = "folderId", required = false) UUID folderId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "25") int size) {
        try {
            Page<EmailMessageDTO> result = emailMessageService.listByAccount(accountId, folderId, page, size);
            return ResponseEntity.ok(Map.of("success", true, "data", result));
        } catch (Exception e) {
            log.error("Erro ao listar mensagens da conta {}: {}", accountId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/accounts/{accountId}/search")
    public ResponseEntity<?> search(@PathVariable("accountId") UUID accountId,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "25") int size) {
        try {
            Page<EmailMessageDTO> result = emailMessageService.search(accountId, q, page, size);
            return ResponseEntity.ok(Map.of("success", true, "data", result));
        } catch (Exception e) {
            log.error("Erro ao buscar mensagens da conta {}: {}", accountId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/messages/{id}")
    public ResponseEntity<?> getMessage(@PathVariable("id") UUID id) {
        try {
            EmailMessageDTO message = emailMessageService.getMessageAndMarkRead(id);
            return ResponseEntity.ok(Map.of("success", true, "data", message));
        } catch (Exception e) {
            log.error("Erro ao buscar mensagem {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/messages/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable("id") UUID id, @RequestBody(required = false) Map<String, Object> body) {
        try {
            boolean read = body != null && body.containsKey("read")
                    ? Boolean.TRUE.equals(body.get("read"))
                    : true;
            EmailMessageDTO message = emailMessageService.markRead(id, read);
            return ResponseEntity.ok(Map.of("success", true, "data", message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/messages/{id}/flag")
    public ResponseEntity<?> toggleFlag(@PathVariable("id") UUID id) {
        try {
            EmailMessageDTO message = emailMessageService.toggleFlag(id);
            return ResponseEntity.ok(Map.of("success", true, "data", message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable("id") UUID id) {
        try {
            emailMessageService.deleteMessage(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Mensagem excluída"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/messages/{id}/move")
    public ResponseEntity<?> moveMessage(@PathVariable("id") UUID id,
            @RequestBody Map<String, Object> body) {
        try {
            Object folderIdRaw = body != null ? body.get("folderId") : null;
            if (folderIdRaw == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Pasta de destino é obrigatória"));
            }
            UUID targetFolderId = UUID.fromString(String.valueOf(folderIdRaw));
            EmailMessageDTO moved = emailMessageService.moveMessage(id, targetFolderId);
            return ResponseEntity.ok(Map.of("success", true, "data", moved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erro ao mover mensagem {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable("attachmentId") UUID attachmentId) {
        try {
            EmailMessageAttachment att = emailMessageService.getAttachment(attachmentId);
            byte[] bytes = emailMessageService.readAttachmentBytes(att);
            String safeName = att.getFileName() != null ? att.getFileName().replaceAll("[\\\\/:*?\"<>|]", "_") : "anexo.bin";
            String encoded = URLEncoder.encode(safeName, StandardCharsets.UTF_8).replace("+", "%20");

            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            if (att.getContentType() != null) {
                try {
                    mediaType = MediaType.parseMediaType(att.getContentType());
                } catch (Exception ignored) {
                    // contentType inválida - usa octet-stream
                }
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
                    .contentType(mediaType)
                    .body(bytes);
        } catch (Exception e) {
            log.error("Erro ao baixar anexo {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.badRequest().body(new byte[0]);
        }
    }
}
