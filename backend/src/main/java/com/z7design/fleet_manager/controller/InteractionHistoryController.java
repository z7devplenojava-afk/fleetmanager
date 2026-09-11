package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.InteractionHistoryDTO;
import com.z7design.fleet_manager.model.InteractionHistory;
import com.z7design.fleet_manager.service.InteractionHistoryService;
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
@RequestMapping("/api/interaction-history")
@Validated
public class InteractionHistoryController {
    @Autowired
    private InteractionHistoryService interactionHistoryService;

    private InteractionHistoryDTO toDTO(InteractionHistory h) {
        InteractionHistoryDTO dto = new InteractionHistoryDTO();
        dto.setId(h.getId());
        dto.setOpportunityId(h.getOpportunity() != null ? h.getOpportunity().getId() : null);
        dto.setUserId(h.getUser() != null ? h.getUser().getId() : null);
        dto.setNote(h.getNote());
        dto.setCreatedAt(h.getCreatedAt());
        return dto;
    }
    private InteractionHistory fromDTO(InteractionHistoryDTO dto) {
        InteractionHistory h = new InteractionHistory();
        h.setId(dto.getId());
        h.setNote(dto.getNote());
        return h;
    }

    @GetMapping
    public List<InteractionHistoryDTO> getAll() {
        return interactionHistoryService.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InteractionHistoryDTO> getById(@PathVariable("id") String id) {
        Optional<InteractionHistory> history = interactionHistoryService.findById(UUID.fromString(id));
        return history.map(h -> ResponseEntity.ok(toDTO(h))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public InteractionHistoryDTO create(@Valid @RequestBody InteractionHistoryDTO dto) {
        InteractionHistory h = fromDTO(dto);
        InteractionHistory saved = interactionHistoryService.save(h);
        return toDTO(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InteractionHistoryDTO> update(@PathVariable("id") String id, @Valid @RequestBody InteractionHistoryDTO dto) {
        if (!interactionHistoryService.findById(UUID.fromString(id)).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        InteractionHistory h = fromDTO(dto);
        h.setId(UUID.fromString(id));
        InteractionHistory saved = interactionHistoryService.save(h);
        return ResponseEntity.ok(toDTO(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        if (!interactionHistoryService.findById(UUID.fromString(id)).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        interactionHistoryService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
} 
