package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeePdfImportServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private CompanyRepository companyRepository;

    private EmployeePdfImportService service;

    @BeforeEach
    void setUp() {
        service = new EmployeePdfImportService(employeeRepository, companyRepository);

        lenient().when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void testParseAndSaveEmployee_SingleSuccess() {
        String samplePdfText = """
                Empresa:  VIACAO SAO SILVESTRE LTDA Nº  
                CNPJ/CEI:  71.055.644/0001-25
                Ativ Federal:  4929-9/02
                Endereço:  Rua: DOS ESPORTES, 45
                Bairro:  CENTRO
                Município:  Moeda - MG - 35.470-00
                Nome:  ADAIR JOSE SOARES DE ABREU Mat: 661 Código:  000972
                Pai:  DOMINGOS JAQUES COSTA Nr. Recibo:  1.1.0000000037172514197
                Mãe:  LEIA ALVES PEREIRA
                Nascimento:  23/01/1973 Sexo:  Masculino Est. Civil: Casado Raça/Cor: Branca
                Naturalidade:  Belo horizonte - MG Nacionalidade:  Brasileiro
                Endereço:  Rua   Rua Jeremias,   1    
                Bairro:   Bonsucesso  Barreiro CEP:  30.622-582
                Município:  Belo horizonte - MG
                CPF:  856.553.506-10
                RG:  Órgão:  Estado:    Emissão RG:  
                Número CTPS:  8565535 Série CTPS:  0610 Estado CTPS:  MG Expedição CTPS:  
                PIS:  000.00000.00.0 Cadastro PIS:  
                Instrução:  Ensino médio completo
                CNH:  Categoria CNH:  Validade CNH:  
                Reservista:  Categoria:  Tít. Eleitoral: 1005749602/30 Zona: 333 Seção:  
                Banco:  Conta:   Dígito:  Agência:   
                Sindicato:  SETCEMG
                Cons. Profis:   Registro Profis:  Data Registro: 
                Contrato de Trabalho
                Admissão:  02/01/2026
                Optante FGTS:  Sim Data Opção:  02/01/2026 Conta FGTS:   
                Cargo:  Motorista de Onibus Rodoviario   CBO:  782405
                Organograma:  GERAL
                Remuneração:  3.470,62 Modo Pgto:  Dinheiro Período:  Mensal
                Escala:  08:00 às 11:48/13:00 às 18:00
                Ficha Familiar Nome Nascimento Parentesco
                3 REJANE ALVES COSTA 28/07/1974 Cônjuge
                """;

        Company mockCompany = new Company();
        mockCompany.setId(UUID.randomUUID());
        mockCompany.setName("VIACAO SAO SILVESTRE LTDA");
        mockCompany.setCnpj("71.055.644/0001-25");

        when(companyRepository.findByNormalizedCnpj("71055644000125")).thenReturn(List.of(mockCompany));

        Employee result = service.parseAndSaveEmployee(samplePdfText);

        assertNotNull(result);
        assertEquals("ADAIR JOSE SOARES DE ABREU", result.getName());
        assertEquals("85655350610", result.getDocument());
        assertEquals("661", result.getRegistrationNumber());
        assertEquals("000972", result.getCodigoFuncionario());
        assertEquals("DOMINGOS JAQUES COSTA", result.getNomePai());
        assertEquals("LEIA ALVES PEREIRA", result.getNomeMae());
        assertEquals("1.1.0000000037172514197", result.getNumeroRecibo());
        assertEquals(LocalDate.of(1973, 1, 23), result.getBirthDate());
        assertEquals("Masculino", result.getSexo());
        assertEquals("Casado", result.getMaritalStatus());
        assertEquals("Branca", result.getRacaCor());

        assertEquals("8565535", result.getCtps());
        assertEquals("0610", result.getCtpsSeries());
        assertEquals("MG", result.getCtpsUf());
        assertEquals("SETCEMG", result.getSindicato());

        assertEquals(LocalDate.of(2026, 1, 2), result.getHireDate());
        assertTrue(result.getFgtsOptante());
        assertEquals(LocalDate.of(2026, 1, 2), result.getFgtsDataOpcao());
        assertEquals("782405", result.getCbo());
        assertEquals("GERAL", result.getOrganograma());
        assertEquals(new BigDecimal("3470.62"), result.getSalario());
        assertEquals("Dinheiro", result.getModoPagamento());
        assertEquals("Mensal", result.getPeriodoPagamento());
        assertEquals("08:00 às 11:48/13:00 às 18:00", result.getEscalaTrabalho());

        assertEquals("REJANE ALVES COSTA", result.getSpouseName());
        assertEquals(LocalDate.of(1974, 7, 28), result.getSpouseBirthDate());

        assertEquals("VIACAO SAO SILVESTRE LTDA", result.getEmpresaNome());
        assertEquals("71.055.644/0001-25", result.getEmpresaCnpj());
    }
}
