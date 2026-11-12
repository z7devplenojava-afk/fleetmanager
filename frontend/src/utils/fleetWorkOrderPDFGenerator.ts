import api from '@/lib/axios';
import type { FleetWorkOrder } from '@/services/fleetWorkOrderService';

export interface FleetWorkOrderPDFOptions {
  blank?: boolean;
  templateModel?: 'MODELO_1' | 'MODELO_2' | string;
}

/**
 * Busca o PDF da Ordem de Serviço de Frota no backend
 * (endpoint GET /fleet-work-orders/{id}/pdf — gerado via Thymeleaf + Flying Saucer).
 * Quando options.blank === true, gera o PDF com os campos do checklist em branco.
 * Quando options.templateModel === 'MODELO_2', usa o layout Check-List Verificação de Frota.
 */
export async function generateFleetWorkOrderPDFBlob(
  order: FleetWorkOrder,
  options?: FleetWorkOrderPDFOptions
): Promise<Blob> {
  if (!order?.id) {
    throw new Error('Ordem de Serviço sem ID — não é possível gerar o PDF.');
  }

  const params: Record<string, any> = {};
  if (options?.blank) params.blank = true;
  if (options?.templateModel) params.templateModel = options.templateModel;

  const response = await api.get(`/fleet-work-orders/${order.id}/pdf`, {
    params: Object.keys(params).length > 0 ? params : undefined,
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
export async function generateFleetWorkOrderPDFDownload(
  order: FleetWorkOrder,
  options?: FleetWorkOrderPDFOptions
): Promise<void> {
  const blob = await generateFleetWorkOrderPDFBlob(order, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const osNumber = order.osNumber || order.id.split('-')[0] || order.id;
  const suffix = options?.blank ? '-em-branco' : '';
  a.href = url;
  a.download = `ordem-servico-${osNumber.replace(/[^a-zA-Z0-9-_]/g, '')}${suffix}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Abre o PDF gerado diretamente em uma nova aba do navegador para visualização.
 */
export async function openFleetWorkOrderPDFPreview(
  order: FleetWorkOrder,
  options?: FleetWorkOrderPDFOptions
): Promise<void> {
  const blob = await generateFleetWorkOrderPDFBlob(order, options);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
