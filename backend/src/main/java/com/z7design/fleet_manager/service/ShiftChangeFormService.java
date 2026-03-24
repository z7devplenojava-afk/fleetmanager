package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ShiftChangeFormDTO;
import com.z7design.fleet_manager.model.ShiftChangeForm;
import com.z7design.fleet_manager.model.enums.ShiftTime;
import com.z7design.fleet_manager.repository.ShiftChangeFormRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShiftChangeFormService {

    private final ShiftChangeFormRepository shiftChangeFormRepository;

    @Transactional
    public ShiftChangeFormDTO createShiftChangeForm(ShiftChangeFormDTO dto) {
        log.info("Criando nova solicitaÃ§Ã£o de troca de plantÃ£o: {}", dto.getRequesterFullName());
        validateShiftChange(dto);
        ShiftChangeForm entity = dto.toEntity();
        return new ShiftChangeFormDTO(shiftChangeFormRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<ShiftChangeFormDTO> getAllShiftChangeForms() {
        log.info("Buscando todas as solicitaÃ§Ãµes de troca de plantÃ£o");
        return shiftChangeFormRepository.findAll().stream()
                .map(ShiftChangeFormDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ShiftChangeFormDTO getShiftChangeFormById(Long id) {
        log.info("Buscando solicitaÃ§Ã£o de troca de plantÃ£o por ID: {}", id);
        return shiftChangeFormRepository.findById(id)
                .map(ShiftChangeFormDTO::new)
                .orElseThrow(() -> new RuntimeException("SolicitaÃ§Ã£o de troca de plantÃ£o nÃ£o encontrada"));
    }

    @Transactional
    public ShiftChangeFormDTO updateShiftChangeForm(Long id, ShiftChangeFormDTO dto) {
        log.info("Atualizando solicitaÃ§Ã£o de troca de plantÃ£o ID: {}", id);
        ShiftChangeForm existingEntity = shiftChangeFormRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SolicitaÃ§Ã£o de troca de plantÃ£o nÃ£o encontrada"));

        validateShiftChange(dto);

        existingEntity.setDateOfRequest(dto.getDateOfRequest());
        existingEntity.setRequesterFullName(dto.getRequesterFullName());
        existingEntity.setRequesterSector(dto.getRequesterSector());
        existingEntity.setRequesterDayOffDate(dto.getRequesterDayOffDate());
        existingEntity.setRequesterShiftDate(dto.getRequesterShiftDate());
        existingEntity.setReplacingFullName(dto.getReplacingFullName());
        existingEntity.setReplacingSector(dto.getReplacingSector());
        existingEntity.setReplacingShiftDate(dto.getReplacingShiftDate());
        existingEntity.setReplacingDayOffDate(dto.getReplacingDayOffDate());
        existingEntity.setShiftTime(dto.getShiftTime());
        
        // SÃ³ atualiza o status se foi enviado (nÃ£o nulo)
        if (dto.getStatus() != null) {
            existingEntity.setStatus(dto.getStatus());
        }

        return new ShiftChangeFormDTO(shiftChangeFormRepository.save(existingEntity));
    }

    @Transactional
    public void deleteShiftChangeForm(Long id) {
        log.info("Excluindo solicitaÃ§Ã£o de troca de plantÃ£o ID: {}", id);
        if (!shiftChangeFormRepository.existsById(id)) {
            throw new RuntimeException("SolicitaÃ§Ã£o de troca de plantÃ£o nÃ£o encontrada");
        }
        shiftChangeFormRepository.deleteById(id);
    }

    private void validateShiftChange(ShiftChangeFormDTO dto) {
        // Regra de validaÃ§Ã£o: NÃ£o serÃ¡ permitida trocas entre funcionÃ¡rios de turnos diferentes (Dia/Noite)
        boolean isRequesterDayShift = isDayShift(dto.getShiftTime());
        boolean isReplacingDayShift = isDayShift(dto.getShiftTime()); // O colega assumirÃ¡ o mesmo turno

        if (isRequesterDayShift != isReplacingDayShift) {
            throw new IllegalArgumentException("NÃ£o Ã© permitida a troca de plantÃ£o entre turnos diferentes (Dia/Noite).");
        }
    }

    private boolean isDayShift(ShiftTime shiftTime) {
        return shiftTime == ShiftTime.SHIFT_6H_18H || shiftTime == ShiftTime.SHIFT_7H_19H;
    }
}

