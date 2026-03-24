package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Department;
import com.z7design.fleet_manager.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<Department> findAll() {
        return departmentRepository.findAll();
    }

    public List<Department> findActive() {
        return departmentRepository.findByIsActiveTrue();
    }

    public Department getById(UUID id) {
        return departmentRepository.findById(id).orElseThrow();
    }

    public Department create(Department department) {
        return departmentRepository.save(department);
    }

    public Department update(UUID id, Department updated) {
        Department existing = getById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setEmailDomain(updated.getEmailDomain());
        existing.setManagerId(updated.getManagerId());
        existing.setIsActive(updated.getIsActive());
        return departmentRepository.save(existing);
    }

    public void delete(UUID id) {
        departmentRepository.deleteById(id);
    }
}



