import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ShiftChangeData {
  dateOfRequest: string;
  requesterFullName: string;
  requesterSector: string;
  requesterDayOffDate?: string;
  requesterShiftDate: string;
  replacingFullName: string;
  replacingSector: string;
  replacingShiftDate: string;
  replacingDayOffDate?: string;
  shiftTime: string;
}

interface ShiftChangePDFGeneratorProps {
  data: ShiftChangeData;
  onGenerate?: () => void;
}

const ShiftChangePDFGenerator: React.FC<ShiftChangePDFGeneratorProps> = ({ data, onGenerate }) => {
  const generatePDF = async () => {
    try {
      // Criar um elemento temporário para renderizar o PDF
      const pdfElement = document.createElement('div');
      pdfElement.style.position = 'absolute';
      pdfElement.style.left = '-9999px';
      pdfElement.style.top = '0';
      pdfElement.style.width = '210mm';
      pdfElement.style.padding = '15mm';
      pdfElement.style.fontFamily = 'Arial, sans-serif';
      pdfElement.style.backgroundColor = 'white';
      pdfElement.style.color = 'black';
      
      pdfElement.innerHTML = `
        <!-- Cabeçalho da Empresa -->
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 15px;">
          <h1 style="color: #1a1a1a; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">PROMOVER VIGILÂNCIA PATRIMONIAL LTDA</h1>
          <p style="color: #666; margin: 3px 0; font-size: 12px;">CNPJ: 43.576.260/0001-12</p>
          <p style="color: #666; margin: 3px 0; font-size: 12px;">Rua Cel. João Camargos, 267 - Centro - Contagem/MG - CEP: 32040-620</p>
          <p style="color: #666; margin: 3px 0; font-size: 12px;">Tel: (31) 2559-1245 | WhatsApp: (31) 97130-3587</p>
        </div>

        <!-- Título do Documento -->
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #1a1a1a; margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">SOLICITAÇÃO DE TROCA DE PLANTÃO</h2>
          <div style="border-bottom: 1px solid #ccc; width: 150px; margin: 8px auto;"></div>
        </div>

        <!-- Informações Gerais -->
        <div style="margin-bottom: 20px; background-color: #f8f9fa; padding: 12px; border-left: 3px solid #333;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; color: #333; font-size: 13px;">Data da Solicitação:</span>
            <span style="color: #666; font-size: 13px;">${data.dateOfRequest}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: bold; color: #333; font-size: 13px;">Horário do Plantão:</span>
            <span style="color: #666; font-size: 13px;">${getShiftTimeLabel(data.shiftTime)}</span>
          </div>
        </div>

        <!-- Dados dos Funcionários -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px;">
          <!-- Dados do Solicitante -->
          <div style="width: 48%; border: 1px solid #ddd; padding: 15px; background-color: #fff;">
            <h3 style="color: #333; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 8px;">DADOS DO SOLICITANTE</h3>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Nome Completo:</span>
              <span style="color: #333; font-size: 12px;">${data.requesterFullName}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Setor:</span>
              <span style="color: #333; font-size: 12px;">${data.requesterSector}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Data do Plantão:</span>
              <span style="color: #333; font-size: 12px;">${data.requesterShiftDate}</span>
            </div>
            ${data.requesterDayOffDate ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Data da Folga:</span>
              <span style="color: #333; font-size: 12px;">${data.requesterDayOffDate}</span>
            </div>
            ` : ''}
          </div>

          <!-- Dados do Colega -->
          <div style="width: 48%; border: 1px solid #ddd; padding: 15px; background-color: #fff;">
            <h3 style="color: #333; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 8px;">DADOS DO COLEGA</h3>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Nome Completo:</span>
              <span style="color: #333; font-size: 12px;">${data.replacingFullName}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Setor:</span>
              <span style="color: #333; font-size: 12px;">${data.replacingSector}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Data do Plantão:</span>
              <span style="color: #333; font-size: 12px;">${data.replacingShiftDate}</span>
            </div>
            ${data.replacingDayOffDate ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Data da Folga:</span>
              <span style="color: #333; font-size: 12px;">${data.replacingDayOffDate}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Termo de Responsabilidade -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 8px;">TERMO DE RESPONSABILIDADE</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border: 1px solid #ddd;">
            <p style="text-align: justify; line-height: 1.5; margin: 0; color: #333; font-size: 12px;">
              Declaro que estou ciente das responsabilidades inerentes à troca de plantão e me comprometo a cumprir 
              todas as normas e procedimentos estabelecidos pela <strong>Promover Vigilância Patrimonial LTDA</strong>. 
              A troca será realizada de forma voluntária e com total acordo entre as partes envolvidas.
            </p>
          </div>
        </div>

        <!-- Campos de Assinatura -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 25px; gap: 15px;">
          <div style="width: 48%; text-align: center;">
            <div style="border: 1px solid #ddd; padding: 15px; background-color: #fff; min-height: 80px;">
              <p style="margin: 0 0 25px 0; font-weight: bold; color: #333; font-size: 12px;">ASSINATURA DO SOLICITANTE</p>
              <div style="border-bottom: 1px solid #333; width: 100%; margin-bottom: 8px; height: 25px;"></div>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #333; font-weight: bold;">${data.requesterFullName}</p>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #666;">Data: _______________</p>
            </div>
          </div>

          <div style="width: 48%; text-align: center;">
            <div style="border: 1px solid #ddd; padding: 15px; background-color: #fff; min-height: 80px;">
              <p style="margin: 0 0 25px 0; font-weight: bold; color: #333; font-size: 12px;">ASSINATURA DO COLEGA</p>
              <div style="border-bottom: 1px solid #333; width: 100%; margin-bottom: 8px; height: 25px;"></div>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #333; font-weight: bold;">${data.replacingFullName}</p>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #666;">Data: _______________</p>
            </div>
          </div>
        </div>

        <!-- Rodapé -->
        <div style="margin-top: 20px; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
          <p style="margin: 0 0 3px 0; font-size: 11px; color: #666; font-weight: bold;">Promover Vigilância Patrimonial LTDA</p>
          <p style="margin: 0; font-size: 9px; color: #999;">
            Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Fleet Manager v1.0
          </p>
        </div>
      `;

      document.body.appendChild(pdfElement);

      // Gerar canvas do HTML
      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remover elemento temporário
      document.body.removeChild(pdfElement);

      // Criar PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Só adiciona nova página se houver conteúdo significativo (> 20mm)
      while (heightLeft > 20) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Salvar PDF
      const fileName = `Solicitacao_Troca_Plantao_${data.requesterFullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      if (onGenerate) {
        onGenerate();
      }

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const getShiftTimeLabel = (shiftTime: string): string => {
    const shiftLabels: { [key: string]: string } = {
      'SHIFT_6H_18H': '6h às 18h',
      'SHIFT_18H_6H': '18h às 6h',
      'SHIFT_7H_19H': '7h às 19h',
      'SHIFT_19H_7H': '19h às 7h',
    };
    return shiftLabels[shiftTime] || shiftTime;
  };

  return (
    <button
      onClick={generatePDF}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Gerar PDF
    </button>
  );
};

export default ShiftChangePDFGenerator;

