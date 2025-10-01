package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.SystemNotificationService;

import br.com.fleetmanager.model.SystemNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/operational/notifications")
@RequiredArgsConstructor
@Slf4j
public class SystemNotificationController {
    
    private final SystemNotificationService notificationService;
    
    /**
     * Criar nova notificação
     */
    @PostMapping
    public ResponseEntity<SystemNotification> createNotification(@RequestBody SystemNotification notification) {
        log.info("POST /api/operational/notifications - Criando nova notificação");
        
        try {
            SystemNotification createdNotification = notificationService.createNotification(notification);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdNotification);
        } catch (Exception e) {
            log.error("Erro ao criar notificação: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Criar notificação para novo cliente
     */
    @PostMapping("/new-client")
    public ResponseEntity<SystemNotification> createNewClientNotification(
            @RequestParam String clientName,
            @RequestParam String department) {
        log.info("POST /api/operational/notifications/new-client - Criando notificação para novo cliente: {}", clientName);
        
        try {
            SystemNotification notification = notificationService.createNewClientNotification(clientName, department);
            return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        } catch (Exception e) {
            log.error("Erro ao criar notificação para novo cliente: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Criar notificação para contrato vencendo
     */
    @PostMapping("/contract-expiring")
    public ResponseEntity<SystemNotification> createContractExpiringNotification(
            @RequestParam String clientName,
            @RequestParam String contractReference,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime expirationDate,
            @RequestParam BigDecimal value) {
        log.info("POST /api/operational/notifications/contract-expiring - Criando notificação para contrato vencendo: {}", contractReference);
        
        try {
            SystemNotification notification = notificationService.createContractExpiringNotification(
                clientName, contractReference, expirationDate, value);
            return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        } catch (Exception e) {
            log.error("Erro ao criar notificação para contrato vencendo: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Criar notificação para funcionário atrasado
     */
    @PostMapping("/employee-late")
    public ResponseEntity<SystemNotification> createEmployeeLateNotification(
            @RequestParam String employeeName,
            @RequestParam String location) {
        log.info("POST /api/operational/notifications/employee-late - Criando notificação para funcionário atrasado: {}", employeeName);
        
        try {
            SystemNotification notification = notificationService.createEmployeeLateNotification(employeeName, location);
            return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        } catch (Exception e) {
            log.error("Erro ao criar notificação para funcionário atrasado: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Criar notificação para ocorrência
     */
    @PostMapping("/occurrence")
    public ResponseEntity<SystemNotification> createOccurrenceNotification(
            @RequestParam String employeeName,
            @RequestParam String occurrenceType,
            @RequestParam String location,
            @RequestParam String priority) {
        log.info("POST /api/operational/notifications/occurrence - Criando notificação para ocorrência: {}", occurrenceType);
        
        try {
            SystemNotification.NotificationPriority notificationPriority = SystemNotification.NotificationPriority.valueOf(priority.toUpperCase());
            SystemNotification notification = notificationService.createOccurrenceNotification(
                employeeName, occurrenceType, location, notificationPriority);
            return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        } catch (IllegalArgumentException e) {
            log.error("Prioridade inválida: {}", priority);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao criar notificação para ocorrência: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Criar notificação para nova escala
     */
    @PostMapping("/schedule")
    public ResponseEntity<SystemNotification> createScheduleNotification(
            @RequestParam String employeeName,
            @RequestParam String location,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime scheduleDate) {
        log.info("POST /api/operational/notifications/schedule - Criando notificação para nova escala: {}", employeeName);
        
        try {
            SystemNotification notification = notificationService.createScheduleNotification(employeeName, location, scheduleDate);
            return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        } catch (Exception e) {
            log.error("Erro ao criar notificação para nova escala: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificação por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<SystemNotification> getNotificationById(@PathVariable UUID id) {
        log.info("GET /api/operational/notifications/{} - Buscando notificação por ID", id);
        
        try {
            SystemNotification notification = notificationService.getNotificationById(id);
            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            log.error("Erro ao buscar notificação: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Listar todas as notificações
     */
    @GetMapping
    public ResponseEntity<List<SystemNotification>> getAllNotifications() {
        log.info("GET /api/operational/notifications - Listando todas as notificações");
        
        try {
            List<SystemNotification> notifications = notificationService.getAllNotifications();
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao listar notificações: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações por destinatário
     */
    @GetMapping("/recipient/{recipientId}")
    public ResponseEntity<List<SystemNotification>> getNotificationsByRecipient(@PathVariable UUID recipientId) {
        log.info("GET /api/operational/notifications/recipient/{} - Buscando notificações por destinatário", recipientId);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByRecipient(recipientId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por destinatário: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações não lidas por destinatário
     */
    @GetMapping("/unread/recipient/{recipientId}")
    public ResponseEntity<List<SystemNotification>> getUnreadNotificationsByRecipient(@PathVariable UUID recipientId) {
        log.info("GET /api/operational/notifications/unread/recipient/{} - Buscando notificações não lidas", recipientId);
        
        try {
            List<SystemNotification> notifications = notificationService.getUnreadNotificationsByRecipient(recipientId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações não lidas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações por tipo
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<SystemNotification>> getNotificationsByType(@PathVariable String type) {
        log.info("GET /api/operational/notifications/type/{} - Buscando notificações por tipo", type);
        
        try {
            SystemNotification.NotificationType notificationType = SystemNotification.NotificationType.valueOf(type.toUpperCase());
            List<SystemNotification> notifications = notificationService.getNotificationsByType(notificationType);
            return ResponseEntity.ok(notifications);
        } catch (IllegalArgumentException e) {
            log.error("Tipo inválido: {}", type);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por tipo: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações por prioridade
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<SystemNotification>> getNotificationsByPriority(@PathVariable String priority) {
        log.info("GET /api/operational/notifications/priority/{} - Buscando notificações por prioridade", priority);
        
        try {
            SystemNotification.NotificationPriority notificationPriority = SystemNotification.NotificationPriority.valueOf(priority.toUpperCase());
            List<SystemNotification> notifications = notificationService.getNotificationsByPriority(notificationPriority);
            return ResponseEntity.ok(notifications);
        } catch (IllegalArgumentException e) {
            log.error("Prioridade inválida: {}", priority);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por prioridade: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações por período
     */
    @GetMapping("/period")
    public ResponseEntity<List<SystemNotification>> getNotificationsByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/operational/notifications/period - Buscando notificações por período: {} a {}", startDate, endDate);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByPeriod(startDate, endDate);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por período: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações não lidas
     */
    @GetMapping("/unread")
    public ResponseEntity<List<SystemNotification>> getUnreadNotifications() {
        log.info("GET /api/operational/notifications/unread - Buscando notificações não lidas");
        
        try {
            List<SystemNotification> notifications = notificationService.getUnreadNotifications();
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações não lidas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações por departamento
     */
    @GetMapping("/department")
    public ResponseEntity<List<SystemNotification>> getNotificationsByDepartment(@RequestParam String department) {
        log.info("GET /api/operational/notifications/department - Buscando notificações por departamento: {}", department);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByDepartment(department);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por departamento: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações por funcionário
     */
    @GetMapping("/employee")
    public ResponseEntity<List<SystemNotification>> getNotificationsByEmployee(@RequestParam String employeeName) {
        log.info("GET /api/operational/notifications/employee - Buscando notificações por funcionário: {}", employeeName);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByEmployee(employeeName);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por funcionário: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações por cliente
     */
    @GetMapping("/client")
    public ResponseEntity<List<SystemNotification>> getNotificationsByClient(@RequestParam String clientName) {
        log.info("GET /api/operational/notifications/client - Buscando notificações por cliente: {}", clientName);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByClient(clientName);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por cliente: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações por contrato
     */
    @GetMapping("/contract")
    public ResponseEntity<List<SystemNotification>> getNotificationsByContract(@RequestParam String contractReference) {
        log.info("GET /api/operational/notifications/contract - Buscando notificações por contrato: {}", contractReference);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByContract(contractReference);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por contrato: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações por valor mínimo
     */
    @GetMapping("/value")
    public ResponseEntity<List<SystemNotification>> getNotificationsByValueGreaterThan(@RequestParam BigDecimal minValue) {
        log.info("GET /api/operational/notifications/value - Buscando notificações com valor maior que: {}", minValue);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByValueGreaterThan(minValue);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por valor: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificações recentes
     */
    @GetMapping("/recent")
    public ResponseEntity<List<SystemNotification>> getRecentNotifications() {
        log.info("GET /api/operational/notifications/recent - Buscando notificações recentes");
        
        try {
            List<SystemNotification> notifications = notificationService.getRecentNotifications();
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações recentes: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Atualizar notificação existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<SystemNotification> updateNotification(@PathVariable UUID id, 
                                                              @RequestBody SystemNotification notificationDetails) {
        log.info("PUT /api/operational/notifications/{} - Atualizando notificação", id);
        
        try {
            SystemNotification updatedNotification = notificationService.updateNotification(id, notificationDetails);
            return ResponseEntity.ok(updatedNotification);
        } catch (Exception e) {
            log.error("Erro ao atualizar notificação: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Marcar notificação como lida
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markNotificationAsRead(@PathVariable UUID id) {
        log.info("PATCH /api/operational/notifications/{}/read - Marcando notificação como lida", id);
        
        try {
            notificationService.markNotificationAsRead(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Erro ao marcar notificação como lida: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Marcar todas as notificações de um destinatário como lidas
     */
    @PatchMapping("/read-all/recipient/{recipientId}")
    public ResponseEntity<Void> markAllNotificationsAsReadByRecipient(@PathVariable UUID recipientId) {
        log.info("PATCH /api/operational/notifications/read-all/recipient/{} - Marcando todas as notificações como lidas", recipientId);
        
        try {
            notificationService.markAllNotificationsAsReadByRecipient(recipientId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Erro ao marcar todas as notificações como lidas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Contar notificações não lidas por destinatário
     */
    @GetMapping("/count/unread/recipient/{recipientId}")
    public ResponseEntity<Long> countUnreadNotificationsByRecipient(@PathVariable UUID recipientId) {
        log.info("GET /api/operational/notifications/count/unread/recipient/{} - Contando notificações não lidas", recipientId);
        
        try {
            long count = notificationService.countUnreadNotificationsByRecipient(recipientId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Erro ao contar notificações não lidas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Contar notificações por tipo e período
     */
    @GetMapping("/count/type/{type}")
    public ResponseEntity<Long> countNotificationsByTypeAndPeriod(
            @PathVariable String type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/operational/notifications/count/type/{} - Contando notificações por tipo e período", type);
        
        try {
            SystemNotification.NotificationType notificationType = SystemNotification.NotificationType.valueOf(type.toUpperCase());
            long count = notificationService.countNotificationsByTypeAndPeriod(notificationType, startDate, endDate);
            return ResponseEntity.ok(count);
        } catch (IllegalArgumentException e) {
            log.error("Tipo inválido: {}", type);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao contar notificações: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Deletar notificação
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID id) {
        log.info("DELETE /api/operational/notifications/{} - Deletando notificação", id);
        
        try {
            notificationService.deleteNotification(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao deletar notificação: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Deletar notificações antigas
     */
    @DeleteMapping("/old")
    public ResponseEntity<Void> deleteOldNotifications() {
        log.info("DELETE /api/operational/notifications/old - Deletando notificações antigas");
        
        try {
            notificationService.deleteOldNotifications();
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao deletar notificações antigas: {}", e.getMessage(), e);
            throw e;
        }
    }
}
