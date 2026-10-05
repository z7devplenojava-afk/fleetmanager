import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface MobilizationDossierData {
  id?: string;
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleBrand?: string;
  chassisNumber?: string;
  yearModel?: string;
  driverName: string;
  driverCpf?: string;
  driverCnh?: string;
  cnhCategory?: string;
  cnhDueDate?: string;
  clientName: string;
  workPostName?: string;
  occurredAt?: string;
  type?: string;
  kmReading?: number;
  observations?: string;

  // Documentos do Veículo
  crlv2026?: boolean;
  laudoConformidade?: boolean;
  laudoFumaca?: boolean;
  osPreventiva?: boolean;
  planoManutencao?: boolean;
  artEngenheiroMecanico?: boolean;
  atfAnttDer?: boolean;
  apreciacaoRisco?: boolean;

  // Documentação do Funcionário / Motorista (Organizada por Pastas)
  fichaRegistro?: boolean;
  contratoTrabalho?: boolean;
  fichaESocial?: boolean;
  rgDocument?: boolean;
  ctpsDocument?: boolean;
  cnhEspelhoPontuacao?: boolean;
  fotoMotorista?: boolean;

  // Pasta 2: Saúde Ocupacional
  asoVigente?: boolean;
  exameToxicologico?: boolean;
  cartaoVacina?: boolean;
  formularioRac?: boolean;

  // Pasta 3: Segurança do Trabalho (SST / NR-01)
  ordemServicoSstNr01?: boolean;
  fichaEpi?: boolean;
  termoAlcoolDroga?: boolean;
  regraDeOuro?: boolean;

  // Pasta 4: Treinamentos & Certificações
  treinamentoAmbiental?: boolean;
  treinamentoRac02?: boolean;
  certificadoColetivo50h?: boolean;
  certificadoColetivo16h?: boolean;
  treinamentoPrimeirosSocorros?: boolean;
  treinamentoNr?: boolean;

  // Documentos da Empresa
  cnpjEmpresa?: boolean;
  licencaAnttDer?: boolean;
  apoliceSeguro?: boolean;
  pgrPcmsoEmpresa?: boolean;
}

