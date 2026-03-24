package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
 
@Repository
public interface PayslipRepository extends JpaRepository<Payslip, java.util.UUID> {
    
    // MÃ©todo padrÃ£o do Spring Data JPA (deprecated - usar o mÃ©todo com CNPJ)
    @Deprecated
    boolean existsByCpfAndMonthAndYear(String cpf, Integer month, Integer year);
    
    // Consulta personalizada mais robusta (deprecated - usar o mÃ©todo com CNPJ)
    @Deprecated
    @Query("SELECT COUNT(p) > 0 FROM Payslip p WHERE p.cpf = :cpf AND p.month = :month AND p.year = :year")
    boolean existsByCpfAndMonthAndYearCustom(@Param("cpf") String cpf, @Param("month") Integer month, @Param("year") Integer year);
    
    // NOVO: VerificaÃ§Ã£o de duplicidade com CNPJ da empresa
    @Query("SELECT COUNT(p) > 0 FROM Payslip p WHERE " +
           "(:companyCnpj IS NULL OR p.companyCnpj = :companyCnpj) AND " +
           "p.cpf = :cpf AND p.month = :month AND p.year = :year")
    boolean existsByCompanyCnpjAndCpfAndMonthAndYear(
        @Param("companyCnpj") String companyCnpj, 
        @Param("cpf") String cpf, 
        @Param("month") Integer month, 
        @Param("year") Integer year
    );
    
    // Buscar payslips por hash do conteÃºdo (para verificar se arquivo jÃ¡ foi processado)
    List<Payslip> findByHashConteudo(String hashConteudo);
    
    List<Payslip> findAllByCpf(String cpf);
    
    // Retorna lista porque pode haver mÃºltiplos holerites com o mesmo nome de arquivo em diferentes setores/empresas
    List<Payslip> findAllByFileName(String fileName);
    
    // Retorna o primeiro holerite com o nome do arquivo (mais recente)
    // IMPORTANTE: Usar LIMIT 1 para garantir que retorne apenas 1 resultado
    @Query(value = "SELECT * FROM payslips WHERE file_name = :fileName ORDER BY processed_at DESC LIMIT 1", nativeQuery = true)
    Payslip findFirstByFileNameOrderByProcessedAtDesc(@Param("fileName") String fileName);
    
    @Query("SELECT p FROM Payslip p WHERE p.month = :month AND p.year = :year")
    List<Payslip> findByMonthAndYear(@Param("month") Integer month, @Param("year") Integer year);

    @Query("SELECT p FROM Payslip p WHERE p.cpf = :cpf AND p.month = :month AND p.year = :year ORDER BY p.processedAt DESC")
    Payslip findFirstByCpfAndMonthAndYear(@Param("cpf") String cpf, @Param("month") Integer month, @Param("year") Integer year);

    // Buscar holerites por CPF, CNPJ, setor e perÃ­odo para verificaÃ§Ã£o de alteraÃ§Ãµes
    @Query("SELECT p FROM Payslip p WHERE " +
           "(:companyCnpj IS NULL OR p.companyCnpj = :companyCnpj) AND " +
           "p.cpf = :cpf AND " +
           "(:workPostName IS NULL OR p.workPostName = :workPostName) AND " +
           "p.month = :month AND p.year = :year " +
           "ORDER BY p.processedAt DESC")
    List<Payslip> findByCompanyCnpjAndCpfAndWorkPostNameAndMonthAndYear(
        @Param("companyCnpj") String companyCnpj,
        @Param("cpf") String cpf,
        @Param("workPostName") String workPostName,
        @Param("month") Integer month,
        @Param("year") Integer year
    );
    
    // Buscar payslips por nome da empresa (busca flexÃ­vel - case insensitive e contÃ©m)
    @Query("SELECT p FROM Payslip p WHERE " +
           "LOWER(TRIM(p.companyName)) LIKE LOWER(CONCAT('%', TRIM(:companyName), '%')) " +
           "ORDER BY p.year DESC, p.month DESC, p.processedAt DESC")
    List<Payslip> findByCompanyNameContainingIgnoreCase(@Param("companyName") String companyName);
    
    // Buscar payslips por CNPJ da empresa
    @Query("SELECT p FROM Payslip p WHERE p.companyCnpj = :companyCnpj " +
           "ORDER BY p.year DESC, p.month DESC, p.processedAt DESC")
    List<Payslip> findByCompanyCnpj(@Param("companyCnpj") String companyCnpj);
    
    // Buscar payslips por nome do setor (workPostName) - busca flexÃ­vel
    @Query("SELECT p FROM Payslip p WHERE " +
           "LOWER(TRIM(p.workPostName)) LIKE LOWER(CONCAT('%', TRIM(:sectorName), '%')) " +
           "ORDER BY p.year DESC, p.month DESC, p.processedAt DESC")
    List<Payslip> findByWorkPostNameContainingIgnoreCase(@Param("sectorName") String sectorName);
} 
