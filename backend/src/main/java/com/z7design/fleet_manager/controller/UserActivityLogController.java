package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.UserActivityLog;
import com.z7design.fleet_manager.service.UserActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity-logs")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class UserActivityLogController {

    @Autowired
    private UserActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<?> getActivityLogs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "50") int size) {
        
        // Se page e size forem fornecidos, retornar paginado
        if (page >= 0 && size > 0) {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<UserActivityLog> logsPage = activityLogService.getActivityLogs(username, action, module, status, startDate, endDate, pageable);
            return ResponseEntity.ok(logsPage);
        }
        
        // Caso contrÃ¡rio, retornar lista completa (compatibilidade com cÃ³digo antigo)
        List<UserActivityLog> logs = activityLogService.getActivityLogsList(username, action, module, status, startDate, endDate);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportActivityLogs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        byte[] csvData = activityLogService.exportActivityLogs(username, action, module, status, startDate, endDate);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "atividades_" + LocalDate.now() + ".csv");
        
        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getActivityStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Map<String, Object> stats = activityLogService.getActivityStats(startDate, endDate);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<String>> getActiveUsers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<String> users = activityLogService.getActiveUsers(startDate, endDate);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/modules")
    public ResponseEntity<List<String>> getActiveModules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<String> modules = activityLogService.getActiveModules(startDate, endDate);
        return ResponseEntity.ok(modules);
    }

    @GetMapping("/actions")
    public ResponseEntity<List<String>> getActiveActions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<String> actions = activityLogService.getActiveActions(startDate, endDate);
        return ResponseEntity.ok(actions);
    }

    @DeleteMapping("/cleanup")
    public ResponseEntity<String> cleanupOldLogs(
            @RequestParam(defaultValue = "30") int daysToKeep) {
        
        int deletedCount = activityLogService.cleanupOldLogs(daysToKeep);
        return ResponseEntity.ok("Removidos " + deletedCount + " logs antigos");
    }
}

