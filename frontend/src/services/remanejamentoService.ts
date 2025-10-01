import api from '../lib/axios';

export interface Remanejamento {
  id: string;
  employeeId: string;
  originWorkstationId: string;
  destinationWorkstationId: string;
  remanejamentoDate: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRemanejamentoDTO {
  employeeId: string;
  originWorkstationId: string;
  destinationWorkstationId: string;
  remanejamentoDate: string;
  notes?: string;
}

export interface UpdateRemanejamentoDTO {
  originWorkstationId?: string;
  destinationWorkstationId?: string;
  remanejamentoDate?: string;
  status?: string;
  notes?: string;
}

export const getRemanejamentos = () => api.get('/remanejamentos');
export const getRemanejamentosByEmployee = (employeeId: string) => api.get(`/api/remanejamentos/employee/${employeeId}`);
export const getRemanejamento = (id: string) => api.get(`/api/remanejamentos/${id}`);
export const createRemanejamento = (data: CreateRemanejamentoDTO) => api.post('/remanejamentos', data);
export const updateRemanejamento = (id: string, data: UpdateRemanejamentoDTO) => api.put(`/api/remanejamentos/${id}`, data);
export const deleteRemanejamento = (id: string) => api.delete(`/api/remanejamentos/${id}`);

export const getRemanejamentosTyped = async (): Promise<Remanejamento[]> => {
  const response = await api.get('/remanejamentos');
  return response.data;
};