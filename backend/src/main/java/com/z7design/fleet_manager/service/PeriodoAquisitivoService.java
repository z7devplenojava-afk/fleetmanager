package com.z7design.fleet_manager.service;

import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.PeriodoAquisitivo;
import com.z7design.fleet_manager.model.Vacation;
import com.z7design.fleet_manager.model.enums.PeriodoAquisitivoOrigem;
import com.z7design.fleet_manager.model.enums.PeriodoAquisitivoStatus;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.repository.AbsenceRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.PeriodoAquisitivoRepository;
import com.z7design.fleet_manager.repository.VacationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Ciclo de vida do Periodo Aquisitivo (PA) - CLT Art. 129 a 137.
 *
 * Regras implementadas (RF-01 do PRD):
 *  - Criacao automatica a cada aniversario de admissao.
 *  - Saldo inicial pela tabela de faltas injustificadas do Art. 130.
 *  - Transicao EM_ANDAMENTO -> CONCESSIVO ao fim dos 12 meses do PA.
 *  - Transicao para QUITADO quando o saldo zera.
 *  - Transicao para EXPIRADO apos limite_concessivo (risco de ferias em dobro).
 *  - Reset do PA apos ferias coletivas de colaborador com menos de 12 meses.
 *  - Extincao do PA por afastamento superior a 6 meses (Art. 133, IV).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PeriodoAquisitivoService {

    /** Duracao do periodo aquisitivo, em meses (Art. 129). */
    private static final int MESES_AQUISITIVO = 12;
    /** Duracao do periodo concessivo, em meses (Art. 134). */
    private static final int MESES_CONCESSIVO = 12;

    private final PeriodoAquisitivoRepository periodoAquisitivoRepository;
    private final EmployeeRepository employeeRepository;
    private final AbsenceRepository absenceRepository;
    private final VacationRepository vacationRepository;

    // ------------------------------------------------------------------
    // Tabela de faltas injustificadas - Art. 130
    // ------------------------------------------------------------------

    /**
     * @param faltasInjustificadas quantidade de faltas no periodo aquisitivo
     * @return dias de direito a ferias
     *  - ate 5 faltas        -> 30 dias
     *  - 6 a 14 faltas       -> 24 dias
     *  - 15 a 23 faltas      -> 18 dias
     *  - 24 a 32 faltas      -> 12 dias
     *  - acima de 32 faltas  -> perde o direito (0 dias)
     */
    public int calcularDiasDireito(int faltasInjustificadas) {
        if (faltasInjustificadas <= 5) return 30;
        if (faltasInjustificadas <= 14) return 24;
        if (faltasInjustificadas <= 23) return 18;
        if (faltasInjustificadas <= 32) return 12;
        return 0;
    }

    // ------------------------------------------------------------------
    // Criacao / geracao de PAs
    // ------------------------------------------------------------------

    /**
     * Gera (se necessario) e retorna o PA vigente do colaborador.
     * Chamado na consulta de saldo e na solicitacao de ferias.
     */
    @Transactional
    public PeriodoAquisitivo getOrCreateVigente(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Funcionario nao encontrado: " + employeeId));

        atualizarStatuses(employeeId);

        List<PeriodoAquisitivo> vigentes = periodoAquisitivoRepository.findVigentesByEmployeeId(employeeId);
        PeriodoAquisitivo atual = vigentes.stream()
            .filter(p -> p.getStatus() == PeriodoAquisitivoStatus.EM_ANDAMENTO
                      || p.getStatus() == PeriodoAquisitivoStatus.CONCESSIVO)
            .findFirst()
            .orElse(null);

        LocalDate hoje = LocalDate.now();

        if (atual != null && !hoje.isAfter(atual.getLimiteConcessivo())) {
            return atual;
        }

        // Nenhum PA utilizavel: cria o corrente a partir do aniversario de admissao.
        return gerarProximoPeriodo(employee, hoje, PeriodoAquisitivoOrigem.ADMISSAO);
    }

    /**
     * Cria o PA que esta vigente na data de referencia, a partir da data de admissao.
     */
    @Transactional
    public PeriodoAquisitivo gerarProximoPeriodo(Employee employee, LocalDate referencia, PeriodoAquisitivoOrigem origem) {
        LocalDate admissao = employee.getHireDate();
        if (admissao == null) {
            throw new IllegalArgumentException("Funcionario sem data de admissao: " + employee.getName());
        }
        if (admissao.isAfter(referencia)) {
            throw new IllegalArgumentException("Data de admissao posterior a data de referencia.");
        }

        LocalDate inicio = ultimaOcorrenciaAnual(admissao, referencia);

        return periodoAquisitivoRepository
            .findByEmployeeIdAndDataInicio(employee.getId(), inicio)
            .orElseGet(() -> criarPeriodo(employee, inicio, origem));
    }

    private PeriodoAquisitivo criarPeriodo(Employee employee, LocalDate dataInicio, PeriodoAquisitivoOrigem origem) {
        LocalDate dataFim = dataInicio.plusMonths(MESES_AQUISITIVO).minusDays(1);
        LocalDate limiteConcessivo = dataFim.plusMonths(MESES_CONCESSIVO);

        long faltas = absenceRepository.countFaltasInjustificadasByEmployeeAndDateRange(
            employee.getId(), dataInicio, dataFim);

        int diasDireito = calcularDiasDireito((int) faltas);
        int diasGozados = contarDiasGozados(employee.getId(), dataInicio, dataFim);
        int diasSaldo = Math.max(0, diasDireito - Math.min(diasGozados, diasDireito));

        PeriodoAquisitivo pa = PeriodoAquisitivo.builder()
            .employee(employee)
            .dataInicio(dataInicio)
            .dataFim(dataFim)
            .limiteConcessivo(limiteConcessivo)
            .diasDireito(diasDireito)
            .diasSaldo(diasSaldo)
            .diasUtilizados(Math.min(diasGozados, diasDireito))
            .faltasInjustificadas((int) faltas)
            .status(resolverStatus(dataFim, limiteConcessivo, diasDireito, diasSaldo))
            .origem(origem)
            .resetadoPorColetiva(origem == PeriodoAquisitivoOrigem.COLETIVA)
            .build();

        PeriodoAquisitivo salvo = periodoAquisitivoRepository.save(pa);
        log.info("PA criado para {}: {} a {} (concessivo ate {}), saldo {}/{}",
            employee.getName(), salvo.getDataInicio(), salvo.getDataFim(),
            salvo.getLimiteConcessivo(), salvo.getDiasSaldo(), salvo.getDiasDireito());
        return salvo;
    }

    private PeriodoAquisitivoStatus resolverStatus(LocalDate dataFim, LocalDate limiteConcessivo,
                                                    int diasDireito, int diasSaldo) {
        LocalDate hoje = LocalDate.now();
        if (diasDireito > 0 && diasSaldo == 0) return PeriodoAquisitivoStatus.QUITADO;
        if (hoje.isAfter(limiteConcessivo)) return PeriodoAquisitivoStatus.EXPIRADO;
        if (hoje.isAfter(dataFim)) return PeriodoAquisitivoStatus.CONCESSIVO;
        return PeriodoAquisitivoStatus.EM_ANDAMENTO;
    }

    private int contarDiasGozados(UUID employeeId, LocalDate inicio, LocalDate fim) {
        List<Vacation> ferias = vacationRepository.findByEmployeeId(employeeId);
        return ferias.stream()
            .filter(v -> v.getStatus() == VacationStatus.APPROVED
                      || v.getStatus() == VacationStatus.PENDING)
            .filter(v -> v.getStartDate() != null
                      && !v.getStartDate().isBefore(inicio)
                      && !v.getStartDate().isAfter(fim))
            .mapToInt(v -> v.getDaysTaken() != null ? v.getDaysTaken() : 0)
            .sum();
    }

    /**
     * Ultima ocorrencia do aniversario de admissao <= data de referencia.
     * Ex.: admissao 15/03/2024, referencia 20/08/2026 -> 15/03/2026.
     */
    private LocalDate ultimaOcorrenciaAnual(LocalDate admissao, LocalDate referencia) {
        long anos = ChronoUnit.YEARS.between(admissao, referencia);
        LocalDate candidata = admissao.plusYears(anos);
        if (candidata.isAfter(referencia)) {
            candidata = candidata.minusYears(1);
        }
        return candidata;
    }

    // ------------------------------------------------------------------
    // Atualizacao de status (RF-01 / RF-07)
    // ------------------------------------------------------------------

    /**
     * Recalcula o status de todos os PAs de um colaborador.
     * EM_ANDAMENTO -> CONCESSIVO -> EXPIRADO / QUITADO.
     */
    @Transactional
    public void atualizarStatuses(UUID employeeId) {
        LocalDate hoje = LocalDate.now();
        List<PeriodoAquisitivo> todos = periodoAquisitivoRepository
            .findByEmployeeIdOrderByDataInicioDesc(employeeId);

        for (PeriodoAquisitivo pa : todos) {
            PeriodoAquisitivoStatus novo = pa.getStatus();
            if (pa.getDiasDireito() != null && pa.getDiasDireito() > 0
                    && pa.getDiasSaldo() != null && pa.getDiasSaldo() == 0) {
                novo = PeriodoAquisitivoStatus.QUITADO;
            } else if (hoje.isAfter(pa.getLimiteConcessivo())) {
                novo = PeriodoAquisitivoStatus.EXPIRADO;
            } else if (hoje.isAfter(pa.getDataFim())) {
                novo = pa.getStatus() == PeriodoAquisitivoStatus.QUITADO
                    ? PeriodoAquisitivoStatus.QUITADO
                    : PeriodoAquisitivoStatus.CONCESSIVO;
            } else {
                novo = pa.getStatus() == PeriodoAquisitivoStatus.QUITADO
                    ? PeriodoAquisitivoStatus.QUITADO
                    : PeriodoAquisitivoStatus.EM_ANDAMENTO;
            }
            if (novo != pa.getStatus()) {
                pa.setStatus(novo);
                periodoAquisitivoRepository.save(pa);
            }
        }
    }

    /**
     * Varre todos os PAs e aplica as transicoes de status.
     * Usado pelo scheduler de alertas (RF-07) e por jobs de manutencao.
     */
    @Transactional
    public int atualizarStatusesGeral() {
        LocalDate hoje = LocalDate.now();
        List<PeriodoAquisitivo> vencendo = periodoAquisitivoRepository
            .findByStatusInAndLimiteConcessivoBetween(
                List.of(PeriodoAquisitivoStatus.EM_ANDAMENTO, PeriodoAquisitivoStatus.CONCESSIVO),
                hoje.minusYears(1), hoje.plusYears(1));

        int alterados = 0;
        for (PeriodoAquisitivo pa : vencendo) {
            PeriodoAquisitivoStatus atual = pa.getStatus();
            PeriodoAquisitivoStatus novo = atual;
            boolean zerado = pa.getDiasDireito() != null && pa.getDiasDireito() > 0
                    && pa.getDiasSaldo() != null && pa.getDiasSaldo() == 0;

            if (zerado) {
                novo = PeriodoAquisitivoStatus.QUITADO;
            } else if (hoje.isAfter(pa.getLimiteConcessivo())) {
                novo = PeriodoAquisitivoStatus.EXPIRADO;
            } else if (hoje.isAfter(pa.getDataFim())) {
                novo = PeriodoAquisitivoStatus.CONCESSIVO;
            } else {
                novo = PeriodoAquisitivoStatus.EM_ANDAMENTO;
            }

            if (novo != atual) {
                pa.setStatus(novo);
                periodoAquisitivoRepository.save(pa);
                alterados++;
            }
        }
        return alterados;
    }

    // ------------------------------------------------------------------
    // Consumo de saldo
    // ------------------------------------------------------------------

    /**
     * Abate dias do saldo do PA apos o gozo. Zera -> QUITADO (RF-01).
     */
    @Transactional
    public PeriodoAquisitivo abaterSaldo(UUID periodoAquisitivoId, int dias) {
        PeriodoAquisitivo pa = findById(periodoAquisitivoId);
        int novoSaldo = Math.max(0, (pa.getDiasSaldo() == null ? 0 : pa.getDiasSaldo()) - dias);
        pa.setDiasSaldo(novoSaldo);
        pa.setDiasUtilizados((pa.getDiasUtilizados() == null ? 0 : pa.getDiasUtilizados()) + dias);
        if (novoSaldo == 0 && pa.getDiasDireito() != null && pa.getDiasDireito() > 0) {
            pa.setStatus(PeriodoAquisitivoStatus.QUITADO);
        }
        return periodoAquisitivoRepository.save(pa);
    }

    /**
     * Fase 2: devolve dias ao saldo quando uma solicitacao aprovada e
     * rejeitada/cancelada. Nunca ultrapassa o total de dias de direito do PA.
     */
    @Transactional
    public PeriodoAquisitivo estornarSaldo(UUID periodoAquisitivoId, int dias) {
        if (dias <= 0) return findById(periodoAquisitivoId);
        PeriodoAquisitivo pa = findById(periodoAquisitivoId);
        int teto = pa.getDiasDireito() == null ? dias : pa.getDiasDireito();
        int novoSaldo = Math.min(teto,
            (pa.getDiasSaldo() == null ? 0 : pa.getDiasSaldo()) + dias);
        int devolvido = novoSaldo - (pa.getDiasSaldo() == null ? 0 : pa.getDiasSaldo());
        pa.setDiasSaldo(novoSaldo);
        pa.setDiasUtilizados(Math.max(0,
            (pa.getDiasUtilizados() == null ? 0 : pa.getDiasUtilizados()) - devolvido));
        if (pa.getStatus() == PeriodoAquisitivoStatus.QUITADO && novoSaldo > 0) {
            pa.setStatus(pa.getLimiteConcessivo() != null && pa.getLimiteConcessivo().isBefore(LocalDate.now())
                ? PeriodoAquisitivoStatus.EXPIRADO : PeriodoAquisitivoStatus.CONCESSIVO);
        }
        return periodoAquisitivoRepository.save(pa);
    }

    /**
     * Extincao do PA e criacao de um novo (reset).
     * Usado por ferias coletivas (Art. 140) e retorno de afastamento > 6 meses (Art. 133, IV).
     */
    @Transactional
    public PeriodoAquisitivo resetar(UUID employeeId, LocalDate novoInicio, PeriodoAquisitivoOrigem origem) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Funcionario nao encontrado: " + employeeId));

        // Encerra o PA vigente
        periodoAquisitivoRepository.findVigentesByEmployeeId(employeeId).stream()
            .filter(p -> p.getStatus() == PeriodoAquisitivoStatus.EM_ANDAMENTO
                      || p.getStatus() == PeriodoAquisitivoStatus.CONCESSIVO)
            .forEach(p -> {
                if (p.getStatus() != PeriodoAquisitivoStatus.QUITADO) {
                    p.setStatus(PeriodoAquisitivoStatus.QUITADO);
                    p.setObservacoes(concatenarObservacoes(p.getObservacoes(),
                        "Encerrado por reset em " + LocalDate.now() + " (" + origem + ")"));
                    periodoAquisitivoRepository.save(p);
                }
            });

        LocalDate inicio = novoInicio;
        return periodoAquisitivoRepository
            .findByEmployeeIdAndDataInicio(employeeId, inicio)
            .orElseGet(() -> criarPeriodo(employee, inicio, origem));
    }

    /**
     * Art. 133, IV: afastamento por doenca/acidente superior a 6 meses (continuos ou
     * descontinuos) no mesmo PA extingue o periodo e reinicia a contagem no retorno.
     *
     * @return true se o PA foi extinto e um novo criado.
     */
    @Transactional
    public boolean extinguirPorAfastamento(UUID employeeId, LocalDate dataRetorno) {
        PeriodoAquisitivo pa = getOrCreateVigente(employeeId);
        if (pa == null) return false;

        // Janela de 6 meses dentro do mesmo PA (Art. 133, IV)
        boolean ultrapassouSeisMeses = !pa.getDataInicio().plusMonths(6).isAfter(dataRetorno);
        if (!ultrapassouSeisMeses) {
            return false;
        }

        pa.setStatus(PeriodoAquisitivoStatus.QUITADO);
        pa.setObservacoes(concatenarObservacoes(pa.getObservacoes(),
            "PA extinto por afastamento superior a 6 meses (Art. 133, IV) em " + LocalDate.now()));
        periodoAquisitivoRepository.save(pa);

        LocalDate novoInicio = dataRetorno.isAfter(pa.getDataInicio()) ? dataRetorno : LocalDate.now();
        criarPeriodo(pa.getEmployee() != null ? pa.getEmployee()
                : employeeRepository.findById(employeeId).orElseThrow(),
            novoInicio, PeriodoAquisitivoOrigem.RETORNO_AFASTAMENTO);

        log.info("PA extinto por afastamento > 6 meses para colaborador {}", employeeId);
        return true;
    }

    // ------------------------------------------------------------------
    // Consultas
    // ------------------------------------------------------------------

    public PeriodoAquisitivo findById(UUID id) {
        return periodoAquisitivoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Periodo aquisitivo nao encontrado: " + id));
    }

    public List<PeriodoAquisitivo> findByEmployeeId(UUID employeeId) {
        return periodoAquisitivoRepository.findByEmployeeIdOrderByDataInicioDesc(employeeId);
    }

    /**
     * PAs cujo periodo concessivo vence na janela informada (alertas 90/60/30 - RF-07).
     */
    public List<PeriodoAquisitivo> findConcessivosVencendoAte(LocalDate limite) {
        return periodoAquisitivoRepository.findByStatusInAndLimiteConcessivoBefore(
            List.of(PeriodoAquisitivoStatus.EM_ANDAMENTO, PeriodoAquisitivoStatus.CONCESSIVO), limite);
    }

    /**
     * Alertas de periodo concessivo com o nome do colaborador (o campo employee
     * da entidade usa @JsonBackReference e nao vai ao JSON). Resolve o proxy
     * lazy dentro da transacao de leitura.
     */
    @Transactional(readOnly = true)
    public List<AlertaConcessivo> buscarAlertasConcessivo(LocalDate limite) {
        return findConcessivosVencendoAte(limite).stream()
            .map(pa -> {
                Employee emp = pa.getEmployee();
                return new AlertaConcessivo(
                    pa.getId(),
                    emp != null ? emp.getId() : null,
                    emp != null ? emp.getName() : null,
                    pa.getDataInicio(),
                    pa.getDataFim(),
                    pa.getLimiteConcessivo(),
                    pa.getDiasDireito(),
                    pa.getDiasSaldo(),
                    pa.getDiasUtilizados(),
                    pa.getStatus());
            })
            .toList();
    }

    /**
     * Linha de alerta de vencimento de periodo concessivo (RF-07).
     */
    public record AlertaConcessivo(
            UUID id,
            UUID employeeId,
            String employeeName,
            LocalDate dataInicio,
            LocalDate dataFim,
            LocalDate limiteConcessivo,
            Integer diasDireito,
            Integer diasSaldo,
            Integer diasUtilizados,
            PeriodoAquisitivoStatus status) {}

    /**
     * Simula o saldo de um colaborador sem persistir (usado pelo portal e pelo DP).
     */
    public SaldoSimulado simularSaldo(UUID employeeId) {
        PeriodoAquisitivo pa = getOrCreateVigente(employeeId);
        Employee emp = employeeRepository.findById(employeeId).orElseThrow();
        LocalDate hoje = LocalDate.now();

        Period periodo = Period.between(emp.getHireDate(), hoje);
        boolean primeiroAno = periodo.getYears() == 0 && periodo.getMonths() < 11;

        return new SaldoSimulado(
            pa.getId(),
            pa.getDataInicio(),
            pa.getDataFim(),
            pa.getLimiteConcessivo(),
            pa.getDiasDireito(),
            pa.getDiasSaldo(),
            pa.getDiasUtilizados(),
            pa.getFaltasInjustificadas(),
            pa.getStatus(),
            primeiroAno,
            diasAte(pa.getLimiteConcessivo(), hoje),
            pa.getDiasSaldo() / 3
        );
    }

    private long diasAte(LocalDate data, LocalDate hoje) {
        if (data == null) return 0;
        return Math.max(0, ChronoUnit.DAYS.between(hoje, data));
    }

    private String concatenarObservacoes(String atual, String nova) {
        if (atual == null || atual.isBlank()) return nova;
        return atual + " | " + nova;
    }

    /**
     * DTO de leitura do saldo consolidado do colaborador.
     */
    public record SaldoSimulado(
        UUID periodoAquisitivoId,
        LocalDate dataInicio,
        LocalDate dataFim,
        LocalDate limiteConcessivo,
        int diasDireito,
        int diasSaldo,
        int diasUtilizados,
        int faltasInjustificadas,
        PeriodoAquisitivoStatus status,
        boolean primeiroAnoContrato,
        long diasAteLimiteConcessivo,
        int maximoAbonoPecuniario
    ) {}
}
