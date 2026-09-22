package com.z7design.fleet_manager.scheduler;

import com.z7design.fleet_manager.model.CIPAMember;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.PersonalProtectiveEquipment;
import com.z7design.fleet_manager.model.SSTAlert;
import com.z7design.fleet_manager.model.TrainingParticipation;
import com.z7design.fleet_manager.model.enums.ContractStatus;
import com.z7design.fleet_manager.model.enums.SSTAlertType;
import com.z7design.fleet_manager.repository.CIPAMemberRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.PersonalProtectiveEquipmentRepository;
import com.z7design.fleet_manager.repository.SSTAlertRepository;
import com.z7design.fleet_manager.repository.TrainingParticipationRepository;
import com.z7design.fleet_manager.service.SSTAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * MÓDULO SST — Alertas de vencimento (executados diariamente):
 * <ul>
 *   <li><b>Treinamentos</b>: certificados vencendo conforme validityMonths do treinamento;</li>
 *   <li><b>CA de EPI</b>: Certificado de Aprovação vencendo conforme caValidity;</li>
 *   <li><b>CIPA</b>: fim do mandato dos membros. Enquanto houver contrato ativo com o cliente
 *       (vigência endDate), o alerta antecipa 60 dias para permitir a renovação da gestão
 *       (mandato CIPA: 1 ano, podendo ser maior conforme vigência do contrato);</li>
 * </ul>
 * Dedupe por entidade relacionada: enquanto o alerta anterior não for resolvido, não duplica.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SSTExpirationAlertScheduler {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final SSTAlertService alertService;
    private final SSTAlertRepository alertRepository;
    private final TrainingParticipationRepository participationRepository;
    private final PersonalProtectiveEquipmentRepository ppeRepository;
    private final CIPAMemberRepository cipaMemberRepository;
    private final ContractRepository contractRepository;
    private final EmployeeRepository employeeRepository;

    @Value("${app.sst-expiration-alerts.cron:0 30 7 * * ?}")
    private String cron;

    /**
     * Laudo Psicológico vencendo em 30 dias (validade de 1 ano a partir do laudo).
     */
    @Transactional
    public int notifyExpiringLaudoPsicologico() {
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(30);
        int count = 0;

        List<Employee> employees = employeeRepository.findAll();
        for (Employee e : employees) {
            if (e.getNextLaudoPsicologico() == null) {
                continue;
            }
            LocalDate expiry = e.getNextLaudoPsicologico();
            if (expiry.isBefore(today) || expiry.isAfter(limit)) {
                continue;
            }
            long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, expiry);
            String when = daysLeft < 0 ? "VENCIDO desde " + expiry.format(DATE_FMT)
                    : "vence em " + daysLeft + " dia(s) (" + expiry.format(DATE_FMT) + ")";

            if (hasUnresolvedAlert(SSTAlertType.EXAME_VENCIMENTO, "LAUDO_PSICOLOGICO", e.getId())) {
                continue;
            }
            SSTAlert alert = SSTAlert.builder()
                    .alertType(SSTAlertType.EXAME_VENCIMENTO)
                    .title("Laudo Psicológico " + when.split(" ")[0].toLowerCase())
                    .message(String.format("O Laudo Psicológico do funcionário %s %s. Agendar novo exame psicotécnico.",
                            e.getName(), when))
                    .employee(e)
                    .relatedEntityType("LAUDO_PSICOLOGICO")
                    .relatedEntityId(e.getId())
                    .priority(daysLeft < 0 ? 4 : 3)
                    .dueDate(expiry)
                    .build();
            alertService.createAlert(alert);
            count++;
        }
        return count;
    }

    /**
     * ASO (do cadastro do funcionário) vencendo em 30 dias — complementa o AsoAlertScheduler
     * usando a próxima data já calculada (nextExameMedico) em vez de recalcular.
     */
    @Transactional
    public int notifyExpiringAsoCadastro() {
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(30);
        int count = 0;

        List<Employee> employees = employeeRepository.findAll();
        for (Employee e : employees) {
            LocalDate expiry = e.getNextExameMedico() != null ? e.getNextExameMedico()
                    : (e.getExameMedicoData() != null ? e.getExameMedicoData().plusYears(1) : null);
            if (expiry == null) {
                continue;
            }
            if (expiry.isBefore(today) || expiry.isAfter(limit)) {
                continue;
            }
            long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, expiry);
            String when = daysLeft < 0 ? "VENCIDO desde " + expiry.format(DATE_FMT)
                    : "vence em " + daysLeft + " dia(s) (" + expiry.format(DATE_FMT) + ")";

            if (hasUnresolvedAlert(SSTAlertType.EXAME_VENCIMENTO, "ASO_CADASTRO", e.getId())) {
                continue;
            }
            SSTAlert alert = SSTAlert.builder()
                    .alertType(SSTAlertType.EXAME_VENCIMENTO)
                    .title("ASO " + when.split(" ")[0].toLowerCase())
                    .message(String.format("O ASO do funcionário %s %s. Agendar exame médico ocupacional.",
                            e.getName(), when))
                    .employee(e)
                    .relatedEntityType("ASO_CADASTRO")
                    .relatedEntityId(e.getId())
                    .priority(daysLeft < 0 ? 4 : 3)
                    .dueDate(expiry)
                    .build();
            alertService.createAlert(alert);
            count++;
        }
        return count;
    }

    /**
     * Executa diariamente às 07:30 (antes do AsoAlertScheduler 07:45).
     */
    @Scheduled(cron = "${app.sst-expiration-alerts.cron:0 30 7 * * ?}")
    @Transactional
    public void checkExpirations() {
        log.info("Verificacao diaria de vencimentos SST (treinamentos, CA de EPI, CIPA, laudo psicologico, ASO)");
        try {
            int trainings = notifyExpiringTrainings();
            int cas = notifyExpiringCaEPIs();
            int cipa = notifyExpiringCipaMandates();
            int psico = notifyExpiringLaudoPsicologico();
            int aso = notifyExpiringAsoCadastro();
            log.info("Alertas SST gerados: {} treinamentos, {} CAs de EPI, {} mandatos CIPA, {} laudos psicologicos, {} ASOs", trainings, cas, cipa, psico, aso);
        } catch (Exception e) {
            log.error("Erro na verificação de vencimentos SST: {}", e.getMessage(), e);
        }
    }

    /**
     * Treinamentos vencidos ou vencendo em 30 dias (validade = completionDate + validityMonths).
     * Público para execução manual via endpoint admin.
     */
    @Transactional
    public int notifyExpiringTrainings() {
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(30);
        int count = 0;

        List<TrainingParticipation> participations = participationRepository.findAll();
        for (TrainingParticipation p : participations) {
            if (p.getCompletionDate() == null || p.getTraining() == null
                    || p.getTraining().getValidityMonths() == null || p.getEmployee() == null) {
                continue;
            }
            LocalDate expiry = p.getCompletionDate().plusMonths(p.getTraining().getValidityMonths());
            if (expiry.isBefore(today) || expiry.isAfter(limit)) {
                continue;
            }
            String trainingName = p.getTraining().getName();
            String employeeName = p.getEmployee().getName();
            long daysLeft = ChronoUnit.DAYS.between(today, expiry);
            String when = daysLeft < 0 ? "VENCIDO desde " + expiry.format(DATE_FMT)
                    : "vence em " + daysLeft + " dia(s) (" + expiry.format(DATE_FMT) + ")";

            if (hasUnresolvedAlert(SSTAlertType.TREINAMENTO_VENCIMENTO, "TRAINING_PARTICIPATION", p.getId())) {
                continue;
            }
            SSTAlert alert = SSTAlert.builder()
                    .alertType(SSTAlertType.TREINAMENTO_VENCIMENTO)
                    .title("Treinamento " + when.split(" ")[0].toLowerCase())
                    .message(String.format("O treinamento \"%s\" do funcionário %s %s. Agendar reciclagem.",
                            trainingName, employeeName, when))
                    .employee(p.getEmployee())
                    .relatedEntityType("TRAINING_PARTICIPATION")
                    .relatedEntityId(p.getId())
                    .priority(daysLeft < 0 ? 4 : 3)
                    .dueDate(expiry)
                    .build();
            alertService.createAlert(alert);
            count++;
        }
        return count;
    }

    /**
     * CA (Certificado de Aprovação) de EPIs do estoque vencendo em 30 dias ou vencido.
     * EPI com CA vencido não pode ser entregue (NR-06).
     */
    @Transactional
    public int notifyExpiringCaEPIs() {
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(30);
        int count = 0;

        List<PersonalProtectiveEquipment> epis = ppeRepository.findAll();
        for (PersonalProtectiveEquipment epi : epis) {
            if (!Boolean.TRUE.equals(epi.getIsActive()) || epi.getCaValidity() == null) {
                continue;
            }
            LocalDate expiry = epi.getCaValidity();
            if (expiry.isBefore(today) || expiry.isAfter(limit)) {
                continue;
            }
            long daysLeft = ChronoUnit.DAYS.between(today, expiry);
            String when = daysLeft < 0 ? "VENCIDO desde " + expiry.format(DATE_FMT)
                    : "vence em " + daysLeft + " dia(s) (" + expiry.format(DATE_FMT) + ")";

            if (hasUnresolvedAlert(SSTAlertType.EPI_VENCIMENTO, "PPE_CA", epi.getId())) {
                continue;
            }
            SSTAlert alert = SSTAlert.builder()
                    .alertType(SSTAlertType.EPI_VENCIMENTO)
                    .title("CA de EPI " + when.split(" ")[0].toLowerCase())
                    .message(String.format("O EPI \"%s\" (CA %s) %s. Bloquear entrega e solicitar reposição do estoque.",
                            epi.getName(), epi.getCaNumber() != null ? epi.getCaNumber() : "s/n", when))
                    .relatedEntityType("PPE_CA")
                    .relatedEntityId(epi.getId())
                    .priority(daysLeft < 0 ? 4 : 3)
                    .dueDate(expiry)
                    .build();
            alertService.createAlert(alert);
            count++;
        }
        return count;
    }

    /**
     * Mandato CIPA: alerta quando o mandato do membro vence em até 60 dias.
     * A validade do mandato depende da vigência do contrato do cliente: enquanto houver
     * contrato ativo (endDate futuro), a renovação da CIPA deve ser planejada — mandato
     * padrão de 1 ano, podendo ser estendido conforme vigência do contrato.
     */
    @Transactional
    public int notifyExpiringCipaMandates() {
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(60);
        int count = 0;

        List<CIPAMember> members = cipaMemberRepository.findAll();
        for (CIPAMember member : members) {
            if (!Boolean.TRUE.equals(member.getIsActive()) || member.getEndDate() == null || member.getEmployee() == null) {
                continue;
            }
            LocalDate expiry = member.getEndDate();
            if (expiry.isBefore(today) || expiry.isAfter(limit)) {
                continue;
            }
            long daysLeft = ChronoUnit.DAYS.between(today, expiry);
            String when = daysLeft < 0 ? "VENCIDO desde " + expiry.format(DATE_FMT)
                    : "vence em " + daysLeft + " dia(s) (" + expiry.format(DATE_FMT) + ")";

            if (hasUnresolvedAlert(SSTAlertType.CIPA_MANDATO, "CIPA_MEMBER", member.getId())) {
                continue;
            }

            Employee employee = member.getEmployee();
            String context = "Mandato CIPA " + member.getMandateYear() + " de " + employee.getName()
                    + " (" + member.getPosition() + ") " + when;

            // Vigência do contrato do cliente define a janela de renovação
            String contractNote = "";
            UUID companyId = employee.getCompanyId();
            if (companyId != null) {
                Optional<Contract> activeContract = contractRepository.findAll().stream()
                        .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                        .filter(c -> c.getClient() != null && c.getClient().getId() != null)
                        .filter(c -> {
                            UUID clientCompanyId = c.getClient().getCompanyId();
                            return companyId.equals(clientCompanyId);
                        })
                        .filter(c -> c.getEndDate() == null || !c.getEndDate().isBefore(today))
                        .findFirst();
                if (activeContract.isPresent()) {
                    Contract c = activeContract.get();
                    if (c.getEndDate() != null) {
                        contractNote = String.format(" Contrato do cliente vigente até %s — programar nova eleição antes do fim do mandato.",
                                c.getEndDate().format(DATE_FMT));
                    }
                }
            }

            SSTAlert alert = SSTAlert.builder()
                    .alertType(SSTAlertType.CIPA_MANDATO)
                    .title("Mandato CIPA " + when.split(" ")[0].toLowerCase())
                    .message(context + "." + contractNote)
                    .employee(employee)
                    .relatedEntityType("CIPA_MEMBER")
                    .relatedEntityId(member.getId())
                    .priority(daysLeft < 0 ? 4 : 2)
                    .dueDate(expiry)
                    .build();
            alertService.createAlert(alert);
            count++;
        }
        return count;
    }

    private boolean hasUnresolvedAlert(SSTAlertType type, String entityType, UUID entityId) {
        return alertRepository.findByRelatedEntity(entityType, entityId).stream()
                .anyMatch(a -> a.getAlertType() == type && !Boolean.TRUE.equals(a.getIsResolved()));
    }
}
