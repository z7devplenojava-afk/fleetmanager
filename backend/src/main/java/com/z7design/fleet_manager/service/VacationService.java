package com.z7design.fleet_manager.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.PeriodoAquisitivo;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Vacation;
import com.z7design.fleet_manager.model.VacationBloco;
import com.z7design.fleet_manager.model.enums.PeriodoAquisitivoOrigem;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.model.enums.VacationType;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.VacationRepository;
import com.z7design.fleet_manager.service.VacationValidationService.ValidacaoFerias;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class VacationService {
    
    private final VacationRepository vacationRepository;
    private final UserRepository userRepository;
    private final PeriodoAquisitivoService periodoAquisitivoService;
    private final VacationValidationService vacationValidationService;

    @Transactional
    public Vacation create(Vacation vacation) {
        validateVacationDates(vacation);

        // Resolve o PA vigente e valida todas as regras CLT antes de persistir
        PeriodoAquisitivo pa = resolverPeriodoAquisitivo(vacation);
        vacation.setPeriodoAquisitivo(pa);

        validarRegrasCLT(vacation, pa);

        calculateVacationDays(vacation);

        if (vacation.getStatus() == null) {
            vacation.setStatus(VacationStatus.PENDING);
        }
        if (vacation.getVacationType() == null) {
            vacation.setVacationType(VacationType.NORMAL);
        }
        if (vacation.getNumeroBlocos() == null || vacation.getNumeroBlocos() <= 0) {
            vacation.setNumeroBlocos(vacation.getBlocos() != null && !vacation.getBlocos().isEmpty()
                ? vacation.getBlocos().size() : 1);
        }

        // Fase 2: se ja nasce aprovada (carga/importacao), abate o saldo de imediato
        if (vacation.getStatus() == VacationStatus.APPROVED) {
            abaterSaldoSeNecessario(vacation);
        }

        Vacation salva = vacationRepository.save(vacation);
        log.info("Solicitacao de ferias criada: colaborador={}, inicio={}, dias={}, blocos={}, abono={}",
            salva.getEmployee() != null ? salva.getEmployee().getName() : "?",
            salva.getStartDate(), salva.getDaysTaken(),
            salva.getNumeroBlocos(), salva.getDiasAbono());
        return salva;
    }
    
    @Transactional
    public Vacation update(UUID id, Vacation vacation) {
        Vacation existingVacation = findById(id);
        validateVacationDatesForUpdate(vacation);

        if (vacation.getEmployee() == null) {
            vacation.setEmployee(existingVacation.getEmployee());
        }

        PeriodoAquisitivo pa = existingVacation.getPeriodoAquisitivo() != null
            ? existingVacation.getPeriodoAquisitivo()
            : resolverPeriodoAquisitivo(vacation);
        vacation.setPeriodoAquisitivo(pa);

        // Revalida as regras CLT quando datas/blocos/abono mudam
        validarRegrasCLT(vacation, pa);

        calculateVacationDays(vacation);
        
        existingVacation.setStartDate(vacation.getStartDate());
        existingVacation.setEndDate(vacation.getEndDate());
        existingVacation.setDaysTaken(vacation.getDaysTaken());
        existingVacation.setRemainingDays(vacation.getRemainingDays());
        existingVacation.setBlocos(vacation.getBlocos());
        existingVacation.setDiasAbono(vacation.getDiasAbono() != null ? vacation.getDiasAbono() : existingVacation.getDiasAbono());
        existingVacation.setNumeroBlocos(vacation.getNumeroBlocos() != null ? vacation.getNumeroBlocos() : existingVacation.getNumeroBlocos());
        if (vacation.getObservacoes() != null) {
            existingVacation.setObservacoes(vacation.getObservacoes());
        }

        VacationStatus statusAnterior = existingVacation.getStatus();
        if (vacation.getStatus() != null) {
            existingVacation.setStatus(vacation.getStatus());
        }

        // Fase 2: mantem o saldo do PA consistente com o status
        if (existingVacation.getStatus() == VacationStatus.APPROVED
                && statusAnterior != VacationStatus.APPROVED) {
            abaterSaldoSeNecessario(existingVacation);
        } else if (existingVacation.getStatus() != VacationStatus.APPROVED
                && statusAnterior == VacationStatus.APPROVED) {
            estornarSaldoSeNecessario(existingVacation);
        }
        
        if (vacation.getVacationType() != null) {
            existingVacation.setVacationType(vacation.getVacationType());
        }
        
        return vacationRepository.save(existingVacation);
    }
    
    @Transactional
    public Vacation approve(UUID id, UUID approvedBy) {
        Vacation vacation = findById(id);
        User approver = userRepository.findById(approvedBy)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + approvedBy));
        vacation.setStatus(VacationStatus.APPROVED);
        vacation.setApprovedBy(approver);
        vacation.setApprovalDate(LocalDate.now());
        return vacationRepository.save(vacation);
    }
    
    @Transactional
    public Vacation reject(UUID id) {
        Vacation vacation = findById(id);
        vacation.setStatus(VacationStatus.REJECTED);
        return vacationRepository.save(vacation);
    }
    
    @Transactional
    public Vacation cancel(UUID id) {
        Vacation vacation = findById(id);
        vacation.setStatus(VacationStatus.CANCELLED);
        return vacationRepository.save(vacation);
    }
    
    @Transactional
    public void delete(UUID id) {
        if (!vacationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vacation not found with id: " + id);
        }
        vacationRepository.deleteById(id);
    }
    
    public Vacation findById(UUID id) {
        return vacationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vacation not found with id: " + id));
    }
    
    public List<Vacation> findByEmployeeId(UUID employeeId) {
        return vacationRepository.findByEmployeeId(employeeId);
    }
    
    public List<Vacation> findByEmployeeIdAndStatus(UUID employeeId, VacationStatus status) {
        return vacationRepository.findByEmployeeIdAndStatus(employeeId, status);
    }
    
    public List<Vacation> findByStartDateBetween(LocalDate startDate, LocalDate endDate) {
        return vacationRepository.findByStartDateBetween(startDate, endDate);
    }
    
    public List<Vacation> findAll() {
        return vacationRepository.findAllWithEmployee();
    }
    
    public List<Vacation> findByStatus(VacationStatus status) {
        return vacationRepository.findByStatusWithEmployee(status);
    }

    /**
     * Lista com filtros opcionais (RF-01: visao do DP).
     * Corrige o comportamento anterior em que GET /api/vacations ignorava os filtros.
     */
    public List<Vacation> findFiltered(UUID employeeId, VacationStatus status,
                                       LocalDate dataInicio, LocalDate dataFim) {
        List<Vacation> base;
        if (employeeId != null && status != null) {
            base = vacationRepository.findByEmployeeIdAndStatus(employeeId, status);
        } else if (employeeId != null) {
            base = vacationRepository.findByEmployeeId(employeeId);
        } else if (status != null) {
            base = vacationRepository.findByStatusWithEmployee(status);
        } else {
            base = vacationRepository.findAllWithEmployee();
        }

        if (dataInicio == null && dataFim == null) {
            return base;
        }
        final LocalDate ini = dataInicio;
        final LocalDate fim = dataFim;
        return base.stream()
            .filter(v -> v.getStartDate() != null)
            .filter(v -> ini == null || !v.getStartDate().isBefore(ini))
            .filter(v -> fim == null || !v.getStartDate().isAfter(fim))
            .toList();
    }

    /**
     * Endpoint de validacao em tempo real (RF-02 / RF-03 / RF-05).
     * Usado pelo formulario antes de submeter, sem persistir nada.
     */
    public ValidacaoFerias validarSolicitacao(UUID employeeId, LocalDate dataInicio,
                                              List<VacationBloco> blocos, int diasAbono,
                                              UUID periodoAquisitivoId) {
        return vacationValidationService.validar(
            employeeId, dataInicio, blocos, diasAbono, periodoAquisitivoId);
    }
    
    private void validateVacationDates(Vacation vacation) {
        if (vacation.getStartDate().isAfter(vacation.getEndDate())) {
            throw new IllegalArgumentException("Data de inicio nao pode ser posterior a data de fim");
        }
        
        if (vacation.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Data de inicio nao pode ser anterior a data atual");
        }
    }
    
    private void validateVacationDatesForUpdate(Vacation vacation) {
        // Validacao para atualizacao: permite editar ferias mesmo que a data de inicio seja no passado
        // Apenas valida que a data de inicio nao seja posterior a data de fim
        if (vacation.getStartDate().isAfter(vacation.getEndDate())) {
            throw new IllegalArgumentException("Data de inicio nao pode ser posterior a data de fim");
        }
    }
    
    private void calculateVacationDays(Vacation vacation) {
        int diasGozo;
        if (vacation.getBlocos() != null && !vacation.getBlocos().isEmpty()) {
            diasGozo = vacation.getBlocos().stream()
                .mapToInt(b -> b.getDias() != null ? b.getDias() : 0)
                .sum();
        } else {
            diasGozo = (int) (ChronoUnit.DAYS.between(vacation.getStartDate(), vacation.getEndDate()) + 1);
        }
        int diasAbono = vacation.getDiasAbono() != null ? vacation.getDiasAbono() : 0;
        vacation.setDaysTaken(diasGozo + diasAbono);

        // remainingDays passa a refletir o saldo do PA (RF-01), nao mais 30 fixo
        PeriodoAquisitivo pa = vacation.getPeriodoAquisitivo();
        int saldo = pa != null && pa.getDiasSaldo() != null ? pa.getDiasSaldo() : 30;
        vacation.setRemainingDays(Math.max(0, saldo - vacation.getDaysTaken()));
    }

    /**
     * Resolve (ou cria) o periodo aquisitivo vinculado a solicitacao.
     */
    private PeriodoAquisitivo resolverPeriodoAquisitivo(Vacation vacation) {
        if (vacation.getPeriodoAquisitivo() != null) {
            return vacation.getPeriodoAquisitivo();
        }
        if (vacation.getEmployee() == null || vacation.getEmployee().getId() == null) {
            throw new IllegalArgumentException("Funcionario e obrigatorio para solicitar ferias");
        }
        if (vacation.getEmployee().getHireDate() == null) {
            throw new IllegalArgumentException(
                "Colaborador sem data de admissao cadastrada: nao e possivel calcular o periodo aquisitivo");
        }
        return periodoAquisitivoService.getOrCreateVigente(vacation.getEmployee().getId());
    }

    /**
     * Aplica o motor de validacao CLT. Qualquer violacao impeditiva aborta a operacao
     * com mensagem clara para o usuario (RF-02, RF-03, RF-05).
     */
    private void validarRegrasCLT(Vacation vacation, PeriodoAquisitivo pa) {
        UUID employeeId = vacation.getEmployee() != null ? vacation.getEmployee().getId() : null;
        if (employeeId == null) {
            throw new IllegalArgumentException("Funcionario e obrigatorio para solicitar ferias");
        }

        ValidacaoFerias resultado = vacationValidationService.validar(
            employeeId,
            vacation.getStartDate(),
            vacation.getBlocos(),
            vacation.getDiasAbono() != null ? vacation.getDiasAbono() : 0,
            pa != null ? pa.getId() : null);

        if (!resultado.aprovado()) {
            throw new IllegalArgumentException(String.join(" ", resultado.violacoes()));
        }
        // Alertas (ex.: abono fora do prazo, concessivo a vencer) sao apenas informativos
        if (!resultado.alertas().isEmpty()) {
            log.warn("Alertas de ferias para colaborador {}: {}", employeeId, resultado.alertas());
        }
    }

    @Transactional
    public Vacation approveVacation(UUID vacationId, String observacoes) {
        Vacation vacation = vacationRepository.findById(vacationId)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitacao de ferias nao encontrada"));
        
        if (vacation.getStatus() != VacationStatus.PENDING) {
            throw new IllegalArgumentException("Apenas solicitacoes pendentes podem ser aprovadas");
        }
        
        vacation.setStatus(VacationStatus.APPROVED);
        vacation.setApprovalDate(LocalDate.now());
        vacation.setApprovedBy(resolverUsuarioAtual());
        if (observacoes != null && !observacoes.isBlank()) {
            vacation.setObservacoes(observacoes);
        }

        // Fase 2: abate o saldo do PA na aprovacao (uma unica vez por solicitacao)
        abaterSaldoSeNecessario(vacation);

        Vacation salva = vacationRepository.save(vacation);
        log.info("Ferias aprovadas: id={}, aprovador={}, saldoAbatido={}", vacationId,
            salva.getApprovedBy() != null ? salva.getApprovedBy().getUsername() : "desconhecido",
            salva.getSaldoAbatido());
        return salva;
    }

    /**
     * Fase 2: abate os dias do gozo (mais abono) do saldo do PA vigente da
     * solicitacao. Idempotente: so abate se ainda nao tiver sido abatido.
     */
    private void abaterSaldoSeNecessario(Vacation vacation) {
        if (Boolean.TRUE.equals(vacation.getSaldoAbatido())) return;
        if (vacation.getPeriodoAquisitivo() == null) return;
        int dias = (vacation.getDaysTaken() != null ? vacation.getDaysTaken() : 0);
        if (dias <= 0) return;
        periodoAquisitivoService.abaterSaldo(vacation.getPeriodoAquisitivo().getId(), dias);
        vacation.setSaldoAbatido(true);
        log.info("Saldo abatido: PA={}, dias={}, restante={}",
            vacation.getPeriodoAquisitivo().getId(), dias,
            vacation.getPeriodoAquisitivo().getDiasSaldo());
    }

    /**
     * Fase 2: devolve os dias ao saldo quando uma solicitacao ja abatida e
     * rejeitada ou cancelada.
     */
    private void estornarSaldoSeNecessario(Vacation vacation) {
        if (!Boolean.TRUE.equals(vacation.getSaldoAbatido())) return;
        if (vacation.getPeriodoAquisitivo() == null) return;
        int dias = (vacation.getDaysTaken() != null ? vacation.getDaysTaken() : 0);
        if (dias <= 0) return;
        periodoAquisitivoService.estornarSaldo(vacation.getPeriodoAquisitivo().getId(), dias);
        vacation.setSaldoAbatido(false);
        log.info("Saldo estornado: PA={}, dias={}", vacation.getPeriodoAquisitivo().getId(), dias);
    }

    @Transactional
    public Vacation rejectVacation(UUID vacationId, String motivo) {
        Vacation vacation = vacationRepository.findById(vacationId)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitacao de ferias nao encontrada"));
        
        if (vacation.getStatus() != VacationStatus.PENDING) {
            throw new IllegalArgumentException("Apenas solicitacoes pendentes podem ser rejeitadas");
        }
        
        vacation.setStatus(VacationStatus.REJECTED);
        vacation.setApprovalDate(LocalDate.now());
        vacation.setApprovedBy(resolverUsuarioAtual());
        vacation.setMotivoRejeicao(motivo);

        // Fase 2: devolve o saldo abatido na aprovacao
        estornarSaldoSeNecessario(vacation);
        
        Vacation salva = vacationRepository.save(vacation);
        log.info("Ferias rejeitadas: id={}, motivo={}", vacationId, motivo);
        return salva;
    }

    @Transactional
    public Vacation cancelVacation(UUID vacationId) {
        Vacation vacation = vacationRepository.findById(vacationId)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitacao de ferias nao encontrada"));
        
        vacation.setStatus(VacationStatus.CANCELLED);
        vacation.setUpdatedAt(LocalDateTime.now());

        // Fase 2: devolve o saldo abatido na aprovacao
        estornarSaldoSeNecessario(vacation);

        return vacationRepository.save(vacation);
    }

    /**
     * Abate o saldo do PA apos a conclusao do gozo e marca o PA como QUITADO
     * quando o saldo zera (RF-01 / secao 6.2 do PRD).
     */
    @Transactional
    public Vacation concluirGozo(UUID vacationId) {
        Vacation vacation = findById(vacationId);
        if (vacation.getStatus() == VacationStatus.APPROVED) {
            vacation.setStatus(VacationStatus.PENDING); // segue para calculo/pagamento
        }
        if (vacation.getPeriodoAquisitivo() != null) {
            int dias = vacation.getDaysTaken() != null ? vacation.getDaysTaken() : 0;
            periodoAquisitivoService.abaterSaldo(vacation.getPeriodoAquisitivo().getId(), dias);
        }
        return vacationRepository.save(vacation);
    }

    public com.z7design.fleet_manager.dto.VacationBalanceDTO calculateBalance(UUID employeeId) {
        PeriodoAquisitivo pa = periodoAquisitivoService.getOrCreateVigente(employeeId);
        List<Vacation> vacations = findByEmployeeId(employeeId);

        int totalDays = pa != null && pa.getDiasDireito() != null ? pa.getDiasDireito() : 30;
        int saldoPA = pa != null && pa.getDiasSaldo() != null ? pa.getDiasSaldo() : totalDays;

        int usedDays = 0;
        int daysInProgress = 0;

        for (Vacation v : vacations) {
            if (v.getStatus() == VacationStatus.APPROVED || v.getStatus() == VacationStatus.PENDING) {
                usedDays += v.getDaysTaken() != null ? v.getDaysTaken() : 0;
            }
            if (v.getStatus() == VacationStatus.PENDING) {
                daysInProgress += v.getDaysTaken() != null ? v.getDaysTaken() : 0;
            }
        }

        int availableDays = Math.max(0, saldoPA - daysInProgress);

        com.z7design.fleet_manager.dto.VacationBalanceDTO balance =
            new com.z7design.fleet_manager.dto.VacationBalanceDTO();
        balance.setTotalDays(totalDays);
        balance.setUsedDays(usedDays);
        balance.setAvailableDays(availableDays);
        balance.setDaysInProgress(daysInProgress);
        balance.setPeriod(pa != null && pa.getDataInicio() != null
            ? pa.getDataInicio().getYear() + "/" + pa.getDataFim().getYear()
            : java.time.Year.now().getValue() + "/" + (java.time.Year.now().getValue() + 1));

        // Fase 2: datas do PA para o portal exibir proxima aquisicao e limite concessivo
        if (pa != null) {
            LocalDate hoje = LocalDate.now();
            balance.setNextAcquisitionDate(pa.getDataFim() != null ? pa.getDataFim().plusDays(1) : null);
            balance.setDaysToNextAcquisition(pa.getDataFim() != null
                ? (int) ChronoUnit.DAYS.between(hoje, pa.getDataFim().plusDays(1)) : null);
            balance.setNextVacationLimitDate(pa.getLimiteConcessivo());
        }

        return balance;
    }

    private User resolverUsuarioAtual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByUsername(auth.getName())
            .or(() -> userRepository.findByEmail(auth.getName()))
            .orElse(null);
    }
}
