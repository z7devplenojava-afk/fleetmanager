package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service para processar batidas brutas do REP em registros estruturados de ponto
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PontoProcessingService {

    private final PontoRawRepository pontoRawRepository;
    private final TimeRecordRepository timeRecordRepository;
    private final TimeRecordService timeRecordService;
    private final EmployeeRepository employeeRepository;

    /**
     * Processa batidas brutas nÃ£o processadas de um funcionÃ¡rio e converte em TimeRecord
     */
    @Transactional
    public ProcessingResult processBatidasForEmployee(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        log.info("ðŸ”„ Processando batidas para funcionÃ¡rio {} - PerÃ­odo: {} a {}", 
                 employeeId, startDate, endDate);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));

        // Buscar batidas brutas nÃ£o processadas do perÃ­odo
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
        List<PontoRaw> rawBatidas = pontoRawRepository.findByEmployeeIdAndTimestampBetweenOrderByTimestampAsc(
                employeeId, startDateTime, endDateTime);

        // Filtrar apenas nÃ£o processadas
        rawBatidas = rawBatidas.stream()
                .filter(b -> !b.getProcessed())
                .collect(Collectors.toList());

        if (rawBatidas.isEmpty()) {
            log.info("â„¹ï¸ Nenhuma batida nÃ£o processada encontrada");
            return new ProcessingResult(0, 0, 0, new ArrayList<>());
        }

        // Agrupar batidas por dia
        Map<LocalDate, List<PontoRaw>> batidasByDay = rawBatidas.stream()
                .collect(Collectors.groupingBy(b -> b.getTimestamp().toLocalDate()));

        int processedCount = 0;
        int errorCount = 0;
        List<ProcessingError> errors = new ArrayList<>();

        // Processar cada dia
        for (Map.Entry<LocalDate, List<PontoRaw>> entry : batidasByDay.entrySet()) {
            LocalDate date = entry.getKey();
            List<PontoRaw> dayBatidas = entry.getValue();

            try {
                processDayBatidas(employee, date, dayBatidas);
                processedCount += dayBatidas.size();
            } catch (Exception e) {
                errorCount += dayBatidas.size();
                errors.add(new ProcessingError(date, e.getMessage(), dayBatidas.size()));
                log.error("âŒ Erro ao processar batidas do dia {}: {}", date, e.getMessage(), e);
            }
        }

        log.info("âœ… Processamento concluÃ­do - Processadas: {}, Erros: {}", processedCount, errorCount);
        return new ProcessingResult(processedCount, errorCount, 0, errors);
    }

    /**
     * Processa batidas de um dia especÃ­fico, formando pares Entradaâ†’SaÃ­da
     */
    private void processDayBatidas(Employee employee, LocalDate date, List<PontoRaw> dayBatidas) {
        // Ordenar batidas por timestamp
        dayBatidas.sort(Comparator.comparing(PontoRaw::getTimestamp));

        // Normalizar e formar pares
        List<TimeRecordPair> pairs = buildPairs(dayBatidas);

        // Se houver batidas Ã­mpares, tratar
        if (hasOddBatidas(dayBatidas)) {
            log.warn("âš ï¸ Detectadas batidas Ã­mpares para {} em {}", employee.getName(), date);
            // Aplicar regra configurÃ¡vel (por enquanto, apenas logar)
            handleOddBatidas(employee, date, dayBatidas);
        }

        // Criar TimeRecord para cada par vÃ¡lido
        for (TimeRecordPair pair : pairs) {
            if (pair.isValid()) {
                createTimeRecordFromPair(employee, pair);
                // Marcar batidas como processadas
                pair.getEntrada().setProcessed(true);
                pair.getEntrada().setProcessedAt(LocalDateTime.now());
                if (pair.getSaida() != null) {
                    pair.getSaida().setProcessed(true);
                    pair.getSaida().setProcessedAt(LocalDateTime.now());
                }
                pontoRawRepository.save(pair.getEntrada());
                if (pair.getSaida() != null) {
                    pontoRawRepository.save(pair.getSaida());
                }
            }
        }
    }

    /**
     * Forma pares Entradaâ†’SaÃ­da a partir das batidas do dia
     */
    private List<TimeRecordPair> buildPairs(List<PontoRaw> dayBatidas) {
        List<TimeRecordPair> pairs = new ArrayList<>();
        PontoRaw entrada = null;

        for (PontoRaw batida : dayBatidas) {
            if (batida.getTipo() == PontoRaw.BatidaTipo.ENTRADA) {
                // Se jÃ¡ havia uma entrada sem saÃ­da, criar par incompleto
                if (entrada != null) {
                    pairs.add(new TimeRecordPair(entrada, null));
                }
                entrada = batida;
            } else if (batida.getTipo() == PontoRaw.BatidaTipo.SAIDA) {
                if (entrada != null) {
                    pairs.add(new TimeRecordPair(entrada, batida));
                    entrada = null;
                } else {
                    // SaÃ­da sem entrada - pode ser continuaÃ§Ã£o do dia anterior ou erro
                    log.warn("âš ï¸ SaÃ­da sem entrada correspondente em {}", batida.getTimestamp());
                    pairs.add(new TimeRecordPair(null, batida));
                }
            }
        }

        // Se sobrou uma entrada sem saÃ­da, criar par incompleto
        if (entrada != null) {
            pairs.add(new TimeRecordPair(entrada, null));
        }

        return pairs;
    }

    /**
     * Verifica se hÃ¡ batidas Ã­mpares (nÃºmero Ã­mpar ou desbalanceamento)
     */
    private boolean hasOddBatidas(List<PontoRaw> dayBatidas) {
        long entradaCount = dayBatidas.stream()
                .filter(b -> b.getTipo() == PontoRaw.BatidaTipo.ENTRADA)
                .count();
        long saidaCount = dayBatidas.stream()
                .filter(b -> b.getTipo() == PontoRaw.BatidaTipo.SAIDA)
                .count();

        return entradaCount != saidaCount;
    }

    /**
     * Trata batidas Ã­mpares (ex: entrada sem saÃ­da, saÃ­da sem entrada)
     */
    private void handleOddBatidas(Employee employee, LocalDate date, List<PontoRaw> dayBatidas) {
        long entradaCount = dayBatidas.stream()
                .filter(b -> b.getTipo() == PontoRaw.BatidaTipo.ENTRADA)
                .count();
        long saidaCount = dayBatidas.stream()
                .filter(b -> b.getTipo() == PontoRaw.BatidaTipo.SAIDA)
                .count();

        if (entradaCount > saidaCount) {
            log.warn("âš ï¸ {} entradas sem saÃ­da para {} em {}", 
                     entradaCount - saidaCount, employee.getName(), date);
            // Regra configurÃ¡vel: assumir saÃ­da padrÃ£o (ex: 17:00) ou deixar pendente
        } else if (saidaCount > entradaCount) {
            log.warn("âš ï¸ {} saÃ­das sem entrada para {} em {}", 
                     saidaCount - entradaCount, employee.getName(), date);
            // Regra configurÃ¡vel: assumir entrada padrÃ£o (ex: 08:00) ou deixar pendente
        }
    }

    /**
     * Cria um TimeRecord a partir de um par de batidas
     * Para batidas do REP, criamos apenas ENTRADA e SAIDA (almoÃ§o serÃ¡ inferido se necessÃ¡rio)
     */
    private void createTimeRecordFromPair(Employee employee, TimeRecordPair pair) {
        if (!pair.isValid() || pair.getEntrada() == null) {
            return; // Par invÃ¡lido, nÃ£o criar registro
        }

        // Verificar se jÃ¡ existe registro para esta batida (evitar duplicatas)
        if (timeRecordRepository.findByEmployeeIdAndRecordedAtBetweenOrderByRecordedAtAsc(
                employee.getId(), 
                pair.getEntrada().getTimestamp().minusSeconds(1), 
                pair.getEntrada().getTimestamp().plusSeconds(1))
                .stream().anyMatch(tr -> tr.getRecordType() == TimeRecord.RecordType.ENTRADA)) {
            log.debug("Registro de entrada jÃ¡ existe, pulando");
            return;
        }

        // Criar registro de entrada
        TimeRecord entradaRecord = new TimeRecord();
        entradaRecord.setEmployee(employee);
        entradaRecord.setRecordType(TimeRecord.RecordType.ENTRADA);
        entradaRecord.setRecordedAt(pair.getEntrada().getTimestamp());
        entradaRecord.setIsManual(false); // Importado do REP
        entradaRecord.setStatus(TimeRecord.RecordStatus.APPROVED); // PrÃ©-aprovado
        entradaRecord.setJustification("Importado do REP - " + pair.getEntrada().getImportHash());
        timeRecordRepository.save(entradaRecord);

        // Se houver saÃ­da, criar registro de saÃ­da
        if (pair.getSaida() != null) {
            // Verificar se hÃ¡ intervalo de almoÃ§o (heurÃ­stica: mais de 8h entre entrada e saÃ­da)
            long minutesBetween = java.time.Duration.between(
                    pair.getEntrada().getTimestamp(), 
                    pair.getSaida().getTimestamp()).toMinutes();

            if (minutesBetween > 480) { // Mais de 8h trabalhadas (provavelmente tem almoÃ§o)
                // Criar registros de saÃ­da e retorno do almoÃ§o (assumindo 1h de almoÃ§o Ã s 12:00)
                LocalDateTime saidaAlmoco = pair.getEntrada().getTimestamp().toLocalDate()
                        .atTime(12, 0); // 12:00
                LocalDateTime retornoAlmoco = saidaAlmoco.plusHours(1); // 13:00

                // Garantir que estÃ¡ entre entrada e saÃ­da
                if (saidaAlmoco.isAfter(pair.getEntrada().getTimestamp()) && 
                    retornoAlmoco.isBefore(pair.getSaida().getTimestamp())) {
                    
                    TimeRecord saidaAlmocoRecord = new TimeRecord();
                    saidaAlmocoRecord.setEmployee(employee);
                    saidaAlmocoRecord.setRecordType(TimeRecord.RecordType.SAIDA_ALMOCO);
                    saidaAlmocoRecord.setRecordedAt(saidaAlmoco);
                    saidaAlmocoRecord.setIsManual(false);
                    saidaAlmocoRecord.setStatus(TimeRecord.RecordStatus.APPROVED);
                    saidaAlmocoRecord.setJustification("Inferido do REP - intervalo estimado");
                    timeRecordRepository.save(saidaAlmocoRecord);

                    TimeRecord retornoAlmocoRecord = new TimeRecord();
                    retornoAlmocoRecord.setEmployee(employee);
                    retornoAlmocoRecord.setRecordType(TimeRecord.RecordType.RETORNO_ALMOCO);
                    retornoAlmocoRecord.setRecordedAt(retornoAlmoco);
                    retornoAlmocoRecord.setIsManual(false);
                    retornoAlmocoRecord.setStatus(TimeRecord.RecordStatus.APPROVED);
                    retornoAlmocoRecord.setJustification("Inferido do REP - intervalo estimado");
                    retornoAlmocoRecord.setProcessingNotes("Inferido automaticamente");
                    timeRecordRepository.save(retornoAlmocoRecord);
                }
            }

            // Criar registro de saÃ­da
            TimeRecord saidaRecord = new TimeRecord();
            saidaRecord.setEmployee(employee);
            saidaRecord.setRecordType(TimeRecord.RecordType.SAIDA);
            saidaRecord.setRecordedAt(pair.getSaida().getTimestamp());
            saidaRecord.setIsManual(false);
            saidaRecord.setStatus(TimeRecord.RecordStatus.APPROVED);
            saidaRecord.setJustification("Importado do REP - " + pair.getSaida().getImportHash());
            timeRecordRepository.save(saidaRecord);
        }
    }

    /**
     * Classe interna para representar um par Entradaâ†’SaÃ­da
     */
    @Data
    public static class TimeRecordPair {
        private PontoRaw entrada;
        private PontoRaw saida;

        public TimeRecordPair(PontoRaw entrada, PontoRaw saida) {
            this.entrada = entrada;
            this.saida = saida;
        }

        public boolean isValid() {
            return entrada != null; // MÃ­nimo: ter entrada
        }
    }

    /**
     * Resultado do processamento
     */
    @Data
    public static class ProcessingResult {
        private int processedCount;
        private int errorCount;
        private int warningCount;
        private List<ProcessingError> errors;

        public ProcessingResult(int processedCount, int errorCount, int warningCount, List<ProcessingError> errors) {
            this.processedCount = processedCount;
            this.errorCount = errorCount;
            this.warningCount = warningCount;
            this.errors = errors;
        }
    }

    /**
     * Erro de processamento
     */
    @Data
    public static class ProcessingError {
        private LocalDate date;
        private String message;
        private int batidaCount;

        public ProcessingError(LocalDate date, String message, int batidaCount) {
            this.date = date;
            this.message = message;
            this.batidaCount = batidaCount;
        }
    }
}






