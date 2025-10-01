export interface OrderOfService {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCpf: string;
  role: string;
  company: string;
  client: string;
  workplace: string;
  salary: number;
  startDate: string;
  endDate?: string;
  documentUrl?: string;
  signed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderOfServiceDTO {
  employeeId: number;
  employeeName: string;
  employeeCpf: string;
  role: string;
  company: string;
  client: string;
  workplace: string;
  salary: number;
  startDate: string;
  endDate?: string;
} 