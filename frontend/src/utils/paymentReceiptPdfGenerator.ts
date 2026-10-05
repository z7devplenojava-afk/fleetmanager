import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ContaAPagarPDFData {
  id?: string;
  vencimento: Date;
  fornecedor: string;
  fornecedorId?: string;
  cliente?: string;
  obra?: string;
  contrato?: string;
  garagem?: string;
  empresa?: string;
  companySigla?: string;
  descricao: string;
  tipo?: string;
  valor: number;
  codigoBarras?: string;
  status: string;
  dataPagamento?: Date;
  dataEmissao?: Date;
  observacoes?: string;
  categoria?: string;
  centroCusto?: string;
  paymentMethod?: string;
}

export async function generatePaymentReceiptPDF(conta: ContaAPagarPDFData): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px'; // Formato A4 px em 96DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1f2937';
  container.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  container.style.padding = '40px';
  container.style.boxSizing = 'border-box';

  const dataPagamentoFmt = conta.dataPagamento 
    ? new Date(conta.dataPagamento).toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');

  const vencimentoFmt = conta.vencimento 
    ? new Date(conta.vencimento).toLocaleDateString('pt-BR') 
    : '-';

  const valorFmt = new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(conta.valor || 0);

  const empresaNome = conta.empresa || 'FLEET MANAGER LOGÍSTICA & SERVIÇOS';
  const empresaSigla = conta.companySigla ? `[${conta.companySigla}] ` : '';
  const fornecedorNome = conta.fornecedor || 'Favorecido não informado';
  const categoriaNome = conta.categoria || 'Não classificada';
  const referenciaPagamento = conta.id 
    ? `REC-${conta.id.slice(0, 8).toUpperCase()}` 
    : `REC-${Math.floor(100000 + Math.random() * 900000)}`;

  container.innerHTML = `
    <div style="border: 2px solid #3b82f6; border-radius: 12px; padding: 28px; background: #ffffff; position: relative;">
      
      <!-- Cabeçalho -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 20px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px;">
            ${empresaSigla}${empresaNome}
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
            Sistema Integrado de Gestão Financeira & Frota
          </div>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; background: #dbeafe; border: 1px solid #bfdbfe; color: #1e40af; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 6px; text-transform: uppercase;">
            🟢 Comprovante de Pagamento
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 6px; font-family: monospace;">
            Nº Reg: ${referenciaPagamento}
          </div>
        </div>
      </div>

      <!-- Título Principal -->
      <div style="text-align: center; margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
          RECIBO DE PAGAMENTO DE CONTA A PAGAR
        </h2>
        <div style="font-size: 12px; color: #475569; margin-top: 4px;">
          Quitação de despesa operacional e comprovante de quitação financeira
        </div>
      </div>

      <!-- Card de Destaque de Valor -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
        <div>
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #166534; letter-spacing: 0.5px;">
            VALOR TOTAL LIQUIDADO
          </div>
          <div style="font-size: 26px; font-weight: 900; color: #15803d; font-family: monospace; margin-top: 2px;">
            ${valorFmt}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 600; color: #166534;">DATA DA LIQUIDAÇÃO</div>
          <div style="font-size: 16px; font-weight: 800; color: #15803d; font-family: monospace; margin-top: 2px;">
            ${dataPagamentoFmt}
          </div>
        </div>
      </div>

      <!-- Detalhamento dos Dados -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px;">
        <tbody>
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; width: 25%; color: #334155;">
              FAVORECIDO / BENEFICIÁRIO
            </td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;" colspan="3">
              ${fornecedorNome}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; color: #334155;">
              DESCRIÇÃO DA DESPESA
            </td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #1e293b;" colspan="3">
              ${conta.descricao || 'Sem descrição'}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; color: #334155;">
              PLANO DE CONTAS
            </td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #1e293b;">
              ${categoriaNome}
            </td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; color: #334155;">
              CENTRO DE CUSTO
            </td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #1e293b;">
              ${conta.centroCusto || 'Não informado'}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; color: #334155;">
              FORMA DE PAGAMENTO
            </td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">
              ${conta.paymentMethod || 'BOLETO / TRANSFERÊNCIA'}
            </td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; color: #334155;">
              DATA VENCIMENTO
            </td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 600;">
              ${vencimentoFmt}
            </td>
          </tr>
          ${conta.garagem || conta.cliente || conta.obra ? `
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; color: #334155;">
              ALOCAÇÃO OPERACIONAL
            </td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; color: #1e293b;" colspan="3">
              ${conta.garagem ? `Garagem: ${conta.garagem}` : ''} 
              ${conta.cliente ? ` | Cliente: ${conta.cliente}` : ''} 
              ${conta.obra ? ` | Obra: ${conta.obra}` : ''}
            </td>
          </tr>
          ` : ''}
          ${conta.codigoBarras ? `
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; color: #334155;">
              LINHA DIGITÁVEL / BOLETO
            </td>
            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;" colspan="3">
              ${conta.codigoBarras}
            </td>
          </tr>
          ` : ''}
        </tbody>
      </table>

      <!-- Termo de Declaração -->
      <div style="background: #fafafa; border: 1px border-dashed #cbd5e1; border-radius: 8px; padding: 14px; margin-bottom: 30px; font-size: 11px; color: #475569; line-height: 1.5; text-align: justify;">
        <strong>Declaração de Quitação Financeira:</strong> Declaramos para os devidos fins de direito que a conta especificada neste recibo foi devidamente paga e baixada no módulo financeiro em <strong>${dataPagamentoFmt}</strong>, no valor integral de <strong>${valorFmt}</strong>, concedendo quitação referente a este título.
      </div>

      <!-- Rodapé e Assinaturas -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px;">
        <div style="text-align: center; width: 45%;">
          <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 6px; height: 30px;"></div>
          <div style="font-size: 11px; font-weight: 700; color: #1e293b;">DEPARTAMENTO FINANCEIRO</div>
          <div style="font-size: 10px; color: #64748b;">${empresaNome}</div>
        </div>

        <div style="text-align: center; width: 45%;">
          <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 6px; height: 30px;"></div>
          <div style="font-size: 11px; font-weight: 700; color: #1e293b;">FAVORECIDO / RECEBEDOR</div>
          <div style="font-size: 10px; color: #64748b;">${fornecedorNome}</div>
        </div>
      </div>

      <div style="margin-top: 30px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
        Gerado automaticamente pelo Sistema FleetManager em ${new Date().toLocaleString('pt-BR')} • Autenticador Digital
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight);
    
    const fileName = `recibo_pagamento_${conta.id ? conta.id.slice(0, 8) : 'financeiro'}_${dataPagamentoFmt.replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}
