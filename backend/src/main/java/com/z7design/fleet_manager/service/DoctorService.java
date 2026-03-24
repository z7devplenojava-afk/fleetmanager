package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Doctor;
import com.z7design.fleet_manager.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {

    private final DoctorRepository doctorRepository;

    @Transactional(readOnly = true)
    public List<Doctor> findAllActive() {
        return doctorRepository.findByActiveTrueOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public List<Doctor> searchByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return findAllActive();
        }
        return doctorRepository.findByNameContainingIgnoreCaseAndActiveTrue(name.trim());
    }

    @Transactional(readOnly = true)
    public Optional<Doctor> findById(UUID id) {
        return doctorRepository.findById(id);
    }

    @Transactional
    public Doctor create(Doctor doctor) {
        // Verificar se jÃ¡ existe mÃ©dico com mesmo CRM
        Optional<Doctor> existing = doctorRepository.findByCrmNumberAndCrmState(
            doctor.getCrmNumber(), 
            doctor.getCrmState()
        );
        if (existing.isPresent()) {
            throw new RuntimeException("JÃ¡ existe um mÃ©dico cadastrado com CRM " + 
                doctor.getCrmNumber() + "/" + doctor.getCrmState());
        }
        return doctorRepository.save(doctor);
    }

    @Transactional
    public Doctor update(UUID id, Doctor doctor) {
        Doctor existing = doctorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("MÃ©dico nÃ£o encontrado com id: " + id));
        
        // Verificar se outro mÃ©dico jÃ¡ tem o mesmo CRM
        Optional<Doctor> duplicate = doctorRepository.findByCrmNumberAndCrmState(
            doctor.getCrmNumber(), 
            doctor.getCrmState()
        );
        if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) {
            throw new RuntimeException("JÃ¡ existe outro mÃ©dico cadastrado com CRM " + 
                doctor.getCrmNumber() + "/" + doctor.getCrmState());
        }
        
        existing.setName(doctor.getName());
        existing.setCrmNumber(doctor.getCrmNumber());
        existing.setCrmState(doctor.getCrmState());
        existing.setActive(doctor.getActive());
        
        return doctorRepository.save(existing);
    }

    @Transactional
    public void delete(UUID id) {
        Doctor doctor = doctorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("MÃ©dico nÃ£o encontrado com id: " + id));
        doctor.setActive(false);
        doctorRepository.save(doctor);
    }
}




