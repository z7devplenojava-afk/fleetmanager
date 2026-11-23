package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.PositionDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Position;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.repository.PositionRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PositionService {

    private final PositionRepository positionRepository;
    private final UnitRepository unitRepository;

    public List<PositionDTO> getAllPositions() {
        try {
            log.info("Buscando todos os cargos");
            List<Position> positions = positionRepository.findAll();
            log.info("Encontrados {} cargos", positions.size());
            
            if (positions.isEmpty()) {
                log.warn("Nenhum cargo encontrado no banco de dados");
                return java.util.Collections.emptyList();
            }
            
            return positions.stream()
                .map(pos -> {
                    try {
                        return PositionDTO.fromEntity(pos);
                    } catch (Exception e) {
                        log.error("Erro ao converter cargo {}: {}", pos.getName(), e.getMessage());
                        return null; // Continuar com outros cargos
                    }
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar cargos: {}", e.getMessage(), e);
            log.warn("Retornando lista vazia devido ao erro");
            return java.util.Collections.emptyList();
        }
    }
    
    public List<PositionDTO> searchPositions(String query) {
        log.info("Buscando cargos com query: {}", query);
        List<Position> positions;
        
        if (query == null || query.trim().isEmpty()) {
            positions = positionRepository.findAllByOrderByNameAsc();
        } else {
            positions = positionRepository.searchPositions(query.trim());
        }
        
        return positions.stream()
                .map(PositionDTO::fromEntity)
                .filter(dto -> dto != null) // Filtrar DTOs nulos
                .collect(Collectors.toList());
    }

    public PositionDTO getPositionById(UUID id) {
        log.info("Buscando cargo por ID: {}", id);
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cargo nÃ£o encontrado com ID: " + id));
        return PositionDTO.fromEntity(position);
    }

    public PositionDTO createPosition(PositionDTO dto) {
        log.info("Criando novo cargo: {}", dto != null ? dto.getName() : null);

        if (dto == null || dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new BusinessException("Nome do cargo é obrigatório.");
        }

        String trimmedName = dto.getName().trim();
        if (trimmedName.length() > 100) {
            trimmedName = trimmedName.substring(0, 100);
        }

        // Se CBO ou descrição não foram enviados, tenta enriquecer automaticamente pelo catálogo CBO
        String resolvedCbo = dto.getCbo() != null ? dto.getCbo().trim() : "";
        String resolvedDesc = dto.getDescription() != null ? dto.getDescription().trim() : "";
        if (resolvedCbo.isEmpty() || resolvedDesc.isEmpty()) {
            List<java.util.Map<String, String>> matches = searchCbo(trimmedName);
            if (!matches.isEmpty()) {
                java.util.Map<String, String> best = matches.get(0);
                if (resolvedCbo.isEmpty() && best.get("codigo") != null) {
                    resolvedCbo = best.get("codigo");
                }
                if (resolvedDesc.isEmpty()) {
                    String desc = best.get("descricao");
                    if (desc == null || desc.isBlank()) {
                        desc = best.get("titulo");
                    }
                    resolvedDesc = desc != null ? desc : "";
                }
            }
        }

        if (resolvedCbo.length() > 10) {
            resolvedCbo = resolvedCbo.substring(0, 10);
        }
        if (resolvedDesc.length() > 500) {
            resolvedDesc = resolvedDesc.substring(0, 500);
        }

        List<Position> existingList = positionRepository.findAllByNameIgnoreCase(trimmedName);
        if (!existingList.isEmpty()) {
            Position pos = existingList.get(0);
            if (!resolvedCbo.isBlank()) {
                pos.setCbo(resolvedCbo);
            }
            if (!resolvedDesc.isBlank()) {
                pos.setDescription(resolvedDesc);
            }
            if (pos.getBaseSalary() == null) {
                pos.setBaseSalary(dto.getBaseSalary() != null ? dto.getBaseSalary() : java.math.BigDecimal.ZERO);
            }
            pos = positionRepository.save(pos);
            log.info("Cargo existente reutilizado e atualizado - ID: {}", pos.getId());
            return PositionDTO.fromEntity(pos);
        }

        Position position = dto.toEntity();
        position.setName(trimmedName);
        position.setCbo(resolvedCbo.isBlank() ? null : resolvedCbo);
        position.setDescription(resolvedDesc.isBlank() ? null : resolvedDesc);
        if (position.getBaseSalary() == null) {
            position.setBaseSalary(java.math.BigDecimal.ZERO);
        }

        if (dto.getUnitId() != null) {
            unitRepository.findById(dto.getUnitId()).ifPresent(position::setUnit);
        }

        position = positionRepository.save(position);
        log.info("Cargo criado com sucesso - ID: {}", position.getId());
        return PositionDTO.fromEntity(position);
    }

    public PositionDTO updatePosition(UUID id, PositionDTO dto) {
        log.info("Atualizando cargo ID: {}", id);

        Position existingPosition = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cargo não encontrado com ID: " + id));

        String trimmedName = dto.getName() != null ? dto.getName().trim() : existingPosition.getName();
        if (trimmedName.length() > 100) {
            trimmedName = trimmedName.substring(0, 100);
        }

        existingPosition.setName(trimmedName);
        String desc = dto.getDescription() != null ? dto.getDescription().trim() : "";
        if (desc.length() > 500) desc = desc.substring(0, 500);
        existingPosition.setDescription(desc);

        String cbo = dto.getCbo() != null ? dto.getCbo().trim() : null;
        if (cbo != null && cbo.length() > 10) cbo = cbo.substring(0, 10);
        existingPosition.setCbo(cbo);

        existingPosition.setBaseSalary(dto.getBaseSalary() != null ? dto.getBaseSalary() : java.math.BigDecimal.ZERO);

        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada com ID: " + dto.getUnitId()));
            existingPosition.setUnit(unit);
        } else {
            existingPosition.setUnit(null);
        }

        existingPosition = positionRepository.save(existingPosition);
        log.info("Cargo atualizado com sucesso - ID: {}", existingPosition.getId());
        return PositionDTO.fromEntity(existingPosition);
    }

    public void deletePosition(UUID id) {
        log.info("Excluindo cargo ID: {}", id);
        if (!positionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cargo não encontrado com ID: " + id);
        }
        positionRepository.deleteById(id);
        log.info("Cargo excluído com sucesso - ID: {}", id);
    }

    private static String normalizeText(String input) {
        if (input == null) return "";
        return java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .toLowerCase()
                .trim();
    }

    private static final List<java.util.Map<String, String>> CBO_CATALOG = List.of(
            java.util.Map.of("codigo", "3423-05", "titulo", "Chefe de serviço de transporte rodoviário (passageiros e cargas)", "sinonimo", "Encarregado de transportes, Encarregado de transporte, Encarregado de frota, Encarregado de tráfego, Supervisor de frota, Supervisor de transportes, Supervisor de tráfego, Chefe de tráfego, Líder de tráfego, Líder de transporte, Coordenador de transporte, Coordenador de frota, Encarregado operacional", "descricao", "Supervisiona e planeja operações de transporte rodoviário e fretamento, coordena escalas de motoristas e veículos, monitora o cumprimento de itinerários, vistorias e atendimento aos clientes."),
            java.util.Map.of("codigo", "1414-10", "titulo", "Gerente de operações de transportes", "sinonimo", "Gerente de transportes, Gerente de transporte, Gerente de logística, Gerente de frota, Gestor de frota, Gestor de transportes, Diretor operacional", "descricao", "Dirige e planeja as operações de transporte e logística da empresa, gerenciando contratos, indicadores operacionais, custos e equipes."),
            java.util.Map.of("codigo", "3421-10", "titulo", "Analista de transporte / frota", "sinonimo", "Analista de transportes, Analista de frota, Analista de logística, Assistente de transporte, Assistente de transportes, Assistente de frota, Auxiliar de tráfego, Auxiliar de transporte, Auxiliar de transportes", "descricao", "Analisa indicadores operacionais da frota, consumo de combustível, telemetria, roteirização e custos logísticos."),
            java.util.Map.of("codigo", "3423-10", "titulo", "Inspetor de serviços de transportes rodoviários / Despachante", "sinonimo", "Despachante de tráfego, Despachante de transporte, Despachante de transportes, Controlador de tráfego, Operador de CCO, Fiscal de tráfego, Escalante, Monitor de frota", "descricao", "Coordena escalas diárias de motoristas e veículos, monitora viagens em tempo real no CCO, atua na liberação de viagens e atendimento a contingências operacionais."),
            java.util.Map.of("codigo", "9101-05", "titulo", "Supervisor de manutenção mecânica de veículos", "sinonimo", "Encarregado de manutenção, Chefe de oficina, Líder mecânico, Supervisor de oficina, Encarregado mecânico, Encarregado de oficina", "descricao", "Supervisiona as atividades da oficina mecânica, distribui Ordens de Serviço, acompanha indicadores de disponibilidade da frota e controla a qualidade dos reparos."),
            java.util.Map.of("codigo", "9144-25", "titulo", "Mecânico de veículos a diesel (ônibus e caminhões)", "sinonimo", "Mecânico, Mecânico diesel, Mecânico de ônibus, Mecânico de caminhão, Mecânico pesados, Mecânico de frota, Mecânico socorrista", "descricao", "Realiza manutenção preventiva e corretiva em veículos automotores e pesados a diesel (ônibus, micro-ônibus e caminhões), inspecionando motores, sistemas de transmissão, freios, suspensão e direção."),
            java.util.Map.of("codigo", "9144-05", "titulo", "Mecânico de manutenção de automóveis, motocicletas e veículos afins", "sinonimo", "Mecânico de autos, Mecânico geral, Mecânico de frota", "descricao", "Elabora planos de manutenção e executa reparos em motores, sistemas elétricos, hidráulicos, suspensão e freios de veículos automotores da frota."),
            java.util.Map.of("codigo", "9144-10", "titulo", "Mecânico de manutenção de freios de veículos automotores", "sinonimo", "Mecânico de freio, Freista", "descricao", "Realiza diagnóstico, regulagem, substituição de lonas, pastilhas, válvulas pneumáticas e reparo completo em sistemas de freios de veículos da frota."),
            java.util.Map.of("codigo", "9144-15", "titulo", "Mecânico de manutenção de suspensão e direção de veículos", "sinonimo", "Mecânico de suspensão, Alinhador, Balanceador", "descricao", "Executa serviços de manutenção em sistemas de suspensão, feixes de molas, amortecedores, alinhamento e geometria de direção de veículos."),
            java.util.Map.of("codigo", "9144-30", "titulo", "Borracheiro", "sinonimo", "Borracheiro de frota, Vulcanizador de pneus", "descricao", "Realiza montagem, desmontagem, calibragem, rodízio, vulcanização e controle de sulco e recapagem de pneus da frota."),
            java.util.Map.of("codigo", "9511-05", "titulo", "Eletricista de instalações de veículos automotores", "sinonimo", "Eletricista, Auto elétrico, Eletricista de ônibus, Eletricista de autos", "descricao", "Realiza manutenção preventiva e corretiva em sistemas elétricos e eletrônicos de veículos, alternadores, motores de partida, baterias, iluminação e ar-condicionado."),
            java.util.Map.of("codigo", "9913-05", "titulo", "Funileiro de veículos (reparação)", "sinonimo", "Funileiro, Lanterneiro, Chapeador", "descricao", "Executa reparos de carroceria, funilaria, lanternagem, estrutura metálica, fibras e para-choques de veículos da frota."),
            java.util.Map.of("codigo", "9913-10", "titulo", "Pintor de veículos automotores", "sinonimo", "Pintor automotivo, Pintor de frota", "descricao", "Prepara superfícies e realiza pintura, polimento e acabamento visual e padronização de identidade visual nos veículos da frota."),
            java.util.Map.of("codigo", "1414-15", "titulo", "Gerente de manutenção", "sinonimo", "Gestor de manutenção, Coordenador de manutenção", "descricao", "Planeja e gerencia as operações de manutenção preventiva, preditiva e corretiva da frota, controle de custos, contratos e indicadores de desempenho (MTBF/MTTR)."),
            java.util.Map.of("codigo", "7824-05", "titulo", "Motorista de ônibus urbano", "sinonimo", "Motorista urbano, Motorista coletivo, Condutor de ônibus", "descricao", "Conduz ônibus no transporte coletivo urbano e metropolitano de passageiros, cumprindo itinerários, horários, normas de trânsito e direção defensiva."),
            java.util.Map.of("codigo", "7824-10", "titulo", "Motorista de ônibus rodoviário", "sinonimo", "Motorista, Motorista rodoviário, Motorista de viagem, Motorista de fretamento", "descricao", "Conduz ônibus rodoviários e de fretamento em viagens municipais, intermunicipais e interestaduais, zelando pela segurança e conforto dos passageiros e vistoria do veículo."),
            java.util.Map.of("codigo", "7824-15", "titulo", "Motorista de trólebus", "sinonimo", "Motorista elétrico", "descricao", "Conduz veículos elétricos de transporte coletivo de passageiros seguindo protocolos operacionais e de segurança viária."),
            java.util.Map.of("codigo", "7823-10", "titulo", "Motorista de furgão ou van / Manobrista", "sinonimo", "Motorista de van, Motorista de micro-ônibus, Motorista utilitário, Manobrista de ônibus, Manobrista de frota, Manobrista de garagem, Manobrista", "descricao", "Conduz vans, micro-ônibus e utilitários no transporte de passageiros, equipes ou cargas leves, ou realiza manobras no pátio e garagens da empresa."),
            java.util.Map.of("codigo", "7825-10", "titulo", "Motorista de caminhão (rotas regionais e internacionais)", "sinonimo", "Motorista de caminhão, Carreteiro", "descricao", "Transporta cargas em caminhões e veículos pesados, inspecionando condições mecânicas, documentação e segurança do transporte."),
            java.util.Map.of("codigo", "7823-20", "titulo", "Motorista operacional de guincho", "sinonimo", "Operador de guincho, Socorrista de frota, Motorista de socorro", "descricao", "Opera veículo de socorro e reboque para atendimento emergencial e remoção de veículos avariados da frota."),
            java.util.Map.of("codigo", "5112-15", "titulo", "Fiscal de transportes coletivos (exceto trem)", "sinonimo", "Fiscal de tráfego, Fiscal de linha, Inspetor de tráfego, Fiscal operacional", "descricao", "Fiscaliza a operação das linhas e veículos, controla horários de partida e chegada, orienta motoristas e registra ocorrências operacionais."),
            java.util.Map.of("codigo", "5112-20", "titulo", "Cobrador de transportes coletivos (exceto trem)", "sinonimo", "Cobrador, Cobrador de ônibus, Auxiliar de bordo", "descricao", "Realiza cobrança de tarifas, controle de embarque de passageiros e auxílio ao motorista durante a operação do transporte coletivo."),
            java.util.Map.of("codigo", "3331-10", "titulo", "Instrutor de motoristas / Instrutor de trânsito", "sinonimo", "Instrutor de motoristas, Instrutor de tráfego, Instrutor de treinamento, Instrutor de direção defensiva", "descricao", "Ministra treinamentos de direção defensiva, direção econômica e normas operacionais para motoristas de ônibus e veículos pesados."),
            java.util.Map.of("codigo", "5163-40", "titulo", "Lavador de veículos", "sinonimo", "Lavador, Lavador de ônibus, Higienizador de veículos, Lavador de frota", "descricao", "Executa lavagem externa, higienização interna e conservação estética dos veículos da frota na garagem."),
            java.util.Map.of("codigo", "5143-20", "titulo", "Faxineiro / Auxiliar de serviços gerais", "sinonimo", "Auxiliar de serviços gerais, ASG, Auxiliar de limpeza, Servente", "descricao", "Realiza trabalhos de limpeza, conservação e organização nas dependências administrativas, operacionais e garagens da empresa."),
            java.util.Map.of("codigo", "5143-25", "titulo", "Trabalhador da manutenção de edificações", "sinonimo", "Zelador, Auxiliar de manutenção predial, Oficial de manutenção", "descricao", "Executa reparos e conservação predial, hidráulica, elétrica e alvenaria nas instalações e garagens da empresa."),
            java.util.Map.of("codigo", "4141-05", "titulo", "Almoxarife", "sinonimo", "Almoxarifado, Encarregado de almoxarifado, Auxiliar de almoxarifado, Estoquista de peças", "descricao", "Recebe, confere, armazena e controla a saída de peças, pneus, insumos e EPIs no almoxarifado, mantendo o inventário atualizado."),
            java.util.Map.of("codigo", "4141-10", "titulo", "Armazenista / Estoquista", "sinonimo", "Estoquista, Auxiliar de estoque, Conferente", "descricao", "Organiza e controla a movimentação física de materiais e peças no estoque, auxiliando na separação de itens para Ordens de Serviço."),
            java.util.Map.of("codigo", "3542-05", "titulo", "Comprador", "sinonimo", "Comprador, Analista de compras, Assistente de compras, Suprimentos", "descricao", "Realiza cotações, negociação com fornecedores e emissão de pedidos de compra de peças automotivas, pneus, combustível e serviços."),
            java.util.Map.of("codigo", "5171-10", "titulo", "Vigilante", "sinonimo", "Segurança, Guarda patrimonial, Vigilante patrimonial", "descricao", "Zela pela guarda do patrimônio e segurança das instalações, garagens, veículos e colaboradores, realizando rondas e controle de perímetro."),
            java.util.Map.of("codigo", "5174-10", "titulo", "Porteiro de edifícios / Controlador de acesso", "sinonimo", "Porteiro, Controlador de acesso, Recepcionista de portaria, Vigia", "descricao", "Fiscaliza a entrada e saída de pessoas e veículos nas garagens e unidades da empresa, registrando movimentações e checklists de portaria."),
            java.util.Map.of("codigo", "4110-10", "titulo", "Assistente administrativo", "sinonimo", "Auxiliar administrativo, Analista administrativo, Recepcionista", "descricao", "Executa rotinas administrativas, controle de documentos, atendimento, lançamento de dados no sistema e apoio aos departamentos da empresa."),
            java.util.Map.of("codigo", "4110-05", "titulo", "Auxiliar de escritório / Departamento Pessoal", "sinonimo", "Auxiliar de RH, Assistente de RH, Analista de RH, Departamento pessoal, DP", "descricao", "Atua nas rotinas de Recursos Humanos e Departamento Pessoal, controle de admissão, ponto eletrônico, férias, benefícios, holerites e documentação legal."),
            java.util.Map.of("codigo", "4131-10", "titulo", "Auxiliar de contabilidade / Financeiro", "sinonimo", "Assistente financeiro, Analista financeiro, Faturista, Contas a pagar, Contas a receber", "descricao", "Executa lançamentos financeiros, conciliação bancária, controle de contas a pagar e a receber, faturamento de contratos e emissão de relatórios."),
            java.util.Map.of("codigo", "3516-05", "titulo", "Técnico em segurança do trabalho", "sinonimo", "Técnico de segurança, TST, Segurança do trabalho, SESMT", "descricao", "Inspeciona condições de segurança do trabalho, entrega e controle de EPIs, treinamentos normativos (NRs), prevenção de acidentes e gestão de SST."),
            java.util.Map.of("codigo", "9153-05", "titulo", "Lubrificador de veículos automotores", "sinonimo", "Lubrificador, Trocador de óleo, Auxiliar de mecânico, Ajudante de oficina", "descricao", "Realiza troca de óleos lubrificantes, filtros de óleo, ar e combustível, engraxamento e verificação de níveis de fluidos da frota.")
    );

    public List<java.util.Map<String, String>> searchCbo(String query) {
        if (query == null || query.trim().isEmpty()) {
            return CBO_CATALOG.subList(0, Math.min(15, CBO_CATALOG.size()));
        }
        String normQuery = normalizeText(query);
        List<java.util.Map<String, String>> results = new java.util.ArrayList<>();
        java.util.Set<String> seenCodes = new java.util.HashSet<>();

        java.util.Set<String> stopWords = java.util.Set.of("de", "da", "do", "das", "dos", "em", "para", "com", "por", "sem", "ou", "ao", "aos", "e", "a", "o");
        String[] rawWords = normQuery.split("[^a-z0-9]+");
        List<String> queryWords = new java.util.ArrayList<>();
        List<String> stemmedWords = new java.util.ArrayList<>();
        for (String w : rawWords) {
            if (w.length() >= 2 && !stopWords.contains(w)) {
                queryWords.add(w);
                String st = w;
                if (st.endsWith("es") && st.length() > 5) st = st.substring(0, st.length() - 2);
                else if (st.endsWith("s") && st.length() > 4) st = st.substring(0, st.length() - 1);
                stemmedWords.add(st);
            }
        }
        String digitsQuery = normQuery.replaceAll("\\D", "");

        // 1. Buscar no catálogo oficial com pontuação de relevância
        CBO_CATALOG.stream()
                .map(item -> {
                    String codeNorm = normalizeText(item.get("codigo"));
                    String codeDigits = codeNorm.replaceAll("\\D", "");
                    String titleNorm = normalizeText(item.get("titulo"));
                    String synNorm = normalizeText(item.get("sinonimo"));
                    String descNorm = normalizeText(item.get("descricao"));
                    String fullText = titleNorm + " " + synNorm + " " + descNorm;

                    int score = 0;
                    if (titleNorm.equals(normQuery) || codeNorm.equals(normQuery) || (!digitsQuery.isEmpty() && codeDigits.equals(digitsQuery))) {
                        score = 100;
                    } else if (synNorm.contains(normQuery) && java.util.Arrays.stream(synNorm.split(",")).map(String::trim).anyMatch(s -> s.equals(normQuery))) {
                        score = 95;
                    } else if (titleNorm.startsWith(normQuery) || (!digitsQuery.isEmpty() && codeDigits.startsWith(digitsQuery))) {
                        score = 88;
                    } else if (java.util.Arrays.stream(synNorm.split(",")).map(String::trim).anyMatch(s -> s.startsWith(normQuery))) {
                        score = 84;
                    } else if (titleNorm.contains(normQuery)) {
                        score = 80;
                    } else if (synNorm.contains(normQuery)) {
                        score = 75;
                    } else if (!queryWords.isEmpty()) {
                        int matched = 0;
                        int inTitleOrSyn = 0;
                        for (int i = 0; i < queryWords.size(); i++) {
                            String w = queryWords.get(i);
                            String st = stemmedWords.get(i);
                            boolean inTOrS = titleNorm.contains(w) || titleNorm.contains(st) || synNorm.contains(w) || synNorm.contains(st);
                            boolean inF = inTOrS || fullText.contains(w) || fullText.contains(st);
                            if (inF) matched++;
                            if (inTOrS) inTitleOrSyn++;
                        }
                        double ratio = (double) matched / queryWords.size();
                        if (ratio == 1.0) {
                            score = inTitleOrSyn == queryWords.size() ? 90 : 78;
                        } else if (ratio >= 0.5) {
                            score = (int) Math.round(50.0 + ratio * 20.0);
                        }
                    }
                    return new java.util.AbstractMap.SimpleEntry<>(score, item);
                })
                .filter(entry -> entry.getKey() > 0)
                .sorted((a, b) -> Integer.compare(b.getKey(), a.getKey()))
                .forEach(entry -> {
                    java.util.Map<String, String> item = entry.getValue();
                    if (seenCodes.add(item.get("codigo"))) {
                        results.add(item);
                    }
                });

        // 2. Complementar com cargos já salvos no banco que possuam CBO
        try {
            List<Position> dbPositions = positionRepository.searchPositions(query.trim());
            for (Position p : dbPositions) {
                if (p.getCbo() != null && !p.getCbo().isBlank() && seenCodes.add(p.getCbo().trim())) {
                    results.add(java.util.Map.of(
                            "codigo", p.getCbo().trim(),
                            "titulo", p.getName(),
                            "sinonimo", p.getName(),
                            "descricao", p.getDescription() != null && !p.getDescription().isBlank()
                                    ? p.getDescription()
                                    : "Atua nas atividades e responsabilidades inerentes à função de " + p.getName() + "."
                    ));
                }
            }
        } catch (Exception e) {
            log.debug("Aviso ao consultar cargos no banco para CBO: {}", e.getMessage());
        }

        return results;
    }
} 
