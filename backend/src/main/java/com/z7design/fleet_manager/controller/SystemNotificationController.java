package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.SystemNotification;
import com.z7design.fleet_manager.service.SystemNotificationService;
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
     * Criar nova notificaÃ§Ã£o
     */
    @PostMapping
    public ResponseEntity<SystemNotification> createNotification(@RequestBody SystemNotification notification) {
        log.info("POST /api/operational/notifications - Criando nova notificaÃ§Ã£o");
        
        try {
            SystemNotification createdNotification = notificationService.createNotification(notification);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdNotification);
        } catch (Exception e) {
            log.error("Erro ao criar notificaÃ§Ã£o: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Criar notificaÃ§Ã£o para novo cliente
     */
    @PostMapping("/new-client")
    public ResponseEntity<SystemNotification> createNewClientNotification(
            @RequestParam(value = "clientName") String clientName,
            @RequestParam(value = "department") String department) {
        log.info("POST /api/operational/notifications/new-client - Criando notificaÃ§Ã£o para novo cliente: {}", clientName);
        
        try {
            SystemNotification notification = notificationService.createNewClientNotification(clientName, department);
            return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        } catch (Exception e) {
            log.error("Erro ao criar notificaÃ§Ã£o para novo cliente: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Criar notificaÃ§Ã£o para contrato vencendo
     */
    @PostMapping("/contract-expiring")
    public ResponseEntity<SystemNotification> createContractExpiringNotification(
            @RequestParam(value = "clientName") String clientName,
            @RequestParam(value = "contractReference") String contractReference,
            @RequestParam(value = "expirationDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime expirationDate,
            @RequestParam(value = "value") BigDecimal value) {
        log.info("POST /api/operational/notifications/contract-expiring - Criando notificaÃ§Ã£o para contrato vencendo: {}", contractReference);
        
        try {
            SystemNotification notification = notificationService.createContractExpiringNotification(
                clientName, contractReference, expirationDate, value);
            return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        } catch (Exception e) {
            log.error("Erro ao criar notificaÃ§Ã£o para contrato vencendo: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Criar notificaÃ§Ã£o para funcionÃ¡rio atrasado
     */
    @PostMapping("/employee-late")
    public ResponseEntity<SystemNotification> createEmployeeLateNotification(
            @RequestParam(value = "employeeName") String employeeName,
            @RequestParam(value = "location") String location) {
        log.info("POST /api/operational/notifications/employee-late - Criando notificaÃ§Ã£o para funcionÃ¡rio atrasado: {}", employeeName);
        
        try {
            SystemNotification notification = notificationService.createEmployeeLateNotification(employeeName, location);
            return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        } catch (Exception e) {
            log.error("Erro ao criar notificaÃ§Ã£o para funcionÃ¡rio atrasado: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Criar notificaÃ§Ã£o para ocorrÃªncia
     */
    @PostMapping("/occurrence")
    public ResponseEntity<SystemNotification> createOccurrenceNotification(
            @RequestParam(value = "employeeName") String employeeName,
            @RequestParam(value = "occurrenceType") String occurrenceType,
            @RequestParam(value = "location") String location,
            @RequestParam(value = "priority") String priority) {
        log.info("POST /api/operational/notifications/occurrence - Criando notificaÃ§Ã£o para ocorrÃªncia: {}", occurrenceType);
        
        try {
            SystemNotification.NotificationPriority notificationPriority = SystemNotification.NotificationPriority.valueOf(priority.toUpperCase());
            SystemNotification notification = notificationService.createOccurrenceNotification(
                employeeName, occurrenceType, location, notificationPriority);
            return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        } catch (IllegalArgumentException e) {
            log.error("Prioridade invÃ¡lida: {}", priority);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao criar notificaÃ§Ã£o para ocorrÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Criar notificaÃ§Ã£o para nova escala
     */
    @PostMapping("/schedule")
    public ResponseEntity<SystemNotification> createScheduleNotification(
            @RequestParam(value = "employeeName") String employeeName,
            @RequestParam(value = "location") String location,
            @RequestParam(value = "scheduleDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime scheduleDate) {
        log.info("POST /api/operational/notifications/schedule - Criando notificaÃ§Ã£o para nova escala: {}", employeeName);
        
        try {
            SystemNotification notification = notificationService.createScheduleNotification(employeeName, location, scheduleDate);
            return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        } catch (Exception e) {
            log.error("Erro ao criar notificaÃ§Ã£o para nova escala: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ã£o por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<SystemNotification> getNotificationById(@PathVariable("id") UUID id) {
        log.info("GET /api/operational/notifications/{} - Buscando notificaÃ§Ã£o por ID", id);
        
        try {
            SystemNotification notification = notificationService.getNotificationById(id);
            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ã£o: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Listar todas as notificaÃ§Ãµes
     */
    @GetMapping
    public ResponseEntity<List<SystemNotification>> getAllNotifications() {
        log.info("GET /api/operational/notifications - Listando todas as notificaÃ§Ãµes");
        
        try {
            List<SystemNotification> notifications = notificationService.getAllNotifications();
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao listar notificaÃ§Ãµes: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes por destinatÃ¡rio
     */
    @GetMapping("/recipient/{recipientId}")
    public ResponseEntity<List<SystemNotification>> getNotificationsByRecipient(@PathVariable("recipientId") UUID recipientId) {
        log.info("GET /api/operational/notifications/recipient/{} - Buscando notificaÃ§Ãµes por destinatÃ¡rio", recipientId);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByRecipient(recipientId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por destinatÃ¡rio: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes nÃ£o lidas por destinatÃ¡rio
     */
    @GetMapping("/unread/recipient/{recipientId}")
    public ResponseEntity<List<SystemNotification>> getUnreadNotificationsByRecipient(@PathVariable("recipientId") UUID recipientId) {
        log.info("GET /api/operational/notifications/unread/recipient/{} - Buscando notificaÃ§Ãµes nÃ£o lidas", recipientId);
        
        try {
            List<SystemNotification> notifications = notificationService.getUnreadNotificationsByRecipient(recipientId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes nÃ£o lidas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes por tipo
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<SystemNotification>> getNotificationsByType(@PathVariable("type") String type) {
        log.info("GET /api/operational/notifications/type/{} - Buscando notificaÃ§Ãµes por tipo", type);
        
        try {
            SystemNotification.NotificationType notificationType = SystemNotification.NotificationType.valueOf(type.toUpperCase());
            List<SystemNotification> notifications = notificationService.getNotificationsByType(notificationType);
            return ResponseEntity.ok(notifications);
        } catch (IllegalArgumentException e) {
            log.error("Tipo invÃ¡lido: {}", type);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por tipo: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes por prioridade
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<SystemNotification>> getNotificationsByPriority(@PathVariable("priority") String priority) {
        log.info("GET /api/operational/notifications/priority/{} - Buscando notificaÃ§Ãµes por prioridade", priority);
        
        try {
            SystemNotification.NotificationPriority notificationPriority = SystemNotification.NotificationPriority.valueOf(priority.toUpperCase());
            List<SystemNotification> notifications = notificationService.getNotificationsByPriority(notificationPriority);
            return ResponseEntity.ok(notifications);
        } catch (IllegalArgumentException e) {
            log.error("Prioridade invÃ¡lida: {}", priority);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por prioridade: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes por perÃ­odo
     */
    @GetMapping("/period")
    public ResponseEntity<List<SystemNotification>> getNotificationsByPeriod(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/operational/notifications/period - Buscando notificaÃ§Ãµes por perÃ­odo: {} a {}", startDate, endDate);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByPeriod(startDate, endDate);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por perÃ­odo: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes nÃ£o lidas
     */
    @GetMapping("/unread")
    public ResponseEntity<List<SystemNotification>> getUnreadNotifications() {
        log.info("GET /api/operational/notifications/unread - Buscando notificaÃ§Ãµes nÃ£o lidas");
        
        try {
            List<SystemNotification> notifications = notificationService.getUnreadNotifications();
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes nÃ£o lidas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes por departamento
     */
    @GetMapping("/department")
    public ResponseEntity<List<SystemNotification>> getNotificationsByDepartment(@RequestParam(value = "department") String department) {
        log.info("GET /api/operational/notifications/department - Buscando notificaÃ§Ãµes por departamento: {}", department);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByDepartment(department);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por departamento: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes por funcionÃ¡rio
     */
    @GetMapping("/employee")
    public ResponseEntity<List<SystemNotification>> getNotificationsByEmployee(@RequestParam(value = "employeeName") String employeeName) {
        log.info("GET /api/operational/notifications/employee - Buscando notificaÃ§Ãµes por funcionÃ¡rio: {}", employeeName);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByEmployee(employeeName);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por funcionÃ¡rio: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes por cliente
     */
    @GetMapping("/client")
    public ResponseEntity<List<SystemNotification>> getNotificationsByClient(@RequestParam(value = "clientName") String clientName) {
        log.info("GET /api/operational/notifications/client - Buscando notificaÃ§Ãµes por cliente: {}", clientName);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByClient(clientName);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por cliente: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes por contrato
     */
    @GetMapping("/contract")
    public ResponseEntity<List<SystemNotification>> getNotificationsByContract(@RequestParam(value = "contractReference") String contractReference) {
        log.info("GET /api/operational/notifications/contract - Buscando notificaÃ§Ãµes por contrato: {}", contractReference);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByContract(contractReference);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por contrato: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes por valor mÃ­nimo
     */
    @GetMapping("/value")
    public ResponseEntity<List<SystemNotification>> getNotificationsByValueGreaterThan(@RequestParam(value = "minValue") BigDecimal minValue) {
        log.info("GET /api/operational/notifications/value - Buscando notificaÃ§Ãµes com valor maior que: {}", minValue);
        
        try {
            List<SystemNotification> notifications = notificationService.getNotificationsByValueGreaterThan(minValue);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por valor: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar notificaÃ§Ãµes recentes
     */
    @GetMapping("/recent")
    public ResponseEntity<List<SystemNotification>> getRecentNotifications() {
        log.info("GET /api/operational/notifications/recent - Buscando notificaÃ§Ãµes recentes");
        
        try {
            List<SystemNotification> notifications = notificationService.getRecentNotifications();
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes recentes: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Atualizar notificaÃ§Ã£o existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<SystemNotification> updateNotification(@PathVariable("id") UUID id, 
                                                              @RequestBody SystemNotification notificationDetails) {
        log.info("PUT /api/operational/notifications/{} - Atualizando notificaÃ§Ã£o", id);
        
        try {
            SystemNotification updatedNotification = notificationService.updateNotification(id, notificationDetails);
            return ResponseEntity.ok(updatedNotification);
        } catch (Exception e) {
            log.error("Erro ao atualizar notificaÃ§Ã£o: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Marcar notificaÃ§Ã£o como lida
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markNotificationAsRead(@PathVariable("id") UUID id) {
        log.info("PATCH /api/operational/notifications/{}/read - Marcando notificaÃ§Ã£o como lida", id);
        
        try {
            notificationService.markNotificationAsRead(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Erro ao marcar notificaÃ§Ã£o como lida: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Marcar todas as notificaÃ§Ãµes de um destinatÃ¡rio como lidas
     */
    @PatchMapping("/read-all/recipient/{recipientId}")
    public ResponseEntity<Void> markAllNotificationsAsReadByRecipient(@PathVariable("recipientId") UUID recipientId) {
        log.info("PATCH /api/operational/notifications/read-all/recipient/{} - Marcando todas as notificaÃ§Ãµes como lidas", recipientId);
        
        try {
            notificationService.markAllNotificationsAsReadByRecipient(recipientId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Erro ao marcar todas as notificaÃ§Ãµes como lidas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Contar notificaÃ§Ãµes nÃ£o lidas por destinatÃ¡rio
     */
    @GetMapping("/count/unread/recipient/{recipientId}")
    public ResponseEntity<Long> countUnreadNotificationsByRecipient(@PathVariable("recipientId") UUID recipientId) {
        log.info("GET /api/operational/notifications/count/unread/recipient/{} - Contando notificaÃ§Ãµes nÃ£o lidas", recipientId);
        
        try {
            long count = notificationService.countUnreadNotificationsByRecipient(recipientId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Erro ao contar notificaÃ§Ãµes nÃ£o lidas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Contar notificaÃ§Ãµes por tipo e perÃ­odo
     */
    @GetMapping("/count/type/{type}")
    public ResponseEntity<Long> countNotificationsByTypeAndPeriod(
            @PathVariable("type") String type,
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/operational/notifications/count/type/{} - Contando notificaÃ§Ãµes por tipo e perÃ­odo", type);
        
        try {
            SystemNotification.NotificationType notificationType = SystemNotification.NotificationType.valueOf(type.toUpperCase());
            long count = notificationService.countNotificationsByTypeAndPeriod(notificationType, startDate, endDate);
            return ResponseEntity.ok(count);
        } catch (IllegalArgumentException e) {
            log.error("Tipo invÃ¡lido: {}", type);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao contar notificaÃ§Ãµes: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Deletar notificaÃ§Ã£o
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable("id") UUID id) {
        log.info("DELETE /api/operational/notifications/{} - Deletando notificaÃ§Ã£o", id);
        
        try {
            notificationService.deleteNotification(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao deletar notificaÃ§Ã£o: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Deletar notificaÃ§Ãµes antigas
     */
    @DeleteMapping("/old")
    public ResponseEntity<Void> deleteOldNotifications() {
        log.info("DELETE /api/operational/notifications/old - Deletando notificaÃ§Ãµes antigas");
        
        try {
            notificationService.deleteOldNotifications();
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao deletar notificaÃ§Ãµes antigas: {}", e.getMessage(), e);
            throw e;
        }
    }
}

