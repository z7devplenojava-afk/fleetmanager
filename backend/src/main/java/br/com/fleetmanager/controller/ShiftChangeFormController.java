package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.ShiftChangeFormService;

import br.com.fleetmanager.dto.ShiftChangeFormDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operational/shift-changes")
@RequiredArgsConstructor
@Slf4j
public class ShiftChangeFormController {

    private final ShiftChangeFormService shiftChangeFormService;

    @PostMapping
    public ResponseEntity<ShiftChangeFormDTO> createShiftChange(@Valid @RequestBody ShiftChangeFormDTO dto) {
        log.info("POST /api/operational/shift-changes - Criando nova solicitação de troca de plantão");
        ShiftChangeFormDTO createdDto = shiftChangeFormService.createShiftChangeForm(dto);
        log.info("✅ Solicitação de troca de plantão criada com sucesso. ID: {}", createdDto.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDto);
    }

    @GetMapping
    public ResponseEntity<List<ShiftChangeFormDTO>> getAllShiftChanges() {
        log.info("GET /api/operational/shift-changes - Buscando todas as solicitações de troca de plantão");
        List<ShiftChangeFormDTO> dtoList = shiftChangeFormService.getAllShiftChangeForms();
        log.info("✅ Retornadas {} solicitações de troca de plantão.", dtoList.size());
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShiftChangeFormDTO> getShiftChangeById(@PathVariable Long id) {
        log.info("GET /api/operational/shift-changes/{} - Buscando solicitação de troca de plantão por ID", id);
        ShiftChangeFormDTO dto = shiftChangeFormService.getShiftChangeFormById(id);
        log.info("✅ Solicitação de troca de plantão ID {} encontrada.", id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShiftChangeFormDTO> updateShiftChange(@PathVariable Long id, @Valid @RequestBody ShiftChangeFormDTO dto) {
        log.info("PUT /api/operational/shift-changes/{} - Atualizando solicitação de troca de plantão", id);
        ShiftChangeFormDTO updatedDto = shiftChangeFormService.updateShiftChangeForm(id, dto);
        log.info("✅ Solicitação de troca de plantão ID {} atualizada com sucesso.", id);
        return ResponseEntity.ok(updatedDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShiftChange(@PathVariable Long id) {
        log.info("DELETE /api/operational/shift-changes/{} - Excluindo solicitação de troca de plantão", id);
        shiftChangeFormService.deleteShiftChangeForm(id);
        log.info("✅ Solicitação de troca de plantão ID {} excluída com sucesso.", id);
        return ResponseEntity.noContent().build();
    }
}
