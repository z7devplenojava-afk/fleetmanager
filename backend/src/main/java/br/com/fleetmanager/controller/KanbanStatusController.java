package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.KanbanStatusService;

import br.com.fleetmanager.dto.KanbanStatusDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.KanbanStatus;

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
    public KanbanStatusDTO create(@Valid @RequestBody KanbanStatusDTO dto) {
        KanbanStatus s = fromDTO(dto);
        KanbanStatus saved = kanbanStatusService.save(s);
        return toDTO(saved);
    }

    @PutMapping("/{id}")
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
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!kanbanStatusService.findById(UUID.fromString(id)).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        kanbanStatusService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
} 