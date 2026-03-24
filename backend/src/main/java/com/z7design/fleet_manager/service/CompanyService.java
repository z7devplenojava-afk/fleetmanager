package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CompanyDTO;
import com.z7design.fleet_manager.dto.CompanyDefaultEPIDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.model.CompanyDefaultEPI;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.CompanyDefaultEPIRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyDefaultEPIRepository companyDefaultEPIRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    /**
     * Buscar todas as empresas
     */
    public List<CompanyDTO> getAllCompanies() {
        try {
            log.info("Buscando todas as empresas");
            List<Company> companies = companyRepository.findAllWithDefaultEpis();
            log.info("Encontradas {} empresas", companies.size());

            if (companies.isEmpty()) {
                log.warn("Nenhuma empresa encontrada no banco de dados");
                return java.util.Collections.emptyList();
            }

            return companies.stream()
                    .map(comp -> {
                        try {
                            return CompanyDTO.fromEntity(comp);
                        } catch (Exception e) {
                            log.error("Erro ao converter empresa {}: {}", comp.getName(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar empresas: {}", e.getMessage(), e);
            log.warn("Retornando lista vazia devido ao erro");
            return java.util.Collections.emptyList();
        }
    }

    /**
     * Buscar empresas com filtro dinamico
     */
    public List<CompanyDTO> searchCompanies(String query) {
        log.info("Buscando empresas com query: {}", query);
        List<Company> companies;

        if (query == null || query.trim().isEmpty()) {
            companies = companyRepository.findAllByOrderByNameAsc();
        } else {
            companies = companyRepository.searchCompanies(query.trim());
        }

        return companies.stream()
                .map(CompanyDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Buscar empresa por ID
     */
    public CompanyDTO getCompanyById(UUID id) {
        log.info("Buscando empresa por ID: {}", id);
        Company company = companyRepository.findByIdWithDefaultEpis(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa nao encontrada com ID: " + id));
        return CompanyDTO.fromEntity(company);
    }

    /**
     * Buscar empresa por sigla
     */
    public CompanyDTO getCompanyBySigla(String sigla) {
        log.info("Buscando empresa por sigla: {}", sigla);
        Company company = companyRepository.findBySigla(sigla)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa nao encontrada com sigla: " + sigla));
        return CompanyDTO.fromEntity(company);
    }

    /**
     * Criar nova empresa
     */
    public CompanyDTO createCompany(CompanyDTO dto) {
        log.info("Criando nova empresa: {}", dto.getName());

        // Validar sigla unica
        if (companyRepository.existsBySigla(dto.getSigla())) {
            throw new BusinessException("Ja existe uma empresa com a sigla: " + dto.getSigla());
        }

        // Validar CNPJ unico (se fornecido)
        if (dto.getCnpj() != null && !dto.getCnpj().trim().isEmpty()) {
            if (companyRepository.existsByCnpj(dto.getCnpj())) {
                throw new BusinessException("Ja existe uma empresa com o CNPJ: " + dto.getCnpj());
            }
        }

        Company company = dto.toEntity();
        company.setStatus(dto.getStatus() != null ? dto.getStatus() : CompanyStatus.ACTIVE);

        company = companyRepository.save(company);

        // Adicionar EPIs padrao se fornecidos
        if (dto.getDefaultEpis() != null && !dto.getDefaultEpis().isEmpty()) {
            for (int i = 0; i < dto.getDefaultEpis().size(); i++) {
                CompanyDefaultEPIDTO epiDto = dto.getDefaultEpis().get(i);
                CompanyDefaultEPI epi = epiDto.toEntity();
                epi.setCompany(company);
                epi.setOrderIndex(i);
                companyDefaultEPIRepository.save(epi);
            }
            log.info("EPIs padrao adicionados para empresa ID: {}", company.getId());
        }

        log.info("Empresa criada com sucesso - ID: {}", company.getId());

        // Recarregar empresa com EPIs
        company = companyRepository.findById(company.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Empresa nao encontrada"));

        return CompanyDTO.fromEntity(company);
    }

    /**
     * Atualizar empresa
     */
    public CompanyDTO updateCompany(UUID id, CompanyDTO dto) {
        log.info("Atualizando empresa ID: {}", id);

        Company existingCompany = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa nao encontrada com ID: " + id));

        // Validar sigla unica (exceto para a propria empresa)
        if (!existingCompany.getSigla().equals(dto.getSigla()) &&
                companyRepository.existsBySigla(dto.getSigla())) {
            throw new BusinessException("Ja existe uma empresa com a sigla: " + dto.getSigla());
        }

        // Validar CNPJ unico (se fornecido)
        if (dto.getCnpj() != null && !dto.getCnpj().trim().isEmpty()) {
            if (!existingCompany.getCnpj().equals(dto.getCnpj()) &&
                    companyRepository.existsByCnpj(dto.getCnpj())) {
                throw new BusinessException("Ja existe uma empresa com o CNPJ: " + dto.getCnpj());
            }
        }

        // Atualizar campos
        existingCompany.setName(dto.getName());
        existingCompany.setSigla(dto.getSigla());
        existingCompany.setDescription(dto.getDescription());
        existingCompany.setCnpj(dto.getCnpj());
        existingCompany.setAddress(dto.getAddress());
        existingCompany.setEnderecoRua(dto.getEnderecoRua());
        existingCompany.setEnderecoNumero(dto.getEnderecoNumero());
        existingCompany.setEnderecoComplemento(dto.getEnderecoComplemento());
        existingCompany.setEnderecoBairro(dto.getEnderecoBairro());
        existingCompany.setCity(dto.getCity());
        existingCompany.setState(dto.getState());
        existingCompany.setZipCode(dto.getZipCode());
        existingCompany.setPhone(dto.getPhone());
        existingCompany.setEmail(dto.getEmail());
        existingCompany.setWebsite(dto.getWebsite());
        existingCompany.setLogoUrl(dto.getLogoUrl());
        existingCompany.setStatus(dto.getStatus());

        existingCompany = companyRepository.save(existingCompany);

        // Atualizar EPIs padrao
        if (dto.getDefaultEpis() != null) {
            // Remover EPIs existentes
            companyDefaultEPIRepository.deleteByCompanyId(existingCompany.getId());

            // Adicionar novos EPIs
            for (int i = 0; i < dto.getDefaultEpis().size(); i++) {
                CompanyDefaultEPIDTO epiDto = dto.getDefaultEpis().get(i);
                CompanyDefaultEPI epi = epiDto.toEntity();
                epi.setCompany(existingCompany);
                epi.setOrderIndex(i);
                companyDefaultEPIRepository.save(epi);
            }
            log.info("EPIs padrao atualizados para empresa ID: {}", existingCompany.getId());
        }

        log.info("Empresa atualizada com sucesso - ID: {}", existingCompany.getId());

        // Recarregar empresa com EPIs
        existingCompany = companyRepository.findById(existingCompany.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Empresa nao encontrada"));

        return CompanyDTO.fromEntity(existingCompany);
    }

    /**
     * Excluir empresa
     */
    public void deleteCompany(UUID id) {
        log.info("Excluindo empresa ID: {}", id);

        if (!companyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Empresa nao encontrada com ID: " + id);
        }

        // Verificar se ha funcionarios associados
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa nao encontrada com ID: " + id));

        if (company.getEmployees() != null && !company.getEmployees().isEmpty()) {
            throw new BusinessException("Nao e possivel excluir a empresa pois ha funcionarios associados a ela");
        }

        companyRepository.deleteById(id);
        log.info("Empresa excluida com sucesso - ID: {}", id);
    }

    /**
     * Buscar empresas ativas
     */
    public List<CompanyDTO> getActiveCompanies() {
        log.info("Buscando empresas ativas");
        return companyRepository.findByStatusOrderByNameAsc(CompanyStatus.ACTIVE).stream()
                .map(CompanyDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * SECURITY: Buscar empresas acessiveis por um usuario (para selecao no login)
     * Retorna apenas empresas onde o usuario tem registro de employee
     */
    public List<com.z7design.fleet_manager.dto.CompanyBrandingDTO> getAccessibleCompaniesForUser(String username) {
        log.info("Buscando empresas acessiveis para usuario: {}", username);

        // Se username for "anonymous" ou vazio, retornar todas as empresas ativas
        if (username == null || username.isEmpty() || "anonymous".equals(username)) {
            log.info("Usuario anonimo - retornando todas as empresas ativas");
            List<Company> companies = companyRepository.findByStatusOrderByNameAsc(CompanyStatus.ACTIVE);
            return companies.stream()
                    .map(this::convertToCompanyBrandingDTO)
                    .collect(Collectors.toList());
        }

        // SECURITY: Buscar usuario
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (!userOpt.isPresent()) {
            log.warn("Usuario nao encontrado: {}", username);
            return Collections.emptyList();
        }

        User user = userOpt.get();

        // SECURITY: Buscar empresas via employee records
        List<Employee> employees = employeeRepository.findByUser(user);

        if (employees.isEmpty()) {
            log.warn("Usuario {} nao possui employee records", username);
            return Collections.emptyList();
        }

        // Extrair company IDs
        Set<UUID> companyIds = employees.stream()
                .map(Employee::getCompanyId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        if (companyIds.isEmpty()) {
            return Collections.emptyList();
        }

        // Buscar apenas empresas ativas
        List<Company> companies = companyRepository.findByIdInAndStatus(companyIds, CompanyStatus.ACTIVE);

        log.info("Encontradas {} empresas para usuario {}", companies.size(), username);

        return companies.stream()
                .map(this::convertToCompanyBrandingDTO)
                .collect(Collectors.toList());
    }

    /**
     * Buscar informacoes de branding de uma empresa especifica
     */
    public com.z7design.fleet_manager.dto.CompanyBrandingDTO getCompanyBranding(UUID companyId) {
        log.info("Buscando branding da empresa ID: {}", companyId);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa nao encontrada com ID: " + companyId));

        return convertToCompanyBrandingDTO(company);
    }

    /**
     * Converter Company para CompanyBrandingDTO
     */
    private com.z7design.fleet_manager.dto.CompanyBrandingDTO convertToCompanyBrandingDTO(Company company) {
        // Definir funcionalidades habilitadas (por enquanto, todas habilitadas)
        List<String> enabledFeatures = List.of(
                "dashboard",
                "operacional",
                "manutencao",
                "financeiro",
                "rotas",
                "relatorios");

        return com.z7design.fleet_manager.dto.CompanyBrandingDTO.builder()
                .id(company.getId())
                .nome(company.getName())
                .sigla(company.getSigla())
                .logoUrl(company.getLogoUrl())
                .theme(company.getTemaCor() != null ? company.getTemaCor() : "dark")
                .enabledFeatures(enabledFeatures)
                .build();
    }
}
