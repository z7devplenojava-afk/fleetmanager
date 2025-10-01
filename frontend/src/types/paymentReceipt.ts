// Re-export da interface do serviço para manter consistência
export type { PaymentReceipt } from '@/services/paymentReceiptService';

export interface PaymentReceiptViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: PaymentReceipt | null;
  onDownload: (receiptId: string, fileName: string) => void;
}
