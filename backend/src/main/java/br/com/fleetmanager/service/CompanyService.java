package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.CompanyDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Company;
import br.com.fleetmanager.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CompanyService {

    private final CompanyRepository companyRepository;

    // Buscar todas as empresas
    @Cacheable("companies")
    public List<CompanyDTO> getAllCompanies() {
        log.info("Buscando todas as empresas");
        return companyRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Buscar empresa por ID
    @Cacheable(value = "companies", key = "#id")
    public CompanyDTO getCompanyById(UUID id) {
        log.info("Buscando empresa com ID: {}", id);
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada com ID: " + id));
        return convertToDTO(company);
    }

    // Buscar empresa por CNPJ
    public CompanyDTO getCompanyByCnpj(String cnpj) {
        log.info("Buscando empresa por CNPJ: {}", cnpj);
        Company company = companyRepository.findByCnpj(cnpj)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada com CNPJ: " + cnpj));
        return convertToDTO(company);
    }

    // Criar nova empresa
    @CacheEvict(value = "companies", allEntries = true)
    public CompanyDTO createCompany(CompanyDTO companyDTO, UUID currentUserId) {
        log.info("Criando nova empresa: {}", companyDTO.getName());
        
        // Validar se CNPJ já existe
        if (companyDTO.getCnpj() != null && companyRepository.existsByCnpj(companyDTO.getCnpj())) {
            throw new IllegalArgumentException("CNPJ já cadastrado: " + companyDTO.getCnpj());
        }

        // Validar se nome já existe
        if (companyRepository.existsByName(companyDTO.getName())) {
            throw new IllegalArgumentException("Nome da empresa já cadastrado: " + companyDTO.getName());
        }

        Company company = convertToEntity(companyDTO);
        
        // Só definir createdBy se currentUserId não for null
        if (currentUserId != null) {
            company.setCreatedBy(currentUserId);
        }
        
        company.setStatus(Company.CompanyStatus.ACTIVE);
        
        Company savedCompany = companyRepository.save(company);
        log.info("Empresa criada com sucesso: {}", savedCompany.getId());
        
        return convertToDTO(savedCompany);
    }

    // Atualizar empresa
    @CacheEvict(value = "companies", allEntries = true)
    public CompanyDTO updateCompany(UUID id, CompanyDTO companyDTO, UUID currentUserId) {
        log.info("Atualizando empresa com ID: {}", id);
        
        Company existingCompany = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada com ID: " + id));

        // Validar se CNPJ já existe (se foi alterado)
        if (companyDTO.getCnpj() != null && !companyDTO.getCnpj().equals(existingCompany.getCnpj()) &&
            companyRepository.existsByCnpj(companyDTO.getCnpj())) {
            throw new IllegalArgumentException("CNPJ já cadastrado: " + companyDTO.getCnpj());
        }

        // Validar se nome já existe (se foi alterado)
        if (!companyDTO.getName().equals(existingCompany.getName()) &&
            companyRepository.existsByName(companyDTO.getName())) {
            throw new IllegalArgumentException("Nome da empresa já cadastrado: " + companyDTO.getName());
        }

        updateCompanyFromDTO(existingCompany, companyDTO);
        
        // Só definir updatedBy se currentUserId não for null
        if (currentUserId != null) {
            existingCompany.setUpdatedBy(currentUserId);
        }
        
        Company updatedCompany = companyRepository.save(existingCompany);
        log.info("Empresa atualizada com sucesso: {}", updatedCompany.getId());
        
        return convertToDTO(updatedCompany);
    }

    // Deletar empresa
    @CacheEvict(value = "companies", allEntries = true)
    public void deleteCompany(UUID id) {
        log.info("Deletando empresa com ID: {}", id);
        
        if (!companyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Empresa não encontrada com ID: " + id);
        }
        
        companyRepository.deleteById(id);
        log.info("Empresa deletada com sucesso: {}", id);
    }

    // Buscar empresas por status
    public List<CompanyDTO> getCompaniesByStatus(Company.CompanyStatus status) {
        log.info("Buscando empresas por status: {}", status);
        return companyRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Buscar empresas por cidade
    public List<CompanyDTO> getCompaniesByCity(String city) {
        log.info("Buscando empresas por cidade: {}", city);
        return companyRepository.findByCityContainingIgnoreCase(city).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Buscar empresas por estado
    public List<CompanyDTO> getCompaniesByState(String state) {
        log.info("Buscando empresas por estado: {}", state);
        return companyRepository.findByState(state).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Buscar empresas por setor
    public List<CompanyDTO> getCompaniesBySector(String sector) {
        log.info("Buscando empresas por setor: {}", sector);
        return companyRepository.findBySectorContainingIgnoreCase(sector).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Buscar empresas por tipo
    public List<CompanyDTO> getCompaniesByType(String type) {
        log.info("Buscando empresas por tipo: {}", type);
        return companyRepository.findByType(type).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Buscar empresas por tamanho
    public List<CompanyDTO> getCompaniesBySize(String size) {
        log.info("Buscando empresas por tamanho: {}", size);
        return companyRepository.findBySize(size).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Busca avançada
    public Page<CompanyDTO> getCompaniesByAdvancedFilters(
            String name, String cnpj, String city, String state, 
            String sector, Company.CompanyStatus status, String type, Pageable pageable) {
        log.info("Buscando empresas com filtros avançados");
        return companyRepository.findByAdvancedFilters(name, cnpj, city, state, sector, status, type, pageable)
                .map(this::convertToDTO);
    }

    // Busca por termo
    public List<CompanyDTO> searchCompanies(String searchTerm) {
        log.info("Buscando empresas por termo: {}", searchTerm);
        return companyRepository.findBySearchTerm(searchTerm).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Estatísticas
    public long getActiveCompaniesCount() {
        return companyRepository.countByStatus(Company.CompanyStatus.ACTIVE);
    }

    public long getCompaniesCountByStatus(Company.CompanyStatus status) {
        return companyRepository.countByStatus(status);
    }

    public long getCompaniesCountByState(String state) {
        return companyRepository.countByState(state);
    }

    public long getCompaniesCountBySector(String sector) {
        return companyRepository.countBySector(sector);
    }

    public long getCompaniesCountByType(String type) {
        return companyRepository.countByType(type);
    }

    public long getCompaniesCountBySize(String size) {
        return companyRepository.countBySize(size);
    }

    // Conversão DTO para Entity
    private Company convertToEntity(CompanyDTO dto) {
        return Company.builder()
                .id(dto.getId())
                .name(dto.getName())
                .tradeName(dto.getTradeName())
                .cnpj(dto.getCnpj())
                .inscricaoEstadual(dto.getInscricaoEstadual())
                .inscricaoMunicipal(dto.getInscricaoMunicipal())
                .address(dto.getAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .zipCode(dto.getZipCode())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .website(dto.getWebsite())
                .contactPerson(dto.getContactPerson())
                .contactPhone(dto.getContactPhone())
                .contactEmail(dto.getContactEmail())
                .description(dto.getDescription())
                .status(dto.getStatus())
                .type(dto.getType())
                .sector(dto.getSector())
                .size(dto.getSize())
                .annualRevenue(dto.getAnnualRevenue())
                .employeeCount(dto.getEmployeeCount())
                .notes(dto.getNotes())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .createdBy(dto.getCreatedBy())
                .updatedBy(dto.getUpdatedBy())
                .build();
    }

    // Conversão Entity para DTO
    private CompanyDTO convertToDTO(Company company) {
        return CompanyDTO.builder()
                .id(company.getId())
                .name(company.getName())
                .tradeName(company.getTradeName())
                .cnpj(company.getCnpj())
                .inscricaoEstadual(company.getInscricaoEstadual())
                .inscricaoMunicipal(company.getInscricaoMunicipal())
                .address(company.getAddress())
                .city(company.getCity())
                .state(company.getState())
                .zipCode(company.getZipCode())
                .phone(company.getPhone())
                .email(company.getEmail())
                .website(company.getWebsite())
                .contactPerson(company.getContactPerson())
                .contactPhone(company.getContactPhone())
                .contactEmail(company.getContactEmail())
                .description(company.getDescription())
                .status(company.getStatus())
                .type(company.getType())
                .sector(company.getSector())
                .size(company.getSize())
                .annualRevenue(company.getAnnualRevenue())
                .employeeCount(company.getEmployeeCount())
                .notes(company.getNotes())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .createdBy(company.getCreatedBy())
                .updatedBy(company.getUpdatedBy())
                .build();
    }

    // Atualizar Entity a partir do DTO
    private void updateCompanyFromDTO(Company company, CompanyDTO dto) {
        company.setName(dto.getName());
        company.setTradeName(dto.getTradeName());
        company.setCnpj(dto.getCnpj());
        company.setInscricaoEstadual(dto.getInscricaoEstadual());
        company.setInscricaoMunicipal(dto.getInscricaoMunicipal());
        company.setAddress(dto.getAddress());
        company.setCity(dto.getCity());
        company.setState(dto.getState());
        company.setZipCode(dto.getZipCode());
        company.setPhone(dto.getPhone());
        company.setEmail(dto.getEmail());
        company.setWebsite(dto.getWebsite());
        company.setContactPerson(dto.getContactPerson());
        company.setContactPhone(dto.getContactPhone());
        company.setContactEmail(dto.getContactEmail());
        company.setDescription(dto.getDescription());
        company.setStatus(dto.getStatus());
        company.setType(dto.getType());
        company.setSector(dto.getSector());
        company.setSize(dto.getSize());
        company.setAnnualRevenue(dto.getAnnualRevenue());
        company.setEmployeeCount(dto.getEmployeeCount());
        company.setNotes(dto.getNotes());
        company.setUpdatedAt(LocalDateTime.now());
    }
} 