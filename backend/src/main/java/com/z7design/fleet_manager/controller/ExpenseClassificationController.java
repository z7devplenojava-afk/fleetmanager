package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.ExpenseClassification;
import com.z7design.fleet_manager.repository.ExpenseClassificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/expense-classifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ExpenseClassificationController {

    private final ExpenseClassificationRepository repository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ExpenseClassification>> getAllActive() {
        return ResponseEntity.ok(repository.findByIsActiveTrueOrderByNameAsc());
    }

    @GetMapping("/names")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<String>> getAllNames() {
        List<String> names = repository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(ExpenseClassification::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(names);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'FINANCEIRO_FULL', 'FINANCEIRO_WRITE')")
    public ResponseEntity<ExpenseClassification> create(@RequestBody ExpenseClassification classification) {
        if (classification.getName() == null || classification.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        classification.setName(classification.getName().trim().toUpperCase());
        if (repository.existsByNameIgnoreCase(classification.getName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(classification));
    }
}
