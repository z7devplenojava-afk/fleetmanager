package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.UserGroupDTO;
import com.z7design.fleet_manager.dto.UserResponseDTO;
import com.z7design.fleet_manager.model.UserGroupEntity;
import com.z7design.fleet_manager.model.enums.UserGroup;
import com.z7design.fleet_manager.repository.UserGroupRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.*;
import java.util.stream.Collectors;
import com.z7design.fleet_manager.model.Role;
import com.z7design.fleet_manager.model.enums.UserRole;
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
                .orElseThrow(() -> new RuntimeException("Grupo nÃ£o encontrado"));
        return convertToDTO(group);
    }
    
    public UserGroupDTO getGroupByName(UserGroup groupName) {
        UserGroupEntity group = userGroupRepository.findByGroupName(groupName)
                .orElseThrow(() -> new RuntimeException("Grupo nÃ£o encontrado"));
        return convertToDTO(group);
    }
    
    @Transactional(readOnly = true)
    public List<UserGroupDTO> getGroupsByUserId(UUID userId) {
        // Sem contagem de usuários (evita query extra e ciclos); suficiente para o AuthContext
        return userGroupRepository.findByUserId(userId).stream()
                .map(this::convertToDTOWithoutUsers)
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
                .orElseThrow(() -> new RuntimeException("Grupo nÃ£o encontrado"));
        
        System.out.println("ðŸ“‹ [BACKEND] Buscando usuÃ¡rios do grupo: " + groupId);
        
        // ForÃ§ar limpeza do cache antes da consulta
        entityManager.clear();
        
        // Buscar usuÃ¡rios do grupo diretamente via SQL
        String jpql = """
            SELECT u FROM User u 
            JOIN u.groups g 
            WHERE g.id = :groupId
            """;
        
        List<com.z7design.fleet_manager.model.User> users = entityManager
                .createQuery(jpql, com.z7design.fleet_manager.model.User.class)
                .setParameter("groupId", groupId)
                .getResultList();
        
        System.out.println("ðŸ‘¥ [BACKEND] UsuÃ¡rios encontrados no grupo via JPQL: " + users.size());
        users.forEach(u -> System.out.println("   - UsuÃ¡rio: " + u.getId() + " - " + u.getName()));
        
        return users.stream()
                .map(this::convertUserToDTO)
                .collect(Collectors.toList());
    }
    
    public List<UserResponseDTO> getAvailableUsersForGroup(UUID groupId) {
        UserGroupEntity group = userGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grupo nÃ£o encontrado"));
        
        // Buscar todos os usuÃ¡rios que nÃ£o estÃ£o neste grupo
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
        // Validar que groupName Ã© obrigatÃ³rio
        if (groupDTO.getGroupName() == null || groupDTO.getGroupName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome tÃ©cnico do grupo Ã© obrigatÃ³rio (ex: GRUPO_VENDAS, GRUPO_RH)");
        }
        
        // Validar que o groupName Ã© um valor vÃ¡lido do enum
        UserGroup groupNameEnum;
        try {
            groupNameEnum = UserGroup.valueOf(groupDTO.getGroupName().toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            // Listar valores vÃ¡lidos para ajudar o usuÃ¡rio
            StringBuilder validValues = new StringBuilder();
            for (UserGroup validGroup : UserGroup.values()) {
                if (validValues.length() > 0) {
                    validValues.append(", ");
                }
                validValues.append(validGroup.name());
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                String.format("Nome tÃ©cnico invÃ¡lido: '%s'. Valores vÃ¡lidos: %s", 
                    groupDTO.getGroupName(), validValues.toString()));
        }
        
        // Verificar se jÃ¡ existe um grupo com esse nome
        if (userGroupRepository.existsByGroupName(groupNameEnum)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                String.format("JÃ¡ existe um grupo com o nome tÃ©cnico '%s'. Escolha outro nome.", groupDTO.getGroupName()));
        }
        
        // Validar displayName
        if (groupDTO.getDisplayName() == null || groupDTO.getDisplayName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome de exibiÃ§Ã£o do grupo Ã© obrigatÃ³rio");
        }
        
        UserGroupEntity group = new UserGroupEntity();
        group.setGroupName(groupNameEnum);
        group.setDisplayName(groupDTO.getDisplayName().trim());
        group.setDescription(groupDTO.getDescription() != null ? groupDTO.getDescription().trim() : null);
        group.setPermissions(groupDTO.getPermissions() != null ? groupDTO.getPermissions() : new HashSet<>());
        
        UserGroupEntity savedGroup = userGroupRepository.save(group);
        return convertToDTO(savedGroup);
    }
    
    public UserGroupDTO updateGroup(UUID id, UserGroupDTO groupDTO) {
        UserGroupEntity group = userGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grupo nÃ£o encontrado"));
        
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
            throw new RuntimeException("Grupo nÃ£o encontrado");
        }
        userGroupRepository.deleteById(id);
    }
    
    public void addUserToGroup(UUID userId, UUID groupId) {
        System.out.println("âž• [BACKEND] Iniciando adiÃ§Ã£o: userId=" + userId + ", groupId=" + groupId);
        
        // Verificar se o grupo existe
        if (!userGroupRepository.existsById(groupId)) {
            throw new RuntimeException("Grupo nÃ£o encontrado");
        }
        
        // Verificar se o usuÃ¡rio existe
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("UsuÃ¡rio nÃ£o encontrado");
        }
        
        // Verificar se o usuÃ¡rio jÃ¡ estÃ¡ no grupo consultando diretamente na tabela de junÃ§Ã£o
        String checkQuery = "SELECT COUNT(*) FROM user_group_membership WHERE user_id = :userId AND group_id = :groupId";
        Long count = ((Number) entityManager.createNativeQuery(checkQuery)
                .setParameter("userId", userId)
                .setParameter("groupId", groupId)
                .getSingleResult()).longValue();
        
        boolean userAlreadyInGroup = count > 0;
        
        System.out.println("ðŸ” [BACKEND] VerificaÃ§Ã£o na tabela de junÃ§Ã£o - Count: " + count + ", JÃ¡ estÃ¡ no grupo: " + userAlreadyInGroup);
        
        if (userAlreadyInGroup) {
            throw new RuntimeException("UsuÃ¡rio jÃ¡ estÃ¡ no grupo");
        }
        
        // Inserir diretamente na tabela de junÃ§Ã£o
        String insertQuery = "INSERT INTO user_group_membership (user_id, group_id, created_at) VALUES (:userId, :groupId, NOW())";
        int insertedRows = entityManager.createNativeQuery(insertQuery)
                .setParameter("userId", userId)
                .setParameter("groupId", groupId)
                .executeUpdate();
        
        System.out.println("âž• [BACKEND] Registros inseridos na tabela de junÃ§Ã£o: " + insertedRows);
        
        // ForÃ§ar flush para garantir que a mudanÃ§a seja persistida
        entityManager.flush();
        
        // Limpar o cache para forÃ§ar nova consulta
        entityManager.clear();
        
        System.out.println("âœ… [BACKEND] AdiÃ§Ã£o concluÃ­da e cache limpo");
    }
    
    public void removeUserFromGroup(UUID userId, UUID groupId) {
        System.out.println("ðŸ—‘ï¸ [BACKEND] Iniciando remoÃ§Ã£o: userId=" + userId + ", groupId=" + groupId);
        
        UserGroupEntity group = userGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grupo nÃ£o encontrado"));
        
        com.z7design.fleet_manager.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));
        
        // Verificar se o usuÃ¡rio estÃ¡ no grupo antes de tentar remover
        List<UserGroupEntity> userGroups = userGroupRepository.findByUserId(userId);
        boolean userInGroup = userGroups.stream()
                .anyMatch(g -> g.getId().equals(groupId));
        
        System.out.println("ðŸ” [BACKEND] UsuÃ¡rio estÃ¡ no grupo: " + userInGroup);
        
        if (!userInGroup) {
            throw new RuntimeException("UsuÃ¡rio nÃ£o estÃ¡ no grupo");
        }
        
        // Remover diretamente da tabela de junÃ§Ã£o
        String deleteQuery = "DELETE FROM user_group_membership WHERE user_id = :userId AND group_id = :groupId";
        int deletedRows = entityManager.createNativeQuery(deleteQuery)
                .setParameter("userId", userId)
                .setParameter("groupId", groupId)
                .executeUpdate();
        
        System.out.println("ðŸ”„ [BACKEND] Registros removidos da tabela de junÃ§Ã£o: " + deletedRows);
        
        // ForÃ§ar flush para garantir que a mudanÃ§a seja persistida
        entityManager.flush();
        
        // Limpar o cache para forÃ§ar nova consulta
        entityManager.clear();
        
        System.out.println("âœ… [BACKEND] RemoÃ§Ã£o concluÃ­da e cache limpo");
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
            "OPERACIONAL", UserGroup.GRUPO_OPERACIONAL,
            "FINANCEIRO", UserGroup.GRUPO_FINANCEIRO,
            "TI_SUPORTE", UserGroup.GRUPO_TI_SUPORTE,
            "AUDITOR", UserGroup.GRUPO_AUDITOR
        );
        List<com.z7design.fleet_manager.model.User> users = userRepository.findAll();
        for (com.z7design.fleet_manager.model.User user : users) {
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
        
        // Calcular contagem de usuÃ¡rios via consulta direta
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
        dto.setUserCount(null); // NÃ£o calcular contagem para evitar ciclo
        return dto;
    }
    
    private UserResponseDTO convertUserToDTO(com.z7design.fleet_manager.model.User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setUsername(user.getUsername());
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            String primaryRole = user.getRoles().iterator().next().getName();
            dto.setRole(primaryRole);
        } else {
            System.out.println("UsuÃ¡rio sem role: " + user.getId() + " - " + user.getName());
        }
        dto.setStatus(user.getStatus() != null ? user.getStatus().name() : null);
        dto.setActive(user.isActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        // Converter grupos do usuÃ¡rio sem contagem de usuÃ¡rios
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
            case GRUPO_OPERACIONAL: return "Operacional";
            case GRUPO_VIGILANTES: return "Vigilantes";
            default: return group.name();
        }
    }
    
    private String getGroupDescription(UserGroup group) {
        switch (group) {
            case GRUPO_SUPER_ADMIN: return "Acesso total ao sistema";
            case GRUPO_ADMIN: return "AdministraÃ§Ã£o do sistema";
            case GRUPO_GESTOR: return "GestÃ£o de contratos e colaboradores";
            case GRUPO_RH: return "GestÃ£o de recursos humanos";
            case GRUPO_DPE: return "Departamento pessoal";
            case GRUPO_SUPERVISOR: return "SupervisÃ£o de equipes";
            case GRUPO_COLABORADORES: return "Colaboradores da empresa";
            case GRUPO_OPERACIONAL: return "Equipe operacional";
            case GRUPO_VIGILANTES: return "Vigilantes de seguranÃ§a";
            default: return "";
        }
    }
    
    private Map<UserGroup, Set<String>> getDefaultGroupPermissions() {
        Map<UserGroup, Set<String>> permissions = new HashMap<>();
        
        // GRUPO_SUPER_ADMIN - Todas as permissÃµes
        permissions.put(UserGroup.GRUPO_SUPER_ADMIN, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE", "VIEW_EMPLOYEES", 
            "MANAGE_EMPLOYEES", "VIEW_REPORTS", "MANAGE_SYSTEM", "VIEW_CLIENTS", 
            "MANAGE_CLIENTS", "VIEW_CONTRACTS", "MANAGE_CONTRACTS", "VIEW_FINANCIAL", 
            "MANAGE_FINANCIAL", "VIEW_FLEET", "MANAGE_FLEET", "VIEW_DOCUMENTS", 
            "MANAGE_DOCUMENTS"
        )));
        
        // GRUPO_ADMIN - PermissÃµes administrativas
        permissions.put(UserGroup.GRUPO_ADMIN, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE", "VIEW_EMPLOYEES", 
            "MANAGE_EMPLOYEES", "VIEW_REPORTS", "VIEW_CLIENTS", "MANAGE_CLIENTS", 
            "VIEW_CONTRACTS", "MANAGE_CONTRACTS", "VIEW_FINANCIAL", "MANAGE_FINANCIAL", 
            "VIEW_FLEET", "MANAGE_FLEET", "VIEW_DOCUMENTS", "MANAGE_DOCUMENTS"
        )));
        
        // GRUPO_GESTOR - GestÃ£o de contratos
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
        
        // GRUPO_SUPERVISOR - SupervisÃ£o
        permissions.put(UserGroup.GRUPO_SUPERVISOR, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE", "VIEW_EMPLOYEES", 
            "VIEW_REPORTS", "VIEW_FLEET"
        )));
        
        // GRUPO_COLABORADORES - Colaboradores
        permissions.put(UserGroup.GRUPO_COLABORADORES, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE"
        )));

        // GRUPO_OPERACIONAL - Operacional
        permissions.put(UserGroup.GRUPO_OPERACIONAL, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE",
            "VIEW_EMPLOYEES", "VIEW_CONTRACTS", "VIEW_REPORTS", "VIEW_FLEET"
        )));
        
        // GRUPO_VIGILANTES - Vigilantes
        permissions.put(UserGroup.GRUPO_VIGILANTES, new HashSet<>(Arrays.asList(
            "VIEW_PAYSLIP", "DOWNLOAD_PAYSLIP", "EDIT_PROFILE"
        )));
        
        return permissions;
    }
} 
