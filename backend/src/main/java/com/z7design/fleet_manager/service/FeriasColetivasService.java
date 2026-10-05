package com.z7design.fleet_manager.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.FeriasColetivas;
import com.z7design.fleet_manager.model.PeriodoAquisitivo;
import com.z7design.fleet_manager.model.Vacation;
import com.z7design.fleet_manager.model.VacationBloco;
import com.z7design.fleet_manager.model.enums.EmploymentStatus;
import com.z7design.fleet_manager.model.enums.PeriodoAquisitivoOrigem;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.model.enums.VacationType;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.FeriasColetivasRepository;
import com.z7design.fleet_manager.repository.VacationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Ferias Coletivas - CLT Art. 139 e 140 (RF-04 do PRD).
 *
 * Regras cobertas (Secao 2.3 do PRD):
 * - Empregados com menos de 12 meses gozam ferias proporcionais (2,5 dias/mes).
 * - Dias excedentes ao saldo proporcional sao lancados como Licenca Remunerada
 *   (campo diasLicencaRemunerada da solicitacao).
 * - Apos o gozo, para quem tem menos de 12 meses, inicia-se um NOVO PA
 *   a partir do primeiro dia das ferias coletivas (origem COLETIVA).
 * - Colaboradora em licenca-maternidade (MATERNITY_LEAVE) nao e atingida;
 *   o saldo permanece intacto.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeriasColetivasService {

    /** Proporcionalidade para menos de 12 meses: 2,5 dias por mes trabalhado (Art. 140). */
    public static final double DIAS_POR_MES_PROPORCIONAL = 2.5;
    /** Fracao minima de mes considerada: 14 dias corridos (Art. 140). */
    public static final int FRACAO_MINIMA_DIAS = 14;
    /** Status possiveis das coletivas. */
    public static final String STATUS_PLANEJADO = "Planejado";
    public static final String STATUS_EM_ANDAMENTO = "Em Andamento";
    public static final String STATUS_CONCLUIDO = "Concluido";
    public static final String STATUS_CANCELADO = "Cancelado";

    private final FeriasColetivasRepository feriasColetivasRepository;
    private final EmployeeRepository employeeRepository;
    private final VacationRepository vacationRepository;
    private final PeriodoAquisitivoService periodoAquisitivoService;

    @Transactional
    public FeriasColetivas create(FeriasColetivas coletiva) {
        validar(coletiva);
        coletiva.setDiasDuracao((int) (ChronoUnit.DAYS.between(
            coletiva.getDataInicio(), coletiva.getDataFim()) + 1));
        if (coletiva.getStatus() == null) {
            coletiva.setStatus(STATUS_PLANEJADO);
        }
        FeriasColetivas salva = feriasColetivasRepository.save(coletiva);
        log.info("Ferias coletivas criadas: '{}' de {} a {} ({} dias)",
            salva.getTitulo(), salva.getDataInicio(), salva.getDataFim(), salva.getDiasDuracao());
        return salva;
    }

    @Transactional
    public FeriasColetivas update(UUID id, FeriasColetivas coletiva) {
        FeriasColetivas existing = findById(id);
        if (STATUS_EM_ANDAMENTO.equals(existing.getStatus()) || STATUS_CONCLUIDO.equals(existing.getStatus())) {
            throw new IllegalArgumentException(
                "Coletiva em andamento ou concluida nao pode ser editada; cancele e crie uma nova.");
        }
        coletiva.setId(id);
        validar(coletiva);
        coletiva.setDiasDuracao((int) (ChronoUnit.DAYS.between(
            coletiva.getDataInicio(), coletiva.getDataFim()) + 1));
        coletiva.setCreatedAt(existing.getCreatedAt());
        coletiva.setStatus(coletiva.getStatus() != null ? coletiva.getStatus() : existing.getStatus());
        return feriasColetivasRepository.save(coletiva);
    }

    @Transactional
    public void cancel(UUID id) {
        FeriasColetivas existing = findById(id);
        existing.setStatus(STATUS_CANCELADO);
        feriasColetivasRepository.save(existing);
        log.info("Ferias coletivas canceladas: {}", id);
    }

    @Transactional
    public void delete(UUID id) {
        FeriasColetivas existing = findById(id);
        if (!STATUS_PLANEJADO.equals(existing.getStatus())) {
            throw new IllegalArgumentException(
                "Apenas coletivas ainda planejadas podem ser excluidas; use o cancelamento.");
        }
        feriasColetivasRepository.deleteById(id);
    }

    // ------------------------------------------------------------------
    // Processamento em massa (RF-04) - Fase 2
    // ------------------------------------------------------------------

    /**
     * Processa a coletiva: gera uma solicitacao de ferias aprovada para cada
     * colaborador elegivel, abate o saldo do PA vigente e, para menos de 12
     * meses de contrato, abre um novo PA a partir do inicio da coletiva.
     *
     * Idempotente: colaboradores ja processados sao pulados.
     *
     * @return resumo quantitativo para exibicao ao operador de RH.
     */
    @Transactional
    public ResultadoProcessamento processar(UUID id) {
        FeriasColetivas coletiva = findById(id);

        if (STATUS_CANCELADO.equals(coletiva.getStatus())) {
            throw new IllegalArgumentException("Coletiva cancelada nao pode ser processada.");
        }
        if (STATUS_CONCLUIDO.equals(coletiva.getStatus())) {
            throw new IllegalArgumentException("Coletiva ja concluida.");
        }

        List<Employee> alvos = resolverColaboradores(coletiva);
        int processados = 0;
        int pulados = 0;
        int afastadas = 0;
        int totalGozo = 0;
        int totalLicenca = 0;

        for (Employee emp : alvos) {
            if (emp.getHireDate() == null) {
                pulados++;
                continue;
            }
            if (emp.getStatus() == EmploymentStatus.MATERNITY_LEAVE) {
                // PRD: licenca-maternidade nao e atingida; saldo permanece intacto
                afastadas++;
                continue;
            }
            if (vacationRepository.existsByFeriasColetivasIdAndEmployeeId(coletiva.getId(), emp.getId())) {
                pulados++; // ja processado nesta coletiva
                continue;
            }

            LocalDate inicio = coletiva.getDataInicio();
            LocalDate fim = coletiva.getDataFim();
            int duracao = coletiva.getDiasDuracao();

            long meses = ChronoUnit.MONTHS.between(emp.getHireDate(), inicio);
            PeriodoAquisitivo pa = periodoAquisitivoService.getOrCreateVigente(emp.getId());

            int gozo;
            int licenca = 0;

            if (meses >= 12) {
                // Direito integral: goza o que tem de saldo; excedente vira licenca
                int saldo = pa.getDiasSaldo() == null ? 0 : pa.getDiasSaldo();
                gozo = Math.min(duracao, saldo);
                licenca = duracao - gozo;
            } else {
                // Menos de 12 meses: saldo proporcional (Art. 140)
                int diasFracao = (int) ChronoUnit.DAYS.between(emp.getHireDate().plusMonths(meses), inicio);
                int saldoProporcional = calcularSaldoProporcional((int) meses, diasFracao);
                gozo = Math.min(duracao, saldoProporcional);
                licenca = duracao - gozo;
            }

            Vacation vacation = Vacation.builder()
                .employee(emp)
                .startDate(inicio)
                .endDate(fim)
                .daysTaken(gozo)
                .remainingDays(Math.max(0, (pa.getDiasSaldo() == null ? 0 : pa.getDiasSaldo()) - gozo))
                .status(VacationStatus.APPROVED)
                .vacationType(VacationType.NORMAL)
                .periodoAquisitivo(pa)
                .feriasColetivas(coletiva)
                .blocos(List.of(VacationBloco.builder()
                    .inicio(inicio).fim(fim).dias(duracao).build()))
                .numeroBlocos(1)
                .diasAbono(0)
                .diasLicencaRemunerada(licenca)
                .saldoAbatido(gozo > 0)
                .observacoes("Ferias coletivas: " + coletiva.getTitulo()
                    + (licenca > 0 ? " | " + licenca + " dia(s) como licenca remunerada (Art. 140)" : ""))
                .build();

            vacationRepository.save(vacation);

            if (meses >= 12) {
                if (gozo > 0) {
                    periodoAquisitivoService.abaterSaldo(pa.getId(), gozo);
                }
            } else if (gozo > 0) {
                // PRD: apos o gozo do primeiro ano inicia-se um NOVO PA
                // a partir do primeiro dia das ferias coletivas (origem COLETIVA).
                periodoAquisitivoService.resetar(emp.getId(), inicio, PeriodoAquisitivoOrigem.COLETIVA);
            }

            totalGozo += gozo;
            totalLicenca += licenca;
            processados++;
        }

        coletiva.setStatus(STATUS_EM_ANDAMENTO);
        feriasColetivasRepository.save(coletiva);

        ResultadoProcessamento resultado = new ResultadoProcessamento(
            coletiva.getId(), alvos.size(), processados, pulados, afastadas,
            totalGozo, totalLicenca, STATUS_EM_ANDAMENTO);

        log.info("Coletiva '{}' processada: alvo={}, processados={}, pulados={}, afastadas={}, gozo={}, licenca={}",
            coletiva.getTitulo(), alvos.size(), processados, pulados, afastadas, totalGozo, totalLicenca);
        return resultado;
    }

    /**
     * Marca a coletiva como concluida (apos o termino do gozo em massa).
     */
    @Transactional
    public FeriasColetivas concluir(UUID id) {
        FeriasColetivas coletiva = findById(id);
        if (STATUS_EM_ANDAMENTO.equals(coletiva.getStatus())) {
            coletiva.setStatus(STATUS_CONCLUIDO);
            feriasColetivasRepository.save(coletiva);
            log.info("Coletiva '{}' concluida", coletiva.getTitulo());
        } else if (!STATUS_CONCLUIDO.equals(coletiva.getStatus())) {
            throw new IllegalArgumentException(
                "Processe a coletiva antes de conclui-la (status atual: " + coletiva.getStatus() + ").");
        }
        return coletiva;
    }

    /**
     * Colaboradores atingidos pela coletiva: ativos (ou em ferias/atestado),
     * excluindo desligados e afastados com licenca-maternidade.
     * Quando a coletiva nao abrange toda a empresa, filtra pelos departamentos.
     */
    private List<Employee> resolverColaboradores(FeriasColetivas coletiva) {
        List<Employee> todos = employeeRepository.findAll();
        List<UUID> departamentos = coletiva.getDepartamentoIds() != null
            && !coletiva.getDepartamentoIds().isEmpty() ? coletiva.getDepartamentoIds() : null;

        List<Employee> alvos = new ArrayList<>();
        for (Employee emp : todos) {
            if (emp.getStatus() == EmploymentStatus.TERMINATED
                    || emp.getStatus() == EmploymentStatus.INACTIVE
                    || emp.getStatus() == EmploymentStatus.SUSPENDED) {
                continue;
            }
            if (coletiva.getAbrangeTodaEmpresa() == null || Boolean.TRUE.equals(coletiva.getAbrangeTodaEmpresa())) {
                alvos.add(emp);
            } else if (departamentos != null && emp.getDepartment() != null
                    && departamentos.contains(emp.getDepartment().getId())) {
                alvos.add(emp);
            }
        }
        return alvos;
    }

    public FeriasColetivas findById(UUID id) {
        return feriasColetivasRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Ferias coletivas nao encontradas: " + id));
    }

    public List<FeriasColetivas> findAll() {
        return feriasColetivasRepository.findAll();
    }

    public List<FeriasColetivas> findByPeriodo(LocalDate inicio, LocalDate fim) {
        return feriasColetivasRepository.findByDataInicioBetween(inicio, fim);
    }

    /**
     * Saldo proporcional para colaborador com menos de 12 meses (Art. 140).
     *
     * @param mesesCompletos meses completos de contrato
     * @param diasFracao dias corridos desde o ultimo aniversario de admissao
     * @return dias proporcionais (2,5 por mes, considerando fracao > 14 dias)
     */
    public int calcularSaldoProporcional(int mesesCompletos, int diasFracao) {
        if (mesesCompletos >= 12) return 30;
        double base = mesesCompletos * DIAS_POR_MES_PROPORCIONAL;
        // Fracao de mes: apenas se superior a 14 dias corridos (Art. 140)
        if (diasFracao > FRACAO_MINIMA_DIAS) {
            base += DIAS_POR_MES_PROPORCIONAL;
        }
        return (int) Math.min(30, Math.floor(base));
    }

    private void validar(FeriasColetivas coletiva) {
        if (coletiva.getTitulo() == null || coletiva.getTitulo().isBlank()) {
            throw new IllegalArgumentException("Titulo das ferias coletivas e obrigatorio");
        }
        if (coletiva.getDataInicio() == null || coletiva.getDataFim() == null) {
            throw new IllegalArgumentException("Datas de inicio e fim sao obrigatorias");
        }
        if (coletiva.getDataFim().isBefore(coletiva.getDataInicio())) {
            throw new IllegalArgumentException("Data final nao pode ser anterior a data inicial");
        }
        if (Boolean.FALSE.equals(coletiva.getAbrangeTodaEmpresa())
                && (coletiva.getDepartamentoIds() == null || coletiva.getDepartamentoIds().isEmpty())) {
            throw new IllegalArgumentException(
                "Selecione ao menos um departamento ou marque 'Toda a empresa'");
        }
    }

    /** Resumo quantitativo do processamento de uma coletiva. */
    public record ResultadoProcessamento(
        UUID coletivaId,
        int totalAlvos,
        int processados,
        int pulados,
        int afastadasMaternidade,
        int diasGozo,
        int diasLicencaRemunerada,
        String status
    ) {}
}
