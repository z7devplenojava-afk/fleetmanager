package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CarWashDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.CarWash;
import com.z7design.fleet_manager.repository.CarWashRepository;
import com.z7design.fleet_manager.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CarWashService {

    private final CarWashRepository repository;
    private final SupplierRepository supplierRepository;

    @Transactional(readOnly = true)
    public List<CarWashDTO> list(UUID companyId) {
        List<CarWash> list = companyId != null
                ? repository.findByCompanyIdAndActiveTrueOrderByCreatedAtDesc(companyId)
                : repository.findByActiveTrueOrderByCreatedAtDesc();

        return list.stream().map(entity -> {
            CarWashDTO dto = CarWashDTO.fromEntity(entity);
            if (entity.getSupplierId() != null) {
                supplierRepository.findById(entity.getSupplierId())
                        .ifPresent(s -> dto.setSupplierName(s.getName()));
            }
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CarWashDTO getById(UUID id) {
        CarWash entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lava-jato não encontrado: " + id));
        CarWashDTO dto = CarWashDTO.fromEntity(entity);
        if (entity.getSupplierId() != null) {
            supplierRepository.findById(entity.getSupplierId())
                    .ifPresent(s -> dto.setSupplierName(s.getName()));
        }
        return dto;
    }

    @Transactional
    public CarWashDTO create(CarWashDTO dto, UUID companyId) {
        CarWash entity = CarWash.builder()
                .name(dto.getName())
                .cnpjCpf(dto.getCnpjCpf())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .supplierId(dto.getSupplierId())
                .priceInternal(dto.getPriceInternal() != null ? dto.getPriceInternal() : BigDecimal.ZERO)
                .priceExternal(dto.getPriceExternal() != null ? dto.getPriceExternal() : BigDecimal.ZERO)
                .priceComplete(dto.getPriceComplete() != null ? dto.getPriceComplete() : BigDecimal.ZERO)
                .priceSanitary(dto.getPriceSanitary() != null ? dto.getPriceSanitary() : BigDecimal.ZERO)
                .companyId(companyId != null ? companyId : dto.getCompanyId())
                .active(true)
                .build();

        CarWash saved = repository.save(entity);
        return CarWashDTO.fromEntity(saved);
    }

    @Transactional
    public CarWashDTO update(UUID id, CarWashDTO dto) {
        CarWash entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lava-jato não encontrado: " + id));

        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getCnpjCpf() != null) entity.setCnpjCpf(dto.getCnpjCpf());
        if (dto.getPhone() != null) entity.setPhone(dto.getPhone());
        if (dto.getAddress() != null) entity.setAddress(dto.getAddress());
        if (dto.getSupplierId() != null) entity.setSupplierId(dto.getSupplierId());
        if (dto.getPriceInternal() != null) entity.setPriceInternal(dto.getPriceInternal());
        if (dto.getPriceExternal() != null) entity.setPriceExternal(dto.getPriceExternal());
        if (dto.getPriceComplete() != null) entity.setPriceComplete(dto.getPriceComplete());
        if (dto.getPriceSanitary() != null) entity.setPriceSanitary(dto.getPriceSanitary());
        if (dto.getActive() != null) entity.setActive(dto.getActive());

        CarWash saved = repository.save(entity);
        return CarWashDTO.fromEntity(saved);
    }

    @Transactional
    public void delete(UUID id) {
        CarWash entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lava-jato não encontrado: " + id));
        entity.setActive(false);
        repository.save(entity);
    }
}
