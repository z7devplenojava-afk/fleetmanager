package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.TaskService;

import br.com.fleetmanager.dto.TaskDTO;
import br.com.fleetmanager.model.Task;

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
@RequestMapping("/api/tasks")
@Validated
public class TaskController {
    @Autowired
    private TaskService taskService;

    private TaskDTO toDTO(Task t) {
        TaskDTO dto = new TaskDTO();
        dto.setId(t.getId());
        dto.setTitle(t.getTitle());
        dto.setDescription(t.getDescription());
        dto.setOpportunityId(t.getOpportunity() != null ? t.getOpportunity().getId() : null);
        dto.setAssignedToId(t.getAssignedTo() != null ? t.getAssignedTo().getId() : null);
        dto.setDueDate(t.getDueDate());
        dto.setCompleted(t.getCompleted());
        dto.setCreatedAt(t.getCreatedAt());
        return dto;
    }
    private Task fromDTO(TaskDTO dto) {
        Task t = new Task();
        t.setId(dto.getId());
        t.setTitle(dto.getTitle());
        t.setDescription(dto.getDescription());
        t.setDueDate(dto.getDueDate());
        t.setCompleted(dto.getCompleted());
        return t;
    }

    @GetMapping
    public List<TaskDTO> getAll() {
        return taskService.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getById(@PathVariable String id) {
        Optional<Task> task = taskService.findById(UUID.fromString(id));
        return task.map(t -> ResponseEntity.ok(toDTO(t))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TaskDTO create(@Valid @RequestBody TaskDTO dto) {
        Task t = fromDTO(dto);
        Task saved = taskService.save(t);
        return toDTO(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> update(@PathVariable String id, @Valid @RequestBody TaskDTO dto) {
        if (!taskService.findById(UUID.fromString(id)).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Task t = fromDTO(dto);
        t.setId(UUID.fromString(id)); // Certifique-se que o campo id do modelo Task é UUID
        Task saved = taskService.save(t);
        return ResponseEntity.ok(toDTO(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!taskService.findById(UUID.fromString(id)).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        taskService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
} 