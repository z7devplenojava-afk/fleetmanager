import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PreUseMonthlyItem {
  number: number;
  label: string;
}

export const PRE_USE_MONTHLY_ITEMS: PreUseMonthlyItem[] = [
  { number: 1, label: 'Adesivo de identificação - Empresa' },
  { number: 2, label: 'Documentos do Veículo: DUT' },
  { number: 3, label: 'Selo de Monitoramento' },
  { number: 4, label: 'Validade de ATF' },
  { number: 5, label: 'Procedimento Operacional' },
  { number: 6, label: 'Cinto de Segurança' },
  { number: 7, label: 'Encosto da Poltrona' },
  { number: 8, label: 'Saída de Emergência' },
  { number: 9, label: 'Extintor de Incêndio – Validade' },
  { number: 10, label: 'Chave de Roda' },
  { number: 11, label: 'Estepe – condição e calibragem' },
  { number: 12, label: 'Dips de Rodas' },
  { number: 13, label: 'Estado dos Pneus' },
  { number: 14, label: 'Inspeção Visual de Rodas e Acessórios' },
  { number: 15, label: 'Direção – resposta e ausência de folgas' },
  { number: 16, label: 'Freio – eficiência e ausência de ruídos' },
  { number: 17, label: 'Freio de Estacionamento' },
  { number: 18, label: 'Escapamento' },
  { number: 19, label: 'Óleo do Motor – nível e etiqueta' },
  { number: 20, label: 'Nível de Combustível' },
  { number: 21, label: 'Água do Radiador' },
  { number: 22, label: 'Água do Lavador de Para-brisa' },
  { number: 23, label: 'Limpador de Para-brisa LD/LE' },
  { number: 24, label: 'Instrumentos do Painel' },
  { number: 25, label: 'Hodômetro/Tacógrafo' },
  { number: 26, label: 'Farol Alto/Baixo' },
  { number: 27, label: 'Farolete' },
  { number: 28, label: 'Lanternas' },
  { number: 29, label: 'Luz de Freio' },
  { number: 30, label: 'Luz de Freio Break' },
  { number: 31, label: 'Luz de Ré' },
  { number: 32, label: 'Luz Interna' },
  { number: 33, label: 'Luz da Escada' },
  { number: 34, label: 'Pisca Alerta/Setas' },
  { number: 35, label: 'Alarme de Ré' },
  { number: 36, label: 'Campainha' },
  { number: 37, label: 'Buzina' },
  { number: 38, label: 'Estado das Janelas' },
  { number: 39, label: 'Para-brisa – integridade e visibilidade' },
  { number: 40, label: 'Vigia Lado Direito e Esquerdo' },
  { number: 41, label: 'Vigia Teto Dianteiro e Traseiro' },
  { number: 42, label: 'Lataria – estado geral' },
  { number: 43, label: 'Parachoque Dianteiro e Traseiro' },
  { number: 44, label: 'Apoio de Braço' },
  { number: 45, label: 'Quebra-sol' },
  { number: 46, label: 'Limpeza Interna e Externa' }
];

export interface PreUseMonthlyData {
  companyName?: string;
  responsibleName?: string;
  vehicleDescription?: string;
  vehiclePlate?: string;
  monthYear?: string;
  evaluations?: Record<number, Record<number, string>>;
  observations?: Record<number, string>;
}

/**
 * Gera o Relatório de Pré-Uso Mensal em formato Paisagem (Landscape A4),
 * exatamente idêntico ao modelo físico com 46 itens e 31 colunas diárias.
 */
