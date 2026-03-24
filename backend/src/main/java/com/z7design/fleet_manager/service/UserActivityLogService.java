package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.UserActivityLog;
import com.z7design.fleet_manager.repository.UserActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserActivityLogService {

    @Autowired
    private UserActivityLogRepository activityLogRepository;

    public List<UserActivityLog> getActivityLogsList(String username, String action, String module, String status, 
                                                   LocalDate startDate, LocalDate endDate) {
        Specification<UserActivityLog> spec = buildSpecification(username, action, module, status, startDate, endDate);
        return activityLogRepository.findAll(spec);
    }

    public Page<UserActivityLog> getActivityLogs(String username, String action, String module, String status, 
                                               LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Specification<UserActivityLog> spec = buildSpecification(username, action, module, status, startDate, endDate);
        return activityLogRepository.findAll(spec, pageable);
    }

    public byte[] exportActivityLogs(String username, String action, String module, String status, 
                                   LocalDate startDate, LocalDate endDate) {
        Specification<UserActivityLog> spec = buildSpecification(username, action, module, status, startDate, endDate);
        List<UserActivityLog> logs = activityLogRepository.findAll(spec);
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,UsuÃ¡rio,AÃ§Ã£o,MÃ³dulo,Detalhes,IP,Data/Hora,Status,Tempo ExecuÃ§Ã£o\n");
        
        for (UserActivityLog log : logs) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%d\n",
                log.getId(),
                log.getUsername(),
                log.getAction(),
                log.getModule(),
                log.getDetails() != null ? log.getDetails().replace("\"", "\"\"") : "",
                log.getIpAddress(),
                log.getCreatedAt(),
                log.getStatus(),
                log.getExecutionTimeMs() != null ? log.getExecutionTimeMs() : 0
            ));
        }
        
        return csv.toString().getBytes();
    }

    public Map<String, Object> getActivityStats(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;
        
        List<UserActivityLog> logs;
        if (start != null && end != null) {
            logs = activityLogRepository.findByCreatedAtBetween(start, end);
        } else {
            logs = activityLogRepository.findAll();
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalActivities", (long) logs.size());
        stats.put("uniqueUsers", (long) logs.stream().map(UserActivityLog::getUsername).distinct().count());
        stats.put("successCount", (long) logs.stream().filter(l -> "SUCCESS".equalsIgnoreCase(l.getStatus())).count());
        stats.put("errorCount", (long) logs.stream().filter(l -> "ERROR".equalsIgnoreCase(l.getStatus())).count());
        stats.put("warningCount", (long) logs.stream().filter(l -> "WARNING".equalsIgnoreCase(l.getStatus())).count());
        
        // EstatÃ­sticas por mÃ³dulo
        Map<String, Long> byModule = logs.stream()
            .collect(Collectors.groupingBy(UserActivityLog::getModule, Collectors.counting()));
        stats.put("activitiesByModule", byModule);
        
        // EstatÃ­sticas por aÃ§Ã£o
        Map<String, Long> byAction = logs.stream()
            .collect(Collectors.groupingBy(UserActivityLog::getAction, Collectors.counting()));
        stats.put("activitiesByAction", byAction);
        
        // EstatÃ­sticas por usuÃ¡rio
        Map<String, Long> byUser = logs.stream()
            .collect(Collectors.groupingBy(UserActivityLog::getUsername, Collectors.counting()));
        stats.put("activitiesByUser", byUser);
        
        // Tempo mÃ©dio de execuÃ§Ã£o
        double avgTime = logs.stream()
            .filter(l -> l.getExecutionTimeMs() != null)
            .mapToLong(UserActivityLog::getExecutionTimeMs)
            .average()
            .orElse(0.0);
        stats.put("averageExecutionTime", avgTime);
        
        return stats;
    }

    public List<String> getActiveUsers(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;
        
        if (start != null && end != null) {
            return activityLogRepository.findDistinctUsernameByCreatedAtBetween(start, end);
        } else {
            return activityLogRepository.findDistinctUsername();
        }
    }

    public List<String> getActiveModules(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;
        
        if (start != null && end != null) {
            return activityLogRepository.findDistinctModuleByCreatedAtBetween(start, end);
        } else {
            return activityLogRepository.findDistinctModule();
        }
    }

    public List<String> getActiveActions(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;
        
        if (start != null && end != null) {
            return activityLogRepository.findDistinctActionByCreatedAtBetween(start, end);
        } else {
            return activityLogRepository.findDistinctAction();
        }
    }

    public int cleanupOldLogs(int daysToKeep) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        return activityLogRepository.deleteByCreatedAtBefore(cutoffDate);
    }

    private Specification<UserActivityLog> buildSpecification(String username, String action, String module, 
                                                           String status, LocalDate startDate, LocalDate endDate) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (username != null && !username.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("username")), 
                    "%" + username.toLowerCase() + "%"
                ));
            }
            
            if (action != null && !action.trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("action"), action));
            }
            
            if (module != null && !module.trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("module"), module));
            }
            
            if (status != null && !status.trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            
            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                    root.get("createdAt"), 
                    startDate.atStartOfDay()
                ));
            }
            
            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                    root.get("createdAt"), 
                    endDate.atTime(23, 59, 59)
                ));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}

