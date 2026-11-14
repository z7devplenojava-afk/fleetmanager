package com.z7design.fleet_manager.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Definição oficial dos 41 itens do Check-List de Verificação de Frota (Modelo Resumido de Preventiva),
 * reproduzindo fielmente a ficha física da oficina/frota.
 */
public final class PreventiveResumidoChecklist {

    private PreventiveResumidoChecklist() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumidoItem {
        private String itemCode;
        private String descricao;
        private String categoria;
        private int ordem;
    }

    public static final List<ResumidoItem> ITEMS = List.of(
            // A. VISUAL (INTERNO / EXTERNO)
            new ResumidoItem("1", "1. Pintura", "A. VISUAL (INTERNO / EXTERNO)", 1),
            new ResumidoItem("2", "2. Rodas", "A. VISUAL (INTERNO / EXTERNO)", 2),
            new ResumidoItem("3", "3. Limpeza Externa", "A. VISUAL (INTERNO / EXTERNO)", 3),
            new ResumidoItem("4", "4. Limpeza Interna", "A. VISUAL (INTERNO / EXTERNO)", 4),
            new ResumidoItem("5", "5. Pneus", "A. VISUAL (INTERNO / EXTERNO)", 5),

            // B. SISTEMA ELÉTRICO
            new ResumidoItem("1", "1. Iluminação interna", "B. SISTEMA ELÉTRICO", 6),
            new ResumidoItem("2", "2. Iluminação externa", "B. SISTEMA ELÉTRICO", 7),
            new ResumidoItem("3", "3. Sirene de ré", "B. SISTEMA ELÉTRICO", 8),
            new ResumidoItem("4", "4. Buzina", "B. SISTEMA ELÉTRICO", 9),
            new ResumidoItem("5", "5. Limpadores de para-brisa", "B. SISTEMA ELÉTRICO", 10),
            new ResumidoItem("6", "6. Painel de instrumentos", "B. SISTEMA ELÉTRICO", 11),
            new ResumidoItem("7", "7. Bateria", "B. SISTEMA ELÉTRICO", 12),

            // C. SISTEMA DE LUBRIFICAÇÃO
            new ResumidoItem("1", "1. Oléo de Motor", "C. SISTEMA DE LUBRIFICAÇÃO", 13),
            new ResumidoItem("2", "2. Oléo de caixa", "C. SISTEMA DE LUBRIFICAÇÃO", 14),
            new ResumidoItem("3", "3. Oléo de diferencial", "C. SISTEMA DE LUBRIFICAÇÃO", 15),
            new ResumidoItem("4", "4. Fluido de freio", "C. SISTEMA DE LUBRIFICAÇÃO", 16),
            new ResumidoItem("5", "5. Oléo Hidráulico", "C. SISTEMA DE LUBRIFICAÇÃO", 17),
            new ResumidoItem("6", "6. VAzamentos", "C. SISTEMA DE LUBRIFICAÇÃO", 18),

            // D. SISTEMA PNEUMÁTICO
            new ResumidoItem("1", "1. Vazamento de AR", "D. SISTEMA PNEUMÁTICO", 19),
            new ResumidoItem("2", "2. Teste cuícas e servos", "D. SISTEMA PNEUMÁTICO", 20),
            new ResumidoItem("3", "3. Estado das válvulas", "D. SISTEMA PNEUMÁTICO", 21),
            new ResumidoItem("4", "4. Comprensor de ar", "D. SISTEMA PNEUMÁTICO", 22),

            // E. MECÂNICA GERAL
            new ResumidoItem("1.1", "1.1 Embuchamento de Molas DIANT.", "E. MECÂNICA GERAL", 23),
            new ResumidoItem("1.2", "1.2 Embuchamento de Molas TRAS.", "E. MECÂNICA GERAL", 24),
            new ResumidoItem("2.1", "2.1 Buchas estabilizadoras DIANT.", "E. MECÂNICA GERAL", 25),
            new ResumidoItem("2.2", "2.2 Buchas estabilizadoras TRAS.", "E. MECÂNICA GERAL", 26),
            new ResumidoItem("3", "3 Manga de eixo", "E. MECÂNICA GERAL", 27),
            new ResumidoItem("4", "4 Ponteiras", "E. MECÂNICA GERAL", 28),
            new ResumidoItem("5.1", "5.1 Lonas de freios DIANT", "E. MECÂNICA GERAL", 29),
            new ResumidoItem("5.2", "5.2 Lonas de freios TRAS.", "E. MECÂNICA GERAL", 30),
            new ResumidoItem("6", "6 Catracas", "E. MECÂNICA GERAL", 31),
            new ResumidoItem("7", "7 Cardans", "E. MECÂNICA GERAL", 32),
            new ResumidoItem("8", "8 Setor de direção", "E. MECÂNICA GERAL", 33),
            new ResumidoItem("9", "9 Suporte do tanque", "E. MECÂNICA GERAL", 34),
            new ResumidoItem("10", "10 Conferir aperto parafuso de RODA", "E. MECÂNICA GERAL", 35),
            new ResumidoItem("11", "11 Correia do motor", "E. MECÂNICA GERAL", 36),
            new ResumidoItem("12", "12 Rolamento da Polia de motor", "E. MECÂNICA GERAL", 37),
            new ResumidoItem("13", "13 Calibragem dos Pneus", "E. MECÂNICA GERAL", 38),
            new ResumidoItem("14", "14 Lubrificação", "E. MECÂNICA GERAL", 39),

            // F. DIVERSOS
            new ResumidoItem("1", "1 Aferição de Cronotacográfo", "F. DIVERSOS", 40),
            new ResumidoItem("2", "2 Extintores de Incêndio", "F. DIVERSOS", 41),
            new ResumidoItem("3", "3 Ar condicionado", "F. DIVERSOS", 42),
            new ResumidoItem("4", "4 Puxadores dos bancos", "F. DIVERSOS", 43),
            new ResumidoItem("5", "5 Cintos de segurança", "F. DIVERSOS", 44)
    );

    public static com.z7design.fleet_manager.dto.ChecklistItemDTO toDto(ResumidoItem item) {
        return com.z7design.fleet_manager.dto.ChecklistItemDTO.builder()
                .descricao(item.getDescricao())
                .categoria(item.getCategoria())
                .tipoManutencao("PREVENTIVA")
                .vehicleTypeApplicable("ALL")
                .templateModel("MODELO_RESUMIDO")
                .ordem(item.getOrdem())
                .ativo(true)
                .build();
    }

    public static List<com.z7design.fleet_manager.dto.ChecklistItemDTO> getAsDTOs() {
        return ITEMS.stream().map(PreventiveResumidoChecklist::toDto).toList();
    }
}
