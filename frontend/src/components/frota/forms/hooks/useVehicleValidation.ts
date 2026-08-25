import { VehicleFormData, VehicleType } from '../types';

export interface ValidationError {
    field: string;
    message: string;
}

export interface VehicleValidationRules {
    required: string[];
    recommended: string[];
    descriptions: Record<string, string>;
}

// Campos obrigatórios por tipo de veículo
const VALIDATION_RULES: Record<string, VehicleValidationRules> = {
    // Ônibus Rodoviário - campos obrigatórios extras
    BUS_ROAD: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType', 'busType', 'chassisNumber', 'renavan'],
        recommended: ['passengerCapacity', 'chassisBrand', 'bodyBuilder', 'engineModel'],
        descriptions: {
            busType: 'Tipo do ônibus é obrigatório para veículos rodoviários',
            chassisNumber: 'Chassi é obrigatório para ônibus',
            renavan: 'RENAVAN é obrigatório para ônibus',
            passengerCapacity: 'Capacidade de passageiros é recomendada',
            chassisBrand: 'Marca do chassi é recomendada',
            bodyBuilder: 'Fabricante da carroceria é recomendado',
            engineModel: 'Modelo do motor é recomendado',
        }
    },

    // Ônibus Luxo Turismo / Double Decker
    BUS_LUXURY_TOURISM: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType', 'busType', 'chassisNumber', 'renavan'],
        recommended: ['passengerCapacity', 'hasAirConditioning', 'hasWiFi', 'chassisBrand', 'bodyBuilder'],
        descriptions: {
            busType: 'Tipo do ônibus é obrigatório',
            chassisNumber: 'Chassi é obrigatório para ônibus luxo',
            renavan: 'RENAVAN é obrigatório',
            passengerCapacity: 'Capacidade de passageiros é recomendada',
            hasAirConditioning: 'Ar condicionado é esperado em ônibus de luxo',
            hasWiFi: 'Wi-Fi é esperado em ônibus de luxo',
            chassisBrand: 'Marca do chassi é recomendada',
            bodyBuilder: 'Fabricante da carroceria é recomendado',
        }
    },

    // Ônibus Urbano
    BUS_URBAN: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType', 'busType', 'chassisNumber', 'renavan'],
        recommended: ['passengerCapacity', 'standingCapacity', 'totalDoors', 'routeNumber'],
        descriptions: {
            busType: 'Tipo do ônibus é obrigatório',
            chassisNumber: 'Chassi é obrigatório para ônibus urbanos',
            renavan: 'RENAVAN é obrigatório',
            passengerCapacity: 'Capacidade sentados é recomendada',
            standingCapacity: 'Capacidade em pé é recomendada',
            totalDoors: 'Número de portas é recomendado',
            routeNumber: 'Número da rota é recomendado',
        }
    },

    // Micro-ônibus
    MINIBUS: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType', 'busType', 'chassisNumber', 'renavan'],
        recommended: ['passengerCapacity', 'chassisBrand'],
        descriptions: {
            busType: 'Tipo do micro-ônibus é obrigatório',
            chassisNumber: 'Chassi é obrigatório',
            renavan: 'RENAVAN é obrigatório',
            passengerCapacity: 'Capacidade de passageiros é recomendada',
            chassisBrand: 'Marca do chassi é recomendada',
        }
    },

    // Van
    VAN: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType', 'chassisNumber', 'renavan'],
        recommended: ['passengerCapacity', 'chassisBrand'],
        descriptions: {
            chassisNumber: 'Chassi é obrigatório para vans',
            renavan: 'RENAVAN é obrigatório',
            passengerCapacity: 'Capacidade de passageiros é recomendada',
            chassisBrand: 'Marca do chassi é recomendada',
        }
    },

    // Carro Utilitário
    CAR_UTILITY: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType', 'chassisNumber', 'renavan'],
        recommended: [],
        descriptions: {
            chassisNumber: 'Chassi é obrigatório',
            renavan: 'RENAVAN é obrigatório',
        }
    },

    // Carro
    CAR: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType'],
        recommended: ['chassisNumber', 'renavan'],
        descriptions: {
            chassisNumber: 'Chassi é recomendado',
            renavan: 'RENAVAN é recomendado',
        }
    },

    // Caminhão
    TRUCK: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType', 'chassisNumber', 'renavan'],
        recommended: ['chassisBrand', 'bodyBuilder', 'axleCount'],
        descriptions: {
            chassisNumber: 'Chassi é obrigatório para caminhões',
            renavan: 'RENAVAN é obrigatório',
            chassisBrand: 'Marca do chassi é recomendada',
            bodyBuilder: 'Fabricante da carroceria é recomendado',
            axleCount: 'Número de eixos é recomendado',
        }
    },

    // Motocicleta
    MOTORCYCLE: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType'],
        recommended: ['chassisNumber', 'renavan'],
        descriptions: {
            chassisNumber: 'Chassi é recomendado',
            renavan: 'RENAVAN é recomendado',
        }
    },

    // Pickup
    PICKUP: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType'],
        recommended: ['chassisNumber', 'renavan'],
        descriptions: {
            chassisNumber: 'Chassi é recomendado',
            renavan: 'RENAVAN é recomendado',
        }
    },

    // SUV
    SUV: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType'],
        recommended: ['chassisNumber', 'renavan'],
        descriptions: {
            chassisNumber: 'Chassi é recomendado',
            renavan: 'RENAVAN é recomendado',
        }
    },

    // Outro
    OTHER: {
        required: ['plate', 'brand', 'model', 'ano', 'vehicleType'],
        recommended: ['chassisNumber', 'renavan'],
        descriptions: {
            chassisNumber: 'Chassi é recomendado',
            renavan: 'RENAVAN é recomendado',
        }
    },
};

