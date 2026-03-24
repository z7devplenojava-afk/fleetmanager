import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TransportGuide } from '@/types/transportGuide';

interface TransportGuidePDFGeneratorProps {
  data: TransportGuide | {
    cnpj: string;
    empresa: string;
    numeroColete?: string;
    numeroArma: string;
    calibre: string;
    qtdMunicoes: number;
    origem: string;
    destino: string;
    trajeto: string;
    motivo: string;
  };
  onGenerate?: () => void;
}

const TransportGuidePDFGenerator: React.FC<TransportGuidePDFGeneratorProps> = ({ data, onGenerate }) => {
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
          <h2 style="color: #1a1a1a; margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">GUIA DE TRANSPORTE DE ARMA</h2>
          <div style="border-bottom: 1px solid #ccc; width: 150px; margin: 8px auto;"></div>
        </div>

        <!-- Informações da Empresa -->
        <div style="margin-bottom: 20px; background-color: #f8f9fa; padding: 12px; border-left: 3px solid #333;">
          <h3 style="color: #333; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 8px;">INFORMAÇÕES DA EMPRESA</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; color: #333; font-size: 13px;">CNPJ:</span>
            <span style="color: #666; font-size: 13px;">${data.cnpj}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: bold; color: #333; font-size: 13px;">Empresa/Filial:</span>
            <span style="color: #666; font-size: 13px;">${data.empresa}</span>
          </div>
        </div>

        <!-- Informações da Arma -->
        <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; background-color: #fff;">
          <h3 style="color: #333; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 8px;">INFORMAÇÕES DA ARMA</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${data.numeroColete ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Nº do Colete:</span>
              <span style="color: #333; font-size: 12px;">${data.numeroColete}</span>
            </div>
            ` : ''}
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Nº da Arma:</span>
              <span style="color: #333; font-size: 12px;">${data.numeroArma}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Calibre:</span>
              <span style="color: #333; font-size: 12px;">${data.calibre}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold; color: #555; display: block; margin-bottom: 2px; font-size: 12px;">Quantidade de Munições:</span>
              <span style="color: #333; font-size: 12px;">${data.qtdMunicoes}</span>
            </div>
          </div>
        </div>

        <!-- Informações de Localização -->
        <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; background-color: #fff;">
          <h3 style="color: #333; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 8px;">INFORMAÇÕES DE LOCALIZAÇÃO</h3>
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; color: #555; display: block; margin-bottom: 4px; font-size: 12px;">Origem:</span>
            <div style="color: #333; font-size: 12px; padding: 8px; background-color: #f8f9fa; border-radius: 4px; white-space: pre-wrap;">${data.origem}</div>
          </div>
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; color: #555; display: block; margin-bottom: 4px; font-size: 12px;">Destino:</span>
            <div style="color: #333; font-size: 12px; padding: 8px; background-color: #f8f9fa; border-radius: 4px; white-space: pre-wrap;">${data.destino}</div>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="font-weight: bold; color: #555; display: block; margin-bottom: 4px; font-size: 12px;">Trajeto:</span>
            <div style="color: #333; font-size: 12px; padding: 8px; background-color: #f8f9fa; border-radius: 4px; white-space: pre-wrap;">${data.trajeto}</div>
          </div>
        </div>

        <!-- Motivo do Transporte -->
        <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; background-color: #fff;">
          <h3 style="color: #333; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 8px;">MOTIVO DO TRANSPORTE</h3>
          <div style="color: #333; font-size: 13px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
            ${data.motivo}
          </div>
        </div>

        <!-- Termo de Responsabilidade -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 8px;">TERMO DE RESPONSABILIDADE</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border: 1px solid #ddd;">
            <p style="text-align: justify; line-height: 1.5; margin: 0; color: #333; font-size: 12px;">
              Declaro que estou ciente das responsabilidades inerentes ao transporte de arma de fogo e me comprometo a cumprir 
              todas as normas e procedimentos estabelecidos pela <strong>Promover Vigilância Patrimonial LTDA</strong> e pela 
              legislação vigente. O transporte será realizado de forma segura e em conformidade com todas as regulamentações aplicáveis.
            </p>
          </div>
        </div>

        <!-- Campos de Assinatura -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 25px; gap: 15px;">
          <div style="width: 48%; text-align: center;">
            <div style="border: 1px solid #ddd; padding: 15px; background-color: #fff; min-height: 80px;">
              <p style="margin: 0 0 25px 0; font-weight: bold; color: #333; font-size: 12px;">ASSINATURA DO RESPONSÁVEL</p>
              <div style="border-bottom: 1px solid #333; width: 100%; margin-bottom: 8px; height: 25px;"></div>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #666;">Data: _______________</p>
            </div>
          </div>

          <div style="width: 48%; text-align: center;">
            <div style="border: 1px solid #ddd; padding: 15px; background-color: #fff; min-height: 80px;">
              <p style="margin: 0 0 25px 0; font-weight: bold; color: #333; font-size: 12px;">ASSINATURA DO SUPERVISOR</p>
              <div style="border-bottom: 1px solid #333; width: 100%; margin-bottom: 8px; height: 25px;"></div>
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
      const fileName = `Guia_Transporte_${data.numeroArma}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      if (onGenerate) {
        onGenerate();
      }

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
      type="button"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Gerar PDF
    </button>
  );
};

export default TransportGuidePDFGenerator;













