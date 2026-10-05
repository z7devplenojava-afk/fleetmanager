package com.z7design.fleet_manager.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.PeriodoAquisitivo;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.model.VacationBloco;
import com.z7design.fleet_manager.model.enums.PeriodoAquisitivoStatus;
import com.z7design.fleet_manager.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Motor de validacao de datas e regras CLT das solicitacoes de ferias (RF-02, RF-03, RF-05).
 *
 * Regras cobertas:
 *  - RF-02: fracionamento em ate 3 blocos, sendo um >= 14 dias e os demais >= 5 dias
 *           (Art. 134, §1º, apos Lei 13.467/2017).
 *  - RF-02: bloqueio se a data inicial cair nos 2 dias que antecedem DSR ou feriado
 *           (Art. 134, §3º).
 *  - RF-03: abono pecuniario limitado a 1/3 do saldo (Art. 143) + alerta de prazo de
 *           15 dias antes do fim do periodo aquisitivo.
 *  - Limite do periodo concessivo (Art. 134) e alerta de ferias em dobro (Art. 137).
 *  - Elegibilidade no primeiro ano (Art. 129 / 140 §1º).
 *  - Saldo disponivel no PA.
 *
 * RNF-02: todas as validacoes sao O(feriados do intervalo), sem I/O por dia -> < 800ms.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VacationValidationService {

    /** Minimo de dias corridos para o maior bloco (Art. 134, §1º). */
    public static final int MINIMO_BLOCO_PRINCIPAL = 14;
    /** Minimo de dias corridos para os demais blocos (Art. 134, §1º). */
    public static final int MINIMO_BLOCO_SECUNDARIO = 5;
    /** Maximo de blocos de gozo (Art. 134, §1º). */
    public static final int MAXIMO_BLOCOS = 3;
    /** Abono pecuniario: 1/3 do periodo (Art. 143). */
    public static final int FRACAO_ABONO = 3;
    /** Prazo de requerimento do abono: 15 dias antes do fim do PA (Art. 143). */
    public static final int PRAZO_ABONO_DIAS = 15;
    /** Dias que antecedem DSR/feriado em que o gozo nao pode iniciar (Art. 134, §3º). */
    public static final int DIAS_PROTECAO_ANTERIOR = 2;

    private final HolidayService holidayService;
    private final EmployeeRepository employeeRepository;
    private final PeriodoAquisitivoService periodoAquisitivoService;
    private final com.z7design.fleet_manager.repository.FeriasColetivasRepository feriasColetivasRepository;

    // ------------------------------------------------------------------
    // API principal
    // ------------------------------------------------------------------

    /**
     * Valida integralmente uma solicitacao de ferias.
     *
     * @param employeeId      colaborador
     * @param dataInicio      data de inicio do primeiro bloco
     * @param blocos          blocos de gozo (1 a 3). Se null, deriva de dataInicio + diasGozo.
     * @param diasAbono       dias convertidos em abono pecuniario
     * @param periodoAquisitivoId PA informado (opcional - se null usa o vigente)
     * @return resultado com violacoes impeditivas e alertas
     */
    @Transactional(readOnly = true)
    public ValidacaoFerias validar(UUID employeeId,
                                   LocalDate dataInicio,
                                   List<VacationBloco> blocos,
                                   int diasAbono,
                                   UUID periodoAquisitivoId) {
        List<String> violacoes = new ArrayList<>();
        List<String> alertas = new ArrayList<>();

        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Funcionario nao encontrado: " + employeeId));

        PeriodoAquisitivo pa = periodoAquisitivoId != null
            ? periodoAquisitivoService.findById(periodoAquisitivoId)
            : periodoAquisitivoService.getOrCreateVigente(employeeId);

        LocalDate hoje = LocalDate.now();

        // ------------------------------------------------------------
        // 1) Blocos / fracionamento (RF-02, Art. 134 §1º)
        // ------------------------------------------------------------
        List<VacationBloco> blocosEfetivos = normalizarBlocos(dataInicio, blocos);
        int totalDiasGozo = somarDias(blocosEfetivos);

        if (blocosEfetivos.isEmpty()) {
            violacoes.add("Informe a data de inicio e a quantidade de dias de gozo.");
        } else {
            if (blocosEfetivos.size() > MAXIMO_BLOCOS) {
                violacoes.add("As ferias podem ser parceladas em no maximo " + MAXIMO_BLOCOS
                    + " periodos (Art. 134, §1º).");
            }

            long principal = blocosEfetivos.stream()
                .mapToLong(VacationBloco::getDias).max().orElse(0);
            long menor = blocosEfetivos.stream()
                .mapToLong(VacationBloco::getDias).min().orElse(0);

            if (blocosEfetivos.size() == 1) {
                if (blocosEfetivos.get(0).getDias() < 1) {
                    violacoes.add("A quantidade de dias de gozo deve ser maior que zero.");
                }
            } else {
                if (principal < MINIMO_BLOCO_PRINCIPAL) {
                    violacoes.add("No fracionamento, pelo menos um periodo deve ter no minimo "
                        + MINIMO_BLOCO_PRINCIPAL + " dias corridos (Art. 134, §1º). Maior bloco atual: "
                        + principal + " dia(s).");
                }
                if (menor < MINIMO_BLOCO_SECUNDARIO) {
                    violacoes.add("Todos os demais periodos devem ter no minimo "
                        + MINIMO_BLOCO_SECUNDARIO + " dias corridos (Art. 134, §1º). Menor bloco atual: "
                        + menor + " dia(s).");
                }
            }

            // Ordem cronologica e nao sobreposicao
            for (int i = 1; i < blocosEfetivos.size(); i++) {
                VacationBloco anterior = blocosEfetivos.get(i - 1);
                VacationBloco atual = blocosEfetivos.get(i);
                if (anterior.getFim() != null && atual.getInicio() != null
                        && atual.getInicio().isBefore(anterior.getFim().plusDays(1))) {
                    violacoes.add("Os periodos de gozo nao podem se sobrepor.");
                    break;
                }
            }
        }

        // ------------------------------------------------------------
        // 2) Validacao da data inicial: Art. 134 §3º (RF-05)
        // ------------------------------------------------------------
        if (dataInicio != null) {
            if (dataInicio.isBefore(hoje)) {
                violacoes.add("A data de inicio das ferias nao pode ser anterior a data atual.");
            }
            validarRestricaoInicio(dataInicio, employee, violacoes);
        }

        // ------------------------------------------------------------
        // 3) Periodo aquisitivo / primeiro ano / limite concessivo
        // ------------------------------------------------------------
        if (pa == null) {
            violacoes.add("Colaborador sem periodo aquisitivo cadastrado.");
        } else {
            if (pa.getStatus() == PeriodoAquisitivoStatus.EXPIRADO) {
                violacoes.add("O periodo concessivo deste periodo aquisitivo expirou em "
                    + pa.getLimiteConcessivo() + ". A concessao nestas condicoes exige tratamento "
                    + "de ferias em dobro (Art. 137) - acione o DP.");
            }
            if (pa.getStatus() == PeriodoAquisitivoStatus.QUITADO) {
                violacoes.add("O saldo deste periodo aquisitivo esta quitado.");
            }

            // Elegibilidade no primeiro ano (Secao 2.2 do PRD)
            if (primeiroAnoContrato(employee, hoje) && !haColetivaVigente()) {
                violacoes.add("O colaborador ainda nao completou o primeiro periodo aquisitivo "
                    + "(12 meses) e nao tem direito a ferias individuais (Art. 129).");
            }

            // Saldo
            int saldoDisponivel = pa.getDiasSaldo() == null ? 0 : pa.getDiasSaldo();
            if (totalDiasGozo + diasAbono > saldoDisponivel) {
                violacoes.add("Saldo insuficiente: solicitado " + (totalDiasGozo + diasAbono)
                    + " dia(s) e disponivel " + saldoDisponivel
                    + " dia(s) no periodo aquisitivo " + pa.getDataInicio() + " a " + pa.getDataFim() + ".");
            }

            // Limite do periodo concessivo (Art. 134) - data final de gozo
            if (dataInicio != null && !blocosEfetivos.isEmpty()) {
                LocalDate fimGozo = blocosEfetivos.get(blocosEfetivos.size() - 1).getFim();
                if (fimGozo != null && fimGozo.isAfter(pa.getLimiteConcessivo())) {
                    long diasExcedente = ChronoUnit.DAYS.between(pa.getLimiteConcessivo(), fimGozo);
                    violacoes.add("A data final do gozo (" + fimGozo + ") ultrapassa o limite do periodo "
                        + "concessivo (" + pa.getLimiteConcessivo() + ") em " + diasExcedente
                        + " dia(s). Alem do limite as ferias devem ser pagas em dobro (Art. 137) - "
                        + "procure o DP para tratamento excepcional.");
                }
            }

            // --------------------------------------------------------
            // 4) Abono pecuniario (RF-03, Art. 143)
            // --------------------------------------------------------
            int maximoAbono = (pa.getDiasDireito() == null ? 0 : pa.getDiasDireito()) / FRACAO_ABONO;
            if (diasAbono > maximoAbono) {
                violacoes.add("Abono pecuniario limitado a 1/3 do saldo: maximo " + maximoAbono
                    + " dia(s) para este periodo (Art. 143). Solicitado: " + diasAbono + ".");
            }
            if (diasAbono > 0 && diasAbono > totalDiasGozo) {
                violacoes.add("Os dias de abono sao descontados do gozo; informe um gozo compativel.");
            }
            if (diasAbono > 0 && pa.getDataFim() != null) {
                long diasAteFimPa = ChronoUnit.DAYS.between(hoje, pa.getDataFim());
                if (diasAteFimPa < PRAZO_ABONO_DIAS) {
                    alertas.add("Requerimento de abono feito com menos de " + PRAZO_ABONO_DIAS
                        + " dias do fim do periodo aquisitivo (" + pa.getDataFim()
                        + "). Fica sujeito a aprovacao discricionaria do empregador (Art. 143).");
                }
            }
        }

        // ------------------------------------------------------------
        // 5) Alerta de proximidade do limite concessivo (RF-07, informativo)
        // ------------------------------------------------------------
        if (pa != null && pa.getLimiteConcessivo() != null) {
            long diasAteLimite = ChronoUnit.DAYS.between(hoje, pa.getLimiteConcessivo());
            if (diasAteLimite >= 0 && diasAteLimite <= 30) {
                alertas.add("Atencao: faltam apenas " + diasAteLimite
                    + " dia(s) para o fim do periodo concessivo ("
                    + pa.getLimiteConcessivo() + "). Apos essa data as ferias sao pagas em dobro (Art. 137).");
            }
        }

        boolean aprovado = violacoes.isEmpty();

        log.debug("Validacao de ferias colaborador={} inicio={} blocos={} abono={} -> aprovado={} violacoes={}",
            employeeId, dataInicio, blocosEfetivos.size(), diasAbono, aprovado, violacoes.size());

        return new ValidacaoFerias(aprovado, violacoes, alertas, blocosEfetivos,
            totalDiasGozo, pa != null ? pa.getId() : null,
            pa != null ? pa.getLimiteConcessivo() : null,
            pa != null ? pa.getDiasSaldo() : null);
    }

    // ------------------------------------------------------------------
    // Art. 134, §3º - inicio proibido nos 2 dias anteriores a DSR/feriado
    // ------------------------------------------------------------------

    /**
     * Impede que as ferias iniciem nos 2 dias que antecedem feriado ou Repouso
     * Semanal Remunerado (DSR).
     *
     * Exemplos do PRD (DSR dominical):
     *  - inicio na quinta ou sexta-feira -> bloqueado (domingo - 2 = quinta)
     *  - feriado na terca -> inicio no domingo ou segunda bloqueado
     */
    private void validarRestricaoInicio(LocalDate dataInicio, Employee employee, List<String> violacoes) {
        String stateCode = resolverEstado(employee);
        String cityName = resolverCidade(employee);

        for (int offset = 1; offset <= DIAS_PROTECAO_ANTERIOR + 1; offset++) {
            LocalDate diaChecado = dataInicio.minusDays(offset);

            boolean eFeriado = holidayService.isHoliday(diaChecado, stateCode, cityName);
            boolean eDsr = ehDsr(diaChecado, employee);

            if (!eFeriado && !eDsr) continue;

            // O dia protegido deve estar a 1 ou 2 dias antes do inicio
            long diasAntes = offset;
            if (diasAntes <= DIAS_PROTECAO_ANTERIOR) {
                String natureza = eFeriado ? "feriado" : "DSR (repouso semanal remunerado)";
                violacoes.add("Art. 134, §3º: e proibido iniciar as ferias em " + formatar(dataInicio)
                    + ", pois " + formatar(diaChecado) + " e " + natureza
                    + " (valem os " + DIAS_PROTECAO_ANTERIOR + " dias que o antecedem). "
                    + "Escolha outra data de inicio.");
            }
        }
    }

    /**
     * Determina se a data e um Repouso Semanal Remunerado do colaborador.
     * Considera, nesta ordem:
     *  1. o campo folga_semanal do colaborador (ex.: "Domingo", "1º Escola");
     *  2. os dias de trabalho declarados (ex.: "12X36");
     *  3. padrao legal: domingo.
     */
    private boolean ehDsr(LocalDate data, Employee employee) {
        // 1) folga_semanal
        String folga = employee.getFolgaSemanal();
        if (folga != null && !folga.isBlank()) {
            if (diaCorrespondeAFolga(data, folga)) return true;
            // "1º Escola" / "2º XPTO" = escala rotativa: nao da para concluir com certeza,
            // entao cai no padrao dominical abaixo.
        }

        // 2) dias_trabalho (ex.: "Seg a Sex", "12X36")
        String diasTrabalho = employee.getDiasTrabalho();
        if (diasTrabalho != null && !diasTrabalho.isBlank()
                && !diasTrabalho.toUpperCase(Locale.ROOT).contains("X")) {
            if (diaCorrespondeAFolga(data, diasTrabalho)) return false;
        }

        // 3) padrao legal: DSR dominical
        return data.getDayOfWeek() == DayOfWeek.SUNDAY;
    }

    private boolean diaCorrespondeAFolga(LocalDate data, String texto) {
        String normalizado = texto.toLowerCase(Locale.ROOT)
            .replace("feira", "")
            .replace("ª", "")
            .replace("º", "")
            .trim();
        String dia = diaSemanaPortugues(data);

        for (String parte : normalizado.split("[,;/\\s]+")) {
            String p = parte.trim();
            if (p.isEmpty()) continue;
            if (dia.startsWith(p) || p.startsWith(dia)) return true;
            // "dom" vs "domingo"
            if (dia.length() > 3 && dia.startsWith(p) && p.length() >= 3) return true;
            if (p.length() > 3 && p.startsWith(dia) && dia.length() >= 3) return true;
        }
        return false;
    }

    private String diaSemanaPortugues(LocalDate data) {
        return switch (data.getDayOfWeek()) {
            case MONDAY -> "segunda";
            case TUESDAY -> "terca";
            case WEDNESDAY -> "quarta";
            case THURSDAY -> "quinta";
            case FRIDAY -> "sexta";
            case SATURDAY -> "sabado";
            case SUNDAY -> "domingo";
        };
    }

    private String formatar(LocalDate data) {
        return data == null ? "-" : data.toString();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private List<VacationBloco> normalizarBlocos(LocalDate dataInicio, List<VacationBloco> blocos) {
        List<VacationBloco> resultado = new ArrayList<>();
        if (blocos != null && !blocos.isEmpty()) {
            for (VacationBloco b : blocos) {
                if (b == null || b.getInicio() == null || b.getFim() == null) continue;
                long dias = ChronoUnit.DAYS.between(b.getInicio(), b.getFim()) + 1;
                resultado.add(VacationBloco.builder()
                    .inicio(b.getInicio())
                    .fim(b.getFim())
                    .dias((int) Math.max(0, dias))
                    .build());
            }
        } else if (dataInicio != null) {
            // Sem blocos explicitos: tratado como periodo unico (validacao de dias ocorre fora)
            resultado.add(VacationBloco.builder().inicio(dataInicio).fim(dataInicio).dias(1).build());
        }
        return resultado;
    }

    private int somarDias(List<VacationBloco> blocos) {
        return blocos.stream().mapToInt(b -> b.getDias() == null ? 0 : b.getDias()).sum();
    }

    private boolean primeiroAnoContrato(Employee employee, LocalDate hoje) {
        if (employee.getHireDate() == null) return false;
        LocalDate fimPrimeiroPa = employee.getHireDate().plusMonths(12);
        return hoje.isBefore(fimPrimeiroPa);
    }

    /**
     * Ferias coletivas podem ser concedidas antes dos 12 meses (Art. 140 §1º),
     * afastando a restricao de elegibilidade do primeiro ano. Retorna true
     * quando ha coletiva planejada ou em andamento (Fase 2).
     */
    private boolean haColetivaVigente() {
        return feriasColetivasRepository.existsByStatusIn(List.of(
            FeriasColetivasService.STATUS_PLANEJADO,
            FeriasColetivasService.STATUS_EM_ANDAMENTO));
    }

    private String resolverEstado(Employee employee) {
        if (employee.getUnit() != null && employee.getUnit().getAddressState() != null) {
            return employee.getUnit().getAddressState();
        }
        return employee.getEnderecoEstado();
    }

    private String resolverCidade(Employee employee) {
        if (employee.getUnit() != null && employee.getUnit().getAddressCity() != null) {
            return employee.getUnit().getAddressCity();
        }
        return employee.getEnderecoCidade();
    }

    // ------------------------------------------------------------------
    // DTOs
    // ------------------------------------------------------------------

    /**
     * Resultado da validacao. `violacoes` bloqueiam a submissao;
     * `alertas` sao informativos (ex.: abono fora do prazo, concessivo a vencer).
     */
    public record ValidacaoFerias(
        boolean aprovado,
        List<String> violacoes,
        List<String> alertas,
        List<VacationBloco> blocosCalculados,
        int diasGozoCalculados,
        UUID periodoAquisitivoId,
        LocalDate limiteConcessivo,
        Integer saldoDisponivel
    ) {}
}