export async function generatePreUseMonthlyPDF(data: PreUseMonthlyData = {}): Promise<void> {
  const companyName = data.companyName || 'VIAÇÃO SÃO SILVESTRE';
  const vehicle = data.vehicleDescription || '';
  const plate = data.vehiclePlate || '';
  const responsible = data.responsibleName || '';
  const monthYear = data.monthYear || `${new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}`;

  const page1Items = PRE_USE_MONTHLY_ITEMS.slice(0, 33);
  const page2Items = PRE_USE_MONTHLY_ITEMS.slice(33);

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '1120px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = 'Arial, sans-serif';

  const renderHeader = (isPage2: boolean = false) => `
    <div style="border: 1.5px solid #000; padding: 4px 8px; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; background-color: #f8fafc;">
      <div style="display: flex; align-items: center; gap: 8px; min-width: 220px;">
        <span style="font-size: 13px; font-weight: 900; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">${companyName}</span>
      </div>
      <div style="font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; text-align: center; flex: 1;">
        Relatório de Pré-Uso ${isPage2 ? '<span style="font-size: 11px; font-weight: normal; color: #475569;">(Continuação)</span>' : ''}
      </div>
    </div>
    <div style="border: 1.5px solid #000; padding: 5px 8px; margin-bottom: 6px; font-size: 11px; font-weight: bold; display: flex; gap: 16px; align-items: center; justify-content: space-between; background-color: #ffffff;">
      <div style="flex: 2;">RESPONSÁVEL: <span style="font-weight: normal; border-bottom: 1px dotted #000; display: inline-block; min-width: 200px; padding-left: 4px;">${responsible}</span></div>
      <div style="flex: 1.2;">VEÍCULO: <span style="font-weight: normal; border-bottom: 1px dotted #000; display: inline-block; min-width: 120px; padding-left: 4px;">${vehicle}</span></div>
      <div style="flex: 1;">PLACA: <span style="font-weight: normal; border-bottom: 1px dotted #000; display: inline-block; min-width: 90px; padding-left: 4px;">${plate}</span></div>
      <div style="flex: 1; text-align: right;">MÊS/ANO: <span style="font-weight: normal; border-bottom: 1px dotted #000; display: inline-block; min-width: 80px; padding-left: 4px;">${monthYear}</span></div>
    </div>
  `;

  const renderDaysHeader = () => {
    let daysHtml = '';
    for (let d = 1; d <= 31; d++) {
      daysHtml += `<th style="width: 21px; text-align: center; border: 1px solid #000; font-size: 9px; font-weight: bold; padding: 3px 0; background-color: #dcfce7; color: #166534;">${d}</th>`;
    }
    return daysHtml;
  };

  const renderTableRows = (items: PreUseMonthlyItem[]) => {
    return items.map(item => {
      let cellsHtml = '';
      for (let d = 1; d <= 31; d++) {
        const val = data.evaluations?.[item.number]?.[d] || '';
        let color = '#000000';
        if (val === 'B') color = '#15803d';
        else if (val === 'I') color = '#b91c1c';
        else if (val === 'NA') color = '#475569';

        cellsHtml += `<td style="border: 1px solid #000; text-align: center; font-size: 9px; font-weight: bold; height: 17px; padding: 0; color: ${color};">${val}</td>`;
      }
      return `
        <tr>
          <td style="border: 1px solid #000; text-align: center; font-size: 9px; font-weight: bold; padding: 2px 2px; width: 32px; background-color: #f8fafc;">${item.number}</td>
          <td style="border: 1px solid #000; font-size: 9.5px; padding: 2px 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px; font-weight: 500;">${item.label}</td>
          ${cellsHtml}
        </tr>
      `;
    }).join('');
  };

  // Página 1 (Itens 1 a 33)
  const page1Html = `
    <div id="preuse-page-1" style="width: 1120px; box-sizing: border-box; padding: 14px 18px; background-color: #ffffff; page-break-after: always;">
      ${renderHeader(false)}
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #000; font-size: 9.5px; padding: 3px 2px; width: 32px; text-align: center;">ITEM</th>
            <th style="border: 1px solid #000; font-size: 9.5px; padding: 3px 6px; text-align: left; width: 320px;">VERIFICAR</th>
            ${renderDaysHeader()}
          </tr>
        </thead>
        <tbody>
          ${renderTableRows(page1Items)}
        </tbody>
      </table>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; color: #64748b; margin-top: 4px;">
        <span>Viação São Silvestre — Sistema Integrado de Gestão de Frotas</span>
        <span>Página 1 de 2</span>
      </div>
    </div>
  `;

  // Página 2 (Itens 34 a 46, Legendas e Observações)
  let obsCol1Html = '';
  for (let d = 1; d <= 16; d++) {
    const obsVal = data.observations?.[d] || '';
    obsCol1Html += `
      <div style="display: flex; align-items: center; border-bottom: 1px solid #94a3b8; height: 17px; font-size: 8.5px;">
        <span style="width: 24px; font-weight: bold; text-align: center; border-right: 1px solid #94a3b8; padding-right: 4px; margin-right: 4px; background-color: #f1f5f9;">${d}</span>
        <span style="flex: 1; padding: 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${obsVal}</span>
      </div>
    `;
  }

  let obsCol2Html = '';
  for (let d = 17; d <= 31; d++) {
    const obsVal = data.observations?.[d] || '';
    obsCol2Html += `
      <div style="display: flex; align-items: center; border-bottom: 1px solid #94a3b8; height: 17px; font-size: 8.5px;">
        <span style="width: 24px; font-weight: bold; text-align: center; border-right: 1px solid #94a3b8; padding-right: 4px; margin-right: 4px; background-color: #f1f5f9;">${d}</span>
        <span style="flex: 1; padding: 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${obsVal}</span>
      </div>
    `;
  }
  // Linha 32 vazia para alinhar a coluna 2
  obsCol2Html += `
    <div style="display: flex; align-items: center; border-bottom: 1px solid #94a3b8; height: 17px; font-size: 8.5px;">
      <span style="width: 24px; font-weight: bold; text-align: center; border-right: 1px solid #94a3b8; padding-right: 4px; margin-right: 4px; background-color: #f1f5f9;">-</span>
      <span style="flex: 1; padding: 0 4px;"></span>
    </div>
  `;

  const page2Html = `
    <div id="preuse-page-2" style="width: 1120px; box-sizing: border-box; padding: 14px 18px; background-color: #ffffff;">
      ${renderHeader(true)}
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #000; font-size: 9.5px; padding: 3px 2px; width: 32px; text-align: center;">ITEM</th>
            <th style="border: 1px solid #000; font-size: 9.5px; padding: 3px 6px; text-align: left; width: 320px;">VERIFICAR</th>
            ${renderDaysHeader()}
          </tr>
        </thead>
        <tbody>
          ${renderTableRows(page2Items)}
        </tbody>
      </table>

      <!-- Legendas e Quadro de Observações -->
      <div style="margin-top: 10px; display: flex; gap: 14px; align-items: stretch;">
        <!-- Legendas -->
        <div style="border: 1.5px solid #000; padding: 10px 14px; width: 220px; font-size: 10.5px; display: flex; flex-direction: column; justify-content: center; gap: 8px; background-color: #f8fafc;">
          <div style="font-weight: 900; border-bottom: 1.5px solid #000; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
            Legendas:
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="background-color: #dcfce7; color: #166534; font-weight: 900; padding: 2px 8px; border-radius: 4px; border: 1px solid #16a34a; min-width: 24px; text-align: center;">B</span>
            <span style="font-weight: bold; color: #15803d;">Bom</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="background-color: #fee2e2; color: #991b1b; font-weight: 900; padding: 2px 8px; border-radius: 4px; border: 1px solid #dc2626; min-width: 24px; text-align: center;">I</span>
            <span style="font-weight: bold; color: #b91c1c;">Irregular</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="background-color: #f1f5f9; color: #334155; font-weight: 900; padding: 2px 6px; border-radius: 4px; border: 1px solid #64748b; min-width: 24px; text-align: center;">NA</span>
            <span style="font-weight: bold; color: #475569;">Não se Aplica</span>
          </div>
        </div>

        <!-- Observações -->
        <div style="flex: 1; border: 1.5px solid #000; padding: 6px 10px; background-color: #ffffff;">
          <div style="font-size: 10px; font-weight: 900; text-align: center; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
            OBSERVAÇÕES (Dias 1 a 31)
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; column-gap: 16px;">
            <div>${obsCol1Html}</div>
            <div>${obsCol2Html}</div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; color: #64748b; margin-top: 6px;">
        <span>Viação São Silvestre — Sistema Integrado de Gestão de Frotas</span>
        <span>Página 2 de 2</span>
      </div>
    </div>
  `;

  container.innerHTML = page1Html + page2Html;
  document.body.appendChild(container);

  try {
    const page1El = document.getElementById('preuse-page-1');
    const page2El = document.getElementById('preuse-page-2');

    const pdf = new jsPDF('l', 'mm', 'a4'); // Paisagem (Landscape A4: 297mm x 210mm)
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const pages = [page1El, page2El].filter(Boolean) as HTMLElement[];

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      if (i > 0) {
        pdf.addPage('a4', 'l');
      }

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 10) / imgWidth, (pdfHeight - 10) / imgHeight);
      const renderW = imgWidth * ratio;
      const renderH = imgHeight * ratio;
      const imgX = (pdfWidth - renderW) / 2;
      const imgY = (pdfHeight - renderH) / 2;

      pdf.addImage(imgData, 'JPEG', imgX, imgY, renderW, renderH);
    }

    const cleanPlate = (plate || 'Veiculo').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanMonth = (monthYear || 'Mensal').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Relatorio_PreUso_Mensal_${cleanPlate}_${cleanMonth}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}
