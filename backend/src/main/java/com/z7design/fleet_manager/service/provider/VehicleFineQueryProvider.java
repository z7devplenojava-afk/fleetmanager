package com.z7design.fleet_manager.service.provider;

import com.z7design.fleet_manager.dto.VehicleFineQueryRequestDTO;
import com.z7design.fleet_manager.dto.VehicleFineQueryResponseDTO;

public interface VehicleFineQueryProvider {

    /**
     * Nome identificador do provedor (ex: INFOSIMPLES, SERPRO, MOCK_SANDBOX).
     */
    String getProviderName();

    /**
     * Verifica se o provedor está devidamente configurado e habilitado (chaves/tokens disponíveis).
     */
    boolean isAvailable();

    /**
     * Executa a consulta de multas, débitos e restrições veiculares no provedor de dados.
     */
    VehicleFineQueryResponseDTO queryVehicleData(VehicleFineQueryRequestDTO request);
}
