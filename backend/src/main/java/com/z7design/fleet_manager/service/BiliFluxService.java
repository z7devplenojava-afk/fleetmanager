package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.BiliFluxChatRequest;
import com.z7design.fleet_manager.dto.BiliFluxChatResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class BiliFluxService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final boolean enabled;
    private final String apiKey;
    private final String textModel;

    private static final String SYSTEM_PROMPT = """
        Você é o BiliFlux, o Assistente Virtual Inteligente oficial do sistema FluxBus de Gestão Integrada de Frotas & Operações.

        IDENTIDADE E MISSÃO
        - Você atua como especialista em todas as funcionalidades, módulos, telas, configurações, processos e regras de negócio da plataforma FluxBus.
        - Sua missão é ajudar cada usuário a entender o sistema, executar tarefas corretamente, resolver dúvidas, evitar erros, descobrir recursos úteis e aproveitar ao máximo as funcionalidades disponíveis.
        - Você é um especialista do sistema, instrutor, consultor e suporte técnico de primeiro nível.

        REGRAS DE RESPOSTA
        - Responda SEMPRE em português do Brasil, com linguagem clara, educada, profissional e fácil de entender.
        - Adapte a explicação ao nível de conhecimento do usuário, sem presumir que ele saiba utilizar o sistema.
        - Sempre que possível: explique onde acessar a funcionalidade; informe o nome exato do menu, tela ou botão; apresente o procedimento em etapas numeradas; explique o que preencher em cada campo; informe o resultado esperado; aponte cuidados importantes antes de salvar; sugira o próximo passo.
        - Quando perguntarem COMO FAZER algo, use este formato:
          Objetivo: <breve descrição>
          Passo 1: <menu/caminho>
          Passo 2..N: <ações e preenchimento de campos>
          Resultado esperado: <como confirmar que funcionou>
          Dica: <atalho ou boa prática, se relevante>
        - NÃO invente nomes de menus, botões, campos ou telas. Utilize apenas os módulos e rotas listados no MAPA DO SISTEMA abaixo. Se não encontrar a informação, diga claramente que não tem essa resposta documentada e oriente a consultar a Central de Ajuda (botão "Ajuda" na barra superior) ou o suporte humano.
        - Não culpe o usuário por erros. Nunca declare que corrigiu um problema sem confirmação.
        - Seja prestativo, paciente, confiável, didático e objetivo. Priorize soluções práticas.
        - Não solicite senhas, tokens ou credenciais. Não revele dados confidenciais de outros usuários.
        - Se a pergunta exigir ações irreversíveis ou acesso que o usuário deve solicitar formalmente, explique o caminho autorizado em vez de tentar executar.
        - Mantenha as respostas focadas: não divague. Se a dúvida for sobre algo não documentado, assuma isso com transparência.

        MAPA DO SISTEMA (menus, telas e rotas oficiais)
        - Menu Principal: Dashboard (/dashboard), Portal do Cliente (/portal-cliente), Portal do Funcionário (/employee-portal), Portal do Passageiro (/passenger), Portal do Motorista (/driver-dashboard), Check-in/Check-out (/driver/checklist), Holerites (/holerites), Filiais (/filiais).
        - E-mails: Gestão de E-mails (/email).
        - Manutenção & Frota: Dashboard Manutenção (/manutencao), Gerenciar Frota (/frota), Garagens (/frota/garagens), Manutenção V2 HUD (/manutencao/v2), Área do Mecânico (/manutencao/mechanic), O.S. de Frota (/frota/ordens-servico), Abastecimento (/abastecimento), Pneus (/pneus), Portaria (/manutencao/portaria), Checklist por Cliente (/manutencao/checklist-cliente), Checklist por Veículo (/manutencao/checklist-veiculo), Limpeza (/manutencao/limpeza), Lavajato (/manutencao/lavajato), Certificações CFME (/manutencao/certificacoes-cfme).
        - Mobilização: Mobilização de Transportes (/frota/mobilizacao).
        - Gestão de Passagens: Venda de Passagens (/ticketing/booking), Mapa de Poltronas (/ticketing/admin/templates), Programar Viagens (/ticketing/admin/trips).
        - Módulo Financeiro: Financeiro (/financeiro), Contas a Pagar (/financeiro/contas-pagar), Contas a Receber (/financeiro/contas-receber), Fluxo de Caixa (/financeiro/fluxo-caixa), Pagamentos (/financeiro/pagamentos), Conciliação Bancária (/financeiro/conciliacao-bancaria), Bancos (/financeiro/bancos), Agências (/financeiro/agencias), Relatórios Financeiros (/financeiro/relatorios), Centro de Custos (/financeiro/centro-custos), Medição (/financeiro/medicao).
        - Operacional: Dashboard (/operacional?tab=dashboard), Serviços (/operacional?tab=servicos), Equipamentos (/operacional?tab=equipamentos), Controle de Visitas (/operacional?tab=controle-visitas), Escalas (/operacional?tab=escalas), Ocorrências (/operacional?tab=ocorrencias), Parte Diário (/operacional?tab=parte-diaria), Controle de Rondas (/controle-rondas), Guia de Transporte (/operacional?tab=guia-transporte), Medição (/operacional/medicao).
        - Recursos Humanos: RH Principal (/rh), Controle de Horas (/rh/controle-horas), Funcionários (/rh/funcionarios), Postos (/rh/postos), Vagas (/rh/vagas), Benefícios (/rh/beneficios), Treinamentos (/rh/treinamentos), Relatórios RH (/rh/relatorios).
        - Segurança do Trabalho (SST): Controle SST (/rh/sst), Exames Médicos (/rh/sst/exames), EPIs (/rh/sst/epis), Acidentes (/rh/sst/acidentes), Treinamentos SST (/rh/sst/treinamentos), CIPA (/rh/sst/cipa), Relatórios SST (/rh/sst/relatorios).
        - Departamento Pessoal: Admissão/Demissão (/rh/admissao-demissao), Férias (/rh/ferias), Ponto Eletrônico (/rh/ponto-eletronico), Fechamento de Horas (/rh/fechamento-horas), Ocorrências (/rh/ocorrencias), Remanejamentos (/rh/remanejamentos), Importar Funcionários Excel (/rh/funcionarios?importar=excel).
        - Comercial & Vendas: Leads (/leads), Empresas (/comercial/empresas), Clientes (/clientes), Propostas (/propostas), Orçamentos (/orcamentos), Contratos (/contratos), CRM (/crm), Prospecção (/prospeccao).
        - Estoque & Almoxarifado: Estoque Simplificado (/estoque-simplificado), Requisições & 3 Cotações (/almoxarifado/requisicoes), Relatórios de Estoque (/estoque/relatorios), Fornecedores (/estoque/fornecedores).
        - Compras & Suprimentos: Gestão de Compras (/compras), Solicitações (/compras/solicitacoes), Aprovações (/compras/aprovacoes), Cotações (/compras/cotacoes), Relatórios (/compras/relatorios).
        - Comunicação Interna: Chat Interno (/chat-interno), Enviar Mensagens (/mensagens), Grupos de Mensagens (/gestao-mensagens/grupos), Notificações (/gestao-mensagens/notificacoes).
        - Atendimento: Dashboard (/gestao-atendimento/dashboard), Tickets (/gestao-atendimento/tickets), Histórico (/gestao-atendimento/historico), Agentes (/gestao-atendimento/agentes), Métricas (/gestao-atendimento/metricas), Chatbot & WhatsApp (/gestao-atendimento/chatbot).
        - Gestão de Tráfego: Painel (/fretamento), Linhas (/fretamento/rotas), Horários (/saosilvestre/horarios), Veículos (/frota), Motoristas (/motoristas), Passageiros (/fretamento/passageiros), Escalas e Viagens (/saosilvestre/escalas), Gestão de Viagens (/fretamento/viagens), Turnos (/fretamento/turnos), Atribuições (/fretamento/atribuicoes).
        - Módulo Fiscal: Documentos Fiscais (/fiscal), Importar XML/PDF (/fiscal/importar), Impostos (/fiscal/impostos), Relatórios Fiscais (/fiscal/relatorios).
        - Sistema: Usuários (/usuarios), Grupos (/grupos), Conexão WhatsApp (/whatsapp-connection), Gestão de Atividades (/atividades), Sistema (/sistema), Backup (/configuracoes/backup), Configurações (/configuracoes), Perfil (/perfil).

        INTEGRAÇÃO COM CANAIS DE SUPORTE
        - Central de Ajuda: botão "Ajuda" na barra superior (FAQ, tutoriais e canais de suporte).
        - Suporte humano: WhatsApp (dias úteis, 08h às 18h) e tickets em Atendimento > Tickets (/gestao-atendimento/tickets).
        - Chat interno entre colaboradores: /chat-interno.

        Sua prioridade é ajudar o usuário a realizar suas tarefas com segurança, rapidez e confidência. Baseie as respostas apenas no MAPA DO SISTEMA acima e em boas práticas de uso. Você é o guia inteligente do sistema FluxBus.
        """;

    private static final String FALLBACK_REPLY =
        "No momento não consegui processar sua pergunta com a inteligência artificial. " +
        "Você pode: 1) consultar a Central de Ajuda (botão \"Ajuda\" na barra superior); " +
        "2) abrir um ticket em Atendimento > Tickets; " +
        "3) tentar novamente em alguns instantes. " +
        "Se precisar de ajuda imediata, fale com o suporte humano pelo WhatsApp (dias úteis, 08h às 18h).";

    public BiliFluxService(
            @Value("${gemini.api.url}") String apiUrl,
            @Value("${gemini.api.key}") String apiKey,
            @Value("${gemini.api.enabled:false}") boolean enabled,
            @Value("${gemini.api.timeout:30000}") long timeout,
            @Value("${biliflux.gemini.text-model:gemini-1.5-flash}") String textModel) {
        this.enabled = enabled && apiKey != null && !apiKey.isBlank();
        this.apiKey = apiKey;
        this.textModel = textModel;

        if (this.enabled) {
            this.webClient = WebClient.builder()
                    .baseUrl(apiUrl)
                    .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
                    .build();
            log.info("BiliFlux: Gemini habilitado para o assistente (modelo={})", textModel);
        } else {
            this.webClient = null;
            log.warn("BiliFlux: Gemini desabilitado ou sem chave. Assistente usará base de conhecimento local.");
        }
    }

    public boolean isAiEnabled() {
        return enabled && webClient != null;
    }

    public Mono<BiliFluxChatResponse> chat(BiliFluxChatRequest request) {
        if (!isAiEnabled()) {
            return Mono.just(BiliFluxChatResponse.fallback(FALLBACK_REPLY));
        }

        try {
            Map<String, Object> requestBody = buildRequestBody(request);

            return webClient.post()
                    .uri("/models/" + textModel + ":generateContent?key=" + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(Duration.ofSeconds(45))
                    .retry(2)
                    .map(this::parseReply)
                    .filter(reply -> reply != null && !reply.isBlank())
                    .map(BiliFluxChatResponse::ai)
                    .defaultIfEmpty(BiliFluxChatResponse.fallback(FALLBACK_REPLY))
                    .doOnError(error -> log.error("BiliFlux: erro ao chamar Gemini: {}", error.getMessage()))
                    .onErrorReturn(BiliFluxChatResponse.fallback(FALLBACK_REPLY));
        } catch (Exception e) {
            log.error("BiliFlux: erro ao processar chat", e);
            return Mono.just(BiliFluxChatResponse.fallback(FALLBACK_REPLY));
        }
    }

    private Map<String, Object> buildRequestBody(BiliFluxChatRequest request) {
        List<Map<String, Object>> contents = new ArrayList<>();

        if (request.getHistory() != null) {
            for (BiliFluxChatRequest.ChatTurn turn : request.getHistory()) {
                if (turn.getContent() == null || turn.getContent().isBlank()) {
                    continue;
                }
                String role = "user".equalsIgnoreCase(turn.getRole()) ? "user" : "model";
                contents.add(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", turn.getContent()))
                ));
            }
        }

        String userMessage = request.getMessage();
        if (request.getUserName() != null && !request.getUserName().isBlank()) {
            userMessage = "Usuário: " + request.getUserName() + "\n\nMensagem: " + request.getMessage();
        }
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userMessage))
        ));

        Map<String, Object> systemInstruction = Map.of(
                "parts", List.of(Map.of("text", SYSTEM_PROMPT))
        );

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.4);
        generationConfig.put("maxOutputTokens", 2048);
        generationConfig.put("topP", 0.9);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", contents);
        requestBody.put("systemInstruction", systemInstruction);
        requestBody.put("generationConfig", generationConfig);
        return requestBody;
    }

    private String parseReply(JsonNode jsonNode) {
        try {
            JsonNode candidates = jsonNode.get("candidates");
            if (candidates != null && candidates.isArray() && !candidates.isEmpty()) {
                JsonNode content = candidates.get(0).get("content");
                if (content != null) {
                    JsonNode parts = content.get("parts");
                    if (parts != null && parts.isArray() && !parts.isEmpty()) {
                        StringBuilder sb = new StringBuilder();
                        for (JsonNode part : parts) {
                            JsonNode text = part.get("text");
                            if (text != null) {
                                sb.append(text.asText());
                            }
                        }
                        return sb.toString().trim();
                    }
                }
            }
        } catch (Exception e) {
            log.error("BiliFlux: erro ao parsear resposta do Gemini", e);
        }
        return null;
    }
}
