import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { propostaService, PropostaParams } from '@/services/propostaService';
import { PropostaComercial } from '@/types/proposta';

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

export default function PropostaAcordo() {
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
          </CardContent>
        </Card>
      )}
    </div>
  );
} 