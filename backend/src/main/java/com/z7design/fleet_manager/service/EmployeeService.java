package com.z7design.fleet_manager.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Arrays;
import java.util.Map;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.EmploymentStatus;
import com.z7design.fleet_manager.model.enums.UserStatus;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.PositionRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.dto.EmployeeDTO;
import com.z7design.fleet_manager.dto.SimpleEmployeeDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {
    
    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PositionRepository positionRepository;
    @Autowired
    private UnitRepository unitRepository;
    @Autowired
    private com.z7design.fleet_manager.repository.CompanyRepository companyRepository;
    @Autowired
    private com.z7design.fleet_manager.repository.DoctorRepository doctorRepository;
    @Autowired
    private com.z7design.fleet_manager.repository.WorkPostRepository workPostRepository;
    @Autowired
    private com.z7design.fleet_manager.repository.DepartmentRepository departmentRepository;
    
    @Transactional
    @CacheEvict(value = {"employees", "employees-by-company", "dashboard-summary"}, allEntries = true)
    public EmployeeDTO create(EmployeeDTO dto) {
        try {
            System.out.println("[DEBUG] EmployeeService.create - Iniciando criaÃ§Ã£o de funcionÃ¡rio");
            System.out.println("[DEBUG] DTO recebido: " + dto.getName() + " - " + dto.getCpf());
            
            if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty() && employeeRepository.existsByEmail(dto.getEmail())) {
                throw new RuntimeException("Email jÃ¡ cadastrado");
            }
            
            if (dto.getCpf() != null && employeeRepository.existsByDocument(dto.getCpf())) {
                throw new RuntimeException("CPF jÃ¡ cadastrado para outro funcionÃ¡rio");
            }
            
            System.out.println("[DEBUG] ValidaÃ§Ãµes passaram, convertendo DTO para Entity");
            Employee employee = toEntity(dto);
            applyTerminationRules(employee, dto);
            System.out.println("[DEBUG] Entity criada, salvando no banco");
            Employee saved = employeeRepository.save(employee);
            System.out.println("[DEBUG] FuncionÃ¡rio salvo com ID: " + saved.getId());
            return toDTO(saved);
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao criar funcionÃ¡rio: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao criar funcionÃ¡rio: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    @CacheEvict(value = {"employees", "employees-by-company", "dashboard-summary"}, allEntries = true)
    public EmployeeDTO update(UUID id, EmployeeDTO dto) {
        try {
            System.out.println("[DEBUG] EmployeeService.update - Iniciando atualizaÃ§Ã£o do funcionÃ¡rio ID: " + id);
            System.out.println("[DEBUG] DTO recebido - Nome: " + dto.getName() + ", Email: " + dto.getEmail());
            
            Employee existingEmployee = findById(id);
            System.out.println("[DEBUG] FuncionÃ¡rio existente encontrado: " + existingEmployee.getName());
            System.out.println("[DEBUG] Email existente: " + existingEmployee.getEmail());
            
            // Validar email Ãºnico (exceto para o prÃ³prio funcionÃ¡rio)
            if (dto.getEmail() != null && existingEmployee.getEmail() != null && 
                !existingEmployee.getEmail().equals(dto.getEmail()) && 
                employeeRepository.existsByEmail(dto.getEmail())) {
                throw new RuntimeException("Email jÃ¡ cadastrado");
            }
            
            // Validar CPF Ãºnico (exceto para o prÃ³prio funcionÃ¡rio)
            if (dto.getCpf() != null && !dto.getCpf().equals(existingEmployee.getDocument())) {
                if (employeeRepository.existsByDocument(dto.getCpf())) {
                    throw new RuntimeException("CPF jÃ¡ cadastrado para outro funcionÃ¡rio");
                }
            }
            
            System.out.println("[DEBUG] Atualizando campos do funcionÃ¡rio existente...");
            
            // Atualizar apenas os campos fornecidos, preservando campos de auditoria
            if (dto.getName() != null) {
                existingEmployee.setName(dto.getName());
            }
            if (dto.getCpf() != null) {
                existingEmployee.setDocument(dto.getCpf());
            }
            if (dto.getBirthDate() != null) {
                existingEmployee.setBirthDate(dto.getBirthDate());
            }
            if (dto.getRegistrationNumber() != null) {
                existingEmployee.setRegistrationNumber(dto.getRegistrationNumber());
            }
            if (dto.getHireDate() != null) {
                existingEmployee.setHireDate(dto.getHireDate());
            }
            if (dto.getTerminationDate() != null) {
                existingEmployee.setTerminationDate(dto.getTerminationDate());
            }
            if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
                try {
                    EmploymentStatus status = EmploymentStatus.valueOf(dto.getStatus().toUpperCase());
                    existingEmployee.setStatus(status);
                    System.out.println("[DEBUG] Status atualizado: " + status);
                } catch (IllegalArgumentException ex) {
                    System.err.println("[ERROR] Status invÃ¡lido: " + dto.getStatus());
                    throw new RuntimeException("Status invÃ¡lido: " + dto.getStatus() + ". Status vÃ¡lidos: " + 
                        Arrays.toString(EmploymentStatus.values()));
                }
            }
            if (dto.getNotes() != null) {
                existingEmployee.setNotes(dto.getNotes());
            }
            // Atualizar campo address (compatibilidade) e campos separados
            if (dto.getAddress() != null && dto.getAddress().getStreet() != null && !dto.getAddress().getStreet().isEmpty()) {
                existingEmployee.setAddress(dto.getAddress().getStreet());
                System.out.println("[DEBUG] Address atualizado: " + existingEmployee.getAddress());
            }
            
            // Se os campos separados vierem no objeto address, usar eles tambÃ©m
            if (dto.getAddress() != null) {
                if (dto.getAddress().getStreet() != null) {
                    existingEmployee.setEnderecoRua(dto.getAddress().getStreet());
                }
                if (dto.getAddress().getNumber() != null) {
                    existingEmployee.setEnderecoNumero(dto.getAddress().getNumber());
                }
                if (dto.getAddress().getComplement() != null) {
                    existingEmployee.setEnderecoComplemento(dto.getAddress().getComplement());
                }
                if (dto.getAddress().getNeighborhood() != null) {
                    existingEmployee.setEnderecoBairro(dto.getAddress().getNeighborhood());
                }
                if (dto.getAddress().getCity() != null) {
                    existingEmployee.setEnderecoCidade(dto.getAddress().getCity());
                }
                if (dto.getAddress().getState() != null) {
                    existingEmployee.setEnderecoEstado(dto.getAddress().getState());
                }
                if (dto.getAddress().getZipCode() != null) {
                    existingEmployee.setEnderecoCep(dto.getAddress().getZipCode());
                }
            }
            if (dto.getPhone() != null) {
                existingEmployee.setPhone(dto.getPhone());
            }
            if (dto.getEmail() != null) {
                existingEmployee.setEmail(dto.getEmail());
            }
            
            // Atualizar telefone de contato
            if (dto.getTelefoneContato() != null) {
                existingEmployee.setTelefoneContato(dto.getTelefoneContato());
            }
            
            // Atualizar campos de endereÃ§o separados
            if (dto.getEnderecoRua() != null) {
                existingEmployee.setEnderecoRua(dto.getEnderecoRua());
            }
            if (dto.getEnderecoNumero() != null) {
                existingEmployee.setEnderecoNumero(dto.getEnderecoNumero());
            }
            if (dto.getEnderecoComplemento() != null) {
                existingEmployee.setEnderecoComplemento(dto.getEnderecoComplemento());
            }
            if (dto.getEnderecoBairro() != null) {
                existingEmployee.setEnderecoBairro(dto.getEnderecoBairro());
            }
            if (dto.getEnderecoCidade() != null) {
                existingEmployee.setEnderecoCidade(dto.getEnderecoCidade());
            }
            if (dto.getEnderecoEstado() != null) {
                existingEmployee.setEnderecoEstado(dto.getEnderecoEstado());
            }
            if (dto.getEnderecoCep() != null) {
                existingEmployee.setEnderecoCep(dto.getEnderecoCep());
            }
            
            // Atualizar campos CIN
            if (dto.getCinNumero() != null) {
                existingEmployee.setCinNumero(dto.getCinNumero());
            }
            if (dto.getCinOrgaoEmissor() != null) {
                existingEmployee.setCinOrgaoEmissor(dto.getCinOrgaoEmissor());
            }
            if (dto.getCinDataEmissao() != null) {
                existingEmployee.setCinDataEmissao(dto.getCinDataEmissao());
            }
            
            // Atualizar CTPS Digital PDF (apenas se fornecido)
            if (dto.getCtpsDigitalPdf() != null) {
                existingEmployee.setCtpsDigitalPdf(dto.getCtpsDigitalPdf());
            }
            if (dto.getCtpsDigitalPdfNome() != null) {
                existingEmployee.setCtpsDigitalPdfNome(dto.getCtpsDigitalPdfNome());
            }
            if (dto.getCtpsDigitalPdfTamanho() != null) {
                existingEmployee.setCtpsDigitalPdfTamanho(dto.getCtpsDigitalPdfTamanho());
            }
            
            // Atualizar dados bancÃ¡rios se fornecidos
            if (dto.getBankInfo() != null) {
                if (dto.getBankInfo().getBank() != null) {
                    existingEmployee.setBanco(dto.getBankInfo().getBank());
                }
                if (dto.getBankInfo().getAgency() != null) {
                    existingEmployee.setAgencia(dto.getBankInfo().getAgency());
                }
                if (dto.getBankInfo().getAccount() != null) {
                    existingEmployee.setContaCorrente(dto.getBankInfo().getAccount());
                }
            }
            
            // Atualizar entidades relacionais se fornecidas
            if (dto.getUser() != null && dto.getUser().getId() != null) {
                existingEmployee.setUser(userRepository.findById(dto.getUser().getId())
                    .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado para o id informado.")));
            }
            if (dto.getPosition() != null && dto.getPosition().getId() != null) {
                existingEmployee.setPosition(positionRepository.findById(dto.getPosition().getId())
                    .orElseThrow(() -> new RuntimeException("Cargo nÃ£o encontrado para o id informado.")));
            }
            if (dto.getUnit() != null && dto.getUnit().getId() != null) {
                existingEmployee.setUnit(unitRepository.findById(dto.getUnit().getId()).orElse(null));
            }
            if (dto.getCompany() != null && dto.getCompany().getId() != null) {
                existingEmployee.setCompany(companyRepository.findById(dto.getCompany().getId()).orElse(null));
            }
            
            // Atualizar WorkPost se fornecido
            if (dto.getWorkPostId() != null && !dto.getWorkPostId().trim().isEmpty()) {
                try {
                    UUID workPostId = UUID.fromString(dto.getWorkPostId());
                    existingEmployee.setWorkPost(workPostRepository.findById(workPostId).orElse(null));
                } catch (IllegalArgumentException e) {
                    System.err.println("[WARNING] WorkPostId invÃ¡lido: " + dto.getWorkPostId());
                }
            } else {
                existingEmployee.setWorkPost(null);
            }
            
            // Atualizar Department se fornecido
            if (dto.getDepartmentId() != null && !dto.getDepartmentId().trim().isEmpty()) {
                try {
                    UUID departmentId = UUID.fromString(dto.getDepartmentId());
                    existingEmployee.setDepartment(departmentRepository.findById(departmentId).orElse(null));
                } catch (IllegalArgumentException e) {
                    System.err.println("[WARNING] DepartmentId invÃ¡lido: " + dto.getDepartmentId());
                }
            } else {
                existingEmployee.setDepartment(null);
            }
            
            // Atualizar dados do exame mÃ©dico (ASO)
            if (dto.getExameMedicoData() != null) {
                existingEmployee.setExameMedicoData(dto.getExameMedicoData());
            }
            // Recalcular proximo exame (validade de 1 ano)
            if (dto.getNextExameMedico() != null) {
                existingEmployee.setNextExameMedico(dto.getNextExameMedico());
            } else if (dto.getExameMedicoData() != null) {
                existingEmployee.setNextExameMedico(dto.getExameMedicoData().plusYears(1));
            }
            if (dto.getLaudoPsicologicoData() != null) {
                existingEmployee.setLaudoPsicologicoData(dto.getLaudoPsicologicoData());
                existingEmployee.setNextLaudoPsicologico(dto.getNextLaudoPsicologico() != null
                        ? dto.getNextLaudoPsicologico()
                        : dto.getLaudoPsicologicoData().plusYears(1));
            }
            if (dto.getExameMedicoTipo() != null) {
                existingEmployee.setExameMedicoTipo(dto.getExameMedicoTipo());
            }
            if (dto.getExameMedicoDoctor() != null && dto.getExameMedicoDoctor().getId() != null) {
                existingEmployee.setExameMedicoDoctor(doctorRepository.findById(dto.getExameMedicoDoctor().getId()).orElse(null));
            } else if (dto.getExameMedicoDoctor() == null) {
                existingEmployee.setExameMedicoDoctor(null);
            }
            if (dto.getExameMedicoHorario() != null) {
                existingEmployee.setExameMedicoHorario(dto.getExameMedicoHorario());
            }
            if (dto.getExameMedicoIntervalosRefeicao() != null) {
                existingEmployee.setExameMedicoIntervalosRefeicao(dto.getExameMedicoIntervalosRefeicao());
            }
            if (dto.getExameMedicoObservacoes() != null) {
                existingEmployee.setExameMedicoObservacoes(dto.getExameMedicoObservacoes());
            }
            if (dto.getExameMedicoPrimeiroEmprego() != null) {
                existingEmployee.setExameMedicoPrimeiroEmprego(dto.getExameMedicoPrimeiroEmprego());
            }
            if (dto.getExameMedicoContribuicaoSindicalPaga() != null) {
                existingEmployee.setExameMedicoContribuicaoSindicalPaga(dto.getExameMedicoContribuicaoSindicalPaga());
            }
            
            // Atualizar campos para Estrangeiro
            if (dto.getRneNumero() != null) {
                existingEmployee.setRneNumero(dto.getRneNumero());
            }
            if (dto.getRneValidade() != null) {
                existingEmployee.setRneValidade(dto.getRneValidade());
            }
            if (dto.getRicNumero() != null) {
                existingEmployee.setRicNumero(dto.getRicNumero());
            }
            if (dto.getRicOrgaoEmissor() != null) {
                existingEmployee.setRicOrgaoEmissor(dto.getRicOrgaoEmissor());
            }
            if (dto.getRicDataEmissao() != null) {
                existingEmployee.setRicDataEmissao(dto.getRicDataEmissao());
            }
            if (dto.getTipoVisto() != null) {
                existingEmployee.setTipoVisto(dto.getTipoVisto());
            }
            
            // Atualizar campos de admissÃ£o
            if (dto.getPis() != null) {
                existingEmployee.setPis(dto.getPis());
            }
            if (dto.getTituloEleitor() != null) {
                existingEmployee.setTituloEleitor(dto.getTituloEleitor());
            }
            if (dto.getTituloEleitorZona() != null) {
                existingEmployee.setTituloEleitorZona(dto.getTituloEleitorZona());
            }
            if (dto.getTituloEleitorSecao() != null) {
                existingEmployee.setTituloEleitorSecao(dto.getTituloEleitorSecao());
            }
            if (dto.getTituloEleitorDataExpedicao() != null) {
                existingEmployee.setTituloEleitorDataExpedicao(dto.getTituloEleitorDataExpedicao());
            }
            if (dto.getTituloEleitorValidade() != null) {
                existingEmployee.setTituloEleitorValidade(dto.getTituloEleitorValidade());
            }
            if (dto.getNomeConselhoRegional() != null) {
                existingEmployee.setNomeConselhoRegional(dto.getNomeConselhoRegional());
            }
            if (dto.getCarteiraIdentidadeOrgaoEmissor() != null) {
                existingEmployee.setCarteiraIdentidadeOrgaoEmissor(dto.getCarteiraIdentidadeOrgaoEmissor());
            }
            if (dto.getCarteiraIdentidadeDataEmissao() != null) {
                existingEmployee.setCarteiraIdentidadeDataEmissao(dto.getCarteiraIdentidadeDataEmissao());
            }
            if (dto.getCertificadoMilitar() != null) {
                existingEmployee.setCertificadoMilitar(dto.getCertificadoMilitar());
            }
            if (dto.getSalario() != null) {
                existingEmployee.setSalario(dto.getSalario());
            }
            if (dto.getSalarioPorExtenso() != null) {
                existingEmployee.setSalarioPorExtenso(dto.getSalarioPorExtenso());
            }
            if (dto.getPeriodoPagamento() != null) {
                existingEmployee.setPeriodoPagamento(dto.getPeriodoPagamento());
            }
            if (dto.getHorarioTrabalho() != null) {
                existingEmployee.setHorarioTrabalho(dto.getHorarioTrabalho());
            }
            if (dto.getHorarioTrabalhoIntervalo() != null) {
                existingEmployee.setHorarioTrabalhoIntervalo(dto.getHorarioTrabalhoIntervalo());
            }
            if (dto.getDiasTrabalho() != null) {
                existingEmployee.setDiasTrabalho(dto.getDiasTrabalho());
            }
            if (dto.getPrazoExperienciaTexto() != null) {
                existingEmployee.setPrazoExperienciaTexto(dto.getPrazoExperienciaTexto());
            }
            if (dto.getProrrogacaoExperiencia() != null) {
                existingEmployee.setProrrogacaoExperiencia(dto.getProrrogacaoExperiencia());
            }
            if (dto.getFolgaSemanal() != null) {
                existingEmployee.setFolgaSemanal(dto.getFolgaSemanal());
            }
            if (dto.getEscalaTrabalho() != null) {
                existingEmployee.setEscalaTrabalho(dto.getEscalaTrabalho());
            }
            
            applyTerminationRules(existingEmployee, dto);

            // Atualizar timestamp
            existingEmployee.setUpdatedAt(LocalDateTime.now());
            
            System.out.println("[DEBUG] Salvando funcionÃ¡rio atualizado...");
            System.out.println("[DEBUG] Campos de endereÃ§o antes de salvar:");
            System.out.println("  - enderecoRua: " + existingEmployee.getEnderecoRua());
            System.out.println("  - enderecoNumero: " + existingEmployee.getEnderecoNumero());
            System.out.println("  - enderecoCidade: " + existingEmployee.getEnderecoCidade());
            System.out.println("  - enderecoEstado: " + existingEmployee.getEnderecoEstado());
            System.out.println("  - enderecoCep: " + existingEmployee.getEnderecoCep());
            
            Employee saved = employeeRepository.save(existingEmployee);
            System.out.println("[DEBUG] FuncionÃ¡rio salvo com sucesso: " + saved.getName());
            
            System.out.println("[DEBUG] Convertendo entidade para DTO...");
            EmployeeDTO result = toDTO(saved);
            System.out.println("[DEBUG] DTO retornado - Nome: " + result.getName());
            
            return result;
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao atualizar funcionÃ¡rio ID " + id + ": " + e.getMessage());
            System.err.println("[ERROR] Tipo da exceÃ§Ã£o: " + e.getClass().getName());
            e.printStackTrace();
            throw new RuntimeException("Erro ao atualizar funcionÃ¡rio: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    @CacheEvict(value = {"employees", "employees-by-company", "dashboard-summary"}, allEntries = true)
    public void delete(UUID id) {
        Employee employee = findById(id);
        if (employee.getStatus() != EmploymentStatus.TERMINATED) {
            throw new RuntimeException("Apenas funcionÃ¡rios demitidos podem ser excluÃ­dos");
        }
        employeeRepository.delete(employee);
    }

    private void applyTerminationRules(Employee employee, EmployeeDTO dto) {
        if (employee == null || dto == null) {
            return;
        }

        if (employee.getTerminationDate() == null && dto.getDataRescisao() != null) {
            employee.setTerminationDate(dto.getDataRescisao());
        }

        if (employee.getTerminationDate() == null) {
            return;
        }

        employee.setStatus(EmploymentStatus.INACTIVE);

        String cpf = dto.getCpf() != null ? dto.getCpf() : employee.getDocument();
        if (cpf == null || cpf.trim().isEmpty()) {
            return;
        }

        String normalizedCpf = cpf.replaceAll("[^0-9]", "");
        Optional<User> userOpt = userRepository.findByUsername(normalizedCpf);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(cpf);
        }

        userOpt.ifPresent(user -> {
            user.setStatus(UserStatus.INACTIVE);
            user.setActive(false);
            userRepository.save(user);
        });
    }
    
    @Transactional(readOnly = true)
    // Removido @Cacheable - entidade Employee tem relacionamentos circulares que causam problemas no Redis
    // O cache serÃ¡ aplicado apenas nos mÃ©todos que retornam DTOs
    public Employee findById(UUID id) {
        Employee employee = employeeRepository.findById(id)
            .orElseGet(() -> employeeRepository.findByUserId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id)));
        
        // ForÃ§ar inicializaÃ§Ã£o de relacionamentos LAZY para evitar LazyInitializationException
        try {
            if (employee.getUser() != null) {
                org.hibernate.Hibernate.initialize(employee.getUser());
            }
            if (employee.getPosition() != null) {
                org.hibernate.Hibernate.initialize(employee.getPosition());
            }
            if (employee.getUnit() != null) {
                // Inicializar Unit mas evitar inicializar a coleÃ§Ã£o employees (evita referÃªncia circular no cache Redis)
                org.hibernate.Hibernate.initialize(employee.getUnit());
                // NÃ£o inicializar a coleÃ§Ã£o employees do Unit para evitar referÃªncia circular
                // A coleÃ§Ã£o employees jÃ¡ estÃ¡ marcada com @JsonIgnoreProperties no model
            }
            if (employee.getCompany() != null) {
                org.hibernate.Hibernate.initialize(employee.getCompany());
            }
            if (employee.getWorkPost() != null) {
                org.hibernate.Hibernate.initialize(employee.getWorkPost());
            }
            if (employee.getDepartment() != null) {
                org.hibernate.Hibernate.initialize(employee.getDepartment());
            }
        } catch (Exception e) {
            System.err.println("[WARNING] Erro ao inicializar relacionamentos LAZY: " + e.getMessage());
            // Continuar mesmo se houver erro na inicializaÃ§Ã£o
        }
        
        return employee;
    }
    
    public Optional<Employee> findByEmail(String email) {
        return employeeRepository.findByEmail(email);
    }

    @Transactional(readOnly = true)
    public Employee findByUserId(UUID userId) {
        return employeeRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found for user id: " + userId));
    }
    
    public List<Employee> findByStatus(EmploymentStatus status) {
        try {
            System.out.println("[DEBUG] EmployeeService.findByStatus - Status recebido: " + status);
            List<Employee> employees = employeeRepository.findByStatus(status);
            System.out.println("[DEBUG] EmployeeService.findByStatus - FuncionÃ¡rios encontrados: " + employees.size());
            return employees;
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeService.findByStatus - Erro ao buscar funcionÃ¡rios: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public List<Employee> findByNameContaining(String name) {
        try {
            System.out.println("[DEBUG] EmployeeService.findByNameContaining - Nome recebido: " + name);
            List<Employee> employees = employeeRepository.findByNameContainingIgnoreCase(name);
            System.out.println("[DEBUG] EmployeeService.findByNameContaining - FuncionÃ¡rios encontrados: " + employees.size());
            return employees;
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeService.findByNameContaining - Erro ao buscar funcionÃ¡rios: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionÃ¡rios por nome: " + e.getMessage());
        }
    }
    
    public List<Employee> findByNameOrDocumentContaining(String searchTerm) {
        try {
            System.out.println("[DEBUG] EmployeeService.findByNameOrDocumentContaining - Termo recebido: " + searchTerm);
            List<Employee> employees = employeeRepository.findByNameContainingIgnoreCaseOrDocumentContainingIgnoreCase(searchTerm, searchTerm);
            System.out.println("[DEBUG] EmployeeService.findByNameOrDocumentContaining - FuncionÃ¡rios encontrados: " + employees.size());
            return employees;
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeService.findByNameOrDocumentContaining - Erro ao buscar funcionÃ¡rios: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionÃ¡rios por nome ou documento: " + e.getMessage());
        }
    }
    
    public List<SimpleEmployeeDTO> findSimpleEmployeesByNameOrDocument(String searchTerm) {
        try {
            System.out.println("[DEBUG] EmployeeService.findSimpleEmployeesByNameOrDocument - Termo recebido: " + searchTerm);
            List<Employee> employees = employeeRepository.findByNameContainingIgnoreCaseOrDocumentContainingIgnoreCase(searchTerm, searchTerm);
            System.out.println("[DEBUG] EmployeeService.findSimpleEmployeesByNameOrDocument - FuncionÃ¡rios encontrados: " + employees.size());
            
            return employees.stream()
                .map(emp -> SimpleEmployeeDTO.builder()
                    .id(emp.getId())
                    .name(emp.getName())
                    .document(emp.getDocument())
                    .email(emp.getEmail())
                    .phone(emp.getPhone())
                    .registrationNumber(emp.getRegistrationNumber())
                    .positionName(emp.getPosition() != null ? emp.getPosition().getName() : null)
                    .unitName(emp.getUnit() != null ? emp.getUnit().getName() : null)
                    .build())
                .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeService.findSimpleEmployeesByNameOrDocument - Erro ao buscar funcionÃ¡rios: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionÃ¡rios por nome ou documento: " + e.getMessage());
        }
    }
    
    public long count() {
        return employeeRepository.count();
    }
    
    public List<Employee> findByUnit(UUID unitId) {
        return employeeRepository.findByUnitId(unitId);
    }
    
    public List<Employee> findByPosition(UUID positionId) {
        return employeeRepository.findByPositionId(positionId);
    }
    
    @Transactional(readOnly = true)
    public List<Employee> findAll() {
        try {
            System.out.println("ðŸ” EmployeeService.findAll - Iniciando busca no banco...");
            
            // Primeiro, vamos tentar buscar apenas os IDs
            try {
                List<Employee> employees = employeeRepository.findAll();
                System.out.println("âœ… EmployeeService.findAll - Encontrados " + employees.size() + " funcionÃ¡rios no banco");
                
                // Log dos primeiros funcionÃ¡rios para debug
                if (!employees.isEmpty()) {
                    for (int i = 0; i < Math.min(3, employees.size()); i++) {
                        Employee emp = employees.get(i);
                        System.out.println("ðŸ“‹ FuncionÃ¡rio " + (i+1) + ": " + emp.getName() + " (ID: " + emp.getId() + ")");
                    }
                }
                
                return employees;
            } catch (Exception repoError) {
                System.err.println("âŒ EmployeeService.findAll - Erro no repository: " + repoError.getMessage());
                repoError.printStackTrace();
                throw repoError;
            }
            
        } catch (Exception e) {
            System.err.println("âŒ EmployeeService.findAll - Erro ao buscar funcionÃ¡rios: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao buscar funcionÃ¡rios: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<UUID> findAllIds() {
        try {
            System.out.println("ðŸ” EmployeeService.findAllIds - Buscando apenas IDs");
            List<UUID> ids = employeeRepository.findAllIds();
            System.out.println("âœ… EmployeeService.findAllIds - Encontrados " + ids.size() + " IDs");
            return ids;
        } catch (Exception e) {
            System.err.println("âŒ EmployeeService.findAllIds - Erro: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao buscar IDs: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<Object[]> findBasicData() {
        try {
            System.out.println("ðŸ” EmployeeService.findBasicData - Buscando dados bÃ¡sicos");
            List<Object[]> data = employeeRepository.findBasicData();
            System.out.println("âœ… EmployeeService.findBasicData - Encontrados " + data.size() + " registros");
            return data;
        } catch (Exception e) {
            System.err.println("âŒ EmployeeService.findBasicData - Erro: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao buscar dados bÃ¡sicos: " + e.getMessage(), e);
        }
    }

    public List<Object[]> findBasicDataBySearchTerm(String searchTerm) {
        try {
            System.out.println("ðŸ” EmployeeService.findBasicDataBySearchTerm - Buscando por termo: " + searchTerm);
            List<Object[]> data = employeeRepository.findBasicDataBySearchTerm(searchTerm);
            System.out.println("âœ… EmployeeService.findBasicDataBySearchTerm - Encontrados " + data.size() + " registros");
            return data;
        } catch (Exception e) {
            System.err.println("âŒ EmployeeService.findBasicDataBySearchTerm - Erro: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao buscar dados bÃ¡sicos por termo: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public List<EmployeeDTO> getAllAsDTOs() {
        try {
            log.info("Buscando todos os funcionÃ¡rios como DTOs...");
            List<Employee> employees = employeeRepository.findAll();
            log.info("Encontrados {} funcionÃ¡rios", employees.size());
            
            if (employees.isEmpty()) {
                log.warn("Nenhum funcionÃ¡rio encontrado no banco de dados");
                return java.util.Collections.emptyList();
            }
            
            log.info("Retornando lista vazia temporariamente para debug");
            return java.util.Collections.emptyList();
        } catch (Exception e) {
            log.error("Erro ao buscar funcionÃ¡rios como DTOs: {}", e.getMessage(), e);
            log.warn("Retornando lista vazia devido ao erro");
            return java.util.Collections.emptyList();
        }
    }
    
    @Transactional
    public Employee updateStatus(UUID id, EmploymentStatus status) {
        Employee employee = findById(id);
        employee.setStatus(status);
        return employeeRepository.save(employee);
    }

    @Transactional
    @CacheEvict(value = {"employees", "employees-by-company", "dashboard-summary"}, allEntries = true)
    public void deleteById(UUID id) {
        employeeRepository.deleteById(id);
    }

    // MÃ©todos utilitÃ¡rios de mapeamento
    private Employee toEntity(EmployeeDTO dto) {
        try {
            System.out.println("[DEBUG] Iniciando conversÃ£o DTO -> Entity");
            System.out.println("[DEBUG] DTO status: " + dto.getStatus());
            System.out.println("[DEBUG] DTO user: " + (dto.getUser() != null ? dto.getUser().getId() : "null"));
            System.out.println("[DEBUG] DTO position: " + (dto.getPosition() != null ? dto.getPosition().getId() : "null"));
            
            Employee e = new Employee();
            if (dto.getId() != null) {
                e.setId(dto.getId());
            }
            e.setName(dto.getName());
            e.setDocument(dto.getCpf());
            // e.setCarteiraIdentidade(dto.getCarteiraIdentidade());
            // e.setTituloEleitor(dto.getTituloEleitor());
            // e.setGrauInstrucao(dto.getGrauInstrucao());
            // e.setPai(dto.getPai());
            // e.setMae(dto.getMae());
            // e.setNaturalidade(dto.getNaturalidade());
            // e.setCep(dto.getCep());
            // e.setCtps(dto.getCep());
            // e.setCbo(dto.getCbo());
            // e.setPis(dto.getPis());
            // e.setSalario(dto.getSalario());
            // e.setFgtsOptante(dto.getFgtsOptante());
            // e.setFgtsDataOpcao(dto.getFgtsDataOpcao());
            // e.setFgtsBancoDepositario(dto.getFgtsBancoDepositario());
            // e.setEmpresaNome(dto.getEmpresaNome());
            // e.setEmpresaEndereco(dto.getEmpresaEndereco());
            // e.setEmpresaCnpj(dto.getEmpresaCnpj());
            e.setBirthDate(dto.getBirthDate());
            e.setMaritalStatus(dto.getMaritalStatus());
            e.setNationality(dto.getNationality());
            // e.setPhotoUrl(dto.getPhotoUrl());
            // e.setCurrentScale(dto.getCurrentScale());
            e.setRegistrationNumber(dto.getRegistrationNumber());
            e.setHireDate(dto.getHireDate());
            e.setTerminationDate(dto.getTerminationDate());
            
            // Validar e converter status
            if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
                try {
                    EmploymentStatus status = EmploymentStatus.valueOf(dto.getStatus().toUpperCase());
                    e.setStatus(status);
                    System.out.println("[DEBUG] Status convertido com sucesso: " + status);
                } catch (IllegalArgumentException ex) {
                    System.err.println("[ERROR] Status invÃ¡lido: " + dto.getStatus());
                    throw new RuntimeException("Status invÃ¡lido: " + dto.getStatus() + ". Status vÃ¡lidos: " + 
                        Arrays.toString(EmploymentStatus.values()));
                }
            } else {
                System.out.println("[DEBUG] Status nÃ£o fornecido, mantendo status atual");
            }
            
            // e.setPossuiWhatsapp(dto.getPossuiWhatsapp());
            // e.setCaminhoPdf(dto.getCaminhoPdf());
            // e.setMesReferencia(dto.getMesReferencia());
            // e.setAnoReferencia(dto.getAnoReferencia());
            e.setNotes(dto.getNotes());
            
            // Processar endereÃ§o - usar campos separados se disponÃ­veis, senÃ£o usar campo address antigo
            if (dto.getAddress() != null) {
                if (dto.getAddress().getStreet() != null && !dto.getAddress().getStreet().isEmpty()) {
                    e.setAddress(dto.getAddress().getStreet());
                    // TambÃ©m preencher campos separados se vierem no objeto address
                    if (dto.getEnderecoRua() == null) {
                        e.setEnderecoRua(dto.getAddress().getStreet());
                    }
                }
                if (dto.getAddress().getNumber() != null && dto.getEnderecoNumero() == null) {
                    e.setEnderecoNumero(dto.getAddress().getNumber());
                }
                if (dto.getAddress().getComplement() != null && dto.getEnderecoComplemento() == null) {
                    e.setEnderecoComplemento(dto.getAddress().getComplement());
                }
                if (dto.getAddress().getNeighborhood() != null && dto.getEnderecoBairro() == null) {
                    e.setEnderecoBairro(dto.getAddress().getNeighborhood());
                }
                if (dto.getAddress().getCity() != null && dto.getEnderecoCidade() == null) {
                    e.setEnderecoCidade(dto.getAddress().getCity());
                }
                if (dto.getAddress().getState() != null && dto.getEnderecoEstado() == null) {
                    e.setEnderecoEstado(dto.getAddress().getState());
                }
                if (dto.getAddress().getZipCode() != null && dto.getEnderecoCep() == null) {
                    e.setEnderecoCep(dto.getAddress().getZipCode());
                }
            } else {
                e.setAddress(""); // Definir como string vazia se nÃ£o fornecido
            }
            System.out.println("[DEBUG] Address salvo: " + e.getAddress());
            
            e.setPhone(dto.getPhone());
            e.setEmail(dto.getEmail());
            
            // Mapear telefone de contato
            if (dto.getTelefoneContato() != null) {
                e.setTelefoneContato(dto.getTelefoneContato());
            }
            
            // Mapear campos de endereÃ§o separados
            if (dto.getEnderecoRua() != null) {
                e.setEnderecoRua(dto.getEnderecoRua());
            }
            if (dto.getEnderecoNumero() != null) {
                e.setEnderecoNumero(dto.getEnderecoNumero());
            }
            if (dto.getEnderecoComplemento() != null) {
                e.setEnderecoComplemento(dto.getEnderecoComplemento());
            }
            if (dto.getEnderecoBairro() != null) {
                e.setEnderecoBairro(dto.getEnderecoBairro());
            }
            if (dto.getEnderecoCidade() != null) {
                e.setEnderecoCidade(dto.getEnderecoCidade());
            }
            if (dto.getEnderecoEstado() != null) {
                e.setEnderecoEstado(dto.getEnderecoEstado());
            }
            if (dto.getEnderecoCep() != null) {
                e.setEnderecoCep(dto.getEnderecoCep());
            }
            
            // Mapear campos CIN
            if (dto.getCinNumero() != null) {
                e.setCinNumero(dto.getCinNumero());
            }
            if (dto.getCinOrgaoEmissor() != null) {
                e.setCinOrgaoEmissor(dto.getCinOrgaoEmissor());
            }
            if (dto.getCinDataEmissao() != null) {
                e.setCinDataEmissao(dto.getCinDataEmissao());
            }
            
            // Mapear CTPS Digital PDF (apenas se fornecido)
            if (dto.getCtpsDigitalPdf() != null) {
                e.setCtpsDigitalPdf(dto.getCtpsDigitalPdf());
            }
            if (dto.getCtpsDigitalPdfNome() != null) {
                e.setCtpsDigitalPdfNome(dto.getCtpsDigitalPdfNome());
            }
            if (dto.getCtpsDigitalPdfTamanho() != null) {
                e.setCtpsDigitalPdfTamanho(dto.getCtpsDigitalPdfTamanho());
            }
            
            // Mapear dados do cÃ´njuge
            e.setSpouseName(dto.getSpouseName());
            e.setSpouseCpf(dto.getSpouseCpf());
            e.setSpouseRg(dto.getSpouseRg());
            e.setSpouseBirthDate(dto.getSpouseBirthDate());
            e.setSpousePhone(dto.getSpousePhone());
            e.setSpouseEmail(dto.getSpouseEmail());
            
            // Mapear campos da ficha de registro
            e.setEmpresaNome(dto.getEmpresaNome());
            e.setEmpresaEndereco(dto.getEmpresaEndereco());
            e.setEmpresaCnpj(dto.getEmpresaCnpj());
            e.setTituloEleitor(dto.getTituloEleitor());
            e.setTituloEleitorZona(dto.getTituloEleitorZona());
            e.setTituloEleitorSecao(dto.getTituloEleitorSecao());
            if (dto.getTituloEleitorDataExpedicao() != null) {
                e.setTituloEleitorDataExpedicao(dto.getTituloEleitorDataExpedicao());
            }
            if (dto.getTituloEleitorValidade() != null) {
                e.setTituloEleitorValidade(dto.getTituloEleitorValidade());
            }
            e.setNomeConselhoRegional(dto.getNomeConselhoRegional());
            e.setCarteiraIdentidadeOrgaoEmissor(dto.getCarteiraIdentidadeOrgaoEmissor());
            e.setCarteiraIdentidadeDataEmissao(dto.getCarteiraIdentidadeDataEmissao());
            e.setCertificadoMilitar(dto.getCertificadoMilitar());
            e.setNomePai(dto.getNomePai());
            e.setNomeMae(dto.getNomeMae());
            e.setLocalNascimento(dto.getLocalNascimento());
            e.setMunicipioNascimento(dto.getMunicipioNascimento());
            e.setEstadoNascimento(dto.getEstadoNascimento());
            e.setSexo(dto.getSexo());
            e.setGrauInstrucao(dto.getGrauInstrucao());
            e.setMatriculaEsocial(dto.getMatriculaEsocial());
            e.setCbo(dto.getCbo());
            e.setPis(dto.getPis());
            e.setSalario(dto.getSalario());
            e.setSalarioPorExtenso(dto.getSalarioPorExtenso());
            e.setPeriodoPagamento(dto.getPeriodoPagamento());
            e.setHorarioTrabalho(dto.getHorarioTrabalho());
            if (dto.getHorarioTrabalhoIntervalo() != null) {
                e.setHorarioTrabalhoIntervalo(dto.getHorarioTrabalhoIntervalo());
            }
            if (dto.getDiasTrabalho() != null) {
                e.setDiasTrabalho(dto.getDiasTrabalho());
            }
            if (dto.getPrazoExperienciaTexto() != null) {
                e.setPrazoExperienciaTexto(dto.getPrazoExperienciaTexto());
            }
            if (dto.getProrrogacaoExperiencia() != null) {
                e.setProrrogacaoExperiencia(dto.getProrrogacaoExperiencia());
            }
            e.setFolgaSemanal(dto.getFolgaSemanal());
            if (dto.getEscalaTrabalho() != null) {
                e.setEscalaTrabalho(dto.getEscalaTrabalho());
            }
            e.setFgtsOptante(dto.getFgtsOptante());
            e.setFgtsDataOpcao(dto.getFgtsDataOpcao());
            e.setFgtsBancoDepositario(dto.getFgtsBancoDepositario());
            e.setFgtsDataRetratacao(dto.getFgtsDataRetratacao());
            e.setPisDataCadastro(dto.getPisDataCadastro());
            e.setPisBancoDepositario(dto.getPisBancoDepositario());
            e.setPisEnderecoBanco(dto.getPisEnderecoBanco());
            e.setPisCodigoBanco(dto.getPisCodigoBanco());
            e.setPisCodigoAgencia(dto.getPisCodigoAgencia());
            // e.setCnhNumber(dto.getCnhNumber()); // Campo jÃ¡ existe no modelo
            e.setCnhExpirationDate(dto.getCnhExpirationDate());
            e.setCnhCategory(dto.getCnhCategory());
            e.setCtps(dto.getCtps());
            e.setCtpsRural(dto.getCtpsRural());
            e.setCtpsSeries(dto.getCtpsSeries());
            e.setCtpsIssueDate(dto.getCtpsIssueDate());
            e.setCtpsIssuingAgency(dto.getCtpsIssuingAgency());
            e.setCarteiraModelo19(dto.getCarteiraModelo19());
            e.setRegistroGeralEstrangeiro(dto.getRegistroGeralEstrangeiro());
            e.setCasadoBrasileiro(dto.getCasadoBrasileiro());
            e.setNomeConjugeEstrangeiro(dto.getNomeConjugeEstrangeiro());
            e.setTemFilhosBrasileiros(dto.getTemFilhosBrasileiros());
            e.setQuantidadeFilhosBrasileiros(dto.getQuantidadeFilhosBrasileiros());
            e.setDataChegadaBrasil(dto.getDataChegadaBrasil());
            e.setNaturalizado(dto.getNaturalizado());
            e.setDecretoNaturalizacao(dto.getDecretoNaturalizacao());
            e.setVistoFiscalizacao(dto.getVistoFiscalizacao());
            
            // Campos para Estrangeiro
            if (dto.getRneNumero() != null) {
                e.setRneNumero(dto.getRneNumero());
            }
            if (dto.getRneValidade() != null) {
                e.setRneValidade(dto.getRneValidade());
            }
            if (dto.getRicNumero() != null) {
                e.setRicNumero(dto.getRicNumero());
            }
            if (dto.getRicOrgaoEmissor() != null) {
                e.setRicOrgaoEmissor(dto.getRicOrgaoEmissor());
            }
            if (dto.getRicDataEmissao() != null) {
                e.setRicDataEmissao(dto.getRicDataEmissao());
            }
            if (dto.getTipoVisto() != null) {
                e.setTipoVisto(dto.getTipoVisto());
            }
            e.setAssinaturaFuncionario(dto.getAssinaturaFuncionario());
            e.setDataRescisao(dto.getDataRescisao());
            
            // Setar entidades relacionais (agora opcionais)
            if (dto.getUser() != null && dto.getUser().getId() != null) {
                e.setUser(userRepository.findById(dto.getUser().getId())
                    .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado para o id informado.")));
            }
                
            if (dto.getPosition() != null && dto.getPosition().getId() != null) {
                e.setPosition(positionRepository.findById(dto.getPosition().getId())
                    .orElseThrow(() -> new RuntimeException("Cargo nÃ£o encontrado para o id informado.")));
            }
                
            if (dto.getUnit() != null && dto.getUnit().getId() != null) {
                e.setUnit(unitRepository.findById(dto.getUnit().getId()).orElse(null));
            }
            
            if (dto.getCompany() != null && dto.getCompany().getId() != null) {
                e.setCompany(companyRepository.findById(dto.getCompany().getId()).orElse(null));
            }
            
            // Mapear WorkPost se fornecido
            if (dto.getWorkPostId() != null && !dto.getWorkPostId().trim().isEmpty()) {
                try {
                    UUID workPostId = UUID.fromString(dto.getWorkPostId());
                    e.setWorkPost(workPostRepository.findById(workPostId).orElse(null));
                } catch (IllegalArgumentException ex) {
                    System.err.println("[WARNING] WorkPostId invÃ¡lido: " + dto.getWorkPostId());
                }
            }
            
            // Mapear Department se fornecido
            if (dto.getDepartmentId() != null && !dto.getDepartmentId().trim().isEmpty()) {
                try {
                    UUID departmentId = UUID.fromString(dto.getDepartmentId());
                    e.setDepartment(departmentRepository.findById(departmentId).orElse(null));
                } catch (IllegalArgumentException ex) {
                    System.err.println("[WARNING] DepartmentId invÃ¡lido: " + dto.getDepartmentId());
                }
            }
            
            // Mapear dados do exame mÃ©dico (ASO)
            if (dto.getExameMedicoData() != null) {
                e.setExameMedicoData(dto.getExameMedicoData());
            }
            // Recalcular proximo exame (validade de 1 ano)
            if (dto.getNextExameMedico() != null) {
                e.setNextExameMedico(dto.getNextExameMedico());
            } else if (dto.getExameMedicoData() != null) {
                e.setNextExameMedico(dto.getExameMedicoData().plusYears(1));
            }
            if (dto.getLaudoPsicologicoData() != null) {
                e.setLaudoPsicologicoData(dto.getLaudoPsicologicoData());
                e.setNextLaudoPsicologico(dto.getNextLaudoPsicologico() != null
                        ? dto.getNextLaudoPsicologico()
                        : dto.getLaudoPsicologicoData().plusYears(1));
            }
            if (dto.getExameMedicoTipo() != null) {
                e.setExameMedicoTipo(dto.getExameMedicoTipo());
            }
            if (dto.getExameMedicoDoctor() != null && dto.getExameMedicoDoctor().getId() != null) {
                e.setExameMedicoDoctor(doctorRepository.findById(dto.getExameMedicoDoctor().getId()).orElse(null));
            }
            if (dto.getExameMedicoHorario() != null) {
                e.setExameMedicoHorario(dto.getExameMedicoHorario());
            }
            if (dto.getExameMedicoIntervalosRefeicao() != null) {
                e.setExameMedicoIntervalosRefeicao(dto.getExameMedicoIntervalosRefeicao());
            }
            if (dto.getExameMedicoObservacoes() != null) {
                e.setExameMedicoObservacoes(dto.getExameMedicoObservacoes());
            }
            if (dto.getExameMedicoPrimeiroEmprego() != null) {
                e.setExameMedicoPrimeiroEmprego(dto.getExameMedicoPrimeiroEmprego());
            }
            if (dto.getExameMedicoContribuicaoSindicalPaga() != null) {
                e.setExameMedicoContribuicaoSindicalPaga(dto.getExameMedicoContribuicaoSindicalPaga());
            }
            
            // Mapear documentos se fornecidos
            if (dto.getDocuments() != null && !dto.getDocuments().isEmpty()) {
                System.out.println("[DEBUG] Documentos fornecidos: " + dto.getDocuments().size());
            }
            
            // Mapear contato de emergÃªncia se fornecido
            if (dto.getEmergencyContact() != null) {
                System.out.println("[DEBUG] Contato de emergÃªncia fornecido: " + dto.getEmergencyContact().getName());
            }
            
            // Mapear informaÃ§Ãµes bancÃ¡rias se fornecidas
            if (dto.getBankInfo() != null) {
                System.out.println("[DEBUG] InformaÃ§Ãµes bancÃ¡rias fornecidas: " + dto.getBankInfo().getBank());
                e.setBanco(dto.getBankInfo().getBank());
                e.setAgencia(dto.getBankInfo().getAgency());
                e.setContaCorrente(dto.getBankInfo().getAccount());
            }
            
            // Mapear informaÃ§Ãµes profissionais se fornecidas
            if (dto.getJobInfo() != null) {
                System.out.println("[DEBUG] InformaÃ§Ãµes profissionais fornecidas: " + dto.getJobInfo().getPosition());
            }
            
            System.out.println("[DEBUG] ConversÃ£o DTO -> Entity concluÃ­da com sucesso");
            return e;
        } catch (Exception ex) {
            System.err.println("[ERROR] Erro na conversÃ£o DTO -> Entity: " + ex.getMessage());
            ex.printStackTrace();
            throw new RuntimeException("Erro na conversÃ£o DTO -> Entity: " + ex.getMessage(), ex);
        }
    }

    @Transactional(readOnly = true)
    public EmployeeDTO toDTO(Employee e) {
        try {
            System.out.println("[DEBUG] Iniciando conversÃ£o Entity -> DTO para funcionÃ¡rio: " + (e != null ? e.getName() : "null"));
            
            if (e == null) {
                throw new IllegalArgumentException("Employee nÃ£o pode ser null");
            }
            
            EmployeeDTO dto = new EmployeeDTO();
            
            // Campos bÃ¡sicos essenciais
            dto.setId(e.getId());
            dto.setName(e.getName());
            dto.setCpf(e.getDocument());
            // dto.setRg(e.getRg()); // Campo RG nÃ£o existe na entidade
            // dto.setGender(e.getGender()); // Campo Gender nÃ£o existe na entidade
            dto.setEmail(e.getEmail());
            dto.setPhone(e.getPhone());
            dto.setStatus(e.getStatus() != null ? e.getStatus().name() : null);
            dto.setNotes(e.getNotes());
            dto.setCreatedAt(e.getCreatedAt());
            dto.setUpdatedAt(e.getUpdatedAt());
            
            // Campos opcionais com verificaÃ§Ã£o de null
            if (e.getBirthDate() != null) {
                dto.setBirthDate(e.getBirthDate());
            }
            if (e.getMaritalStatus() != null) {
                dto.setMaritalStatus(e.getMaritalStatus());
            }
            if (e.getNationality() != null) {
                dto.setNationality(e.getNationality());
            }
            if (e.getRegistrationNumber() != null) {
                dto.setRegistrationNumber(e.getRegistrationNumber());
            }
            if (e.getHireDate() != null) {
                dto.setHireDate(e.getHireDate());
            }
            if (e.getTerminationDate() != null) {
                dto.setTerminationDate(e.getTerminationDate());
            }
            
            // Address - usar campos separados se disponÃ­veis, senÃ£o usar campo address antigo
            EmployeeDTO.AddressDTO address = new EmployeeDTO.AddressDTO();
            if (e.getEnderecoRua() != null) {
                address.setStreet(e.getEnderecoRua());
            } else if (e.getAddress() != null && !e.getAddress().trim().isEmpty()) {
                address.setStreet(e.getAddress());
            }
            if (e.getEnderecoNumero() != null) {
                address.setNumber(e.getEnderecoNumero());
            }
            if (e.getEnderecoComplemento() != null) {
                address.setComplement(e.getEnderecoComplemento());
            }
            if (e.getEnderecoBairro() != null) {
                address.setNeighborhood(e.getEnderecoBairro());
            }
            if (e.getEnderecoCidade() != null) {
                address.setCity(e.getEnderecoCidade());
            }
            if (e.getEnderecoEstado() != null) {
                address.setState(e.getEnderecoEstado());
            }
            if (e.getEnderecoCep() != null) {
                address.setZipCode(e.getEnderecoCep());
            }
            if (address.getStreet() != null || address.getNumber() != null || 
                address.getNeighborhood() != null || address.getCity() != null) {
                dto.setAddress(address);
            }
            
            // Mapear campos de endereÃ§o separados
            dto.setEnderecoRua(e.getEnderecoRua());
            dto.setEnderecoNumero(e.getEnderecoNumero());
            dto.setEnderecoComplemento(e.getEnderecoComplemento());
            dto.setEnderecoBairro(e.getEnderecoBairro());
            dto.setEnderecoCidade(e.getEnderecoCidade());
            dto.setEnderecoEstado(e.getEnderecoEstado());
            dto.setEnderecoCep(e.getEnderecoCep());
            
            // Mapear telefone de contato
            dto.setTelefoneContato(e.getTelefoneContato());
            
            // Mapear campos CIN
            dto.setCinNumero(e.getCinNumero());
            dto.setCinOrgaoEmissor(e.getCinOrgaoEmissor());
            dto.setCinDataEmissao(e.getCinDataEmissao());
            
            // Mapear CTPS Digital PDF (nÃ£o incluir o byte array no DTO por padrÃ£o, apenas metadados)
            // dto.setCtpsDigitalPdf(e.getCtpsDigitalPdf()); // NÃ£o incluir byte array no DTO
            dto.setCtpsDigitalPdfNome(e.getCtpsDigitalPdfNome());
            dto.setCtpsDigitalPdfTamanho(e.getCtpsDigitalPdfTamanho());
            
            // Mapear dados do cÃ´njuge
            dto.setSpouseName(e.getSpouseName());
            dto.setSpouseCpf(e.getSpouseCpf());
            dto.setSpouseRg(e.getSpouseRg());
            dto.setSpouseBirthDate(e.getSpouseBirthDate());
            dto.setSpousePhone(e.getSpousePhone());
            dto.setSpouseEmail(e.getSpouseEmail());
            
            // Mapear campos da ficha de registro
            dto.setEmpresaNome(e.getEmpresaNome());
            dto.setEmpresaEndereco(e.getEmpresaEndereco());
            dto.setEmpresaCnpj(e.getEmpresaCnpj());
            dto.setTituloEleitor(e.getTituloEleitor());
            dto.setTituloEleitorZona(e.getTituloEleitorZona());
            dto.setTituloEleitorSecao(e.getTituloEleitorSecao());
            dto.setTituloEleitorDataExpedicao(e.getTituloEleitorDataExpedicao());
            dto.setTituloEleitorValidade(e.getTituloEleitorValidade());
            dto.setNomeConselhoRegional(e.getNomeConselhoRegional());
            dto.setCarteiraIdentidadeOrgaoEmissor(e.getCarteiraIdentidadeOrgaoEmissor());
            dto.setCarteiraIdentidadeDataEmissao(e.getCarteiraIdentidadeDataEmissao());
            dto.setCertificadoMilitar(e.getCertificadoMilitar());
            dto.setNomePai(e.getNomePai());
            dto.setNomeMae(e.getNomeMae());
            dto.setLocalNascimento(e.getLocalNascimento());
            dto.setMunicipioNascimento(e.getMunicipioNascimento());
            dto.setEstadoNascimento(e.getEstadoNascimento());
            dto.setSexo(e.getSexo());
            dto.setGrauInstrucao(e.getGrauInstrucao());
            dto.setMatriculaEsocial(e.getMatriculaEsocial());
            dto.setCbo(e.getCbo());
            dto.setPis(e.getPis());
            dto.setSalario(e.getSalario());
            dto.setSalarioPorExtenso(e.getSalarioPorExtenso());
            dto.setPeriodoPagamento(e.getPeriodoPagamento());
            dto.setHorarioTrabalho(e.getHorarioTrabalho());
            dto.setFolgaSemanal(e.getFolgaSemanal());
            dto.setEscalaTrabalho(e.getEscalaTrabalho());
            dto.setFgtsOptante(e.getFgtsOptante());
            dto.setFgtsDataOpcao(e.getFgtsDataOpcao());
            dto.setFgtsBancoDepositario(e.getFgtsBancoDepositario());
            dto.setFgtsDataRetratacao(e.getFgtsDataRetratacao());
            dto.setPisDataCadastro(e.getPisDataCadastro());
            dto.setPisBancoDepositario(e.getPisBancoDepositario());
            dto.setPisEnderecoBanco(e.getPisEnderecoBanco());
            dto.setPisCodigoBanco(e.getPisCodigoBanco());
            dto.setPisCodigoAgencia(e.getPisCodigoAgencia());
            // dto.setCnhNumber(e.getCnhNumber()); // Campo jÃ¡ existe no modelo
            dto.setCnhExpirationDate(e.getCnhExpirationDate());
            dto.setCnhCategory(e.getCnhCategory());
            dto.setCtps(e.getCtps());
            dto.setCtpsRural(e.getCtpsRural());
            dto.setCtpsSeries(e.getCtpsSeries());
            dto.setCtpsIssueDate(e.getCtpsIssueDate());
            dto.setCtpsIssuingAgency(e.getCtpsIssuingAgency());
            dto.setCarteiraModelo19(e.getCarteiraModelo19());
            dto.setRegistroGeralEstrangeiro(e.getRegistroGeralEstrangeiro());
            dto.setCasadoBrasileiro(e.getCasadoBrasileiro());
            dto.setNomeConjugeEstrangeiro(e.getNomeConjugeEstrangeiro());
            dto.setTemFilhosBrasileiros(e.getTemFilhosBrasileiros());
            dto.setQuantidadeFilhosBrasileiros(e.getQuantidadeFilhosBrasileiros());
            dto.setDataChegadaBrasil(e.getDataChegadaBrasil());
            dto.setNaturalizado(e.getNaturalizado());
            dto.setDecretoNaturalizacao(e.getDecretoNaturalizacao());
            dto.setVistoFiscalizacao(e.getVistoFiscalizacao());
            dto.setAssinaturaFuncionario(e.getAssinaturaFuncionario());
            dto.setDataRescisao(e.getDataRescisao());
            
            // Mapear dados bancÃ¡rios
            if (e.getBanco() != null || e.getAgencia() != null || e.getContaCorrente() != null) {
                EmployeeDTO.BankInfoDTO bankInfo = new EmployeeDTO.BankInfoDTO();
                bankInfo.setBank(e.getBanco());
                bankInfo.setAgency(e.getAgencia());
                bankInfo.setAccount(e.getContaCorrente());
                bankInfo.setAccountType("CORRENTE"); // Tipo padrÃ£o
                dto.setBankInfo(bankInfo);
            }
            
            // Mapear WorkPost e Department
            if (e.getWorkPost() != null) {
                dto.setWorkPostId(e.getWorkPost().getId().toString());
            }
            if (e.getDepartment() != null) {
                dto.setDepartmentId(e.getDepartment().getId().toString());
            }
            
            // Mapear entidades relacionais com verificaÃ§Ã£o de null
            if (e.getUser() != null) {
                try {
                    EmployeeDTO.IdOnlyDTO userDTO = new EmployeeDTO.IdOnlyDTO();
                    userDTO.setId(e.getUser().getId());
                    userDTO.setName(e.getUser().getName());
                    userDTO.setUsername(e.getUser().getUsername());
                    userDTO.setEmail(e.getUser().getEmail());
                    dto.setUser(userDTO);
                } catch (Exception userEx) {
                    System.err.println("[WARNING] Erro ao mapear user: " + userEx.getMessage());
                    dto.setUser(null);
                }
            }
            
            if (e.getPosition() != null) {
                try {
                    // ForÃ§ar inicializaÃ§Ã£o do position (LAZY loading)
                    org.hibernate.Hibernate.initialize(e.getPosition());
                    
                    EmployeeDTO.PositionDTO positionDTO = new EmployeeDTO.PositionDTO();
                    positionDTO.setId(e.getPosition().getId());
                    positionDTO.setName(e.getPosition().getName());
                    if (e.getPosition().getDescription() != null) {
                        positionDTO.setDescription(e.getPosition().getDescription());
                    }
                    dto.setPosition(positionDTO);
                    System.out.println("[DEBUG] Position mapeado com sucesso: " + positionDTO.getName());
                } catch (Exception positionEx) {
                    System.err.println("[WARNING] Erro ao mapear position: " + positionEx.getMessage());
                    positionEx.printStackTrace();
                    dto.setPosition(null);
                }
            }
            
            if (e.getUnit() != null) {
                try {
                    // ForÃ§ar inicializaÃ§Ã£o do unit (LAZY loading)
                    org.hibernate.Hibernate.initialize(e.getUnit());
                    
                    EmployeeDTO.UnitDTO unitDTO = new EmployeeDTO.UnitDTO();
                    unitDTO.setId(e.getUnit().getId());
                    unitDTO.setName(e.getUnit().getName());
                    if (e.getUnit().getDescription() != null) {
                        unitDTO.setDescription(e.getUnit().getDescription());
                    }
                    dto.setUnit(unitDTO);
                    System.out.println("[DEBUG] Unit mapeado com sucesso: " + unitDTO.getName());
                } catch (Exception unitEx) {
                    System.err.println("[WARNING] Erro ao mapear unit: " + unitEx.getMessage());
                    unitEx.printStackTrace();
                    dto.setUnit(null);
                }
            }
            
            // Mapear Company
            if (e.getCompany() != null) {
                try {
                    EmployeeDTO.IdOnlyDTO companyDTO = new EmployeeDTO.IdOnlyDTO();
                    companyDTO.setId(e.getCompany().getId());
                    dto.setCompany(companyDTO);
                } catch (Exception companyEx) {
                    System.err.println("[WARNING] Erro ao mapear company: " + companyEx.getMessage());
                    dto.setCompany(null);
                }
            }
            
            // Dados de exames (ASO, Laudo Psicológico e próximos vencimentos)
            dto.setExameMedicoData(e.getExameMedicoData());
            dto.setNextExameMedico(e.getNextExameMedico());
            dto.setLaudoPsicologicoData(e.getLaudoPsicologicoData());
            dto.setNextLaudoPsicologico(e.getNextLaudoPsicologico());
            
            System.out.println("[DEBUG] DTO criado com sucesso para: " + dto.getName());
            return dto;
            
        } catch (Exception ex) {
            System.err.println("[ERROR] Erro na conversÃ£o Entity -> DTO: " + ex.getMessage());
            ex.printStackTrace();
            throw new RuntimeException("Erro na conversÃ£o Entity -> DTO: " + ex.getMessage(), ex);
        }
    }
    
    /**
     * Lista supervisores ativos para seleÃ§Ã£o em formulÃ¡rios
     */
    public List<SimpleEmployeeDTO> getSupervisors() {
        // Buscar funcionÃ¡rios ativos com cargo que contenha "supervisor" (case insensitive)
        List<Employee> allActiveEmployees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
        
        return allActiveEmployees.stream()
            .filter(emp -> emp.getPosition() != null && 
                          emp.getPosition().getName() != null &&
                          emp.getPosition().getName().toLowerCase().contains("supervisor"))
            .map(emp -> SimpleEmployeeDTO.builder()
                .id(emp.getId())
                .name(emp.getName())
                .email(emp.getEmail())
                .positionName(emp.getPosition() != null ? emp.getPosition().getName() : null)
                .build())
            .collect(java.util.stream.Collectors.toList());
    }
    
    /**
     * Busca funcionÃ¡rio por CPF exato (normalizado)
     * Tenta buscar em diferentes campos e com normalizaÃ§Ã£o
     * PRIORIDADE: users.username -> employees.document -> employees.cpf
     */
    public Optional<Employee> findByCpfExact(String cpf) {
        // Normalizar CPF (remover caracteres nÃ£o numÃ©ricos)
        String normalizedCpf = cpf.replaceAll("[^0-9]", "");
        log.debug("Buscando funcionÃ¡rio por CPF exato (normalizado): {}", normalizedCpf);
        
        // PRIORIDADE 1: Buscar User pelo username (que contÃ©m o CPF)
        Optional<com.z7design.fleet_manager.model.User> userOpt = userRepository.findByUsername(normalizedCpf);
        if (userOpt.isEmpty()) {
            // Tentar tambÃ©m com CPF formatado (com pontos e traÃ§o)
            String formattedCpf = normalizedCpf.length() == 11 
                ? String.format("%s.%s.%s-%s", 
                    normalizedCpf.substring(0, 3),
                    normalizedCpf.substring(3, 6),
                    normalizedCpf.substring(6, 9),
                    normalizedCpf.substring(9))
                : normalizedCpf;
            userOpt = userRepository.findByUsername(formattedCpf);
        }
        
        if (userOpt.isPresent()) {
            com.z7design.fleet_manager.model.User user = userOpt.get();
            log.debug("âœ… User encontrado pelo username (CPF): {} - ID: {}", user.getUsername(), user.getId());
            
            // Buscar Employee relacionado ao User
            Optional<Employee> employeeOpt = employeeRepository.findByUserId(user.getId());
            if (employeeOpt.isPresent()) {
                log.debug("âœ… FuncionÃ¡rio encontrado atravÃ©s do User: {}", employeeOpt.get().getName());
                return employeeOpt;
            } else {
                log.warn("âš ï¸ User encontrado mas nÃ£o hÃ¡ Employee relacionado para userId: {}", user.getId());
            }
        }
        
        // PRIORIDADE 2: Buscar usando findByCpf (busca na coluna cpf com normalizaÃ§Ã£o)
        Optional<Employee> employeeOpt = employeeRepository.findByCpf(normalizedCpf);
        if (employeeOpt.isPresent()) {
            log.debug("âœ… FuncionÃ¡rio encontrado usando findByCpf: {}", employeeOpt.get().getName());
            return employeeOpt;
        }
        
        // PRIORIDADE 3: Buscar usando findByDocument (campo document)
        employeeOpt = employeeRepository.findByDocument(normalizedCpf);
        if (employeeOpt.isPresent()) {
            log.debug("âœ… FuncionÃ¡rio encontrado usando findByDocument: {}", employeeOpt.get().getName());
            return employeeOpt;
        }
        
        // PRIORIDADE 4: Buscar todos e normalizar manualmente (fallback)
        List<Employee> allEmployees = employeeRepository.findAll();
        employeeOpt = allEmployees.stream()
            .filter(e -> e.getDocument() != null)
            .filter(e -> e.getDocument().replaceAll("[^0-9]", "").equals(normalizedCpf))
            .findFirst();
        
        if (employeeOpt.isPresent()) {
            log.debug("âœ… FuncionÃ¡rio encontrado usando busca manual: {}", employeeOpt.get().getName());
            return employeeOpt;
        }
        
        log.warn("âš ï¸ FuncionÃ¡rio nÃ£o encontrado para CPF: {} (tentou users.username, employees.document, employees.cpf)", normalizedCpf);
        return Optional.empty();
    }
    
    /**
     * Busca dados bÃ¡sicos do funcionÃ¡rio por CPF
     */
    public Map<String, Object> getEmployeeBasicDataByCpf(String cpf) {
        log.debug("Buscando dados bÃ¡sicos do funcionÃ¡rio por CPF: {}", cpf);
        
        Optional<Employee> employeeOpt = findByCpfExact(cpf);
        if (employeeOpt.isEmpty()) {
            log.warn("FuncionÃ¡rio nÃ£o encontrado para CPF: {}", cpf);
            return new HashMap<>();
        }
        
        Employee employee = employeeOpt.get();
        Map<String, Object> data = new HashMap<>();
        
        data.put("id", employee.getId());
        data.put("name", employee.getName());
        data.put("cpf", employee.getDocument());
        data.put("email", employee.getEmail());
        data.put("phone", employee.getPhone());
        data.put("status", employee.getStatus());
        
        if (employee.getPosition() != null) {
            data.put("position", employee.getPosition().getName());
            data.put("positionId", employee.getPosition().getId());
        }
        
        if (employee.getUnit() != null) {
            data.put("unit", employee.getUnit().getName());
            data.put("unitId", employee.getUnit().getId());
        }
        
        log.debug("Dados bÃ¡sicos encontrados para funcionÃ¡rio: {}", employee.getName());
        return data;
    }
} 
