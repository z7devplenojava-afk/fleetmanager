package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.SupplierDTO;
import br.com.fleetmanager.model.Supplier;
import br.com.fleetmanager.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SupplierService {
    
    private final SupplierRepository supplierRepository;
    
    public List<Supplier> findAll() {
        return supplierRepository.findAll();
    }
    
    public Page<Supplier> findAll(Pageable pageable) {
        return supplierRepository.findAll(pageable);
    }
    
    public List<Supplier> findActiveSuppliers() {
        return supplierRepository.findByIsActiveTrue();
    }
    
    public Page<Supplier> findActiveSuppliers(Pageable pageable) {
        return supplierRepository.findByIsActiveTrue(pageable);
    }
    
    public Optional<Supplier> findById(UUID id) {
        return supplierRepository.findById(id);
    }
    
    public Optional<Supplier> findByCnpj(String cnpj) {
        return supplierRepository.findByCnpj(cnpj);
    }
    
    public Optional<Supplier> findByEmail(String email) {
        return supplierRepository.findByEmail(email);
    }
    
    public List<Supplier> findByNameContaining(String name) {
        return supplierRepository.findByNameContainingIgnoreCase(name);
    }
    
    public Page<Supplier> findByNameContaining(String name, Pageable pageable) {
        return supplierRepository.findByNameContainingIgnoreCase(name, pageable);
    }
    
    public List<Supplier> findByCity(String city) {
        return supplierRepository.findByCityIgnoreCase(city);
    }
    
    public List<Supplier> findByState(String state) {
        return supplierRepository.findByStateIgnoreCase(state);
    }
    
    public Page<Supplier> findByFilters(String name, String cnpj, String city, String state, Boolean isActive, Pageable pageable) {
        return supplierRepository.findByFilters(name, cnpj, city, state, isActive, pageable);
    }
    
    public Supplier save(Supplier supplier) {
        return supplierRepository.save(supplier);
    }
    
    public Supplier create(SupplierDTO supplierDTO) {
        // Verificações prévias para evitar 500 por violação de constraint
        if (supplierDTO.getCnpj() != null) {
            String cnpjTrimmed = supplierDTO.getCnpj().trim();
            supplierRepository.findByCnpj(cnpjTrimmed).ifPresent(existing -> {
                throw new br.com.fleetmanager.exception.BusinessException("Já existe um fornecedor com este CNPJ.");
            });
        }

        Supplier supplier = new Supplier();
        updateSupplierFromDTO(supplier, supplierDTO);
        return supplierRepository.save(supplier);
    }
    
    public Supplier update(UUID id, SupplierDTO supplierDTO) {
        return supplierRepository.findById(id)
                .map(supplier -> {
                    updateSupplierFromDTO(supplier, supplierDTO);
                    return supplierRepository.save(supplier);
                })
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));
    }
    
    public void deleteById(UUID id) {
        supplierRepository.deleteById(id);
    }
    
    public void deactivate(UUID id) {
        supplierRepository.findById(id)
                .ifPresent(supplier -> {
                    supplier.setIsActive(false);
                    supplierRepository.save(supplier);
                });
    }
    
    public void activate(UUID id) {
        supplierRepository.findById(id)
                .ifPresent(supplier -> {
                    supplier.setIsActive(true);
                    supplierRepository.save(supplier);
                });
    }
    
    public long countActiveSuppliers() {
        return supplierRepository.countByIsActiveTrue();
    }
    
    public long countInactiveSuppliers() {
        return supplierRepository.countByIsActiveFalse();
    }
    
    private void updateSupplierFromDTO(Supplier supplier, SupplierDTO dto) {
        supplier.setName(dto.getName());
        supplier.setCnpj(dto.getCnpj());
        supplier.setEmail(dto.getEmail());
        supplier.setPhone(dto.getPhone());
        supplier.setAddress(dto.getAddress());
        supplier.setCity(dto.getCity());
        supplier.setState(normalizeState(dto.getState()));
        supplier.setZipCode(dto.getZipCode());
        supplier.setNotes(dto.getNotes());
        if (dto.getIsActive() != null) {
            supplier.setIsActive(dto.getIsActive());
        }
    }

    private String normalizeState(String state) {
        if (state == null) return null;
        String s = state.trim();
        if (s.isEmpty()) return null;
        String upper = s.toUpperCase();
        // Mapear nomes completos comuns para UF
        switch (upper) {
            case "ACRE": return "AC";
            case "ALAGOAS": return "AL";
            case "AMAPA":
            case "AMAPÁ": return "AP";
            case "AMAZONAS": return "AM";
            case "BAHIA": return "BA";
            case "CEARA":
            case "CEARÁ": return "CE";
            case "DISTRITO FEDERAL": return "DF";
            case "ESPIRITO SANTO":
            case "ESPÍRITO SANTO": return "ES";
            case "GOIAS":
            case "GOIÁS": return "GO";
            case "MARANHAO":
            case "MARANHÃO": return "MA";
            case "MATO GROSSO": return "MT";
            case "MATO GROSSO DO SUL": return "MS";
            case "MINAS GERAIS": return "MG";
            case "PARA":
            case "PARÁ": return "PA";
            case "PARAIBA":
            case "PARAÍBA": return "PB";
            case "PARANA":
            case "PARANÁ": return "PR";
            case "PERNAMBUCO": return "PE";
            case "PIAUI":
            case "PIAUÍ": return "PI";
            case "RIO DE JANEIRO": return "RJ";
            case "RIO GRANDE DO NORTE": return "RN";
            case "RIO GRANDE DO SUL": return "RS";
            case "RONDONIA":
            case "RONDÔNIA": return "RO";
            case "RORAIMA": return "RR";
            case "SANTA CATARINA": return "SC";
            case "SAO PAULO":
            case "SÃO PAULO": return "SP";
            case "SERGIPE": return "SE";
            case "TOCANTINS": return "TO";
            default:
                // Se já tiver 2 caracteres, devolver upper; caso contrário, tenta as 2 primeiras letras
                if (upper.length() >= 2) return upper.substring(0, 2);
                return upper;
        }
    }
} 