import { PropostaComercial } from '@/types/proposta';

export interface PropostaParams {
  quantidadePorteiros: number;
  salarioPorteiro: number;
  adicionalNoturnoPercent: number;
  encargosPercent: number;
  uniformeQuantidade: number;
  uniformeUnitario: number;
  equipamentosQuantidade: number;
  equipamentosUnitario: number;
  taxaAdministracaoPercent: number;
  lucroPercent: number;
  cofinsPercent: number;
  pisPercent: number;
  issqnPercent: number;
  irPercent: number;
  csllPercent: number;
}

export const propostaService = {
  calcularProposta(params: PropostaParams): PropostaComercial {
    // Mão de Obra
    const salarioTotal = params.salarioPorteiro * params.quantidadePorteiros;
    const adicionalNoturnoValor = params.salarioPorteiro * (params.adicionalNoturnoPercent / 100);
    const reflexoAdicional = 190.30; // fixo conforme planilha
    const subtotalMaoDeObra = salarioTotal + adicionalNoturnoValor * params.quantidadePorteiros + reflexoAdicional;
    const encargosValor = subtotalMaoDeObra * (params.encargosPercent / 100);
    const totalMaoDeObra = subtotalMaoDeObra + encargosValor;

    // Materiais
    const subtotalMateriais = params.uniformeQuantidade * params.uniformeUnitario + params.equipamentosQuantidade * params.equipamentosUnitario;

    // BDI
    const baseBDI = totalMaoDeObra + subtotalMateriais;
    const taxaAdministracaoValor = baseBDI * (params.taxaAdministracaoPercent / 100);
    const lucroValor = baseBDI * (params.lucroPercent / 100);
    const subtotalBDI = taxaAdministracaoValor + lucroValor;

    // Impostos
    const baseImpostos = baseBDI + subtotalBDI;
    const cofinsValor = baseImpostos * (params.cofinsPercent / 100);
    const pisValor = baseImpostos * (params.pisPercent / 100);
    const issqnValor = baseImpostos * (params.issqnPercent / 100);
    const irValor = baseImpostos * (params.irPercent / 100);
    const csllValor = baseImpostos * (params.csllPercent / 100);
    const totalImpostos = cofinsValor + pisValor + issqnValor + irValor + csllValor;

    // Resultado Final
    const valorMensal = baseImpostos + totalImpostos;
    const valorAnual = valorMensal * 12;

    return {
      descricaoServico: 'Posto de portaria 24 horas ininterruptas, de segunda a domingo. Escala 12x36. Pagamento de intrajornada.',
      maoDeObra: {
        salarioPorteiro: params.salarioPorteiro,
        quantidadePorteiros: params.quantidadePorteiros,
        adicionalNoturnoPercent: params.adicionalNoturnoPercent,
        adicionalNoturnoValor,
        reflexoAdicional,
        encargosPercent: params.encargosPercent,
        encargosValor,
        subtotal: subtotalMaoDeObra,
        total: totalMaoDeObra,
      },
      materiais: {
        uniformeQuantidade: params.uniformeQuantidade,
        uniformeUnitario: params.uniformeUnitario,
        equipamentosQuantidade: params.equipamentosQuantidade,
        equipamentosUnitario: params.equipamentosUnitario,
        subtotal: subtotalMateriais,
      },
      bdi: {
        taxaAdministracaoPercent: params.taxaAdministracaoPercent,
        taxaAdministracaoValor,
        lucroPercent: params.lucroPercent,
        lucroValor,
        subtotal: subtotalBDI,
      },
      impostos: {
        cofinsPercent: params.cofinsPercent,
        cofinsValor,
        pisPercent: params.pisPercent,
        pisValor,
        issqnPercent: params.issqnPercent,
        issqnValor,
        irPercent: params.irPercent,
        irValor,
        csllPercent: params.csllPercent,
        csllValor,
        total: totalImpostos,
      },
      resultado: {
        valorMensal,
        valorAnual,
      },
    };
  },
}; 