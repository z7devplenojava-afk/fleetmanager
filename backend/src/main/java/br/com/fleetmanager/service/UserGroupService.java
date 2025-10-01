package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.UserGroupDTO;
import br.com.fleetmanager.dto.UserResponseDTO;
import br.com.fleetmanager.model.UserGroupEntity;
import br.com.fleetmanager.model.enums.UserGroup;
import br.com.fleetmanager.repository.UserGroupRepository;
import br.com.fleetmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.*;
import java.util.stream.Collectors;
import br.com.fleetmanager.model.Role;
import br.com.fleetmanager.model.enums.UserRole;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@Transactional
public class UserGroupService {
    
    @Autowired
    private UserGroupRepository userGroupRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    public List<UserGroupDTO> getAllGroups() {
        return userGroupRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public UserGroupDTO getGroupById(UUID id) {
        UserGroupEntity group = userGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
        return convertToDTO(group);
    }
    
    public UserGroupDTO getGroupByName(UserGroup groupName) {
        UserGroupEntity group = userGroupRepository.findByGroupName(groupName)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
        return convertToDTO(group);
    }
    
    public List<UserGroupDTO> getGroupsByUserId(UUID userId) {
        return userGroupRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Set<String> getUserPermissions(UUID userId) {
        List<UserGroupEntity> userGroups = userGroupRepository.findByUserId(userId);
        Set<String> allPermissions = new HashSet<>();
        
        for (UserGroupEntity group : userGroups) {
            allPermissions.addAll(group.getPermissions());
        }
        
        return allPermissions;
    }
    
    public List<UserResponseDTO> getUsersByGroup(UUID groupId) {
        // Verificar se o grupo existe
        userGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
        
        System.out.println("📋 [BACKEND] Buscando usuários do grupo: " + groupId);
        
        // Forçar limpeza do cache antes da consulta
        entityManager.clear();
        
        // Buscar usuários do grupo diretamente via SQL
        String jpql = """
            SELECT u FROM User u 
            JOIN u.groups g 
            WHERE g.id = :groupId
            """;
        
        List<br.com.fleetmanager.model.User> users = entityManager
                .createQuery(jpql, br.com.fleetmanager.model.User.class)
                .setParameter("groupId", groupId)
                .getResultList();
        
        System.out.println("👥 [BACKEND] Usuários encontrados no grupo via JPQL: " + users.size());
        users.forEach(u -> System.out.println("   - Usuário: " + u.getId() + " - " + u.getName()));
        
        return users.stream()
                .map(this::convertUserToDTO)
                .collect(Collectors.toList());
    }
    
    public List<UserResponseDTO> getAvailableUsersForGroup(UUID groupId) {
        UserGroupEntity group = userGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
        
        // Buscar todos os usuários que não estão neste grupo
        List<UserResponseDTO> allUsers = userRepository.findAll().stream()
                .map(this::convertUserToDTO)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
        
        List<UserResponseDTO> groupUsers = getUsersByGroup(groupId);
        
        return allUsers.stream()
                .filter(user -> groupUsers.stream()
                        .noneMatch(groupUser -> groupUser.getId().equals(user.getId())))
                .collect(Collectors.toList());
    }
    
    public UserGroupDTO createGroup(UserGroupDTO groupDTO) {
        if (groupDTO.getGroupName() != null && userGroupRepository.existsByGroupName(UserGroup.valueOf(groupDTO.getGroupName()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Já existe um grupo com esse nome. Escolha outro nome.");
        }
        
        UserGroupEntity group = new UserGroupEntity();
        if (groupDTO.getGroupName() != null) {
            group.setGroupName(UserGroup.valueOf(groupDTO.getGroupName()));
        }
        group.setDisplayName(groupDTO.getDisplayName());
        group.setDescription(groupDTO.getDescription());
        group.setPermissions(groupDTO.getPermissions() != null ? groupDTO.getPermissions() : new HashSet<>());
        
        UserGroupEntity savedGroup = userGroupRepository.save(group);
        return convertToDTO(savedGroup);
    }
    
    public UserGroupDTO updateGroup(UUID id, UserGroupDTO groupDTO) {
        UserGroupEntity group = userGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
        
        group.setDisplayName(groupDTO.getDisplayName());
        group.setDescription(groupDTO.getDescription());
        if (groupDTO.getPermissions() != null) {
            group.setPermissions(groupDTO.getPermissions());
        }
        
        UserGroupEntity savedGroup = userGroupRepository.save(group);
        return convertToDTO(savedGroup);
    }
    
    public void deleteGroup(UUID id) {
        if (!userGroupRepository.existsById(id)) {
            throw new RuntimeException("Grupo não encontrado");
        }
        userGroupRepository.deleteById(id);
    }
    
    public void addUserToGroup(UUID userId, UUID groupId) {
        System.out.println("➕ [BACKEND] Iniciando adição: userId=" + userId + ", groupId=" + groupId);
        
        UserGroupEntity group = userGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
        
        br.com.fleetmanager.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        // Verificar se o usuário já está no grupo consultando diretamente no banco
        List<UserGroupEntity> userGroups = userGroupRepository.findByUserId(userId);
        boolean userAlreadyInGroup = userGroups.stream()
                .anyMatch(g -> g.getId().equals(groupId));
        
        System.out.println("🔍 [BACKEND] Usuário já está no grupo: " + userAlreadyInGroup);
        
        if (userAlreadyInGroup) {
            throw new RuntimeException("Usuário já está no grupo");
        }
        
        // Inserir diretamente na tabela de junção
        String insertQuery = "INSERT INTO user_group_membership (user_id, group_id, created_at) VALUES (:userId, :groupId, NOW())";
        int insertedRows = entityManager.createNativeQuery(insertQuery)
                .setParameter("userId", userId)
                .setParameter("groupId", groupId)
                .executeUpdate();
        
        System.out.println("➕ [BACKEND] Registros inseridos na tabela de junção: " + insertedRows);
        
        // Forçar flush para garantir que a mudança seja persistida
        entityManager.flush();
        
        // Limpar o cache para forçar nova consulta
        entityManager.clear();
        
        System.out.println("✅ [BACKEND] Adição concluída e cache limpo");
    }
    
    public void removeUserFromGroup(UUID userId, UUID groupId) {
        System.out.println("🗑️ [BACKEND] Iniciando remoção: userId=" + userId + ", groupId=" + groupId);
        
        UserGroupEntity group = userGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
        
        br.com.fleetmanager.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        // Verificar se o usuário está no grupo antes de tentar remover
        List<UserGroupEntity> userGroups = userGroupRepository.findByUserId(userId);
        boolean userInGroup = userGroups.stream()
                .anyMatch(g -> g.getId().equals(groupId));
        
        System.out.println("🔍 [BACKEND] Usuário está no grupo: " + userInGroup);
        
        if (!userInGroup) {
            throw new RuntimeException("Usuário não está no grupo");
        }
        
        // Remover diretamente da tabela de junção
        String deleteQuery = "DELETE FROM user_group_membership WHERE user_id = :userId AND group_id = :groupId";
        int deletedRows = entityManager.createNativeQuery(deleteQuery)
                .setParameter("userId", userId)
                .setParameter("groupId", groupId)
                .executeUpdate();
        
        System.out.println("🔄 [BACKEND] Registros removidos da tabela de junção: " + deletedRows);
        
        // Forçar flush para garantir que a mudança seja persistida
        entityManager.flush();
        
        // Limpar o cache para forçar nova consulta
        entityManager.clear();
        
        System.out.println("✅ [BACKEND] Remoção concluída e cache limpo");
    }
    
    public void initializeDefaultGroups() {
        Map<UserGroup, Set<String>> defaultPermissions = getDefaultGroupPermissions();
        
        for (Map.Entry<UserGroup, Set<String>> entry : defaultPermissions.entrySet()) {
            UserGroup groupName = entry.getKey();
            Set<String> permissions = entry.getValue();
            
            if (!userGroupRepository.existsByGroupName(groupName)) {
                UserGroupEntity group = new UserGroupEntity();
                group.setGroupName(groupName);
                group.setDisplayName(getGroupDisplayName(groupName));
                group.setDescription(getGroupDescription(groupName));
                group.setPermissions(permissions);
                userGroupRepository.save(group);
            }
        }
    }
    
    public void syncUsersWithGroups() {
        Map<String, UserGroup> roleToGroup = Map.of(
            "SUPER_ADMIN", UserGroup.GRUPO_SUPER_ADMIN,
            "ADMIN", UserGroup.GRUPO_ADMIN,
            "RH", UserGroup.GRUPO_RH,
            "SUPERVISOR", UserGroup.GRUPO_SUPERVISOR,
            "COLABORADOR", UserGroup.GRUPO_COLABORADORES,
            "FINANCEIRO", UserGroup.GRUPO_FINANCEIRO,
            "TI_SUPORTE", UserGroup.GRUPO_TI_SUPORTE,
            "AUDITOR", UserGroup.GRUPO_AUDITOR
        );
        List<br.com.fleetmanager.model.User> users = userRepository.findAll();
        for (br.com.fleetmanager.model.User user : users) {
            for (Role role : user.getRoles()) {
                UserGroup group = roleToGroup.get(role.getName());
                if (group != null) {
                    UserGroupEntity groupEntity = userGroupRepository.findByGroupName(group).orElse(null);
                    if (groupEntity != null && !user.getGroups().contains(groupEntity)) {
                        user.getGroups().add(groupEntity);
                        userRepository.save(user);
                    }
                }
            }
        }
    }
    
    private UserGroupDTO convertToDTO(UserGroupEntity group) {
        UserGroupDTO dto = new UserGroupDTO();
        dto.setId(group.getId());
        dto.setGroupName(group.getGroupName() != null ? group.getGroupName().name() : null);
        dto.setDisplayName(group.getDisplayName());
        dto.setDescription(group.getDescription());
        dto.setPermissions(group.getPermissions());
        
        // Calcular contagem de usuários via consulta direta
        String countQuery = "SELECT COUNT(u) FROM User u JOIN u.groups g WHERE g.id = :groupId";
        Long userCount = entityManager.createQuery(countQuery, Long.class)
                .setParameter("groupId", group.getId())
                .getSingleResult();
        
        dto.setUserCount(userCount);
        return dto;
    }
    
    private UserGroupDTO convertToDTOWithoutUsers(UserGroupEntity group) {
        UserGroupDTO dto = new UserGroupDTO();
        dto.setId(group.getId());
        dto.setGroupName(group.getGroupName() != null ? group.getGroupName().name() : null);
        dto.setDisplayName(group.getDisplayName());
        dto.setDescription(group.getDescription());
        dto.setPermissions(group.getPermissions());
        dto.setUserCount(null); // Não calcular contagem para evitar ciclo
        return dto;
    }
    
    private UserResponseDTO convertUserToDTO(br.com.fleetmanager.model.User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setUsername(user.getUsername());
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            String primaryRole = user.getRoles().iterator().next().getName();
            dto.setRole(primaryRole);
        } else {
            System.out.println("Usuário sem role: " + user.getId() + " - " + user.getName());
        }
        dto.setStatus(user.getStatus() != null ? user.getStatus().name() : null);
        dto.setActive(user.isActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        // Converter grupos do usuário sem contagem de usuários
        List<UserGroupDTO> userGroups = user.getGroups().stream()
                .map(this::convertToDTOWithoutUsers)
                .collect(Collectors.toList());
        dto.setGroups(userGroups);
        return dto;
    }
    
    private String getGroupDisplayName(UserGroup group) {
        switch (group) {
            case GRUPO_SUPER_ADMIN: return "Super Administrador";
            case GRUPO_ADMIN: return "Administrador";
            case GRUPO_GESTOR: return "Gestor";
            case GRUPO_RH: return "Recursos Humanos";
            case GRUPO_DPE: return "Departamento Pessoal";
            case GRUPO_SUPERVISOR: return "Supervisor";
            case GRUPO_COLABORADORES: return "Colaboradores";
            case GRUPO_VIGILANTES: return "Vigilantes";
            default: return group.name();
        }
    }
    
    private String getGroupDescription(UserGroup group) {
        switch (group) {
            case GRUPO_SUPER_ADMIN: return "Acesso total ao sistema";
            case GRUPO_ADMIN: return "Administração do sistema";
            case GRUPO_GESTOR: return "Gestão de contratos e colaboradores";
            case GRUPO_RH: return "Gestão de recursos humanos";
            case GRUPO_DPE: return "Departamento pessoal";
            case GRUPO_SUPERVISOR: return "Supervisão de equipes";
            case GRUPO_COLABORADORES: return "Colaboradores da empresa";
            case GRUPO_VIGILANTES: return "Vigilantes de segurança";
            default: return "";
        }
    }
    
    private Map<UserGroup, Set<String>> getDefaultGroupPermissions() {
        Map<UserGroup, Set<String>> permissions = new HashMap<>();
        
        // GRUPO_SUPER_ADMIN - Todas as permissões
        permissions.put(UserGroup.GRUPO_SUPER_ADMIN, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE", "VIEW_EMPLOYEES", 
            "MANAGE_EMPLOYEES", "VIEW_REPORTS", "MANAGE_SYSTEM", "VIEW_CLIENTS", 
            "MANAGE_CLIENTS", "VIEW_CONTRACTS", "MANAGE_CONTRACTS", "VIEW_FINANCIAL", 
            "MANAGE_FINANCIAL", "VIEW_FLEET", "MANAGE_FLEET", "VIEW_DOCUMENTS", 
            "MANAGE_DOCUMENTS"
        )));
        
        // GRUPO_ADMIN - Permissões administrativas
        permissions.put(UserGroup.GRUPO_ADMIN, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE", "VIEW_EMPLOYEES", 
            "MANAGE_EMPLOYEES", "VIEW_REPORTS", "VIEW_CLIENTS", "MANAGE_CLIENTS", 
            "VIEW_CONTRACTS", "MANAGE_CONTRACTS", "VIEW_FINANCIAL", "MANAGE_FINANCIAL", 
            "VIEW_FLEET", "MANAGE_FLEET", "VIEW_DOCUMENTS", "MANAGE_DOCUMENTS"
        )));
        
        // GRUPO_GESTOR - Gestão de contratos
        permissions.put(UserGroup.GRUPO_GESTOR, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE", "VIEW_EMPLOYEES", 
            "MANAGE_EMPLOYEES", "VIEW_REPORTS", "VIEW_CLIENTS", "MANAGE_CLIENTS", 
            "VIEW_CONTRACTS", "MANAGE_CONTRACTS", "VIEW_FINANCIAL", "VIEW_FLEET", 
            "VIEW_DOCUMENTS"
        )));
        
        // GRUPO_RH - Recursos Humanos
        permissions.put(UserGroup.GRUPO_RH, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE", "VIEW_EMPLOYEES", 
            "MANAGE_EMPLOYEES", "VIEW_REPORTS", "VIEW_CLIENTS", "VIEW_CONTRACTS", 
            "VIEW_FINANCIAL", "VIEW_FLEET", "VIEW_DOCUMENTS"
        )));
        
        // GRUPO_DPE - Departamento Pessoal
        permissions.put(UserGroup.GRUPO_DPE, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE", "VIEW_EMPLOYEES", 
            "MANAGE_EMPLOYEES", "VIEW_REPORTS", "VIEW_CLIENTS", "VIEW_CONTRACTS", 
            "VIEW_FINANCIAL", "VIEW_FLEET", "VIEW_DOCUMENTS"
        )));
        
        // GRUPO_SUPERVISOR - Supervisão
        permissions.put(UserGroup.GRUPO_SUPERVISOR, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE", "VIEW_EMPLOYEES", 
            "VIEW_REPORTS", "VIEW_FLEET"
        )));
        
        // GRUPO_COLABORADORES - Colaboradores
        permissions.put(UserGroup.GRUPO_COLABORADORES, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE"
        )));
        
        // GRUPO_VIGILANTES - Vigilantes
        permissions.put(UserGroup.GRUPO_VIGILANTES, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE"
        )));
        
        return permissions;
    }
} 