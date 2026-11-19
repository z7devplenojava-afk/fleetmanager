import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PreUseChecklistItem {
  id: string;
  label: string;
  category: string;
  positivo?: number | null;
  negativo?: number | null;
  observacao?: string;
}

export interface PreUseChecklistPDFData {
  id?: string;
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleBrand?: string;
  kmReading?: number | string;
  driverName?: string;
  driverCpf?: string;
  driverCnh?: string;
  clientName?: string;
  workPostName?: string;
  occurredAt?: string;
  type?: string;
  observations?: string;
  items?: PreUseChecklistItem[];
}

export async function generatePreUseChecklistPDF(data: PreUseChecklistPDFData): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Inter', 'Helvetica Neue', Arial, sans-serif";
  container.style.padding = '35px';
  container.style.boxSizing = 'border-box';

  const dataEmissao = data.occurredAt 
    ? new Date(data.occurredAt).toLocaleString('pt-BR') 
    : new Date().toLocaleString('pt-BR');

  const codigoChecklist = data.id 
    ? `CHK-${data.id.slice(0, 8).toUpperCase()}` 
    : `CHK-${Math.floor(100000 + Math.random() * 900000)}`;

  const items = data.items || [];
  const totalConformes = items.filter(i => i.positivo === 1).length;
  const totalNaoConformes = items.filter(i => i.negativo === 1).length;
  const totalItens = items.length;

  // Separar itens normais de itens de avarias
  const isAvaria = (item: PreUseChecklistItem) => {
    const l = (item.label || '').toLowerCase();
    const c = (item.category || '').toLowerCase();
    return l.includes('[avaria]') || l.includes('avaria') || c.includes('avaria') || l.includes('amassado') || l.includes('arranhao') || l.includes('trinca');
  };

  const avariaItems = items.filter(isAvaria);
  const generalItems = items.filter(i => !isAvaria(i));

  const getStatusBadge = (item: PreUseChecklistItem) => {
    if (item.positivo === 1) {
      return '<span style="color: #16a34a; font-weight: 800; background-color: #dcfce7; padding: 2px 8px; border-radius: 4px; font-size: 10px;">✅ CONFORME</span>';
    } else if (item.negativo === 1) {
      return '<span style="color: #dc2626; font-weight: 800; background-color: #fee2e2; padding: 2px 8px; border-radius: 4px; font-size: 10px;">❌ NÃO CONFORME</span>';
    } else {
      return '<span style="color: #64748b; font-weight: 600; background-color: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 10px;">⚪ N/A</span>';
    }
  };

  const renderTableRows = (itemList: PreUseChecklistItem[]) => itemList.map((item, index) => `
    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px 8px; font-size: 10px; color: #64748b; text-align: center; width: 30px;">${index + 1}</td>
      <td style="padding: 6px 8px; font-size: 10px; font-weight: 700; color: #334155; width: 110px;">${item.category || 'Geral'}</td>
      <td style="padding: 6px 8px; font-size: 10px; font-weight: 600; color: #0f172a;">${item.label.replace(/^\[Avaria\]\s*/i, '')}</td>
      <td style="padding: 6px 8px; text-align: center; width: 120px;">${getStatusBadge(item)}</td>
      <td style="padding: 6px 8px; font-size: 9px; color: #475569; width: 140px;">${item.observacao || '-'}</td>
    </tr>
  `).join('');

  const generalRowsHtml = renderTableRows(generalItems.length > 0 ? generalItems : items);
  const avariaRowsHtml = avariaItems.length > 0 ? renderTableRows(avariaItems) : '';

  container.innerHTML = `
    <!-- CABEÇALHO OFICIAL NO FORMATO DA ORDEM DE SERVIÇO -->
    <div style="border-bottom: 2px solid #2e7d32; padding-bottom: 8px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 12px; width: 60%;">
        <img src="/images/sao-silvestre-logo.png" alt="Logo" style="height: 38px; width: auto; object-fit: contain;" />
        <div>
          <div style="font-size: 13px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.3px;">VIAÇÃO SÃO SILVESTRE S.A.</div>
          <div style="font-size: 9px; color: #4b5563; line-height: 1.2;">SISTEMA INTEGRADO DE MOBILIZAÇÃO E INSPEÇÃO TÉCNICA</div>
          <div style="font-size: 8px; color: #6b7280;">CNPJ: 71.055.644/0001-25 • Transporte e Fretamento</div>
        </div>
      </div>
      <div style="text-align: right; width: 40%;">
        <div style="font-size: 12px; font-weight: 900; color: #2e7d32; text-transform: uppercase; letter-spacing: 0.5px;">CHECK-LIST DE PRÉ-USO</div>
        <div style="display: inline-block; background-color: #f1f8e9; border: 1px solid #2e7d32; color: #2e7d32; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; margin-top: 2px;">
          ${codigoChecklist}
        </div>
        <div style="font-size: 9px; color: #4b5563; margin-top: 2px;">Emissão: ${dataEmissao}</div>
      </div>
    </div>

    <!-- PAINEL DE IDENTIFICAÇÃO DO VEÍCULO E MOTORISTA -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background-color: #fafafa; border: 1px solid #ddd; border-radius: 6px; padding: 8px; margin-bottom: 12px; font-size: 9.5px;">
      <div>
        <span style="color: #64748b; display: block; font-size: 8.5px; font-weight: 700; text-transform: uppercase;">VEÍCULO / PLACA:</span>
        <strong style="color: #0f172a; font-size: 11px; font-family: monospace;">${data.vehiclePlate || '-'}</strong>
        <span style="color: #475569; display: block; font-size: 8.5px;">${data.vehicleBrand || ''} ${data.vehicleModel || ''}</span>
      </div>
      <div>
        <span style="color: #64748b; display: block; font-size: 8.5px; font-weight: 700; text-transform: uppercase;">HODÔMETRO (KM):</span>
        <strong style="color: #2e7d32; font-size: 11px; font-family: monospace;">${data.kmReading ? Number(data.kmReading).toLocaleString('pt-BR') + ' KM' : '-'}</strong>
      </div>
      <div>
        <span style="color: #64748b; display: block; font-size: 8.5px; font-weight: 700; text-transform: uppercase;">MOTORISTA RESPONSÁVEL:</span>
        <strong style="color: #0f172a; font-size: 9.5px;">${data.driverName || 'Não Informado'}</strong>
        <span style="color: #475569; display: block; font-size: 8.5px;">CPF: ${data.driverCpf || '-'}</span>
      </div>
      <div>
        <span style="color: #64748b; display: block; font-size: 8.5px; font-weight: 700; text-transform: uppercase;">CLIENTE / OBRA:</span>
        <strong style="color: #0f172a; font-size: 9.5px;">${data.clientName || 'Geral'}</strong>
        <span style="color: #475569; display: block; font-size: 8.5px;">Posto: ${data.workPostName || '-'}</span>
      </div>
    </div>

    <!-- RESUMO DE CONFORMIDADE -->
    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
      <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 10px; color: #166534; font-weight: 700;">Itens Conformes</span>
        <strong style="font-size: 14px; color: #15803d;">${totalConformes} / ${totalItens}</strong>
      </div>
      <div style="flex: 1; background-color: ${totalNaoConformes > 0 ? '#fef2f2' : '#f8fafc'}; border: 1px solid ${totalNaoConformes > 0 ? '#fecaca' : '#e2e8f0'}; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 10px; color: ${totalNaoConformes > 0 ? '#991b1b' : '#64748b'}; font-weight: 700;">Não Conformidades</span>
        <strong style="font-size: 14px; color: ${totalNaoConformes > 0 ? '#dc2626' : '#64748b'};">${totalNaoConformes}</strong>
      </div>
    </div>

    <!-- TABELA DE ITENS DO CHECKLIST -->
    <div style="margin-bottom: 14px;">
      <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
        <span>DETALHAMENTO DOS ITENS DE INSPEÇÃO (${generalItems.length > 0 ? generalItems.length : totalItens} ITENS)</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #475569; font-size: 9px; text-transform: uppercase; font-weight: 800; text-align: left;">
            <th style="padding: 6px 8px; text-align: center; border-bottom: 2px solid #cbd5e1;">#</th>
            <th style="padding: 6px 8px; border-bottom: 2px solid #cbd5e1;">Categoria</th>
            <th style="padding: 6px 8px; border-bottom: 2px solid #cbd5e1;">Item do Checklist</th>
            <th style="padding: 6px 8px; text-align: center; border-bottom: 2px solid #cbd5e1;">Status</th>
            <th style="padding: 6px 8px; border-bottom: 2px solid #cbd5e1;">Observações</th>
          </tr>
        </thead>
        <tbody>
          ${generalRowsHtml}
        </tbody>
      </table>
    </div>

    ${avariaItems.length > 0 ? `
    <!-- SEÇÃO DEDICADA DE AVARIAS, LATARIA E PINTURA -->
    <div style="margin-bottom: 14px; border: 1.5px solid #f59e0b; border-radius: 6px; overflow: hidden;">
      <div style="background-color: #fef3c7; color: #92400e; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #fde68a;">
        <span>🔍 INSPEÇÃO DE AVARIAS, LATARIA E PINTURA (${avariaItems.length} ITENS AVALIADOS)</span>
        <span style="font-size: 9px; font-weight: 700; color: #b45309;">Conferência Visual Externa & Interna</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
        <thead>
          <tr style="background-color: #fffbeb; color: #78350f; font-size: 9px; text-transform: uppercase; font-weight: 800; text-align: left;">
            <th style="padding: 5px 8px; text-align: center; border-bottom: 1.5px solid #fde68a; width: 30px;">#</th>
            <th style="padding: 5px 8px; border-bottom: 1.5px solid #fde68a; width: 110px;">Tipo de Avaria</th>
            <th style="padding: 5px 8px; border-bottom: 1.5px solid #fde68a;">Região / Componente</th>
            <th style="padding: 5px 8px; text-align: center; border-bottom: 1.5px solid #fde68a; width: 120px;">Condição</th>
            <th style="padding: 5px 8px; border-bottom: 1.5px solid #fde68a; width: 140px;">Registro de Danos / Detalhes</th>
          </tr>
        </thead>
        <tbody>
          ${avariaRowsHtml}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${data.observations ? `
      <!-- OBSERVAÇÕES GERAIS -->
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 10px;">
        <strong style="color: #92400e; display: block; margin-bottom: 2px;">OBSERVAÇÕES DO INSPETOR:</strong>
        <span style="color: #78350f;">${data.observations}</span>
      </div>
    ` : ''}

    <!-- SEÇÃO DE ASSINATURAS -->
    <div style="margin-top: 25px; padding-top: 10px; border-top: 1.5px solid #cbd5e1; font-size: 9px; color: #475569;">
      <div style="display: flex; justify-content: space-between; text-align: center; gap: 40px;">
        <div style="flex: 1;">
          <div style="border-bottom: 1px solid #94a3b8; height: 30px; margin-bottom: 4px;"></div>
          <div style="font-weight: 800; color: #0f172a;">${data.driverName || 'Motorista / Condutor'}</div>
          <div>Responsável pelo Veículo no Pré-Uso</div>
        </div>
        <div style="flex: 1;">
          <div style="border-bottom: 1px solid #94a3b8; height: 30px; margin-bottom: 4px;"></div>
          <div style="font-weight: 800; color: #0f172a;">Inspetor / Técnico de Frota</div>
          <div>Viação São Silvestre Ltda.</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    const fileName = `Checklist_PreUso_${(data.vehiclePlate || 'Veiculo').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}
