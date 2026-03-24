import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface ShiftChangeFormDTO {
    id?: number;
    dateOfRequest: string;
    requesterFullName: string;
    requesterSector: string;
    requesterDayOffDate?: string | null;
    requesterShiftDate: string;
    replacingFullName: string;
    replacingSector: string;
    replacingShiftDate: string;
    replacingDayOffDate?: string | null;
    shiftTime: 'SHIFT_6H_18H' | 'SHIFT_18H_6H' | 'SHIFT_7H_19H' | 'SHIFT_19H_7H';
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

class ShiftChangeService {

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            Authorization: `Bearer ${token}`,
        };
    }

    async createShiftChange(formData: ShiftChangeFormDTO): Promise<ShiftChangeFormDTO> {
        try {
            const response = await axios.post<ShiftChangeFormDTO>(
                `${API_URL}/operational/shift-changes`,
                formData,
                { headers: this.getAuthHeaders() }
            );
            toast({
                title: "Sucesso!",
                description: "Solicitação de troca de plantão criada.",
                variant: "default",
            });
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erro ao criar solicitação de troca de plantão.";
            toast({
                title: "Erro",
                description: errorMessage,
                variant: "destructive",
            });
            throw error;
        }
    }

    async getAllShiftChanges(): Promise<ShiftChangeFormDTO[]> {
        try {
            const response = await axios.get<ShiftChangeFormDTO[]>(
                `${API_URL}/operational/shift-changes`,
                { headers: this.getAuthHeaders() }
            );
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erro ao buscar solicitações de troca de plantão.";
            toast({
                title: "Erro",
                description: errorMessage,
                variant: "destructive",
            });
            throw error;
        }
    }

    async updateShiftChange(id: number, formData: ShiftChangeFormDTO): Promise<ShiftChangeFormDTO> {
        try {
            const response = await axios.put<ShiftChangeFormDTO>(
                `${API_URL}/operational/shift-changes/${id}`,
                formData,
                { headers: this.getAuthHeaders() }
            );
            toast({
                title: "Sucesso!",
                description: "Solicitação de troca de plantão atualizada.",
                variant: "default",
            });
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erro ao atualizar solicitação de troca de plantão.";
            toast({
                title: "Erro",
                description: errorMessage,
                variant: "destructive",
            });
            throw error;
        }
    }

    async deleteShiftChange(id: number): Promise<void> {
        try {
            await axios.delete(
                `${API_URL}/operational/shift-changes/${id}`,
                { headers: this.getAuthHeaders() }
            );
            toast({
                title: "Sucesso!",
                description: "Solicitação de troca de plantão excluída.",
                variant: "default",
            });
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erro ao excluir solicitação de troca de plantão.";
            toast({
                title: "Erro",
                description: errorMessage,
                variant: "destructive",
            });
            throw error;
        }
    }
}

export default new ShiftChangeService();
