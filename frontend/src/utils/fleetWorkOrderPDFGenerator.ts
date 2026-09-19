import api from '@/lib/axios';
import type { FleetWorkOrder } from '@/services/fleetWorkOrderService';

/**
 * Busca o PDF da Ordem de Serviço de Frota no backend
 * (endpoint GET /fleet-work-orders/{id}/pdf — gerado via Thymeleaf + Flying Saucer).
 */
export async function generateFleetWorkOrderPDFBlob(order: FleetWorkOrder): Promise<Blob> {
  if (!order?.id) {
    throw new Error('Ordem de Serviço sem ID — não é possível gerar o PDF.');
  }

  const response = await api.get(`/fleet-work-orders/${order.id}/pdf`, {
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf',
    },
  });

  if (!(response.data instanceof Blob) || response.data.size === 0) {
    throw new Error('Resposta vazia do servidor ao gerar o PDF.');
  }

  return response.data;
}

/**
 * Gera o PDF e dispara o download direto.
 */
export async function generateFleetWorkOrderPDFDownload(order: FleetWorkOrder): Promise<void> {
  const blob = await generateFleetWorkOrderPDFBlob(order);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const osNumber = order.osNumber || order.id.split('-')[0] || order.id;
  a.href = url;
  a.download = `ordem-servico-${osNumber.replace(/[^a-zA-Z0-9-_]/g, '')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Abre o PDF gerado diretamente em uma nova aba do navegador para visualização.
 */
export async function openFleetWorkOrderPDFPreview(order: FleetWorkOrder): Promise<void> {
  const blob = await generateFleetWorkOrderPDFBlob(order);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
