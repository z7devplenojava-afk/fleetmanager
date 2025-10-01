package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.OpportunityService;

import br.com.fleetmanager.dto.OpportunityDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Opportunity;

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
@RequestMapping("/api/opportunities")
@Validated
public class OpportunityController {
    @Autowired
    private OpportunityService opportunityService;

    // Converter Opportunity para OpportunityDTO (simplificado)
    private OpportunityDTO toDTO(Opportunity o) {
        OpportunityDTO dto = new OpportunityDTO();
        dto.setId(o.getId());
        dto.setTitle(o.getTitle());
        dto.setDescription(o.getDescription());
        dto.setClientId(o.getClient() != null ? o.getClient().getId() : null);
        dto.setLeadId(o.getLead() != null ? o.getLead().getId() : null);
        dto.setStatusId(o.getStatus() != null ? o.getStatus().getId() : null);
        dto.setAssignedToId(o.getAssignedTo() != null ? o.getAssignedTo().getId() : null);
        dto.setEstimatedValue(o.getEstimatedValue());
        dto.setCloseDate(o.getCloseDate());
        dto.setCreatedAt(o.getCreatedAt());
        dto.setUpdatedAt(o.getUpdatedAt());
        return dto;
    }
    
    private Opportunity fromDTO(OpportunityDTO dto) {
        Opportunity o = new Opportunity();
        o.setId(dto.getId());
        o.setTitle(dto.getTitle());
        o.setDescription(dto.getDescription());
        // Associações (Client, Lead, Status, AssignedTo) devem ser resolvidas no service
        o.setEstimatedValue(dto.getEstimatedValue());
        o.setCloseDate(dto.getCloseDate());
        return o;
    }

    @GetMapping
    public List<OpportunityDTO> getAll() {
        return opportunityService.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OpportunityDTO> getById(@PathVariable String id) {
        Optional<Opportunity> opportunity = opportunityService.findById(UUID.fromString(id));
        return opportunity.map(this::toDTO)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new ResourceNotFoundException("Oportunidade não encontrada"));
    }

    @PostMapping
    public OpportunityDTO create(@Valid @RequestBody OpportunityDTO dto) {
        Opportunity o = fromDTO(dto);
        Opportunity saved = opportunityService.save(o);
        return toDTO(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OpportunityDTO> update(@PathVariable String id, @Valid @RequestBody OpportunityDTO dto) {
        if (!opportunityService.findById(UUID.fromString(id)).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Opportunity o = fromDTO(dto);
        o.setId(UUID.fromString(id));
        Opportunity saved = opportunityService.save(o);
        return ResponseEntity.ok(toDTO(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!opportunityService.findById(UUID.fromString(id)).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        opportunityService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
} 