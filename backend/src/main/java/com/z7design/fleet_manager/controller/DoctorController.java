package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Doctor;
import com.z7design.fleet_manager.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors", description = "API para gerenciamento de mÃ©dicos")
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    @Operation(summary = "Listar todos os mÃ©dicos ativos")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'EMPLOYEES_READ')")
    public ResponseEntity<List<Doctor>> getAllActive() {
        return ResponseEntity.ok(doctorService.findAllActive());
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar mÃ©dicos por nome")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'EMPLOYEES_READ')")
    public ResponseEntity<List<Doctor>> searchByName(@RequestParam(required = false) String name) {
        return ResponseEntity.ok(doctorService.searchByName(name));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar mÃ©dico por ID")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'EMPLOYEES_READ')")
    public ResponseEntity<Doctor> getById(@PathVariable UUID id) {
        return doctorService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Criar novo mÃ©dico")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'EMPLOYEES_WRITE')")
    public ResponseEntity<Doctor> create(@RequestBody Doctor doctor) {
        return ResponseEntity.ok(doctorService.create(doctor));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar mÃ©dico")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'EMPLOYEES_WRITE')")
    public ResponseEntity<Doctor> update(@PathVariable UUID id, @RequestBody Doctor doctor) {
        return ResponseEntity.ok(doctorService.update(id, doctor));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desativar mÃ©dico")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'EMPLOYEES_WRITE')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        doctorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}




