package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.tenant.TenantContext;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.EmploymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID>, JpaSpecificationExecutor<Employee> {

        Optional<Employee> findByUserId(UUID userId);

        List<Employee> findByStatus(EmploymentStatus status);

        Page<Employee> findByStatus(EmploymentStatus status, Pageable pageable);

        List<Employee> findByUnitId(UUID unitId);

        List<Employee> findByPositionId(UUID positionId);

        Optional<Employee> findByEmail(String email);

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

        // Buscar dados básicos COM relacionamentos de cargo, unidade, empresa, workPost e department
        @Query(value = "SELECT e.id, e.name, e.document, e.birth_date, e.registration_number, e.hire_date, e.termination_date, e.status, e.notes, e.address, e.phone, e.email, e.cnh_number, e.ctps, e.cbo, e.pis, e.salario, e.created_at, e.updated_at, p.name as position_name, u.name as unit_name, c.sigla as company_sigla, e.user_id, wp.name as work_post_name, d.name as department_name "
                        + "FROM employees e "
                        + "LEFT JOIN positions p ON e.position_id = p.id "
                        + "LEFT JOIN units u ON e.unit_id = u.id "
                        + "LEFT JOIN companies c ON e.company_id = c.id "
                        + "LEFT JOIN work_posts wp ON e.work_post_id = wp.id "
                        + "LEFT JOIN departments d ON e.department_id = d.id "
                        + "WHERE e.company_id = :companyId", nativeQuery = true)
        List<Object[]> findBasicDataByCompanyId(@Param("companyId") UUID companyId);

        @Query(value = "SELECT e.id, e.name, e.document, e.birth_date, e.registration_number, e.hire_date, e.termination_date, e.status, e.notes, e.address, e.phone, e.email, e.cnh_number, e.ctps, e.cbo, e.pis, e.salario, e.created_at, e.updated_at, p.name as position_name, u.name as unit_name, c.sigla as company_sigla, e.user_id, wp.name as work_post_name, d.name as department_name "
                        + "FROM employees e "
                        + "LEFT JOIN positions p ON e.position_id = p.id "
                        + "LEFT JOIN units u ON e.unit_id = u.id "
                        + "LEFT JOIN companies c ON e.company_id = c.id "
                        + "LEFT JOIN work_posts wp ON e.work_post_id = wp.id "
                        + "LEFT JOIN departments d ON e.department_id = d.id", nativeQuery = true)
        List<Object[]> findBasicDataGlobal();

        default List<Object[]> findBasicDataScoped(UUID companyId) {
                if (companyId != null) {
                        return findBasicDataByCompanyId(companyId);
                }
                return findBasicDataGlobal();
        }

        default List<Object[]> findBasicData() {
                return findBasicDataScoped(TenantContext.get());
        }

        // Buscar dados básicos por termo de busca
        @Query(value = "SELECT e.id, e.name, e.document, e.birth_date, e.registration_number, e.hire_date, e.termination_date, e.status, e.notes, e.address, e.phone, e.email, e.cnh_number, e.ctps, e.cbo, e.pis, e.salario, e.created_at, e.updated_at, p.name as position_name, u.name as unit_name, c.sigla as company_sigla, e.user_id, wp.name as work_post_name, d.name as department_name "
                        + "FROM employees e "
                        + "LEFT JOIN positions p ON e.position_id = p.id "
                        + "LEFT JOIN units u ON e.unit_id = u.id "
                        + "LEFT JOIN companies c ON e.company_id = c.id "
                        + "LEFT JOIN work_posts wp ON e.work_post_id = wp.id "
                        + "LEFT JOIN departments d ON e.department_id = d.id "
                        + "WHERE (UPPER(e.name) LIKE UPPER(CONCAT('%', :searchTerm, '%')) "
                        + "OR REGEXP_REPLACE(COALESCE(e.document, ''), '[^0-9]', '', 'g') LIKE CONCAT('%', REGEXP_REPLACE(:searchTerm, '[^0-9]', '', 'g'), '%') "
                        + "OR UPPER(COALESCE(e.email, '')) LIKE UPPER(CONCAT('%', :searchTerm, '%'))) "
                        + "AND e.company_id = :companyId", nativeQuery = true)
        List<Object[]> findBasicDataBySearchTermAndCompanyId(@Param("searchTerm") String searchTerm,
                        @Param("companyId") UUID companyId);

        @Query(value = "SELECT e.id, e.name, e.document, e.birth_date, e.registration_number, e.hire_date, e.termination_date, e.status, e.notes, e.address, e.phone, e.email, e.cnh_number, e.ctps, e.cbo, e.pis, e.salario, e.created_at, e.updated_at, p.name as position_name, u.name as unit_name, c.sigla as company_sigla, e.user_id, wp.name as work_post_name, d.name as department_name "
                        + "FROM employees e "
                        + "LEFT JOIN positions p ON e.position_id = p.id "
                        + "LEFT JOIN units u ON e.unit_id = u.id "
                        + "LEFT JOIN companies c ON e.company_id = c.id "
                        + "LEFT JOIN work_posts wp ON e.work_post_id = wp.id "
                        + "LEFT JOIN departments d ON e.department_id = d.id "
                        + "WHERE (UPPER(e.name) LIKE UPPER(CONCAT('%', :searchTerm, '%')) "
                        + "OR REGEXP_REPLACE(COALESCE(e.document, ''), '[^0-9]', '', 'g') LIKE CONCAT('%', REGEXP_REPLACE(:searchTerm, '[^0-9]', '', 'g'), '%') "
                        + "OR UPPER(COALESCE(e.email, '')) LIKE UPPER(CONCAT('%', :searchTerm, '%')))", nativeQuery = true)
        List<Object[]> findBasicDataBySearchTermGlobal(@Param("searchTerm") String searchTerm);

        default List<Object[]> findBasicDataBySearchTermScoped(String searchTerm, UUID companyId) {
                if (companyId != null) {
                        return findBasicDataBySearchTermAndCompanyId(searchTerm, companyId);
                }
                return findBasicDataBySearchTermGlobal(searchTerm);
        }

        default List<Object[]> findBasicDataBySearchTerm(String searchTerm) {
                return findBasicDataBySearchTermScoped(searchTerm, TenantContext.get());
        }

        // Buscar apenas o nome por ID
        @Query("SELECT e.name FROM Employee e WHERE e.id = :id")
        Optional<String> findNameById(@Param("id") UUID id);

        // Buscar por CPF (coluna document do banco)
        @Query(value = "SELECT * FROM employees WHERE REGEXP_REPLACE(COALESCE(document, ''), '[^0-9]', '', 'g') = :cpf LIMIT 1", nativeQuery = true)
        Optional<Employee> findByCpfGlobal(@Param("cpf") String cpf);

        default Optional<Employee> findByCpfScoped(String cpf, UUID companyId) {
                if (companyId != null) {
                        return findByCpfAndCompanyId(cpf, companyId);
                }
                return findByCpfGlobal(cpf);
        }

        default Optional<Employee> findByCpf(String cpf) {
                return findByCpfScoped(cpf, TenantContext.get());
        }

        // Buscar por matricula (registration_number)
        @Query(value = "SELECT * FROM employees WHERE company_id = :companyId "
                        + "AND UPPER(TRIM(registration_number)) = UPPER(TRIM(:registrationNumber)) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByRegistrationNumberAndCompanyId(@Param("registrationNumber") String registrationNumber,
                        @Param("companyId") UUID companyId);

        @Query(value = "SELECT * FROM employees WHERE UPPER(TRIM(registration_number)) = UPPER(TRIM(:registrationNumber)) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByRegistrationNumberGlobal(@Param("registrationNumber") String registrationNumber);

        default Optional<Employee> findByRegistrationNumberScoped(String registrationNumber, UUID companyId) {
                if (companyId != null) {
                        return findByRegistrationNumberAndCompanyId(registrationNumber, companyId);
                }
                return findByRegistrationNumberGlobal(registrationNumber);
        }

        default Optional<Employee> findByRegistrationNumber(String registrationNumber) {
                return findByRegistrationNumberScoped(registrationNumber, TenantContext.get());
        }

        // Buscar por nome (exato, case insensitive)
        @Query(value = "SELECT * FROM employees WHERE UPPER(TRIM(name)) = UPPER(TRIM(:name)) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByNameExactGlobal(@Param("name") String name);

        default Optional<Employee> findByNameExactScoped(String name, UUID companyId) {
                if (companyId != null) {
                        return findByNameExactAndCompanyId(name, companyId);
                }
                return findByNameExactGlobal(name);
        }

        default Optional<Employee> findByNameExact(String name) {
                return findByNameExactScoped(name, TenantContext.get());
        }

        // Buscar por WhatsApp/phone normalizado
        @Query(value = "SELECT * FROM employees WHERE company_id = :companyId AND "
                        + "(REGEXP_REPLACE(COALESCE(whatsapp, ''), '[^0-9]', '', 'g') = :whatsapp OR "
                        + "REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g') = :whatsapp) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByWhatsAppAndCompanyId(@Param("whatsapp") String whatsapp, @Param("companyId") UUID companyId);

        @Query(value = "SELECT * FROM employees WHERE "
                        + "(REGEXP_REPLACE(COALESCE(whatsapp, ''), '[^0-9]', '', 'g') = :whatsapp OR "
                        + "REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g') = :whatsapp) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByWhatsAppGlobal(@Param("whatsapp") String whatsapp);

        default Optional<Employee> findByWhatsAppScoped(String whatsapp, UUID companyId) {
                if (companyId != null) {
                        return findByWhatsAppAndCompanyId(whatsapp, companyId);
                }
                return findByWhatsAppGlobal(whatsapp);
        }

        default Optional<Employee> findByWhatsApp(String whatsapp) {
                return findByWhatsAppScoped(whatsapp, TenantContext.get());
        }

        // Buscar por conta corrente
        @Query(value = "SELECT * FROM employees WHERE company_id = :companyId AND "
                        + "REGEXP_REPLACE(COALESCE(conta_corrente, ''), '[^0-9]', '', 'g') = :contaCorrente LIMIT 1", nativeQuery = true)
        Optional<Employee> findByContaCorrenteAndCompanyId(@Param("contaCorrente") String contaCorrente,
                        @Param("companyId") UUID companyId);

        @Query(value = "SELECT * FROM employees WHERE "
                        + "REGEXP_REPLACE(COALESCE(conta_corrente, ''), '[^0-9]', '', 'g') = :contaCorrente LIMIT 1", nativeQuery = true)
        Optional<Employee> findByContaCorrenteGlobal(@Param("contaCorrente") String contaCorrente);

        default Optional<Employee> findByContaCorrenteScoped(String contaCorrente, UUID companyId) {
                if (companyId != null) {
                        return findByContaCorrenteAndCompanyId(contaCorrente, companyId);
                }
                return findByContaCorrenteGlobal(contaCorrente);
        }

        default Optional<Employee> findByContaCorrente(String contaCorrente) {
                return findByContaCorrenteScoped(contaCorrente, TenantContext.get());
        }

        // SECURITY: Buscar todos os employee records de um usuário
        List<Employee> findByUser(User user);

        // ====================================================================
        // Importação multi-tenant (CNPJ-aware)
        // ====================================================================

        /** Busca por CPF normalizado (somente dígitos) dentro de uma empresa */
        @Query(value = "SELECT * FROM employees WHERE company_id = :companyId "
                        + "AND REGEXP_REPLACE(COALESCE(document, ''), '[^0-9]', '', 'g') = :cpf LIMIT 1", nativeQuery = true)
        Optional<Employee> findByCpfAndCompanyId(@Param("cpf") String cpf, @Param("companyId") UUID companyId);

        /** Busca por nome exato (case-insensitive) dentro de uma empresa */
        @Query(value = "SELECT * FROM employees WHERE company_id = :companyId "
                        + "AND UPPER(TRIM(name)) = UPPER(TRIM(:name)) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByNameExactAndCompanyId(@Param("name") String name, @Param("companyId") UUID companyId);

        long countByCompanyId(UUID companyId);

        // Native query ultra-leve para obter apenas company_id de um funcionário por user_id
        @Query(value = "SELECT company_id FROM employees WHERE user_id = :userId AND company_id IS NOT NULL LIMIT 1", nativeQuery = true)
        Optional<UUID> findCompanyIdByUserIdNative(@Param("userId") UUID userId);

        // Native query ultra-leve para obter lista de company_ids associados ao user_id
        @Query(value = "SELECT DISTINCT company_id FROM employees WHERE user_id = :userId AND company_id IS NOT NULL", nativeQuery = true)
        List<UUID> findCompanyIdsByUserIdNative(@Param("userId") UUID userId);

        // Native query para obter unitName e branchName sem carregar a entidade Employee inteira
        @Query(value = "SELECT u.name as unit_name, b.name as branch_name "
                        + "FROM employees e "
                        + "JOIN units u ON e.unit_id = u.id "
                        + "LEFT JOIN branches b ON u.branch_id = b.id "
                        + "WHERE e.user_id = :userId LIMIT 1", nativeQuery = true)
        List<Object[]> findUnitAndBranchNamesByUserIdNative(@Param("userId") UUID userId);
}
