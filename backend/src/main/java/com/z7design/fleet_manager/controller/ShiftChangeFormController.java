package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ShiftChangeFormDTO;
import com.z7design.fleet_manager.service.ShiftChangeFormService;
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
        log.info("POST /api/operational/shift-changes - Criando nova solicitaÃ§Ã£o de troca de plantÃ£o");
        ShiftChangeFormDTO createdDto = shiftChangeFormService.createShiftChangeForm(dto);
        log.info("âœ… SolicitaÃ§Ã£o de troca de plantÃ£o criada com sucesso. ID: {}", createdDto.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDto);
    }

    @GetMapping
    public ResponseEntity<List<ShiftChangeFormDTO>> getAllShiftChanges() {
        log.info("GET /api/operational/shift-changes - Buscando todas as solicitaÃ§Ãµes de troca de plantÃ£o");
        List<ShiftChangeFormDTO> dtoList = shiftChangeFormService.getAllShiftChangeForms();
        log.info("âœ… Retornadas {} solicitaÃ§Ãµes de troca de plantÃ£o.", dtoList.size());
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShiftChangeFormDTO> getShiftChangeById(@PathVariable Long id) {
        log.info("GET /api/operational/shift-changes/{} - Buscando solicitaÃ§Ã£o de troca de plantÃ£o por ID", id);
        ShiftChangeFormDTO dto = shiftChangeFormService.getShiftChangeFormById(id);
        log.info("âœ… SolicitaÃ§Ã£o de troca de plantÃ£o ID {} encontrada.", id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShiftChangeFormDTO> updateShiftChange(@PathVariable Long id, @Valid @RequestBody ShiftChangeFormDTO dto) {
        log.info("PUT /api/operational/shift-changes/{} - Atualizando solicitaÃ§Ã£o de troca de plantÃ£o", id);
        ShiftChangeFormDTO updatedDto = shiftChangeFormService.updateShiftChangeForm(id, dto);
        log.info("âœ… SolicitaÃ§Ã£o de troca de plantÃ£o ID {} atualizada com sucesso.", id);
        return ResponseEntity.ok(updatedDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShiftChange(@PathVariable Long id) {
        log.info("DELETE /api/operational/shift-changes/{} - Excluindo solicitaÃ§Ã£o de troca de plantÃ£o", id);
        shiftChangeFormService.deleteShiftChangeForm(id);
        log.info("âœ… SolicitaÃ§Ã£o de troca de plantÃ£o ID {} excluÃ­da com sucesso.", id);
        return ResponseEntity.noContent().build();
    }
}