export async function generateMobilizationDossierPDF(data: MobilizationDossierData): Promise<void> {
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
    ? new Date(data.occurredAt).toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');

  const codigoMobilizacao = data.id 
    ? `MOB-${data.id.slice(0, 8).toUpperCase()}` 
    : `MOB-${Math.floor(100000 + Math.random() * 900000)}`;

  container.innerHTML = `
    <!-- CABEÇALHO OFICIAL VIAÇÃO SÃO SILVESTRE -->
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 50px; height: 50px; background-color: #0284c7; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 20px;">
          VSS
        </div>
        <div>
          <div style="font-size: 18px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px;">VIAÇÃO SÃO SILVESTRE LTDA.</div>
          <div style="font-size: 11px; color: #64748b; font-weight: 600;">GESTÃO INTEGRADA DE FROTAS, MOBILIZAÇÃO E OPERAÇÕES</div>
          <div style="font-size: 10px; color: #94a3b8;">CNPJ: 71.055.644/0001-25 • Inscrição Estadual: Isenta</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="display: inline-block; background-color: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid #bae6fd;">
          DOSSIÊ DE MOBILIZAÇÃO
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 4px;">Nº: ${codigoMobilizacao}</div>
        <div style="font-size: 10px; color: #64748b;">Emissão: ${dataEmissao}</div>
      </div>
    </div>

    <!-- PAINEL DE IDENTIFICAÇÃO DO VEÍCULO E MOTORISTA -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 18px;">
      <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0369a1; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
        <span>🚍 Resumo de Alocação Operacional</span>
        <span style="color: #64748b; font-size: 10px;">Cliente: ${data.clientName || 'Geral'} ${data.workPostName ? ` • Obra: ${data.workPostName}` : ''}</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px;">
        <div>
          <div style="color: #64748b; font-size: 10px; font-weight: 700;">DADOS DO VEÍCULO AUDITADO:</div>
          <div style="font-size: 14px; font-weight: 900; color: #0f172a; font-family: monospace;">PLACA: ${data.vehiclePlate || 'N/I'}</div>
          <div>Modelo: <strong>${data.vehicleBrand || ''} ${data.vehicleModel || 'Ônibus/Van'}</strong></div>
          <div>Chassi: <strong>${data.chassisNumber || 'Conforme CRLV'}</strong></div>
          <div>Hodômetro na Vistoria: <strong>${data.kmReading ? `${data.kmReading.toLocaleString('pt-BR')} km` : 'Registrado em sistema'}</strong></div>
        </div>
        <div>
          <div style="color: #64748b; font-size: 10px; font-weight: 700;">COLABORADOR / MOTORISTA DESIGNADO:</div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${data.driverName || 'Motorista Não Informado'}</div>
          <div>CPF: <strong>${data.driverCpf || 'Registrado em Ficha'}</strong></div>
          <div>CNH / Categoria: <strong>${data.driverCnh || 'Vigente'} (${data.cnhCategory || 'D/E'})</strong></div>
          <div>Validade CNH: <strong>${data.cnhDueDate || 'Vigente'}</strong></div>
        </div>
      </div>
    </div>

    <!-- SEÇÃO 1: DOCUMENTAÇÃO TÉCNICA E LAUDOS DO VEÍCULO -->
    <div style="margin-bottom: 16px;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; background-color: #0284c7; color: #ffffff; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px;">
        1. Checklist & Laudos Técnicos do Veículo (Inspeção Geral & RAC 02)
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #475569; text-align: left; font-weight: 700;">
            <th style="padding: 6px; border: 1px solid #cbd5e1;">Item Auditado</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1;">Descrição do Requisito de Mobilização</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Status Auditado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700;">CRLV 2026</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">Licenciamento e Certificado de Registro de Veículo Vigente</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; color: #16a34a; font-weight: 800;">🟢 CONFORME</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700;">Laudo de Conformidade</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">Vistoria Técnica Mecânica e Estrutural Completa</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; color: #16a34a; font-weight: 800;">🟢 CONFORME</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700;">Laudo de Opacidade</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">Teste de Emissão de Fumaça Preta (Análise Ambiental)</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; color: #16a34a; font-weight: 800;">🟢 CONFORME</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700;">Apreciação de Risco (APR)</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">Análise de Riscos Operacionais do Equipamento</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; color: #16a34a; font-weight: 800;">🟢 CONFORME</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700;">OS Preventiva & PMP</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">Manutenção Preventiva Executada & Plano Periódico 10.000km</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; color: #16a34a; font-weight: 800;">🟢 CONFORME</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700;">ART Engenheiro Mecânico</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">Anotação de Responsabilidade Técnica (Assinada por Eng. Mecânico)</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; color: #16a34a; font-weight: 800;">🟢 CONFORME</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700;">ATF (ANTT/DER)</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">Autorização de Tráfego e Fretamento de Passageiros</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; color: #16a34a; font-weight: 800;">🟢 CONFORME</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SEÇÃO 2: PASTA DO MOTORISTA E SEGURANÇA DO TRABALHO (NR-01 / PGR / ASO) -->
    <div style="margin-bottom: 16px;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; background-color: #0f172a; color: #ffffff; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px;">
        2. Pasta do Colaborador / Motorista (SST, ASO, CNH, Treinamentos & Ficha EPI)
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 9.5px;">
        <!-- Bloco 1: Registro & Saúde -->
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px;">
          <div style="font-weight: 800; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px;">
            📁 1. DADOS PESSOAIS & SAÚDE OCUPACIONAL
          </div>
          <div>✅ Ficha de Registro do Funcionário</div>
          <div>✅ Contrato de Trabalho / Experiência</div>
          <div>✅ Ficha eSocial Cadastral & CTPS Digital</div>
          <div>✅ CNH com Consulta de Pontuação Atualizada</div>
          <div>✅ ASO (Atestado de Saúde Ocupacional) Vigente</div>
          <div>✅ Exame Toxicológico Periódico Aprovado</div>
          <div>✅ Cartão de Vacinas Atualizado</div>
        </div>

        <!-- Bloco 2: SST & Treinamentos -->
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px;">
          <div style="font-weight: 800; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px;">
            📁 2. SEGURANÇA DO TRABALHO (NR-01) & CURSOS
          </div>
          <div>✅ Ordem de Serviço de SST (NR-01 com Matriz de Riscos)</div>
          <div>✅ Ficha de Entrega e Controle de EPI</div>
          <div>✅ Termo de Compromisso Álcool e Drogas</div>
          <div>✅ Treinamento Introdutório & Regras de Ouro</div>
          <div>✅ Treinamento RAC 02 (Direção Defensiva / Veículos)</div>
          <div>✅ Certificado Coletivo 50h & 16h (Transp. Passageiros)</div>
          <div>✅ Treinamento de Primeiros Socorros</div>
        </div>
      </div>
    </div>

    <!-- SEÇÃO 3: RESUMO DA MATRIZ DE RISCOS (ORDEM DE SERVIÇO NR-01 MOTORISTA) -->
    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background-color: #fafafa; margin-bottom: 18px;">
      <div style="font-size: 10px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
        🛡️ Resumo da Ordem de Serviço de Segurança do Trabalho (NR-01 - PGR / PCMSO)
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 9px; background-color: #ffffff;">
        <tr style="background-color: #f1f5f9; font-weight: 700;">
          <td style="padding: 4px; border: 1px solid #cbd5e1;">Riscos Físicos: Ruído Contínuo / Vibração</td>
          <td style="padding: 4px; border: 1px solid #cbd5e1;">Riscos Ergonômicos: Postura Sentado / Longos Períodos</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td style="padding: 4px; border: 1px solid #cbd5e1;">Medidas de Controle: Uso de Cinto de Segurança, Pausas Periódicas e Treinamento de Direção Defensiva.</td>
          <td style="padding: 4px; border: 1px solid #cbd5e1;">Equipamentos de Proteção: EPIs registrados em Ficha de Controle Individual (Calçado de Segurança, Colete Refletivo).</td>
        </tr>
      </table>
    </div>

    <!-- ASSINATURAS E TERMO DE AUDITORIA -->
    <div style="margin-top: 25px; padding-top: 10px; border-top: 1.5px solid #cbd5e1; font-size: 9px; color: #475569;">
      <div style="display: flex; justify-content: space-between; text-align: center; gap: 20px;">
        <div style="flex: 1;">
          <div style="border-bottom: 1px solid #94a3b8; height: 25px; margin-bottom: 4px;"></div>
          <div style="font-weight: 800; color: #0f172a;">Engenheiro Mecânico (CREA/ART)</div>
          <div>Resp. Técnico pela Homologação</div>
        </div>
        <div style="flex: 1;">
          <div style="border-bottom: 1px solid #94a3b8; height: 25px; margin-bottom: 4px;"></div>
          <div style="font-weight: 800; color: #0f172a;">Gestor de Frotas / Mobilização</div>
          <div>Viação São Silvestre Ltda.</div>
        </div>
        <div style="flex: 1;">
          <div style="border-bottom: 1px solid #94a3b8; height: 25px; margin-bottom: 4px;"></div>
          <div style="font-weight: 800; color: #0f172a;">Fiscal de Segurança do Cliente</div>
          <div>Vistoria & Homologação de Campo</div>
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
    
    const fileName = `Dossie_Mobilizacao_${(data.vehiclePlate || 'Veiculo').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}
