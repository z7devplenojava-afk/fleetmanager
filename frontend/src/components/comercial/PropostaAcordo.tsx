import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { propostaService, PropostaParams } from '@/services/propostaService';
import { PropostaComercial } from '@/types/proposta';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const valoresPadrao: PropostaParams = {
  quantidadePorteiros: 4,
  salarioPorteiro: 2134.80,
  adicionalNoturnoPercent: 39,
  encargosPercent: 69,
  uniformeQuantidade: 2,
  uniformeUnitario: 50,
  equipamentosQuantidade: 1,
  equipamentosUnitario: 20,
  taxaAdministracaoPercent: 4,
  lucroPercent: 3.19,
  cofinsPercent: 7.6,
  pisPercent: 1.65,
  issqnPercent: 3.5,
  irPercent: 1,
  csllPercent: 1,
};

interface PropostaAcordoProps {
  onSaveProposal?: (proposalData: PropostaComercial) => Promise<void>;
}

export default function PropostaAcordo({ onSaveProposal }: PropostaAcordoProps) {
  const { toast } = useToast();
  const [params, setParams] = useState<PropostaParams>(valoresPadrao);
  const [proposta, setProposta] = useState<PropostaComercial | null>(
    propostaService.calcularProposta(valoresPadrao)
  );

  const handleChange = (field: keyof PropostaParams, value: string) => {
    setParams((prev) => ({ ...prev, [field]: Number(value) }));
  };

  const handleCalcular = () => {
    setProposta(propostaService.calcularProposta(params));
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' });
  };

  const handleGeneratePDF = () => {
    if (!proposta) {
      toast({
        title: "Erro",
        description: "Calcule a proposta antes de gerar o PDF.",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('PROPOSTA COMERCIAL DE ACORDO', 105, 20, { align: 'center' });
      
      // Data
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 105, 30, { align: 'center' });
      
      let yPos = 45;

      // Valor Final
      doc.setFontSize(16);
      doc.setTextColor(255, 193, 7);
      doc.text('VALOR FINAL', 105, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFontSize(14);
      doc.text(`Mensal: ${formatCurrency(proposta.resultado.valorMensal)}`, 105, yPos, { align: 'center' });
      yPos += 8;
      doc.text(`Anual: ${formatCurrency(proposta.resultado.valorAnual)}`, 105, yPos, { align: 'center' });
      yPos += 15;

      // Descrição do Serviço
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('DESCRIÇÃO DO SERVIÇO', 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const descLines = doc.splitTextToSize(proposta.descricaoServico, 180);
      doc.text(descLines, 14, yPos);
      yPos += descLines.length * 6 + 10;

      // I. Mão de Obra
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('I. MÃO DE OBRA', 14, yPos);
      yPos += 8;
      
      const maoDeObraData = [
        ['Item', 'Descrição', 'Valor'],
        ['1', `Salário do Porteiro (R$ ${formatCurrency(proposta.maoDeObra.salarioPorteiro)} x ${proposta.maoDeObra.quantidadePorteiros})`, formatCurrency(proposta.maoDeObra.salarioPorteiro * proposta.maoDeObra.quantidadePorteiros)],
        ['2', `Adicional Noturno (${proposta.maoDeObra.adicionalNoturnoPercent}%)`, formatCurrency(proposta.maoDeObra.adicionalNoturnoValor)],
        ['3', 'Reflexo Adicional Noturno/HE/DSR', formatCurrency(proposta.maoDeObra.reflexoAdicional)],
        ['4', 'Subtotal', formatCurrency(proposta.maoDeObra.subtotal)],
        ['5', `Encargos (${proposta.maoDeObra.encargosPercent}%)`, formatCurrency(proposta.maoDeObra.encargosValor)],
        ['', 'TOTAL MÃO DE OBRA', formatCurrency(proposta.maoDeObra.total)]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [maoDeObraData[0]],
        body: maoDeObraData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40], textColor: 255 },
        styles: { fontSize: 9 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;

      // II. Materiais
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('II. MATERIAIS / EQUIPAMENTOS / UNIFORMES, EPI\'s', 14, yPos);
      yPos += 8;
      
      const materiaisData = [
        ['Item', 'Descrição', 'Valor'],
        ['1', `Uniformes (${proposta.materiais.uniformeQuantidade} x ${formatCurrency(proposta.materiais.uniformeUnitario)})`, formatCurrency(proposta.materiais.uniformeQuantidade * proposta.materiais.uniformeUnitario)],
        ['2', `Equipamentos (${proposta.materiais.equipamentosQuantidade} x ${formatCurrency(proposta.materiais.equipamentosUnitario)})`, formatCurrency(proposta.materiais.equipamentosQuantidade * proposta.materiais.equipamentosUnitario)],
        ['', 'SUBTOTAL MATERIAIS', formatCurrency(proposta.materiais.subtotal)]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [materiaisData[0]],
        body: materiaisData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40], textColor: 255 },
        styles: { fontSize: 9 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;

      // III. BDI
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('III. BDI (BASE DE CÁLCULO DO LUCRO)', 14, yPos);
      yPos += 8;
      
      const bdiData = [
        ['Item', 'Descrição', 'Valor'],
        ['1', `Taxa de Administração (${proposta.bdi.taxaAdministracaoPercent}%)`, formatCurrency(proposta.bdi.taxaAdministracaoValor)],
        ['2', `Lucro (${proposta.bdi.lucroPercent}%)`, formatCurrency(proposta.bdi.lucroValor)],
        ['', 'SUBTOTAL BDI', formatCurrency(proposta.bdi.subtotal)]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [bdiData[0]],
        body: bdiData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40], textColor: 255 },
        styles: { fontSize: 9 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;

      // IV. Impostos
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('IV. IMPOSTOS', 14, yPos);
      yPos += 8;
      
      const impostosData = [
        ['Item', 'Descrição', 'Valor'],
        ['1', `COFINS (${proposta.impostos.cofinsPercent}%)`, formatCurrency(proposta.impostos.cofinsValor)],
        ['2', `PIS (${proposta.impostos.pisPercent}%)`, formatCurrency(proposta.impostos.pisValor)],
        ['3', `ISSQN (${proposta.impostos.issqnPercent}%)`, formatCurrency(proposta.impostos.issqnValor)],
        ['4', `IR (${proposta.impostos.irPercent}%)`, formatCurrency(proposta.impostos.irValor)],
        ['5', `CSLL (${proposta.impostos.csllPercent}%)`, formatCurrency(proposta.impostos.csllValor)],
        ['', 'TOTAL IMPOSTOS', formatCurrency(proposta.impostos.total)]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [impostosData[0]],
        body: impostosData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40], textColor: 255 },
        styles: { fontSize: 9 }
      });

      // Salvar PDF
      const fileName = `proposta_acordo_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Sucesso",
        description: "PDF gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateExcel = () => {
    if (!proposta) {
      toast({
        title: "Erro",
        description: "Calcule a proposta antes de gerar o Excel.",
        variant: "destructive"
      });
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      // Aba: Resumo
      const resumoData = [
        ['PROPOSTA COMERCIAL DE ACORDO'],
        ['Data', new Date().toLocaleDateString('pt-BR')],
        [''],
        ['VALOR FINAL'],
        ['Mensal', proposta.resultado.valorMensal],
        ['Anual', proposta.resultado.valorAnual],
        [''],
        ['DESCRIÇÃO DO SERVIÇO'],
        [proposta.descricaoServico]
      ];
      const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');

      // Aba: Mão de Obra
      const maoDeObraData = [
        ['Item', 'Descrição', 'Valor'],
        ['1', `Salário do Porteiro (R$ ${proposta.maoDeObra.salarioPorteiro} x ${proposta.maoDeObra.quantidadePorteiros})`, proposta.maoDeObra.salarioPorteiro * proposta.maoDeObra.quantidadePorteiros],
        ['2', `Adicional Noturno (${proposta.maoDeObra.adicionalNoturnoPercent}%)`, proposta.maoDeObra.adicionalNoturnoValor],
        ['3', 'Reflexo Adicional Noturno/HE/DSR', proposta.maoDeObra.reflexoAdicional],
        ['4', 'Subtotal', proposta.maoDeObra.subtotal],
        ['5', `Encargos (${proposta.maoDeObra.encargosPercent}%)`, proposta.maoDeObra.encargosValor],
        ['', 'TOTAL MÃO DE OBRA', proposta.maoDeObra.total]
      ];
      const maoDeObraSheet = XLSX.utils.aoa_to_sheet(maoDeObraData);
      XLSX.utils.book_append_sheet(workbook, maoDeObraSheet, 'Mão de Obra');

      // Aba: Materiais
      const materiaisData = [
        ['Item', 'Descrição', 'Valor'],
        ['1', `Uniformes (${proposta.materiais.uniformeQuantidade} x R$ ${proposta.materiais.uniformeUnitario})`, proposta.materiais.uniformeQuantidade * proposta.materiais.uniformeUnitario],
        ['2', `Equipamentos (${proposta.materiais.equipamentosQuantidade} x R$ ${proposta.materiais.equipamentosUnitario})`, proposta.materiais.equipamentosQuantidade * proposta.materiais.equipamentosUnitario],
        ['', 'SUBTOTAL MATERIAIS', proposta.materiais.subtotal]
      ];
      const materiaisSheet = XLSX.utils.aoa_to_sheet(materiaisData);
      XLSX.utils.book_append_sheet(workbook, materiaisSheet, 'Materiais');

      // Aba: BDI
      const bdiData = [
        ['Item', 'Descrição', 'Valor'],
        ['1', `Taxa de Administração (${proposta.bdi.taxaAdministracaoPercent}%)`, proposta.bdi.taxaAdministracaoValor],
        ['2', `Lucro (${proposta.bdi.lucroPercent}%)`, proposta.bdi.lucroValor],
        ['', 'SUBTOTAL BDI', proposta.bdi.subtotal]
      ];
      const bdiSheet = XLSX.utils.aoa_to_sheet(bdiData);
      XLSX.utils.book_append_sheet(workbook, bdiSheet, 'BDI');

      // Aba: Impostos
      const impostosData = [
        ['Item', 'Descrição', 'Valor'],
        ['1', `COFINS (${proposta.impostos.cofinsPercent}%)`, proposta.impostos.cofinsValor],
        ['2', `PIS (${proposta.impostos.pisPercent}%)`, proposta.impostos.pisValor],
        ['3', `ISSQN (${proposta.impostos.issqnPercent}%)`, proposta.impostos.issqnValor],
        ['4', `IR (${proposta.impostos.irPercent}%)`, proposta.impostos.irValor],
        ['5', `CSLL (${proposta.impostos.csllPercent}%)`, proposta.impostos.csllValor],
        ['', 'TOTAL IMPOSTOS', proposta.impostos.total]
      ];
      const impostosSheet = XLSX.utils.aoa_to_sheet(impostosData);
      XLSX.utils.book_append_sheet(workbook, impostosSheet, 'Impostos');

      // Salvar Excel
      const fileName = `proposta_acordo_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Sucesso",
        description: "Excel gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o Excel.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray text-lg">Simulação de Proposta de Acordo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-seguranca-lightgray mb-1">Quantidade de Porteiros</label>
              <Input type="number" min={1} value={params.quantidadePorteiros} onChange={e => handleChange('quantidadePorteiros', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">Salário do Porteiro (R$)</label>
              <Input type="number" min={0} step={0.01} value={params.salarioPorteiro} onChange={e => handleChange('salarioPorteiro', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">Adicional Noturno (%)</label>
              <Input type="number" min={0} step={0.01} value={params.adicionalNoturnoPercent} onChange={e => handleChange('adicionalNoturnoPercent', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">Encargos (%)</label>
              <Input type="number" min={0} step={0.01} value={params.encargosPercent} onChange={e => handleChange('encargosPercent', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">Uniformes (Qtd)</label>
              <Input type="number" min={0} value={params.uniformeQuantidade} onChange={e => handleChange('uniformeQuantidade', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">Valor Unitário Uniforme (R$)</label>
              <Input type="number" min={0} step={0.01} value={params.uniformeUnitario} onChange={e => handleChange('uniformeUnitario', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">Equipamentos (Qtd)</label>
              <Input type="number" min={0} value={params.equipamentosQuantidade} onChange={e => handleChange('equipamentosQuantidade', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">Valor Unitário Equipamento (R$)</label>
              <Input type="number" min={0} step={0.01} value={params.equipamentosUnitario} onChange={e => handleChange('equipamentosUnitario', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">Taxa Administração (%)</label>
              <Input type="number" min={0} step={0.01} value={params.taxaAdministracaoPercent} onChange={e => handleChange('taxaAdministracaoPercent', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">Lucro (%)</label>
              <Input type="number" min={0} step={0.01} value={params.lucroPercent} onChange={e => handleChange('lucroPercent', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">COFINS (%)</label>
              <Input type="number" min={0} step={0.01} value={params.cofinsPercent} onChange={e => handleChange('cofinsPercent', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">PIS (%)</label>
              <Input type="number" min={0} step={0.01} value={params.pisPercent} onChange={e => handleChange('pisPercent', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">ISSQN (%)</label>
              <Input type="number" min={0} step={0.01} value={params.issqnPercent} onChange={e => handleChange('issqnPercent', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">IR (%)</label>
              <Input type="number" min={0} step={0.01} value={params.irPercent} onChange={e => handleChange('irPercent', e.target.value)} />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1">CSLL (%)</label>
              <Input type="number" min={0} step={0.01} value={params.csllPercent} onChange={e => handleChange('csllPercent', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleCalcular} className="bg-seguranca-yellow text-black hover:bg-yellow-500">Calcular Proposta</Button>
          </div>
        </CardContent>
      </Card>

      {proposta && (
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray text-lg">Proposta Comercial Detalhada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-seguranca-yellow font-bold text-xl mb-2">Valor Final</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="text-3xl font-bold text-seguranca-yellow">R$ {proposta.resultado.valorMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-base font-normal text-gray-400">/ mês</span></div>
                <div className="text-xl font-bold text-seguranca-yellow">R$ {proposta.resultado.valorAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-base font-normal text-gray-400">/ ano</span></div>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-seguranca-lightgray font-semibold mb-2">Descrição do Serviço</h4>
              <p className="text-gray-300">{proposta.descricaoServico}</p>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-seguranca-lightgray font-semibold mb-2">I. Mão de Obra</h4>
              <ul className="text-gray-300 space-y-1">
                <li>Salário do Porteiro: <b>R$ {proposta.maoDeObra.salarioPorteiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b> x {proposta.maoDeObra.quantidadePorteiros} = <b>R$ {(proposta.maoDeObra.salarioPorteiro * proposta.maoDeObra.quantidadePorteiros).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li>Adicional Noturno ({proposta.maoDeObra.adicionalNoturnoPercent}%): <b>R$ {proposta.maoDeObra.adicionalNoturnoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li>Reflexo Adicional Noturno/HE/DSR: <b>R$ {proposta.maoDeObra.reflexoAdicional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li>Subtotal: <b>R$ {proposta.maoDeObra.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li>Encargos ({proposta.maoDeObra.encargosPercent}%): <b>R$ {proposta.maoDeObra.encargosValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li><b>Total Mão de Obra: R$ {proposta.maoDeObra.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
              </ul>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-seguranca-lightgray font-semibold mb-2">II. Materiais / Equipamentos / Uniformes, EPI's</h4>
              <ul className="text-gray-300 space-y-1">
                <li>Uniformes: <b>{proposta.materiais.uniformeQuantidade}</b> x R$ {proposta.materiais.uniformeUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = <b>R$ {(proposta.materiais.uniformeQuantidade * proposta.materiais.uniformeUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li>Equipamentos: <b>{proposta.materiais.equipamentosQuantidade}</b> x R$ {proposta.materiais.equipamentosUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = <b>R$ {(proposta.materiais.equipamentosQuantidade * proposta.materiais.equipamentosUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li><b>Subtotal Materiais: R$ {proposta.materiais.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
              </ul>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-seguranca-lightgray font-semibold mb-2">III. BDI (Base de Cálculo do Lucro)</h4>
              <ul className="text-gray-300 space-y-1">
                <li>Taxa de Administração ({proposta.bdi.taxaAdministracaoPercent}%): <b>R$ {proposta.bdi.taxaAdministracaoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li>Lucro ({proposta.bdi.lucroPercent}%): <b>R$ {proposta.bdi.lucroValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li><b>Subtotal BDI: R$ {proposta.bdi.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
              </ul>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-seguranca-lightgray font-semibold mb-2">IV. Impostos</h4>
              <ul className="text-gray-300 space-y-1">
                <li>COFINS ({proposta.impostos.cofinsPercent}%): <b>R$ {proposta.impostos.cofinsValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li>PIS ({proposta.impostos.pisPercent}%): <b>R$ {proposta.impostos.pisValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li>ISSQN ({proposta.impostos.issqnPercent}%): <b>R$ {proposta.impostos.issqnValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li>IR ({proposta.impostos.irPercent}%): <b>R$ {proposta.impostos.irValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li>CSLL ({proposta.impostos.csllPercent}%): <b>R$ {proposta.impostos.csllValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
                <li><b>Total Impostos: R$ {proposta.impostos.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
              </ul>
            </div>
            
            {/* Botões de Exportação e Salvar */}
            <div className="border-t border-gray-700 pt-6 flex justify-end gap-3">
              {onSaveProposal && (
                <Button
                  onClick={async () => {
                    if (proposta && onSaveProposal) {
                      await onSaveProposal(proposta);
                    }
                  }}
                  className="bg-seguranca-yellow text-black hover:bg-yellow-500"
                >
                  Salvar Proposta
                </Button>
              )}
              <Button
                onClick={handleGeneratePDF}
                className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
              >
                <FileText className="mr-2 h-4 w-4" />
                Gerar PDF
              </Button>
              <Button
                onClick={handleGenerateExcel}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Gerar Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 