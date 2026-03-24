package com.z7design.fleet_manager.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @GetMapping("/auth")
    public ResponseEntity<Map<String, Object>> debugAuth(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", auth != null && auth.isAuthenticated());
        response.put("username", auth != null ? auth.getName() : "null");
        response.put("authorities", auth != null ? 
            auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()) : 
            "null");
        response.put("principal", auth != null ? auth.getPrincipal().getClass().getSimpleName() : "null");
        
        // Debug adicional
        String authHeader = request.getHeader("Authorization");
        response.put("authHeader", authHeader != null ? authHeader.substring(0, Math.min(50, authHeader.length())) + "..." : "null");
        response.put("hasAuthHeader", authHeader != null);
        response.put("authHeaderStartsWithBearer", authHeader != null && authHeader.startsWith("Bearer "));
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/permissions")
    public ResponseEntity<Map<String, Object>> debugPermissions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        
        if (auth != null && auth.isAuthenticated()) {
            boolean hasPayslipsRead = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PAYSLIPS_READ"));
            boolean hasSuperAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
            boolean hasColaborador = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
            
            response.put("hasPayslipsRead", hasPayslipsRead);
            response.put("hasSuperAdmin", hasSuperAdmin);
            response.put("hasColaborador", hasColaborador);
            response.put("shouldAccessPayslips", hasPayslipsRead || hasSuperAdmin || hasColaborador);
        } else {
            response.put("error", "Not authenticated");
        }
        
        return ResponseEntity.ok(response);
    }
}

