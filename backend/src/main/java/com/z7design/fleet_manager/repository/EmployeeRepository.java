package com.z7design.fleet_manager.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.EmploymentStatus;
import com.z7design.fleet_manager.tenant.TenantContext;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

        Optional<Employee> findByEmail(String email);

        Optional<Employee> findByUserId(UUID userId);

        List<Employee> findByStatus(EmploymentStatus status);

        List<Employee> findByUnitId(UUID unitId);

        List<Employee> findByPositionId(UUID positionId);

        boolean existsByEmail(String email);

        boolean existsByDocument(String document);

        Optional<Employee> findByNameIgnoreCase(String name);

        Optional<Employee> findByDocument(String document);

        // Métodos para envio de holerites
        List<Employee> findByEmailIsNotNullAndEmailNot(String empty);

        // Busca por nome (case insensitive)
        List<Employee> findByNameContainingIgnoreCase(String name);

        // Busca por nome ou documento (case insensitive)
        List<Employee> findByNameContainingIgnoreCaseOrDocumentContainingIgnoreCase(String name, String document);

        // Buscar apenas IDs
        @Query("SELECT e.id FROM Employee e")
        List<UUID> findAllIds();

        // Buscar dados básicos COM relacionamentos de cargo, unidade, empresa, workPost
        // e department
        @Query(value = "SELECT e.id, e.name, e.document, e.birth_date, e.registration_number, e.hire_date, e.termination_date, e.status, e.notes, e.address, e.phone, e.email, e.cnh_number, e.ctps, e.cbo, e.pis, e.salario, e.created_at, e.updated_at, p.name as position_name, u.name as unit_name, c.sigla as company_sigla, e.user_id, wp.name as work_post_name, d.name as department_name "
                        +
                        "FROM employees e " +
                        "LEFT JOIN positions p ON e.position_id = p.id " +
                        "LEFT JOIN units u ON e.unit_id = u.id " +
                        "LEFT JOIN companies c ON e.company_id = c.id " +
                        "LEFT JOIN work_posts wp ON e.work_post_id = wp.id " +
                        "LEFT JOIN departments d ON e.department_id = d.id " +
                        "WHERE (CAST(:companyId AS uuid) IS NULL OR e.company_id = CAST(:companyId AS uuid))", nativeQuery = true)
        List<Object[]> findBasicDataScoped(@Param("companyId") UUID companyId);

        default List<Object[]> findBasicData() {
                return findBasicDataScoped(TenantContext.get());
        }

        // Buscar dados básicos COM relacionamentos de cargo, unidade, empresa, workPost
        // e department por termo de busca (nome ou CPF)
        @Query(value = "SELECT e.id, e.name, e.document, e.birth_date, e.registration_number, e.hire_date, e.termination_date, e.status, e.notes, e.address, e.phone, e.email, e.cnh_number, e.ctps, e.cbo, e.pis, e.salario, e.created_at, e.updated_at, p.name as position_name, u.name as unit_name, c.sigla as company_sigla, e.user_id, wp.name as work_post_name, d.name as department_name "
                        +
                        "FROM employees e " +
                        "LEFT JOIN positions p ON e.position_id = p.id " +
                        "LEFT JOIN units u ON e.unit_id = u.id " +
                        "LEFT JOIN companies c ON e.company_id = c.id " +
                        "LEFT JOIN work_posts wp ON e.work_post_id = wp.id " +
                        "LEFT JOIN departments d ON e.department_id = d.id " +
                        "WHERE (UPPER(e.name) LIKE UPPER(CONCAT('%', :searchTerm, '%')) " +
                        "OR REGEXP_REPLACE(COALESCE(e.document, ''), '[^0-9]', '', 'g') LIKE CONCAT('%', REGEXP_REPLACE(:searchTerm, '[^0-9]', '', 'g'), '%') " +
                        "OR UPPER(COALESCE(e.email, '')) LIKE UPPER(CONCAT('%', :searchTerm, '%'))) " +
                        "AND (CAST(:companyId AS uuid) IS NULL OR e.company_id = CAST(:companyId AS uuid))", nativeQuery = true)
        List<Object[]> findBasicDataBySearchTermScoped(@Param("searchTerm") String searchTerm,
                        @Param("companyId") UUID companyId);

        default List<Object[]> findBasicDataBySearchTerm(String searchTerm) {
                return findBasicDataBySearchTermScoped(searchTerm, TenantContext.get());
        }

        // Buscar apenas o nome por ID para evitar carregar toda a entidade (e colunas
        // inexistentes em alguns ambientes)
        @Query("SELECT e.name FROM Employee e WHERE e.id = :id")
        Optional<String> findNameById(@Param("id") UUID id);

        // Buscar por CPF (coluna document do banco)
        @Query(value = "SELECT * FROM employees WHERE REGEXP_REPLACE(COALESCE(document, ''), '[^0-9]', '', 'g') = :cpf " +
                        "AND (CAST(:companyId AS uuid) IS NULL OR company_id = CAST(:companyId AS uuid)) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByCpfScoped(@Param("cpf") String cpf, @Param("companyId") UUID companyId);

        default Optional<Employee> findByCpf(String cpf) {
                return findByCpfScoped(cpf, TenantContext.get());
        }

        // Buscar por matricula (registration_number)
        @Query(value = "SELECT * FROM employees WHERE UPPER(TRIM(registration_number)) = UPPER(TRIM(:registrationNumber)) " +
                        "AND (CAST(:companyId AS uuid) IS NULL OR company_id = CAST(:companyId AS uuid)) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByRegistrationNumberScoped(@Param("registrationNumber") String registrationNumber,
                        @Param("companyId") UUID companyId);

        default Optional<Employee> findByRegistrationNumber(String registrationNumber) {
                return findByRegistrationNumberScoped(registrationNumber, TenantContext.get());
        }

        // Buscar por nome (exato, case insensitive)
        @Query(value = "SELECT * FROM employees WHERE UPPER(TRIM(name)) = UPPER(TRIM(:name)) " +
                        "AND (CAST(:companyId AS uuid) IS NULL OR company_id = CAST(:companyId AS uuid)) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByNameExactScoped(@Param("name") String name, @Param("companyId") UUID companyId);

        default Optional<Employee> findByNameExact(String name) {
                return findByNameExactScoped(name, TenantContext.get());
        }

        // Buscar por WhatsApp/phone normalizado (remove caracteres nao numericos)
        // A normalizacao acontece no codigo Java, aqui busca por valores normalizados
        @Query(value = "SELECT * FROM employees WHERE " +
                        "(REGEXP_REPLACE(COALESCE(whatsapp, ''), '[^0-9]', '', 'g') = :whatsapp OR " +
                        "REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g') = :whatsapp) " +
                        "AND (CAST(:companyId AS uuid) IS NULL OR company_id = CAST(:companyId AS uuid)) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByWhatsAppScoped(@Param("whatsapp") String whatsapp, @Param("companyId") UUID companyId);

        default Optional<Employee> findByWhatsApp(String whatsapp) {
                return findByWhatsAppScoped(whatsapp, TenantContext.get());
        }

        // Buscar por conta corrente (normaliza removendo espacos, hifens e pontos)
        @Query(value = "SELECT * FROM employees WHERE " +
                        "REGEXP_REPLACE(COALESCE(conta_corrente, ''), '[^0-9]', '', 'g') = :contaCorrente " +
                        "AND (CAST(:companyId AS uuid) IS NULL OR company_id = CAST(:companyId AS uuid)) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByContaCorrenteScoped(@Param("contaCorrente") String contaCorrente,
                        @Param("companyId") UUID companyId);

        default Optional<Employee> findByContaCorrente(String contaCorrente) {
                return findByContaCorrenteScoped(contaCorrente, TenantContext.get());
        }

        // SECURITY: Buscar todos os employee records de um usuário (para validação de
        // acesso a empresas)
        List<Employee> findByUser(User user);

        // ====================================================================
        // Importação multi-tenant (CNPJ-aware)
        // ====================================================================

        /** Busca por CPF normalizado (somente dígitos) dentro de uma empresa */
        @Query(value = "SELECT * FROM employees WHERE company_id = :companyId " +
                        "AND REGEXP_REPLACE(COALESCE(document, ''), '[^0-9]', '', 'g') = :cpf LIMIT 1",
                        nativeQuery = true)
        Optional<Employee> findByCpfAndCompanyId(@Param("cpf") String cpf, @Param("companyId") UUID companyId);

        /** Busca por nome exato (case-insensitive) dentro de uma empresa */
        @Query(value = "SELECT * FROM employees WHERE company_id = :companyId " +
                        "AND UPPER(TRIM(name)) = UPPER(TRIM(:name)) LIMIT 1",
                        nativeQuery = true)
        Optional<Employee> findByNameExactAndCompanyId(@Param("name") String name, @Param("companyId") UUID companyId);

        long countByCompanyId(UUID companyId);

        // Native query ultra-leve para obter apenas company_id de um funcionário por user_id (evita carregar 120+ colunas da entidade Employee)
        @Query(value = "SELECT company_id FROM employees WHERE user_id = :userId AND company_id IS NOT NULL LIMIT 1", nativeQuery = true)
        Optional<UUID> findCompanyIdByUserIdNative(@Param("userId") UUID userId);

        // Native query ultra-leve para obter lista de company_ids associados ao user_id
        @Query(value = "SELECT DISTINCT company_id FROM employees WHERE user_id = :userId AND company_id IS NOT NULL", nativeQuery = true)
        List<UUID> findCompanyIdsByUserIdNative(@Param("userId") UUID userId);

        // Native query para obter unitName e branchName sem carregar a entidade Employee inteira
        @Query(value = "SELECT u.name as unit_name, b.name as branch_name " +
                        "FROM employees e " +
                        "JOIN units u ON e.unit_id = u.id " +
                        "LEFT JOIN branches b ON u.branch_id = b.id " +
                        "WHERE e.user_id = :userId LIMIT 1", nativeQuery = true)
        List<Object[]> findUnitAndBranchNamesByUserIdNative(@Param("userId") UUID userId);
}

