package com.z7design.fleet_manager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import com.z7design.fleet_manager.dto.CreateTrainingRequest;
import com.z7design.fleet_manager.dto.ErrorResponse;
import com.z7design.fleet_manager.model.Training;
import com.z7design.fleet_manager.service.TrainingService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/trainings")
@RequiredArgsConstructor
@Tag(name = "Treinamentos", description = "Endpoints para gestÃ£o de treinamentos.")
@SecurityRequirement(name = "bearerAuth")
public class TrainingController {

    private final TrainingService trainingService;

    @Operation(summary = "Lista treinamentos")
    @GetMapping
    public ResponseEntity<List<Training>> find(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "provider", required = false) String provider) {
        if (name != null && !name.isBlank()) {
            return ResponseEntity.ok(trainingService.findByNameContaining(name));
        }
        if (provider != null && !provider.isBlank()) {
            return ResponseEntity.ok(trainingService.findByProviderContaining(provider));
        }
        return ResponseEntity.ok(trainingService.findAll());
    }

    @Operation(summary = "Cria treinamento",
            responses = {
                @ApiResponse(responseCode = "200", description = "OK",
                        content = @Content(mediaType = "application/json", schema = @Schema(implementation = Training.class))),
                @ApiResponse(responseCode = "400", description = "Erro",
                        content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
            })
    @PostMapping
    public ResponseEntity<Training> create(@Valid @RequestBody CreateTrainingRequest request) {
        Training training = Training.builder()
                .name(request.getName())
                .description(request.getDescription())
                .provider(request.getProvider())
                .duration(request.getDuration())
                .renewalPeriodMonths(request.getRenewalPeriodMonths() != null ? request.getRenewalPeriodMonths() : 12)
                .mandatoryForGuards(request.getMandatoryForGuards() != null ? request.getMandatoryForGuards() : Boolean.TRUE)
                .build();
        return ResponseEntity.ok(trainingService.create(training));
    }

    @Operation(summary = "Atualiza treinamento")
    @PutMapping("/{id}")
    public ResponseEntity<Training> update(@PathVariable("id") UUID id, @RequestBody Training training) {
        return ResponseEntity.ok(trainingService.update(id, training));
    }

    @Operation(summary = "Busca por id")
    @GetMapping("/{id}")
    public ResponseEntity<Training> findById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(trainingService.findById(id));
    }

    @Operation(summary = "Exclui treinamento")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        trainingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}



