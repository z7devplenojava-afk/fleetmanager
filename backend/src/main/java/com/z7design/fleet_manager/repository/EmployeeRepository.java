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
                        "LEFT JOIN departments d ON e.department_id = d.id", nativeQuery = true)
        List<Object[]> findBasicData();

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
                        "WHERE UPPER(e.name) LIKE UPPER(CONCAT('%', :searchTerm, '%')) " +
                        "OR REGEXP_REPLACE(COALESCE(e.document, ''), '[^0-9]', '', 'g') LIKE CONCAT('%', REGEXP_REPLACE(:searchTerm, '[^0-9]', '', 'g'), '%') "
                        +
                        "OR UPPER(COALESCE(e.email, '')) LIKE UPPER(CONCAT('%', :searchTerm, '%'))", nativeQuery = true)
        List<Object[]> findBasicDataBySearchTerm(@Param("searchTerm") String searchTerm);

        // Buscar apenas o nome por ID para evitar carregar toda a entidade (e colunas
        // inexistentes em alguns ambientes)
        @Query("SELECT e.name FROM Employee e WHERE e.id = :id")
        Optional<String> findNameById(@Param("id") UUID id);

        // Buscar por CPF (coluna document do banco)
        @Query(value = "SELECT * FROM employees WHERE REGEXP_REPLACE(COALESCE(document, ''), '[^0-9]', '', 'g') = :cpf LIMIT 1", nativeQuery = true)
        Optional<Employee> findByCpf(@Param("cpf") String cpf);

        // Buscar por matrícula (registration_number)
        @Query(value = "SELECT * FROM employees WHERE UPPER(TRIM(registration_number)) = UPPER(TRIM(:registrationNumber)) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByRegistrationNumber(@Param("registrationNumber") String registrationNumber);

        // Buscar por nome (exato, case insensitive)
        @Query(value = "SELECT * FROM employees WHERE UPPER(TRIM(name)) = UPPER(TRIM(:name)) LIMIT 1", nativeQuery = true)
        Optional<Employee> findByNameExact(@Param("name") String name);

        // Buscar por WhatsApp/phone normalizado (remove caracteres não numéricos)
        // A normalização acontece no código Java, aqui busca por valores normalizados
        @Query(value = "SELECT * FROM employees WHERE " +
                        "REGEXP_REPLACE(COALESCE(whatsapp, ''), '[^0-9]', '', 'g') = :whatsapp OR " +
                        "REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g') = :whatsapp " +
                        "LIMIT 1", nativeQuery = true)
        Optional<Employee> findByWhatsApp(@Param("whatsapp") String whatsapp);

        // Buscar por conta corrente (normaliza removendo espaços, hífens e pontos)
        @Query(value = "SELECT * FROM employees WHERE " +
                        "REGEXP_REPLACE(COALESCE(conta_corrente, ''), '[^0-9]', '', 'g') = :contaCorrente " +
                        "LIMIT 1", nativeQuery = true)
        Optional<Employee> findByContaCorrente(@Param("contaCorrente") String contaCorrente);

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
}
