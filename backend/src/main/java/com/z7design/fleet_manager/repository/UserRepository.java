package com.z7design.fleet_manager.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
       Optional<User> findByUsername(String username);

       @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:input) OR LOWER(u.email) = LOWER(:input)")
       Optional<User> findByUsernameOrEmailIgnoreCase(@Param("input") String input);

       boolean existsByUsername(String username);

       Optional<User> findByEmail(String email);

       Optional<User> findByWhatsapp(String whatsapp);

       boolean existsByEmail(String email);

       long countByCompanyId(UUID companyId);

       long countByCompanyIdAndActiveTrue(UUID companyId);

       /**
        * Busca usuÃ¡rios ativos
        */
       List<User> findByActiveTrue();

       /**
        * Busca usuÃ¡rios com permissÃµes financeiras
        */
       @Query("SELECT DISTINCT u FROM User u " +
                     "JOIN u.roles r " +
                     "WHERE u.active = true AND " +
                     "(r.name IN ('SUPER_ADMIN', 'ADMIN', 'FINANCEIRO') OR " +
                     "EXISTS (SELECT p FROM u.permissions p WHERE p.name IN ('FINANCIAL_READ', 'FINANCIAL_WRITE', 'FINANCIAL_CREATE')))")
       List<User> findUsersWithFinancialPermissions();

       /**
        * Busca usuÃ¡rios que sÃ£o supervisores
        */
       @Query("SELECT DISTINCT u FROM User u " +
                     "JOIN u.roles r " +
                     "WHERE u.active = true AND r.name = 'SUPERVISOR'")
       List<User> findSupervisors();

       /**
        * Candidatos a "remetente do sistema" para mensagens geradas automaticamente
        * (o Message exige sender nÃ£o nulo). Retorna admins ativos, mais antigo primeiro.
        */
       @Query("SELECT u FROM User u " +
                     "JOIN u.roles r " +
                     "WHERE u.active = true AND r.name IN ('SUPER_ADMIN', 'FLEX_ADMIN', 'ADMIN') " +
                     "ORDER BY u.createdAt ASC")
       List<User> findSystemMessageSenderCandidates();

       /**
        * Gestores de tráfego/CCO da empresa: administradores e papéis de tráfego/escala.
        * Usado pelas notificações de execução/liberação/atraso da Gestão de Limpeza.
        */
       @Query("SELECT DISTINCT u FROM User u " +
                     "JOIN u.roles r " +
                     "WHERE u.active = true AND (r.name IN ('SUPER_ADMIN', 'FLEX_ADMIN', 'ADMIN', 'TRAFFIC_MANAGER', 'GERENTE_TRAFEGO', 'OPERACIONAL') " +
                     "OR UPPER(r.name) LIKE '%TRAFEGO%' OR UPPER(r.name) LIKE '%TRAFFIC%')")
       List<User> findTrafficManagers(UUID companyId);

       /**
        * Busca usuÃ¡rios por nome, email ou username
        */
       @Query("SELECT DISTINCT u FROM User u " +
                     "WHERE u.active = true AND " +
                     "(LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%'))) " +
                     "ORDER BY u.name ASC")
       List<User> searchUsers(@Param("query") String query);

       /**
        * Busca usuário através do CPF do funcionário associado
        */
       @Query("SELECT u FROM User u " +
                     "JOIN Employee e ON e.user.id = u.id " +
                     "WHERE e.document = :cpf")
       Optional<User> findByEmployeeCpf(@Param("cpf") String cpf);

       /**
        * Busca usuário por username, email, CPF ou matrícula de funcionário
        */
       @Query(value = "SELECT u.* FROM users u " +
                     "LEFT JOIN employees e ON e.user_id = u.id " +
                     "WHERE LOWER(u.username) = LOWER(:identifier) " +
                     "   OR LOWER(u.email) = LOWER(:identifier) " +
                     "   OR (LENGTH(:cleanDigits) >= 11 AND (" +
                     "         REGEXP_REPLACE(COALESCE(u.username, ''), '[^0-9]', '', 'g') = :cleanDigits " +
                     "      OR REGEXP_REPLACE(COALESCE(u.cpf, ''), '[^0-9]', '', 'g') = :cleanDigits " +
                     "      OR REGEXP_REPLACE(COALESCE(e.document, ''), '[^0-9]', '', 'g') = :cleanDigits" +
                     "   )) " +
                     "   OR (LENGTH(TRIM(:identifier)) >= 2 AND (" +
                     "         LOWER(TRIM(COALESCE(u.employee_code, ''))) = LOWER(TRIM(:identifier)) " +
                     "      OR LOWER(TRIM(COALESCE(e.registration_number, ''))) = LOWER(TRIM(:identifier)) " +
                     "      OR LOWER(TRIM(COALESCE(e.matricula_esocial, ''))) = LOWER(TRIM(:identifier))" +
                     "   )) " +
                     "LIMIT 1", nativeQuery = true)
       Optional<User> findByIdentifierNative(@Param("identifier") String identifier, @Param("cleanDigits") String cleanDigits);

       @Query(value = "SELECT * FROM users WHERE REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g') = :cleanCpf LIMIT 1", nativeQuery = true)
       Optional<User> findByCpfNative(@Param("cleanCpf") String cleanCpf);

       /**
        * Busca usuário por ID ignorando filtros de tenant do Hibernate (garante busca consistente de entidade)
        */
       @Query(value = "SELECT * FROM users WHERE id = :id", nativeQuery = true)
       Optional<User> findByIdNative(@Param("id") UUID id);

       @Query(value = "SELECT * FROM users WHERE LOWER(username) = LOWER(:username) LIMIT 1", nativeQuery = true)
       Optional<User> findByUsernameNative(@Param("username") String username);

       @Query(value = "SELECT * FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1", nativeQuery = true)
       Optional<User> findByEmailNative(@Param("email") String email);
}
