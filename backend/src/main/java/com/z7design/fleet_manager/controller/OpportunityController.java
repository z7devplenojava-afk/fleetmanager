package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.OpportunityDTO;
import com.z7design.fleet_manager.dto.OpportunityResponse;
import com.z7design.fleet_manager.model.Opportunity;
import com.z7design.fleet_manager.service.OpportunityService;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
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

    // Converter Opportunity para OpportunityDTO (simplificado) - usado para criaÃ§Ã£o/atualizaÃ§Ã£o
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
        // AssociaÃ§Ãµes (Client, Lead, Status, AssignedTo) devem ser resolvidas no service
        o.setEstimatedValue(dto.getEstimatedValue());
        o.setCloseDate(dto.getCloseDate());
        return o;
    }

    @GetMapping
    public List<OpportunityResponse> getAll() {
        return opportunityService.findAll().stream()
                .map(OpportunityResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OpportunityResponse> getById(@PathVariable("id") String id) {
        Optional<Opportunity> opportunity = opportunityService.findById(UUID.fromString(id));
        return opportunity.map(OpportunityResponse::fromEntity)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new ResourceNotFoundException("Oportunidade nÃ£o encontrada"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('CRM_READ', 'LEADS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public OpportunityDTO create(@Valid @RequestBody OpportunityDTO dto) {
        Opportunity o = fromDTO(dto);
        Opportunity saved = opportunityService.create(
            o,
            dto.getStatusId(),
            dto.getLeadId(),
            dto.getClientId(),
            dto.getAssignedToId()
        );
        return toDTO(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('CRM_READ', 'LEADS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<OpportunityDTO> update(@PathVariable("id") String id, @Valid @RequestBody OpportunityDTO dto) {
        if (!opportunityService.findById(UUID.fromString(id)).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Opportunity o = fromDTO(dto);
        Opportunity saved = opportunityService.update(
            UUID.fromString(id),
            o,
            dto.getStatusId(),
            dto.getLeadId(),
            dto.getClientId(),
            dto.getAssignedToId()
        );
        return ResponseEntity.ok(toDTO(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('CRM_READ', 'LEADS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        if (!opportunityService.findById(UUID.fromString(id)).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        opportunityService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
} 
