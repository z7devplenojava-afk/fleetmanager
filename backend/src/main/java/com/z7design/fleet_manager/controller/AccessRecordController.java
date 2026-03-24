package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.AccessRecord;
import com.z7design.fleet_manager.repository.AccessRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gatehouse/access-records")
@RequiredArgsConstructor
public class AccessRecordController {

    private final AccessRecordRepository repository;

    @GetMapping
    public ResponseEntity<List<AccessRecord>> findAll(@RequestParam(required = false) UUID companyId) {
        if (companyId != null) {
            return ResponseEntity.ok(repository.findByCompanyId(companyId));
        }
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping("/entry")
    public ResponseEntity<AccessRecord> registerEntry(@RequestBody AccessRecord record) {
        record.setEntryTime(LocalDateTime.now());
        record.setStatus("IN");
        return ResponseEntity.ok(repository.save(record));
    }

    @PostMapping("/{id}/exit")
    public ResponseEntity<AccessRecord> registerExit(@PathVariable UUID id) {
        return repository.findById(id).map(record -> {
            record.setExitTime(LocalDateTime.now());
            record.setStatus("OUT");
            return ResponseEntity.ok(repository.save(record));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public ResponseEntity<List<AccessRecord>> findActive() {
        return ResponseEntity.ok(repository.findByStatus("IN"));
    }
}
