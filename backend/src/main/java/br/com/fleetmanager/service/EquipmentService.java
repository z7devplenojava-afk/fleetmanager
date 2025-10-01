package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.CreateEquipmentRequest;
import br.com.fleetmanager.dto.EquipmentDTO;
import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Equipment;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.enums.EquipmentStatus;
import br.com.fleetmanager.repository.EquipmentRepository;
import br.com.fleetmanager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EmployeeRepository employeeRepository;

    public Page<EquipmentDTO> findAll(Pageable pageable) {
        log.debug("Buscando equipamentos com paginação: {}", pageable);
        Page<Equipment> equipments = equipmentRepository.findAll(pageable);
        return equipments.map(this::toDTO);
    }

    public List<EquipmentDTO> findAll() {
        log.debug("Buscando todos os equipamentos");
        List<Equipment> equipments = equipmentRepository.findAll();
        return equipments.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "equipments", key = "#id")
    public EquipmentDTO findById(UUID id) {
        log.debug("Buscando equipamento por ID: {}", id);
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipamento não encontrado com ID: " + id));
        return toDTO(equipment);
    }

    @Cacheable(value = "equipments", key = "#serialNumber")
    public EquipmentDTO findBySerialNumber(String serialNumber) {
        log.debug("Buscando equipamento por número de série: {}", serialNumber);
        Equipment equipment = equipmentRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipamento não encontrado com número de série: " + serialNumber));
        return toDTO(equipment);
    }

    @Cacheable(value = "equipmentsByStatus", key = "#status")
    public List<EquipmentDTO> findByStatus(EquipmentStatus status) {
        log.debug("Buscando equipamentos por status: {}", status);
        List<Equipment> equipments = equipmentRepository.findByStatus(status);
        return equipments.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EquipmentDTO> findByCurrentUser(UUID userId) {
        log.debug("Buscando equipamentos do usuário: {}", userId);
        List<Equipment> equipments = equipmentRepository.findByCurrentUserId(userId);
        return equipments.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EquipmentDTO> findExpiring(int days) {
        log.debug("Buscando equipamentos expirando em {} dias", days);
        LocalDate alertDate = LocalDate.now().plusDays(days);
        List<Equipment> equipments = equipmentRepository.findByValidityDateBefore(alertDate);
        return equipments.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EquipmentDTO> findExpired() {
        log.debug("Buscando equipamentos expirados");
        LocalDate today = LocalDate.now();
        List<Equipment> equipments = equipmentRepository.findByValidityDateBefore(today);
        return equipments.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EquipmentDTO> findDangerous() {
        log.debug("Buscando equipamentos perigosos");
        List<Equipment> equipments = equipmentRepository.findByIsDangerousTrue();
        return equipments.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @CacheEvict(value = {"equipments", "equipmentsByStatus"}, allEntries = true)
    public EquipmentDTO create(CreateEquipmentRequest request) {
        log.debug("Criando novo equipamento: {}", request.getSerialNumber());

        // Verificar se já existe equipamento com o mesmo número de série
        if (equipmentRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new BusinessException("Já existe um equipamento com o número de série: " + request.getSerialNumber());
        }

        Equipment equipment = Equipment.builder()
                .serialNumber(request.getSerialNumber())
                .status(request.getStatus())
                .model(request.getModel())
                .batch(request.getBatch())
                .caNumber(request.getCaNumber())
                .protectionLevel(request.getProtectionLevel())
                .size(request.getSize())
                .usageType(request.getUsageType())
                .ballisticPlate(request.getBallisticPlate())
                .manufacturingDate(request.getManufacturingDate())
                .validityDate(request.getValidityDate())
                .weaponRegistrationValidity(request.getWeaponRegistrationValidity())
                .isDangerous(request.getIsDangerous())
                .currentUserId(request.getCurrentUserId())
                .notes(request.getNotes())
                .build();

        Equipment saved = equipmentRepository.save(equipment);
        log.info("Equipamento criado com sucesso: {}", saved.getId());

        return toDTO(saved);
    }

    @CacheEvict(value = {"equipments", "equipmentsByStatus"}, allEntries = true)
    public EquipmentDTO update(UUID id, CreateEquipmentRequest request) {
        log.debug("Atualizando equipamento: {}", id);

        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipamento não encontrado com ID: " + id));

        // Verificar se o número de série não está sendo usado por outro equipamento
        if (!equipment.getSerialNumber().equals(request.getSerialNumber()) &&
                equipmentRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new BusinessException("Já existe um equipamento com o número de série: " + request.getSerialNumber());
        }

        equipment.setSerialNumber(request.getSerialNumber());
        equipment.setStatus(request.getStatus());
        equipment.setModel(request.getModel());
        equipment.setBatch(request.getBatch());
        equipment.setCaNumber(request.getCaNumber());
        equipment.setProtectionLevel(request.getProtectionLevel());
        equipment.setSize(request.getSize());
        equipment.setUsageType(request.getUsageType());
        equipment.setBallisticPlate(request.getBallisticPlate());
        equipment.setManufacturingDate(request.getManufacturingDate());
        equipment.setValidityDate(request.getValidityDate());
        equipment.setWeaponRegistrationValidity(request.getWeaponRegistrationValidity());
        equipment.setIsDangerous(request.getIsDangerous());
        equipment.setCurrentUserId(request.getCurrentUserId());
        equipment.setNotes(request.getNotes());

        Equipment saved = equipmentRepository.save(equipment);
        log.info("Equipamento atualizado com sucesso: {}", saved.getId());

        return toDTO(saved);
    }

    @CacheEvict(value = {"equipments", "equipmentsByStatus"}, allEntries = true)
    public EquipmentDTO updateStatus(UUID id, EquipmentStatus status) {
        log.debug("Atualizando status do equipamento {} para {}", id, status);

        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipamento não encontrado com ID: " + id));

        equipment.setStatus(status);
        Equipment saved = equipmentRepository.save(equipment);

        log.info("Status do equipamento {} atualizado para {}", id, status);
        return toDTO(saved);
    }

    public EquipmentDTO assignToUser(UUID equipmentId, UUID userId) {
        log.debug("Atribuindo equipamento {} ao usuário {}", equipmentId, userId);

        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipamento não encontrado com ID: " + equipmentId));

        if (userId != null) {
            Employee employee = employeeRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Funcionário não encontrado com ID: " + userId));
        }

        equipment.setCurrentUserId(userId);
        equipment.setStatus(userId != null ? EquipmentStatus.EM_USO : EquipmentStatus.EM_ESTOQUE);

        Equipment saved = equipmentRepository.save(equipment);
        log.info("Equipamento {} atribuído ao usuário {}", equipmentId, userId);

        return toDTO(saved);
    }

    public void delete(UUID id) {
        log.debug("Excluindo equipamento: {}", id);

        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipamento não encontrado com ID: " + id));

        equipmentRepository.delete(equipment);
        log.info("Equipamento excluído com sucesso: {}", id);
    }

    public Map<String, Object> getSummary() {
        log.debug("Gerando resumo de equipamentos");

        long total = equipmentRepository.count();
        long inUse = equipmentRepository.countByStatus(EquipmentStatus.EM_USO);
        long inStock = equipmentRepository.countByStatus(EquipmentStatus.EM_ESTOQUE);
        long inMaintenance = equipmentRepository.countByStatus(EquipmentStatus.EM_MANUTENCAO);
        long dangerous = equipmentRepository.countByIsDangerousTrue();

        LocalDate today = LocalDate.now();
        LocalDate alertDate = today.plusDays(30);

        long expired = equipmentRepository.countByValidityDateBefore(today);
        long expiringSoon = equipmentRepository.countByValidityDateBetween(today, alertDate);

        return Map.of(
                "total", total,
                "inUse", inUse,
                "inStock", inStock,
                "inMaintenance", inMaintenance,
                "dangerous", dangerous,
                "expired", expired,
                "expiringSoon", expiringSoon);
    }

    private EquipmentDTO toDTO(Equipment equipment) {
        String currentUserName = null;
        if (equipment.getCurrentUserId() != null) {
            currentUserName = employeeRepository.findById(equipment.getCurrentUserId())
                    .map(Employee::getName)
                    .orElse(null);
        }

        return EquipmentDTO.builder()
                .id(equipment.getId())
                .serialNumber(equipment.getSerialNumber())
                .status(equipment.getStatus())
                .model(equipment.getModel())
                .batch(equipment.getBatch())
                .caNumber(equipment.getCaNumber())
                .protectionLevel(equipment.getProtectionLevel())
                .size(equipment.getSize())
                .usageType(equipment.getUsageType())
                .ballisticPlate(equipment.getBallisticPlate())
                .manufacturingDate(equipment.getManufacturingDate())
                .validityDate(equipment.getValidityDate())
                .sixYearExpiry(equipment.getSixYearExpiry())
                .weaponRegistrationValidity(equipment.getWeaponRegistrationValidity())
                .lastMaintenanceDate(equipment.getLastMaintenanceDate())
                .nextMaintenanceDate(equipment.getNextMaintenanceDate())
                .isDangerous(equipment.getIsDangerous())
                .currentUserId(equipment.getCurrentUserId())
                .currentUserName(currentUserName)
                .notes(equipment.getNotes())
                .qrCode(equipment.getQrCode())
                .createdAt(equipment.getCreatedAt())
                .updatedAt(equipment.getUpdatedAt())
                .build();
    }
}