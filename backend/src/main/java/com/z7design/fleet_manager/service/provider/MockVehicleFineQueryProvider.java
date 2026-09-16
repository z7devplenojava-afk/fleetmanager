package com.z7design.fleet_manager.service.provider;

import com.z7design.fleet_manager.dto.VehicleFineQueryRequestDTO;
import com.z7design.fleet_manager.dto.VehicleFineQueryResponseDTO;
import com.z7design.fleet_manager.dto.VehicleFineQueryResponseDTO.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class MockVehicleFineQueryProvider implements VehicleFineQueryProvider {

    @Override
    public String getProviderName() {
        return "MOCK_SANDBOX";
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public VehicleFineQueryResponseDTO queryVehicleData(VehicleFineQueryRequestDTO request) {
        String cleanPlate = request.getPlaca().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        log.info("[MockVehicleFineQueryProvider] Simulando consulta para a placa: {}", cleanPlate);

        // Gera dados simulados realistas
        DadosVeiculoDTO dadosVeiculo = DadosVeiculoDTO.builder()
                .placa(cleanPlate)
                .renavam(request.getRenavam() != null && !request.getRenavam().isBlank() ? request.getRenavam() : "00" + Math.abs(cleanPlate.hashCode() % 900000000 + 100000000))
                .chassi("9BWCA" + cleanPlate + "Z123456")
                .marcaModelo("MERCEDES-BENZ / OF 1721 EVOLUTION")
                .anoFabricacao(2022)
                .anoModelo(2023)
                .cor("BRANCA")
                .combustivel("DIESEL")
                .uf(request.getUf() != null && !request.getUf().isBlank() ? request.getUf().toUpperCase() : "MG")
                .municipio("Belo Horizonte")
                .situacaoVeiculo("CIRCULAÇÃO REGULAR")
                .build();

        List<InfracaoDetalhadaDTO> infracoes = new ArrayList<>();
        List<RestricaoVeicularDTO> restricoes = new ArrayList<>();

        // Se a placa terminar com número ímpar, adiciona 2 multas de demonstração
        char lastChar = cleanPlate.charAt(cleanPlate.length() - 1);
        boolean hasFines = Character.isDigit(lastChar) ? (Character.getNumericValue(lastChar) % 2 != 0) : true;

        if (hasFines) {
            LocalDate today = LocalDate.now();
            
            infracoes.add(InfracaoDetalhadaDTO.builder()
                    .autoInfracao("R" + Math.abs(cleanPlate.hashCode() % 899999 + 100000))
                    .codigoInfracao("7455-0")
                    .orgaoAutuador("DER-MG")
                    .descricao("Transitar em velocidade superior a máxima permitida em até 20%")
                    .dataHora(today.minusDays(5).format(DateTimeFormatter.ISO_LOCAL_DATE) + "T14:22:00")
                    .local("Rodovia MG-050, KM 12 - Sentido Divinópolis/BH")
                    .valor(new BigDecimal("130.16"))
                    .dataVencimento(today.plusDays(25).format(DateTimeFormatter.ISO_LOCAL_DATE))
                    .situacao("AGUARDANDO PAGAMENTO")
                    .pontos(4)
                    .jaCadastradaNoSistema(false)
                    .build());

            infracoes.add(InfracaoDetalhadaDTO.builder()
                    .autoInfracao("E" + Math.abs((cleanPlate + "2").hashCode() % 899999 + 100000))
                    .codigoInfracao("5185-1")
                    .orgaoAutuador("BHTRANS / DETRAN-MG")
                    .descricao("Deixar o condutor ou passageiro de usar o cinto de segurança")
                    .dataHora(today.minusDays(18).format(DateTimeFormatter.ISO_LOCAL_DATE) + "T08:45:00")
                    .local("Av. do Contorno, 6200 - Savassi, Belo Horizonte/MG")
                    .valor(new BigDecimal("195.23"))
                    .dataVencimento(today.plusDays(10).format(DateTimeFormatter.ISO_LOCAL_DATE))
                    .situacao("PENALIDADE APLICADA")
                    .pontos(5)
                    .jaCadastradaNoSistema(false)
                    .build());

            restricoes.add(RestricaoVeicularDTO.builder()
                    .tipo("FINANCEIRA")
                    .descricao("Alienação Fiduciária - Banco Santander S.A.")
                    .orgao("DETRAN-MG / SNG")
                    .dataInclusao(today.minusYears(2).format(DateTimeFormatter.ISO_LOCAL_DATE))
                    .status("ATIVO")
                    .build());
        }

        BigDecimal totalAmount = infracoes.stream()
                .map(InfracaoDetalhadaDTO::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        ResumoDebitosDTO resumo = ResumoDebitosDTO.builder()
                .quantidadeMultas(infracoes.size())
                .valorTotal(totalAmount)
                .quantidadeAutuacoes(infracoes.size())
                .temRestricoes(!restricoes.isEmpty())
                .build();

        return VehicleFineQueryResponseDTO.builder()
                .status("success")
                .message(infracoes.isEmpty() ? "Nenhuma infração pendente encontrada para o veículo." : "Consulta realizada com sucesso. Infrações identificadas.")
                .dadosVeiculo(dadosVeiculo)
                .resumoDebitos(resumo)
                .restricoes(restricoes)
                .infracoes(infracoes)
                .consultadoEm(LocalDateTime.now())
                .origemDados("SIMULADO")
                .build();
    }
}
