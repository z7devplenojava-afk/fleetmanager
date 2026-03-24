package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.KanbanStatusDTO;
import com.z7design.fleet_manager.model.KanbanStatus;
import com.z7design.fleet_manager.service.KanbanStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.UUID;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.dto.KanbanStatusDTO;

@RestController
@RequestMapping("/api/kanban-status")
@Validated
public class KanbanStatusController {
    @Autowired
    private KanbanStatusService kanbanStatusService;

    private KanbanStatusDTO toDTO(KanbanStatus s) {
        KanbanStatusDTO dto = new KanbanStatusDTO();
        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setOrderIndex(s.getOrderIndex());
        return dto;
    }
    private KanbanStatus fromDTO(KanbanStatusDTO dto) {
        KanbanStatus s = new KanbanStatus();
        s.setId(dto.getId());
        s.setName(dto.getName());
        s.setOrderIndex(dto.getOrderIndex());
        return s;
    }

    @GetMapping
    public List<KanbanStatusDTO> getAll() {
        return kanbanStatusService.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<KanbanStatusDTO> getById(@PathVariable String id) {
        return kanbanStatusService.findById(UUID.fromString(id)).map(this::toDTO)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('CRM_READ', 'LEADS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public KanbanStatusDTO create(@Valid @RequestBody KanbanStatusDTO dto) {
        KanbanStatus s = fromDTO(dto);
        KanbanStatus saved = kanbanStatusService.save(s);
        return toDTO(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('CRM_READ', 'LEADS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<KanbanStatusDTO> update(@PathVariable String id, @Valid @RequestBody KanbanStatusDTO dto) {
        if (!kanbanStatusService.findById(UUID.fromString(id)).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        KanbanStatus s = fromDTO(dto);
        s.setId(UUID.fromString(id));
        KanbanStatus saved = kanbanStatusService.save(s);
        return ResponseEntity.ok(toDTO(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('CRM_READ', 'LEADS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!kanbanStatusService.findById(UUID.fromString(id)).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        kanbanStatusService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
} 