// Labels dos campos para mensagens de erro
const FIELD_LABELS: Record<string, string> = {
    plate: 'Placa',
    brand: 'Marca',
    model: 'Modelo',
    ano: 'Ano',
    vehicleType: 'Tipo de Veículo',
    busType: 'Tipo de Ônibus',
    chassisNumber: 'Chassi',
    renavan: 'RENAVAN',
    passengerCapacity: 'Capacidade de Passageiros',
    standingCapacity: 'Capacidade em Pé',
    totalDoors: 'Número de Portas',
    chassisBrand: 'Marca do Chassi',
    bodyBuilder: 'Fabricante da Carroceria',
    engineModel: 'Modelo do Motor',
    routeNumber: 'Número da Rota',
    hasAirConditioning: 'Ar Condicionado',
    hasWiFi: 'Wi-Fi',
    axleCount: 'Número de Eixos',
    financingStatus: 'Status do Financiamento',
    aggregatedOwnerName: 'Nome do Proprietário (Agregado)',
    aggregatedPaymentType: 'Tipo de Pagamento (Agregado)',
};

export function useVehicleValidation() {

    const getValidationRules = (vehicleType: VehicleType | ''): VehicleValidationRules => {
        if (!vehicleType) {
            return {
                required: ['plate', 'brand', 'model', 'ano', 'vehicleType'],
                recommended: [],
                descriptions: {}
            };
        }
        return VALIDATION_RULES[vehicleType] || VALIDATION_RULES.OTHER;
    };

    const validate = (formData: VehicleFormData): ValidationError[] => {
        const errors: ValidationError[] = [];
        const rules = getValidationRules(formData.vehicleType);

        // Validar campos obrigatórios
        for (const field of rules.required) {
            const value = formData[field as keyof VehicleFormData];
            if (value === undefined || value === null || value === '' || value === 0) {
                const label = FIELD_LABELS[field] || field;
                const description = rules.descriptions[field] || `${label} é obrigatório para este tipo de veículo`;
                errors.push({ field, message: description });
            }
        }

        // Validações específicas de agregado
        if (formData.isAggregated) {
            if (!formData.aggregatedOwnerName) {
                errors.push({
                    field: 'aggregatedOwnerName',
                    message: 'Nome do proprietário é obrigatório para veículos de agregado'
                });
            }
            if (!formData.aggregatedPaymentType) {
                errors.push({
                    field: 'aggregatedPaymentType',
                    message: 'Tipo de pagamento é obrigatório para veículos de agregado'
                });
            }
        }

        // Validações de financiamento
        if (formData.financingStatus === 'FINANCED') {
            if (!formData.financingBankOrInstitution) {
                errors.push({
                    field: 'financingBankOrInstitution',
                    message: 'Banco/Instituição é obrigatório para veículos financiados'
                });
            }
            if (!formData.financingInstallmentValue || formData.financingInstallmentValue <= 0) {
                errors.push({
                    field: 'financingInstallmentValue',
                    message: 'Valor da parcela é obrigatório para veículos financiados'
                });
            }
        }

        // Validação de placa
        if (formData.placa && formData.placa.length < 7) {
            errors.push({
                field: 'placa',
                message: 'Placa deve ter pelo menos 7 caracteres'
            });
        }

        // Validação de chassi (17 caracteres se informado)
        if (formData.chassi && formData.chassi.length !== 17) {
            errors.push({
                field: 'chassisNumber',
                message: 'Chassi deve ter exatamente 17 caracteres'
            });
        }

        return errors;
    };

    const getFieldStatus = (field: string, formData: VehicleFormData): 'required' | 'recommended' | 'optional' => {
        const rules = getValidationRules(formData.vehicleType);
        if (rules.required.includes(field)) return 'required';
        if (rules.recommended.includes(field)) return 'recommended';
        return 'optional';
    };

    const getRequiredFields = (vehicleType: VehicleType | ''): string[] => {
        return getValidationRules(vehicleType).required;
    };

    const getRecommendedFields = (vehicleType: VehicleType | ''): string[] => {
        return getValidationRules(vehicleType).recommended;
    };

    return {
        validate,
        getFieldStatus,
        getRequiredFields,
        getRecommendedFields,
        getValidationRules,
    };
}
