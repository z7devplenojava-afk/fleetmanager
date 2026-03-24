package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.OrderOfServiceSSTRequestDTO;
import com.z7design.fleet_manager.dto.OrderOfServiceSSTResponseDTO;
import com.z7design.fleet_manager.model.OrderOfServiceSST;
import com.z7design.fleet_manager.repository.OrderOfServiceSSTRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderOfServiceSSTService {
    private final OrderOfServiceSSTRepository repository;

    public OrderOfServiceSSTResponseDTO create(OrderOfServiceSSTRequestDTO dto) {
        OrderOfServiceSST entity = new OrderOfServiceSST();
        BeanUtils.copyProperties(dto, entity);
        OrderOfServiceSST saved = repository.save(entity);
        return toResponseDTO(saved);
    }

    public OrderOfServiceSSTResponseDTO update(UUID id, OrderOfServiceSSTRequestDTO dto) {
        OrderOfServiceSST entity = repository.findById(id).orElseThrow();
        BeanUtils.copyProperties(dto, entity);
        OrderOfServiceSST saved = repository.save(entity);
        return toResponseDTO(saved);
    }

    public void delete(UUID id) {
        repository.deleteById(id);
    }

    public OrderOfServiceSSTResponseDTO findById(UUID id) {
        return repository.findById(id).map(this::toResponseDTO).orElseThrow();
    }

    public List<OrderOfServiceSSTResponseDTO> findAll() {
        return repository.findAll().stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    private OrderOfServiceSSTResponseDTO toResponseDTO(OrderOfServiceSST entity) {
        OrderOfServiceSSTResponseDTO dto = new OrderOfServiceSSTResponseDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }
} 
