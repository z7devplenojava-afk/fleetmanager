package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.email.EmailConfig;
import com.z7design.fleet_manager.service.email.EmailConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/email/configs")
public class EmailConfigController {

    @Autowired
    private EmailConfigService emailConfigService;

    @GetMapping
    public ResponseEntity<List<EmailConfig>> getAllConfigs() {
        return ResponseEntity.ok(emailConfigService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmailConfig> getConfigById(@PathVariable("id") UUID id) {
        return emailConfigService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EmailConfig> createConfig(@RequestBody EmailConfig config) {
        return ResponseEntity.ok(emailConfigService.save(config));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmailConfig> updateConfig(@PathVariable("id") UUID id, @RequestBody EmailConfig config) {
        if (!emailConfigService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        config.setId(id);
        return ResponseEntity.ok(emailConfigService.save(config));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConfig(@PathVariable("id") UUID id) {
        if (!emailConfigService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        emailConfigService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
