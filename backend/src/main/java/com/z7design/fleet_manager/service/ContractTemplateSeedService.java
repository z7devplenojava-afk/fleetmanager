package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.ContractTemplate;
import com.z7design.fleet_manager.model.enums.ContractTemplateType;
import com.z7design.fleet_manager.repository.ContractTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * PRD 1.0 - MÓDULO 2: semeia os 3 modelos contratuais do RF-02.1 com as
 * cláusulas obrigatórias do RF-02.2 (executado no startup, idempotente).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContractTemplateSeedService implements ApplicationRunner {

    private final ContractTemplateRepository templateRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedIfAbsent(ContractTemplateType.FRANCHISE_KM,
                "Prestação de Serviços com Franquia de KM (Padrão Reframax/Vale)",
                "Contrato de prestação de serviços de transporte de funcionários com franquia quilométrica mensal, diária contratada e tarifa de km excedente.");
        seedIfAbsent(ContractTemplateType.DEDICATED_ROUTES,
                "Prestação de Serviços por Rotas e Linhas Dedicadas (Padrão Mineração Serra da Moeda / Construcap)",
                "Contrato de prestação de serviços por rotas e linhas dedicadas, com rotogramas homologados, frota dedicada e regulamento interno da mina.");
        seedIfAbsent(ContractTemplateType.DRY_LEASE,
                "Locação Seca sem Mão de Obra e sem Combustível (Padrão Coopersind / Aterpa)",
                "Contrato de locação seca de veículos, sem fornecimento de mão de obra e sem combustível, com cronograma de disponibilização e vistoria conjunta.");
    }

    private void seedIfAbsent(ContractTemplateType type, String name, String description) {
        if (templateRepository.findByTemplateType(type).isPresent()) {
            return;
        }

        ContractTemplate t = new ContractTemplate();
        t.setTemplateType(type);
        t.setName(name);
        t.setDescription(description);
        t.setBody(buildBody(type));
        t.setAdjustmentClause(buildAdjustmentClause());
        t.setDieselTriggerClause(buildDieselTriggerClause());
        t.setPmpPaymentClause(buildPmpPaymentClause());
        t.setMeasurementClause(buildMeasurementClause());
        t.setRetentionClause(buildRetentionClause());
        t.setDefaultRetentionPct(new java.math.BigDecimal("0.0300"));
        t.setDefaultAdjustmentIndex("IGP-M");
        t.setDefaultPaymentDays(30);
        t.setDieselTriggerPct(new java.math.BigDecimal("0.0500"));

        templateRepository.save(t);
        log.info("PRD Módulo 2: template contratual '{}' semeado", name);
    }

    private String buildBody(ContractTemplateType type) {
        String specific;
        switch (type) {
            case FRANCHISE_KM -> specific = """
                    CLÁUSULA 4ª — DO PREÇO E DA FRANQUIA
                    Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor mensal de {{VALOR_MENSAL}} ({{VALOR_MENSAL_EXTENSO}}),
                    correspondente à franquia de {{FRANQUIA_KM}} quilômetros mensais, mediante diária contratada de {{VALOR_DIARIA}}.
                    Os quilômetros excedentes à franquia serão faturados à razão de {{TARIFA_KM_EXCEDENTE}} por quilômetro excedido.
                    Viagens extras serão faturadas pela tabela unitária, sendo a viagem extra padrão de {{VALOR_VIAGEM_EXTRA}}.

                    CLÁUSULA 5ª — DA FRANQUIA
                    A franquia mensal de {{FRANQUIA_KM}} quilômetros contempla margem técnica de 10% (dez por cento) para
                    quilometragem improdutiva, deslocamentos de garagem e retornos sem carga.""";

            case DEDICATED_ROUTES -> specific = """
                    CLÁUSULA 4ª — DO OBJETO E DAS LINHAS DEDICADAS
                    A CONTRATADA prestará serviços de transporte de funcionários nas rotas e linhas dedicadas descritas
                    nos rotogramas homologados (Anexo I), com partida e chegada na portaria da obra, sob horários e
                    itinerários aprovados pela fiscalização da CONTRATANTE.

                    CLÁUSULA 5ª — DO PREÇO
                    Pelos serviços, a CONTRATANTE pagará o valor mensal de {{VALOR_MENSAL}} ({{VALOR_MENSAL_EXTENSO}}),
                    mediante diária contratada de {{VALOR_DIARIA}}, correspondente aos dias efetivamente rodados.
                    Viagens extras realizadas fora da escala contratada serão faturadas à razão de {{VALOR_VIAGEM_EXTRA}} por viagem.""";

            case DRY_LEASE -> specific = """
                    CLÁUSULA 4ª — DO PREÇO DA LOCAÇÃO
                    Pela locação dos veículos, a LOCATÁRIA pagará à LOCADORA o valor mensal de {{VALOR_MENSAL}} ({{VALOR_MENSAL_EXTENSO}}),
                    com franquia de {{FRANQUIA_KM}} quilômetros mensais e tarifa de {{TARIFA_KM_EXCEDENTE}} pelo quilômetro excedente.

                    CLÁUSULA 5ª — DA LOCAÇÃO SECA
                    A presente locação é efetuada SEM fornecimento de mão de obra (motoristas) e SEM fornecimento de
                    combustível, arcando a LOCATÁRIA com tais encargos, permanecendo sob responsabilidade da LOCADORA
                    a manutenção mecânica e documental dos veículos.""";

            default -> specific = "";
        }

        return """
                CONTRATO DE %s

                %s

                QUALIFICAÇÃO DAS PARTES
                CONTRATADA/LOCADORA: {{CONTRATADA_NOME}}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{CONTRATADA_CNPJ}},
                com sede em {{CONTRATADA_ENDERECO}}.
                CONTRATANTE/LOCATÁRIA: {{CLIENTE_NOME}}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{CLIENTE_CNPJ}},
                com sede em {{CLIENTE_ENDERECO}}.

                As partes, por mútuo acordo e de pleno direito, celebram o presente contrato, que se regerá pelas cláusulas seguintes.

                CLÁUSULA 1ª — DO OBJETO
                %s

                CLÁUSULA 2ª — DA VIGÊNCIA
                O presente contrato vigorará por 12 (doze) meses a contar da assinatura, prorrogável por igual período.

                CLÁUSULA 3ª — DA FROTA
                Os veículos alocados atenderão aos critérios de elegibilidade: idade máxima de 5 anos, ar-condicionado,
                cinto de segurança em todos os assentos, freio motor/retarder, câmera no condutor e telemetria.
                A frota reserva garantirá substituição em até 4 (quatro) horas sem interrupção de rota.
                """.formatted(type == ContractTemplateType.DRY_LEASE ? "LOCAÇÃO SECA DE VEÍCULOS SEM MÃO DE OBRA E SEM COMBUSTÍVEL"
                        : "PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE COLETIVO DE FUNCIONÁRIOS",
                "TÍTULO: {{TITULO}}", specific);
    }

    private String buildAdjustmentClause() {
        return """
                CLÁUSULA — DO REAJUSTE ANUAL
                Os valores pactuados serão reajustados anualmente pela variação acumulada do {{INDICE_REAJUSTE}},
                ou pelo índice que vier a substituí-lo, proporcionalmente aos meses em desflagra, aplicando-se a
                data-base definida em contrato.""";

    }

    private String buildDieselTriggerClause() {
        return """
                CLÁUSULA — DO REEQUILÍBRIO ECONÔMICO-FINANCEIRO
                Verificado aumento do preço do óleo diesel S10 superior a {{GATILHO_DIESEL}}% ({{GATILHO_DIESEL_PCT}}),
                apurado pela média do mês anterior da ANP, as partes procederão ao reequilíbrio econômico-financeiro
                do presente contrato, mediante revisão proporcional do item combustível, no prazo de 30 (trinta) dias.""";

    }

    private String buildPmpPaymentClause() {
        return """
                CLÁUSULA — DO PAGAMENTO EM DIAS PARADOS PARA MANUTENÇÃO PREVENTIVA
                Os dias em que os veículos permanecerem parados para manutenção preventiva programada (PMP) serão
                remunerados normalmente, sem qualquer desconto no valor da locação, desde que a manutenção seja
                previamente comunicada e comprovada, garantida a disponibilização de veículo reserva.""";

    }

    private String buildMeasurementClause() {
        return """
                CLÁUSULA — DA MEDIÇÃO E DO PAGAMENTO
                O fechamento da medição ocorrerá até o dia 20 (vinte) do mês subsequente, com aprovação em até
                5 (cinco) dias úteis e pagamento em {{DIAS_PAGAMENTO}} dias corridos via boleto bancário registrado.
                A medição será acompanhada do dossiê de conformidade trabalhista, SST e evidências de campo
                (Partes Diárias atestadas e telemetria).""";

    }

    private String buildRetentionClause() {
        return """
                CLÁUSULA — DA RETENÇÃO TÉCNICA DE CAUÇÃO
                Será retida a percentagem de {{RETENCAO_PCT}} sobre o valor de cada medição, a título de caução técnica,
                depositada em conta gráfica vinculada ao presente contrato, liberada mediante ordem cronológica de
                serviços e mediante a aprovação final da fiscalização, conforme regulamento aplicável.""";

    }
}
