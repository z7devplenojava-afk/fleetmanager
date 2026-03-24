export interface OrderOfService {
  id: string;
  employeeId: string;
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
  employeeId: string;
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