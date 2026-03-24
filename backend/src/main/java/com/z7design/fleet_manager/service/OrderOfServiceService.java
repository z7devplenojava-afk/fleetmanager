package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CreateOrderOfServiceDTO;
import com.z7design.fleet_manager.dto.OrderOfServiceDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.OrderOfService;
import com.z7design.fleet_manager.model.Role;
import com.z7design.fleet_manager.repository.OrderOfServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderOfServiceService {
    
    private final OrderOfServiceRepository orderOfServiceRepository;
    
    public List<OrderOfServiceDTO> listByEmployee(UUID employeeId) {
        if (employeeId == null) return orderOfServiceRepository.findAll().stream().map(this::convertToDTO).toList();
        return orderOfServiceRepository.findByEmployeeId(employeeId).stream().map(this::convertToDTO).toList();
    }
    
    public List<OrderOfServiceDTO> listAll() {
        List<OrderOfService> orders = orderOfServiceRepository.findAll();
        return orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public OrderOfServiceDTO findById(UUID id) {
        OrderOfService order = orderOfServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de serviÃ§o nÃ£o encontrada com ID: " + id));
        return convertToDTO(order);
    }
    
    public OrderOfServiceDTO create(CreateOrderOfServiceDTO dto) {
        OrderOfService order = OrderOfService.builder()
                .employeeId(dto.getEmployeeId())
                .employeeName(dto.getEmployeeName())
                .employeeCpf(dto.getEmployeeCpf())
                .role(dto.getRole())
                .company(dto.getCompany())
                .client(dto.getClient())
                .workplace(dto.getWorkplace())
                .salary(dto.getSalary())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .signed(false)
                .build();
        
        OrderOfService savedOrder = orderOfServiceRepository.save(order);
        return convertToDTO(savedOrder);
    }
    
    public OrderOfServiceDTO update(UUID id, CreateOrderOfServiceDTO dto) {
        OrderOfService existingOrder = orderOfServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de serviÃ§o nÃ£o encontrada com ID: " + id));
        
        existingOrder.setEmployeeId(dto.getEmployeeId());
        existingOrder.setEmployeeName(dto.getEmployeeName());
        existingOrder.setEmployeeCpf(dto.getEmployeeCpf());
        existingOrder.setRole(dto.getRole());
        existingOrder.setCompany(dto.getCompany());
        existingOrder.setClient(dto.getClient());
        existingOrder.setWorkplace(dto.getWorkplace());
        existingOrder.setSalary(dto.getSalary());
        existingOrder.setStartDate(dto.getStartDate());
        existingOrder.setEndDate(dto.getEndDate());
        
        OrderOfService updatedOrder = orderOfServiceRepository.save(existingOrder);
        return convertToDTO(updatedOrder);
    }
    
    public OrderOfServiceDTO sign(UUID id) {
        OrderOfService order = orderOfServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de serviÃ§o nÃ£o encontrada com ID: " + id));
        
        order.setSigned(true);
        OrderOfService signedOrder = orderOfServiceRepository.save(order);
        return convertToDTO(signedOrder);
    }
    
    public OrderOfServiceDTO updateDocumentUrl(UUID id, String documentUrl) {
        OrderOfService order = orderOfServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de serviÃ§o nÃ£o encontrada com ID: " + id));
        
        order.setDocumentUrl(documentUrl);
        OrderOfService updatedOrder = orderOfServiceRepository.save(order);
        return convertToDTO(updatedOrder);
    }
    
    public void delete(UUID id) {
        if (!orderOfServiceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ordem de serviÃ§o nÃ£o encontrada com ID: " + id);
        }
        orderOfServiceRepository.deleteById(id);
    }
    
    public List<OrderOfServiceDTO> searchByTerm(String searchTerm) {
        List<OrderOfService> orders = orderOfServiceRepository.searchByTerm(searchTerm);
        return orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<OrderOfServiceDTO> findBySigned(Boolean signed) {
        List<OrderOfService> orders = orderOfServiceRepository.findBySigned(signed);
        return orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private OrderOfServiceDTO convertToDTO(OrderOfService order) {
        return OrderOfServiceDTO.builder()
                .id(order.getId())
                .employeeId(order.getEmployeeId())
                .employeeName(order.getEmployeeName())
                .employeeCpf(order.getEmployeeCpf())
                .role(order.getRole())
                .company(order.getCompany())
                .client(order.getClient())
                .workplace(order.getWorkplace())
                .salary(order.getSalary())
                .startDate(order.getStartDate())
                .endDate(order.getEndDate())
                .documentUrl(order.getDocumentUrl())
                .signed(order.getSigned())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
} 
