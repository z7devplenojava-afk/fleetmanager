package com.z7design.fleet_manager.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.z7design.fleet_manager.model.Notification;
import com.z7design.fleet_manager.model.enums.NotificationStatus;
import com.z7design.fleet_manager.model.enums.NotificationType;
import com.z7design.fleet_manager.service.NotificationService;
import com.z7design.fleet_manager.dto.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Parameter;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "NotificaÃ§Ãµes", description = "Endpoints para gestÃ£o de notificaÃ§Ãµes.")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {
    
    private final NotificationService notificationService;
    
    @Operation(summary = "Cria uma nova notificaÃ§Ã£o",
               description = "Adiciona uma nova notificaÃ§Ã£o ao sistema. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "NotificaÃ§Ã£o criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Notification.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da notificaÃ§Ã£o para criaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Notification.class),
                    examples = @ExampleObject(value = "{\"userId\": \"UUID_DO_USUARIO\", \"message\": \"Sua solicitaÃ§Ã£o de fÃ©rias foi aprovada.\", \"type\": \"INFO\", \"status\": \"UNREAD\"}")))
    @PostMapping
    public ResponseEntity<com.z7design.fleet_manager.model.Notification> create(@RequestBody com.z7design.fleet_manager.model.Notification notification) {
        notificationService.create(notification);
        return ResponseEntity.ok(notification);
    }
    
    @Operation(summary = "Marca uma notificaÃ§Ã£o como lida",
               description = "Atualiza o status de uma notificaÃ§Ã£o para LIDA. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua prÃ³pria notificaÃ§Ã£o).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "NotificaÃ§Ã£o marcada como lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.z7design.fleet_manager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "NotificaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/read")
    public ResponseEntity<com.z7design.fleet_manager.model.Notification> markAsRead(@PathVariable("id") UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
    
    @Operation(summary = "Marca uma notificaÃ§Ã£o como nÃ£o lida",
               description = "Atualiza o status de uma notificaÃ§Ã£o para NÃƒO LIDA. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua prÃ³pria notificaÃ§Ã£o).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "NotificaÃ§Ã£o marcada como nÃ£o lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.z7design.fleet_manager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "NotificaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/unread")
    public ResponseEntity<com.z7design.fleet_manager.model.Notification> markAsUnread(@PathVariable("id") UUID id) {
        notificationService.markAsUnread(id);
        return ResponseEntity.ok().build();
    }
    
    @Operation(summary = "Exclui uma notificaÃ§Ã£o",
               description = "Exclui uma notificaÃ§Ã£o pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "NotificaÃ§Ã£o excluÃ­da com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "NotificaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca uma notificaÃ§Ã£o pelo ID",
               description = "Retorna as informaÃ§Ãµes de uma notificaÃ§Ã£o especÃ­fica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua prÃ³pria notificaÃ§Ã£o).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "NotificaÃ§Ã£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.z7design.fleet_manager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "NotificaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<com.z7design.fleet_manager.model.Notification> findById(@PathVariable("id") UUID id) {
        com.z7design.fleet_manager.model.Notification notification = notificationService.findById(id);
        if (notification != null) {
            return ResponseEntity.ok(notification);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @Operation(summary = "Busca notificaÃ§Ãµes por ID de usuÃ¡rio",
               description = "Retorna uma lista de notificaÃ§Ãµes associadas a um usuÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio usuÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de notificaÃ§Ãµes do usuÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = com.z7design.fleet_manager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<com.z7design.fleet_manager.model.Notification>> findByUserId(@PathVariable("userId") UUID userId) {
        return ResponseEntity.ok(notificationService.findByUserId(userId));
    }
    
    @Operation(summary = "Busca notificaÃ§Ãµes por ID de usuÃ¡rio e status",
               description = "Retorna uma lista de notificaÃ§Ãµes de um usuÃ¡rio com um status especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio usuÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de notificaÃ§Ãµes por usuÃ¡rio e status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = com.z7design.fleet_manager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/user/{userId}/status/{status}")
    public ResponseEntity<List<com.z7design.fleet_manager.model.Notification>> findByUserIdAndStatus(
            @PathVariable("userId") UUID userId,
            @PathVariable("status") com.z7design.fleet_manager.model.enums.NotificationStatus status) {
        return ResponseEntity.ok(notificationService.findByUserIdAndStatus(userId, status));
    }
    
    @Operation(summary = "Busca notificaÃ§Ãµes por ID de usuÃ¡rio e tipo",
               description = "Retorna uma lista de notificaÃ§Ãµes de um usuÃ¡rio com um tipo especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio usuÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de notificaÃ§Ãµes por usuÃ¡rio e tipo",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = com.z7design.fleet_manager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/user/{userId}/type/{type}")
    public ResponseEntity<List<com.z7design.fleet_manager.model.Notification>> findByUserIdAndType(
            @PathVariable("userId") UUID userId,
            @PathVariable("type") com.z7design.fleet_manager.model.enums.NotificationType type) {
        return ResponseEntity.ok(notificationService.findByUserIdAndType(userId, type));
    }
    
    @Operation(summary = "Busca notificaÃ§Ãµes por intervalo de datas de criaÃ§Ã£o",
               description = "Retorna uma lista de notificaÃ§Ãµes criadas dentro de um perÃ­odo especÃ­fico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de notificaÃ§Ãµes por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = com.z7design.fleet_manager.model.Notification.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida (formato de data/hora)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data/hora de inÃ­cio do perÃ­odo (ISO 8601)", example = "2023-01-01T00:00:00", required = true)
    @Parameter(description = "Data/hora de fim do perÃ­odo (ISO 8601)", example = "2023-12-31T23:59:59", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<com.z7design.fleet_manager.model.Notification>> findByCreatedAtBetween(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(notificationService.findByCreatedAtBetween(startDate, endDate));
    }
    
    @Operation(
            summary = "Lista notificaÃ§Ãµes",
            description = "Com query params `recipientId` e opcionalmente `type` (ex.: ADMIN, SYSTEM), retorna sÃ³ as do usuÃ¡rio "
                    + "(consulta leve, ordenada por data). Sem params, retorna todas (pode ser pesado em bases grandes).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de notificaÃ§Ãµes",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = com.z7design.fleet_manager.model.Notification.class))),
            @ApiResponse(responseCode = "400", description = "ParÃ¢metro type invÃ¡lido para o enum NotificationType",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<com.z7design.fleet_manager.model.Notification>> list(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "recipientId", required = false) UUID recipientId) {
        try {
            if (recipientId != null) {
                final String typeTrimmed = type != null ? type.trim() : "";
                // Front envia type=ADMIN para o sino do painel: todas as notificacoes deste usuario (nao filtra coluna type).
                if (!typeTrimmed.isEmpty() && !typeTrimmed.equalsIgnoreCase("ADMIN")) {
                    final com.z7design.fleet_manager.model.enums.NotificationType notificationType;
                    try {
                        notificationType = com.z7design.fleet_manager.model.enums.NotificationType.valueOf(typeTrimmed.toUpperCase());
                    } catch (IllegalArgumentException ex) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                    }
                    return ResponseEntity.ok(
                            notificationService.findByUserIdAndTypeOrderByCreatedAtDesc(recipientId, notificationType));
                }
                return ResponseEntity.ok(notificationService.findByUserIdOrderByCreatedAtDesc(recipientId));
            }
            return ResponseEntity.ok(notificationService.findAll());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 
