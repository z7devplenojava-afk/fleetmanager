import { PaymentReceipt } from '@/services/paymentReceiptService';

export const mockPaymentReceipts: PaymentReceipt[] = [
  {
    id: 'pr-1',
    employeeName: 'JOÃO SILVA SANTOS',
    year: 2025,
    month: 1,
    fileName: 'comprovante_joao_silva_santos_2025_01.pdf',
    filePath: 'uploads/payment-receipts/2025/01/comprovante_joao_silva_santos_2025_01.pdf',
    status: 'PROCESSED',
    netSalary: 3500.00,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'pr-2',
    employeeName: 'MARIA OLIVEIRA COSTA',
    year: 2025,
    month: 1,
    fileName: 'comprovante_maria_oliveira_costa_2025_01.pdf',
    filePath: 'uploads/payment-receipts/2025/01/comprovante_maria_oliveira_costa_2025_01.pdf',
    status: 'PROCESSED',
    netSalary: 4200.00,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'pr-3',
    employeeName: 'CARLOS PEREIRA LIMA',
    year: 2025,
    month: 2,
    fileName: 'comprovante_carlos_pereira_lima_2025_02.pdf',
    filePath: 'uploads/payment-receipts/2025/02/comprovante_carlos_pereira_lima_2025_02.pdf',
    status: 'PROCESSED',
    netSalary: 3800.00,
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2025-02-15T10:00:00Z'
  },
  {
    id: 'pr-4',
    employeeName: 'ANA SANTOS RODRIGUES',
    year: 2025,
    month: 2,
    fileName: 'comprovante_ana_santos_rodrigues_2025_02.pdf',
    filePath: 'uploads/payment-receipts/2025/02/comprovante_ana_santos_rodrigues_2025_02.pdf',
    status: 'PROCESSED',
    netSalary: 3600.00,
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2025-02-15T10:00:00Z'
  }
];
