package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.ShiftChangeFormDTO;
import br.com.fleetmanager.model.ShiftChangeForm;
import br.com.fleetmanager.model.enums.ShiftTime;
import br.com.fleetmanager.repository.ShiftChangeFormRepository;
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
        log.info("Criando nova solicitação de troca de plantão: {}", dto.getRequesterFullName());
        validateShiftChange(dto);
        ShiftChangeForm entity = dto.toEntity();
        return new ShiftChangeFormDTO(shiftChangeFormRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<ShiftChangeFormDTO> getAllShiftChangeForms() {
        log.info("Buscando todas as solicitações de troca de plantão");
        return shiftChangeFormRepository.findAll().stream()
                .map(ShiftChangeFormDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ShiftChangeFormDTO getShiftChangeFormById(Long id) {
        log.info("Buscando solicitação de troca de plantão por ID: {}", id);
        return shiftChangeFormRepository.findById(id)
                .map(ShiftChangeFormDTO::new)
                .orElseThrow(() -> new RuntimeException("Solicitação de troca de plantão não encontrada"));
    }

    @Transactional
    public ShiftChangeFormDTO updateShiftChangeForm(Long id, ShiftChangeFormDTO dto) {
        log.info("Atualizando solicitação de troca de plantão ID: {}", id);
        ShiftChangeForm existingEntity = shiftChangeFormRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitação de troca de plantão não encontrada"));

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
        existingEntity.setStatus(dto.getStatus());

        return new ShiftChangeFormDTO(shiftChangeFormRepository.save(existingEntity));
    }

    @Transactional
    public void deleteShiftChangeForm(Long id) {
        log.info("Excluindo solicitação de troca de plantão ID: {}", id);
        if (!shiftChangeFormRepository.existsById(id)) {
            throw new RuntimeException("Solicitação de troca de plantão não encontrada");
        }
        shiftChangeFormRepository.deleteById(id);
    }

    private void validateShiftChange(ShiftChangeFormDTO dto) {
        // Regra de validação: Não será permitida trocas entre funcionários de turnos diferentes (Dia/Noite)
        boolean isRequesterDayShift = isDayShift(dto.getShiftTime());
        boolean isReplacingDayShift = isDayShift(dto.getShiftTime()); // O colega assumirá o mesmo turno

        if (isRequesterDayShift != isReplacingDayShift) {
            throw new IllegalArgumentException("Não é permitida a troca de plantão entre turnos diferentes (Dia/Noite).");
        }
    }

    private boolean isDayShift(ShiftTime shiftTime) {
        return shiftTime == ShiftTime.SHIFT_6H_18H || shiftTime == ShiftTime.SHIFT_7H_19H;
    }
}
