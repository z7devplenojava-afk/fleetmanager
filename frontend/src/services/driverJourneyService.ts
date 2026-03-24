import api from '@/lib/axios';

// DTO para retorno da Jornada
export interface DriverJourneyDTO {
    id: string;
    driverId: string;
    driverName: string;
    startTime: string;
    endTime: string;
    type: 'DRIVING' | 'WAIT' | 'REST' | 'MEAL' | 'EXTRA';
    source: string;
    notes: string;
    durationMinutes: number;
}

export const driverJourneyService = {
    /**
     * Busca jornadas de um motorista em uma data específica
     */
    async getJourneys(driverId: string, date: string): Promise<DriverJourneyDTO[]> {
        const response = await api.get('/api/driver-journeys', {
            params: { driverId, date }
        });
        return response.data;
    },

    /**
     * Calcula o total de minutos trabalhados no dia (para pre-validar frontend)
     * Isso Ã© uma estimativa, a validaÃ§Ã£o real Ã© no backend.
     */
    async getDailyUsageMinutes(driverId: string, date: string): Promise<number> {
        try {
            const journeys = await this.getJourneys(driverId, date);
            return journeys
                .filter(j => j.type === 'DRIVING' || j.type === 'EXTRA')
                .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
        } catch (error) {
            console.error('Erro ao calcular uso diÃ¡rio:', error);
            return 0;
        }
    },

    /**
     * Busca o saldo do banco de horas (Mockado por enquanto, pois o endpoint real ainda falta no controller)
     * Futuramente: GET /api/time-bank/{driverId}
     */
    async getTimeBankBalance(driverId: string): Promise<string> {
        // SimulaÃ§Ã£o: Retorna valor aleatÃ³rio entre -10h e +20h para demonstraÃ§Ã£o
        // Em produÃ§Ã£o, isso deve vir do backend
        return new Promise((resolve) => {
            setTimeout(() => {
                const hours = Math.floor(Math.random() * 30) - 10;
                const sign = hours >= 0 ? '+' : '';
                resolve(`${sign}${hours}h 00m`);
            }, 500);
        });
    }
};
