package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.CharterContract;
import com.z7design.fleet_manager.repository.CharterContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CharterService {

    private final CharterContractRepository contractRepository;

    public List<CharterContract> findAllContracts() {
        return contractRepository.findAll();
    }

    public CharterContract findContractById(UUID id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contrato de fretamento não encontrado"));
    }

    @Transactional
    public CharterContract saveContract(CharterContract contract) {
        return contractRepository.save(contract);
    }

    @Transactional
    public void deleteContract(UUID id) {
        contractRepository.deleteById(id);
    }
}
