package br.com.fleetmanager.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
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

import br.com.fleetmanager.service.NotificationService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.Notification;
import br.com.fleetmanager.model.enums.NotificationStatus;
import br.com.fleetmanager.model.enums.NotificationType;
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
@Tag(name = "Notificações", description = "Endpoints para gestão de notificações.")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {
    
    private final NotificationService notificationService;
    
    @Operation(summary = "Cria uma nova notificação",
               description = "Adiciona uma nova notificação ao sistema. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notificação criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Notification.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da notificação para criação",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Notification.class),
                    examples = @ExampleObject(value = "{\"userId\": \"UUID_DO_USUARIO\", \"message\": \"Sua solicitação de férias foi aprovada.\", \"type\": \"INFO\", \"status\": \"UNREAD\"}")))
    @PostMapping
    public ResponseEntity<br.com.fleetmanager.model.Notification> create(@RequestBody br.com.fleetmanager.model.Notification notification) {
        notificationService.create(notification);
        return ResponseEntity.ok(notification);
    }
    
    @Operation(summary = "Marca uma notificação como lida",
               description = "Atualiza o status de uma notificação para LIDA. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua própria notificação).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notificação marcada como lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = br.com.fleetmanager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Notificação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/read")
    public ResponseEntity<br.com.fleetmanager.model.Notification> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
    
    @Operation(summary = "Marca uma notificação como não lida",
               description = "Atualiza o status de uma notificação para NÃO LIDA. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua própria notificação).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notificação marcada como não lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = br.com.fleetmanager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Notificação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/unread")
    public ResponseEntity<br.com.fleetmanager.model.Notification> markAsUnread(@PathVariable UUID id) {
        notificationService.markAsUnread(id);
        return ResponseEntity.ok().build();
    }
    
    @Operation(summary = "Exclui uma notificação",
               description = "Exclui uma notificação pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Notificação excluída com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Notificação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca uma notificação pelo ID",
               description = "Retorna as informações de uma notificação específica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua própria notificação).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notificação encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = br.com.fleetmanager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Notificação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<br.com.fleetmanager.model.Notification> findById(@PathVariable UUID id) {
        br.com.fleetmanager.model.Notification notification = notificationService.findById(id);
        if (notification != null) {
            return ResponseEntity.ok(notification);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @Operation(summary = "Busca notificações por ID de usuário",
               description = "Retorna uma lista de notificações associadas a um usuário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio usuário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de notificações do usuário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = br.com.fleetmanager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<br.com.fleetmanager.model.Notification>> findByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(notificationService.findByUserId(userId));
    }
    
    @Operation(summary = "Busca notificações por ID de usuário e status",
               description = "Retorna uma lista de notificações de um usuário com um status específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio usuário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de notificações por usuário e status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = br.com.fleetmanager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/user/{userId}/status/{status}")
    public ResponseEntity<List<br.com.fleetmanager.model.Notification>> findByUserIdAndStatus(
            @PathVariable UUID userId,
            @PathVariable br.com.fleetmanager.model.enums.NotificationStatus status) {
        return ResponseEntity.ok(notificationService.findByUserIdAndStatus(userId, status));
    }
    
    @Operation(summary = "Busca notificações por ID de usuário e tipo",
               description = "Retorna uma lista de notificações de um usuário com um tipo específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio usuário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de notificações por usuário e tipo",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = br.com.fleetmanager.model.Notification.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/user/{userId}/type/{type}")
    public ResponseEntity<List<br.com.fleetmanager.model.Notification>> findByUserIdAndType(
            @PathVariable UUID userId,
            @PathVariable br.com.fleetmanager.model.enums.NotificationType type) {
        return ResponseEntity.ok(notificationService.findByUserIdAndType(userId, type));
    }
    
    @Operation(summary = "Busca notificações por intervalo de datas de criação",
               description = "Retorna uma lista de notificações criadas dentro de um período específico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de notificações por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = br.com.fleetmanager.model.Notification.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida (formato de data/hora)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data/hora de início do período (ISO 8601)", example = "2023-01-01T00:00:00", required = true)
    @Parameter(description = "Data/hora de fim do período (ISO 8601)", example = "2023-12-31T23:59:59", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<br.com.fleetmanager.model.Notification>> findByCreatedAtBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(notificationService.findByCreatedAtBetween(startDate, endDate));
    }
} 