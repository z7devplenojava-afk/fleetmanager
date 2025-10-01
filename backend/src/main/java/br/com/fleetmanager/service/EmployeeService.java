package br.com.fleetmanager.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Arrays;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.enums.EmploymentStatus;
import br.com.fleetmanager.repository.EmployeeRepository;
import br.com.fleetmanager.repository.UserRepository;
import br.com.fleetmanager.repository.PositionRepository;
import br.com.fleetmanager.repository.UnitRepository;
import br.com.fleetmanager.dto.EmployeeDTO;
import br.com.fleetmanager.dto.SimpleEmployeeDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeService {
    
    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PositionRepository positionRepository;
    @Autowired
    private UnitRepository unitRepository;
    
    @Transactional
    public EmployeeDTO create(EmployeeDTO dto) {
        if (employeeRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email já cadastrado");
        }
        
        if (dto.getCpf() != null && employeeRepository.existsByDocument(dto.getCpf())) {
            throw new RuntimeException("CPF já cadastrado para outro funcionário");
        }
        
        Employee employee = toEntity(dto);
        Employee saved = employeeRepository.save(employee);
        return toDTO(saved);
    }
    
    @Transactional
    public EmployeeDTO update(UUID id, EmployeeDTO dto) {
        try {
            System.out.println("[DEBUG] DTO recebido: " + dto);
            
            Employee existingEmployee = findById(id);
            System.out.println("[DEBUG] Funcionário existente encontrado: " + existingEmployee.getName());
            
            if (!existingEmployee.getEmail().equals(dto.getEmail()) && 
                employeeRepository.existsByEmail(dto.getEmail())) {
                throw new RuntimeException("Email já cadastrado");
            }
            
            // Validar CPF único (exceto para o próprio funcionário)
            if (dto.getCpf() != null && !dto.getCpf().equals(existingEmployee.getDocument())) {
                if (employeeRepository.existsByDocument(dto.getCpf())) {
                    throw new RuntimeException("CPF já cadastrado para outro funcionário");
                }
            }
            
            System.out.println("[DEBUG] Atualizando campos do funcionário existente...");
            
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
                    System.err.println("[ERROR] Status inválido: " + dto.getStatus());
                    throw new RuntimeException("Status inválido: " + dto.getStatus() + ". Status válidos: " + 
                        Arrays.toString(EmploymentStatus.values()));
                }
            }
            if (dto.getNotes() != null) {
                existingEmployee.setNotes(dto.getNotes());
            }
            if (dto.getAddress() != null && dto.getAddress().getStreet() != null && !dto.getAddress().getStreet().isEmpty()) {
                existingEmployee.setAddress(dto.getAddress().getStreet());
                System.out.println("[DEBUG] Address atualizado: " + existingEmployee.getAddress());
            }
            if (dto.getPhone() != null) {
                existingEmployee.setPhone(dto.getPhone());
            }
            if (dto.getEmail() != null) {
                existingEmployee.setEmail(dto.getEmail());
            }
            
            // Atualizar entidades relacionais se fornecidas
            if (dto.getUser() != null && dto.getUser().getId() != null) {
                existingEmployee.setUser(userRepository.findById(dto.getUser().getId())
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado para o id informado.")));
            }
            if (dto.getPosition() != null && dto.getPosition().getId() != null) {
                existingEmployee.setPosition(positionRepository.findById(dto.getPosition().getId())
                    .orElseThrow(() -> new RuntimeException("Cargo não encontrado para o id informado.")));
            }
            if (dto.getUnit() != null && dto.getUnit().getId() != null) {
                existingEmployee.setUnit(unitRepository.findById(dto.getUnit().getId()).orElse(null));
            }
            
            // Atualizar timestamp
            existingEmployee.setUpdatedAt(LocalDateTime.now());
            
            System.out.println("[DEBUG] Salvando funcionário atualizado...");
            Employee saved = employeeRepository.save(existingEmployee);
            System.out.println("[DEBUG] Funcionário salvo com sucesso: " + saved.getName());
            
            System.out.println("[DEBUG] Convertendo entidade para DTO...");
            EmployeeDTO result = toDTO(saved);
            System.out.println("[DEBUG] DTO retornado: " + result);
            
            return result;
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao atualizar funcionário: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao atualizar funcionário: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void delete(UUID id) {
        Employee employee = findById(id);
        if (employee.getStatus() != EmploymentStatus.TERMINATED) {
            throw new RuntimeException("Apenas funcionários demitidos podem ser excluídos");
        }
        employeeRepository.delete(employee);
    }
    
    public Employee findById(UUID id) {
        return employeeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }
    
    public Optional<Employee> findByEmail(String email) {
        return employeeRepository.findByEmail(email);
    }
    
    public List<Employee> findByStatus(EmploymentStatus status) {
        try {
            System.out.println("[DEBUG] EmployeeService.findByStatus - Status recebido: " + status);
            List<Employee> employees = employeeRepository.findByStatus(status);
            System.out.println("[DEBUG] EmployeeService.findByStatus - Funcionários encontrados: " + employees.size());
            return employees;
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeService.findByStatus - Erro ao buscar funcionários: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public List<Employee> findByNameContaining(String name) {
        try {
            System.out.println("[DEBUG] EmployeeService.findByNameContaining - Nome recebido: " + name);
            List<Employee> employees = employeeRepository.findByNameContainingIgnoreCase(name);
            System.out.println("[DEBUG] EmployeeService.findByNameContaining - Funcionários encontrados: " + employees.size());
            return employees;
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeService.findByNameContaining - Erro ao buscar funcionários: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionários por nome: " + e.getMessage());
        }
    }
    
    public List<Employee> findByNameOrDocumentContaining(String searchTerm) {
        try {
            System.out.println("[DEBUG] EmployeeService.findByNameOrDocumentContaining - Termo recebido: " + searchTerm);
            List<Employee> employees = employeeRepository.findByNameContainingIgnoreCaseOrDocumentContainingIgnoreCase(searchTerm, searchTerm);
            System.out.println("[DEBUG] EmployeeService.findByNameOrDocumentContaining - Funcionários encontrados: " + employees.size());
            return employees;
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeService.findByNameOrDocumentContaining - Erro ao buscar funcionários: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionários por nome ou documento: " + e.getMessage());
        }
    }
    
    public List<SimpleEmployeeDTO> findSimpleEmployeesByNameOrDocument(String searchTerm) {
        try {
            System.out.println("[DEBUG] EmployeeService.findSimpleEmployeesByNameOrDocument - Termo recebido: " + searchTerm);
            List<Employee> employees = employeeRepository.findByNameContainingIgnoreCaseOrDocumentContainingIgnoreCase(searchTerm, searchTerm);
            System.out.println("[DEBUG] EmployeeService.findSimpleEmployeesByNameOrDocument - Funcionários encontrados: " + employees.size());
            
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
            System.err.println("[ERROR] EmployeeService.findSimpleEmployeesByNameOrDocument - Erro ao buscar funcionários: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionários por nome ou documento: " + e.getMessage());
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
    
    public List<Employee> findAll() {
        return employeeRepository.findAll();
    }
    
    @Transactional
    public Employee updateStatus(UUID id, EmploymentStatus status) {
        Employee employee = findById(id);
        employee.setStatus(status);
        return employeeRepository.save(employee);
    }

    @Transactional
    public void deleteById(UUID id) {
        employeeRepository.deleteById(id);
    }

    // Métodos utilitários de mapeamento
    private Employee toEntity(EmployeeDTO dto) {
        try {
            System.out.println("[DEBUG] Iniciando conversão DTO -> Entity");
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
            // e.setMaritalStatus(dto.getMaritalStatus());
            // e.setNationality(dto.getNationality());
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
                    System.err.println("[ERROR] Status inválido: " + dto.getStatus());
                    throw new RuntimeException("Status inválido: " + dto.getStatus() + ". Status válidos: " + 
                        Arrays.toString(EmploymentStatus.values()));
                }
            } else {
                System.out.println("[DEBUG] Status não fornecido, mantendo status atual");
            }
            
            // e.setPossuiWhatsapp(dto.getPossuiWhatsapp());
            // e.setCaminhoPdf(dto.getCaminhoPdf());
            // e.setMesReferencia(dto.getMesReferencia());
            // e.setAnoReferencia(dto.getAnoReferencia());
            e.setNotes(dto.getNotes());
            
            // Garantir que address nunca seja null
            if (dto.getAddress() == null || dto.getAddress().getStreet() == null || dto.getAddress().getStreet().isEmpty()) {
                throw new RuntimeException("O campo address.street é obrigatório e não pode ser vazio.");
            }
            e.setAddress(dto.getAddress().getStreet());
            System.out.println("[DEBUG] Address salvo: " + e.getAddress());
            
            e.setPhone(dto.getPhone());
            e.setEmail(dto.getEmail());
            
            // Setar entidades relacionais obrigatórias
            if (dto.getUser() == null || dto.getUser().getId() == null) {
                throw new RuntimeException("O campo user.id é obrigatório.");
            }
            e.setUser(userRepository.findById(dto.getUser().getId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado para o id informado.")));
                
            if (dto.getPosition() == null || dto.getPosition().getId() == null) {
                throw new RuntimeException("O campo position.id é obrigatório.");
            }
            e.setPosition(positionRepository.findById(dto.getPosition().getId())
                .orElseThrow(() -> new RuntimeException("Cargo não encontrado para o id informado.")));
                
            if (dto.getUnit() != null && dto.getUnit().getId() != null) {
                e.setUnit(unitRepository.findById(dto.getUnit().getId()).orElse(null));
            }
            
            // Mapear documentos se fornecidos
            if (dto.getDocuments() != null && !dto.getDocuments().isEmpty()) {
                System.out.println("[DEBUG] Documentos fornecidos: " + dto.getDocuments().size());
            }
            
            // Mapear contato de emergência se fornecido
            if (dto.getEmergencyContact() != null) {
                System.out.println("[DEBUG] Contato de emergência fornecido: " + dto.getEmergencyContact().getName());
            }
            
            // Mapear informações bancárias se fornecidas
            if (dto.getBankInfo() != null) {
                System.out.println("[DEBUG] Informações bancárias fornecidas: " + dto.getBankInfo().getBank());
            }
            
            // Mapear informações profissionais se fornecidas
            if (dto.getJobInfo() != null) {
                System.out.println("[DEBUG] Informações profissionais fornecidas: " + dto.getJobInfo().getPosition());
            }
            
            System.out.println("[DEBUG] Conversão DTO -> Entity concluída com sucesso");
            return e;
        } catch (Exception ex) {
            System.err.println("[ERROR] Erro na conversão DTO -> Entity: " + ex.getMessage());
            ex.printStackTrace();
            throw new RuntimeException("Erro na conversão DTO -> Entity: " + ex.getMessage(), ex);
        }
    }

    public EmployeeDTO toDTO(Employee e) {
        try {
            System.out.println("[DEBUG] Iniciando conversão Entity -> DTO para funcionário: " + e.getName());
            
            EmployeeDTO dto = new EmployeeDTO();
            dto.setId(e.getId()); // Adicionado para mapear o ID
            dto.setName(e.getName());
            dto.setCpf(e.getDocument());
            // dto.setCarteiraIdentidade(e.getCarteiraIdentidade());
            // dto.setTituloEleitor(e.getTituloEleitor());
            // dto.setGrauInstrucao(e.getGrauInstrucao());
            // dto.setPai(e.getPai());
            // dto.setMae(e.getMae());
            // dto.setNaturalidade(e.getNaturalidade());
            // dto.setCep(e.getCep());
            // dto.setCtps(e.getCtps());
            // dto.setCbo(e.getCbo());
            // dto.setPis(e.getPis());
            // dto.setSalario(e.getSalario());
            // dto.setFgtsOptante(e.getFgtsOptante());
            // dto.setFgtsDataOpcao(e.getFgtsDataOpcao());
            // dto.setFgtsBancoDepositario(e.getFgtsBancoDepositario());
            // dto.setEmpresaNome(e.getEmpresaNome());
            // dto.setEmpresaEndereco(e.getEmpresaEndereco());
            // dto.setEmpresaCnpj(e.getEmpresaCnpj());
            dto.setBirthDate(e.getBirthDate());
            // dto.setMaritalStatus(e.getMaritalStatus());
            // dto.setNationality(e.getNationality());
            // dto.setPhotoUrl(e.getPhotoUrl());
            // dto.setCurrentScale(e.getCurrentScale());
            dto.setRegistrationNumber(e.getRegistrationNumber());
            dto.setHireDate(e.getHireDate());
            dto.setTerminationDate(e.getTerminationDate());
            dto.setStatus(e.getStatus() != null ? e.getStatus().name() : null);
            // dto.setPossuiWhatsapp(e.getPossuiWhatsapp());
            // dto.setCaminhoPdf(e.getCaminhoPdf());
            // dto.setMesReferencia(e.getMesReferencia());
            // dto.setAnoReferencia(e.getAnoReferencia());
            dto.setNotes(e.getNotes());
            dto.setCreatedAt(e.getCreatedAt());
            dto.setUpdatedAt(e.getUpdatedAt());
            
            // Address simplificado - usar apenas o campo street
            if (e.getAddress() != null && !e.getAddress().trim().isEmpty()) {
                EmployeeDTO.AddressDTO address = new EmployeeDTO.AddressDTO();
                address.setStreet(e.getAddress());
                dto.setAddress(address);
                System.out.println("[DEBUG] Address mapeado: " + e.getAddress());
            } else {
                dto.setAddress(null);
                System.out.println("[DEBUG] Address não fornecido ou vazio");
            }
            dto.setPhone(e.getPhone());
            dto.setEmail(e.getEmail());
            
            // Mapear entidades relacionais
            if (e.getUser() != null) {
                EmployeeDTO.IdOnlyDTO userDTO = new EmployeeDTO.IdOnlyDTO();
                userDTO.setId(e.getUser().getId());
                dto.setUser(userDTO);
                System.out.println("[DEBUG] User mapeado: " + e.getUser().getId());
            }
            if (e.getPosition() != null) {
                EmployeeDTO.PositionDTO positionDTO = new EmployeeDTO.PositionDTO();
                positionDTO.setId(e.getPosition().getId());
                positionDTO.setName(e.getPosition().getName());
                positionDTO.setDescription(e.getPosition().getDescription());
                dto.setPosition(positionDTO);
                System.out.println("[DEBUG] Position mapeada: " + e.getPosition().getName() + " (ID: " + e.getPosition().getId() + ")");
            }
            if (e.getUnit() != null) {
                EmployeeDTO.UnitDTO unitDTO = new EmployeeDTO.UnitDTO();
                unitDTO.setId(e.getUnit().getId());
                unitDTO.setName(e.getUnit().getName());
                unitDTO.setDescription(e.getUnit().getDescription());
                dto.setUnit(unitDTO);
                System.out.println("[DEBUG] Unit mapeada: " + e.getUnit().getName() + " (ID: " + e.getUnit().getId() + ")");
            }
            
            System.out.println("[DEBUG] DTO final criado com campos principais:");
            System.out.println("[DEBUG] - Nome: " + dto.getName());
            System.out.println("[DEBUG] - CPF: " + dto.getCpf());
            System.out.println("[DEBUG] - Status: " + dto.getStatus());
            System.out.println("[DEBUG] - Email: " + dto.getEmail());
            System.out.println("[DEBUG] - Phone: " + dto.getPhone());
            System.out.println("[DEBUG] - Address: " + (dto.getAddress() != null ? dto.getAddress().getStreet() : "null"));
            
            return dto;
        } catch (Exception ex) {
            System.err.println("[ERROR] Erro na conversão Entity -> DTO: " + ex.getMessage());
            ex.printStackTrace();
            throw new RuntimeException("Erro na conversão Entity -> DTO: " + ex.getMessage(), ex);
        }
    }
    
    /**
     * Lista supervisores ativos para seleção em formulários
     */
    public List<SimpleEmployeeDTO> getSupervisors() {
        // Buscar funcionários ativos com cargo que contenha "supervisor" (case insensitive)
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
} 