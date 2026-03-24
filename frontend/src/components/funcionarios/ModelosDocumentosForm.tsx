import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, 
  Shield, 
  FileSignature, 
  FileCheck, 
  UserX, 
  File,
  Download,
  Eye,
  Plus,
  Search
} from 'lucide-react';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { documentModels, categories, getModelsByCategory, DocumentModel } from '@/utils/documentModels';
import { 
  termoResponsabilidadeCartaoOtimoGenerator, 
  termoResponsabilidadeCelularGenerator,
  termoResponsabilidadeCartaoBhBusGenerator,
  termoResponsabilidadeCartaoBetimGenerator
} from '@/utils/termoResponsabilidadeGenerator';
import { contratoExperienciaGenerator } from '@/utils/contratoExperienciaGenerator';
import { declaracaoCipaTranspesGenerator, declaracaoFinsEscolaresGenerator } from '@/utils/declaracaoGenerator';
import { demissaoJustaCausaGenerator } from '@/utils/demissaoGenerator';
import {
  cartaApresentacaoGenerator,
  termoOpcaoVTPromoverGenerator,
  validacaoNR06Generator,
  termoLGPDGenerator,
  termoProtecaoDadosLGPDGenerator,
  formularioAberturaVagaGenerator
} from '@/utils/outrosDocumentosGenerator';
import { generatePDFBlob } from '@/utils/pdfPreviewHelper';

const ModelosDocumentosForm = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState<DocumentModel | null>(null);

  // Filtrar modelos baseado na busca
  const filteredModels = documentModels.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar modelos por categoria
  const modelsByCategory = categories.map(category => ({
    ...category,
    models: filteredModels.filter(model => model.category === category.id)
  }));

  const handleGenerateDocument = async (model: DocumentModel) => {
    if (!model.hasGenerator) {
      toast({
        title: 'Atenção',
        description: `Gerador para "${model.name}" ainda não implementado.`,
        variant: 'destructive'
      });
      return;
    }

    // Validar se há dados disponíveis
    if (!model || !model.id) {
      toast({
        title: 'Atenção',
        description: 'Não há dados disponíveis para gerar o documento. Por favor, selecione um modelo válido.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Dados mock para demonstração
      const mockData = {
        funcionario: {
          nome: 'João Silva Santos',
          cpf: '123.456.789-00',
          rg: '12.345.678-9',
          cargo: 'Vigia',
          empresa: 'Secure Guard Ltda',
          endereco: 'Rua das Flores, 123',
          cidade: 'Belo Horizonte',
          estado: 'MG',
          cep: '30100-000',
          telefone: '(31) 99999-9999',
          email: 'joao.silva@email.com',
          dataAdmissao: '01/01/2020'
        },
        equipamento: {
          tipo: 'Cartão Ótimo',
          marca: 'Ótimo',
          modelo: 'Vale-Transporte',
          numeroSerie: 'OT123456789',
          valor: '50,00'
        },
        contrato: {
          cargo: 'Vigia',
          salario: '1.500,00',
          periodo: 45,
          dataInicio: '01/01/2024',
          dataFim: '15/02/2024',
          horarioTrabalho: '08:00 às 18:00',
          localTrabalho: 'Sede da empresa'
        },
        declaracao: {
          tipo: 'CIPA',
          conteudo: 'Declaro que estou apto para participar da Comissão Interna de Prevenção de Acidentes (CIPA) da empresa TRANSPES, conforme legislação trabalhista vigente.',
          finalidade: 'Designação para CIPA'
        },
        dataEntrega: '15/01/2024',
        dataDeclaracao: '15/01/2024',
        dataContrato: '15/01/2024',
        localEntrega: 'Sede da empresa',
        localDeclaracao: 'Sede da empresa',
        localContrato: 'Sede da empresa',
        observacoes: 'Documento gerado automaticamente pelo sistema.'
      };

      // Chamar o gerador apropriado baseado no ID do modelo
      switch (model.id) {
        case 'termo-responsabilidade-cartao-otimo':
          await termoResponsabilidadeCartaoOtimoGenerator.generatePDF(mockData);
          break;
        case 'termo-responsabilidade-cartao-bh-bus':
          await termoResponsabilidadeCartaoBhBusGenerator.generatePDF(mockData);
          break;
        case 'termo-responsabilidade-cartao-betim':
          await termoResponsabilidadeCartaoBetimGenerator.generatePDF(mockData);
          break;
        case 'termo-responsabilidade-celular':
          await termoResponsabilidadeCelularGenerator.generatePDF(mockData);
          break;
        case 'contrato-experiencia-45':
        case 'contrato-experiencia-60':
        case 'contrato-experiencia-90':
          const periodo = parseInt(model.id.split('-')[2]);
          await contratoExperienciaGenerator.generatePDF({
            ...mockData,
            contrato: { ...mockData.contrato, periodo }
          });
          break;
        case 'declaracao-cipa-transpes':
          await declaracaoCipaTranspesGenerator.generatePDF(mockData);
          break;
        case 'declaracao-fins-escolares':
          await declaracaoFinsEscolaresGenerator.generatePDF(mockData);
          break;
        case 'demissao-justa-causa':
          await demissaoJustaCausaGenerator.generatePDF({
            funcionario: mockData.funcionario,
            demissao: {
              tipo: 'JUSTA_CAUSA',
              motivo: 'Falta grave cometida pelo funcionário conforme art. 482 da CLT.',
              dataDemissao: new Date().toLocaleDateString('pt-BR'),
              dataUltimoDia: new Date().toLocaleDateString('pt-BR'),
              avisoPrevio: false
            },
            observacoes: mockData.observacoes
          });
          break;
        case 'carta-apresentacao':
          await cartaApresentacaoGenerator.generatePDF({
            funcionario: mockData.funcionario,
            destinatario: 'Prezado(a) Senhor(a)',
            data: new Date().toLocaleDateString('pt-BR'),
            conteudo: `Venho por meio desta apresentar ${mockData.funcionario.nome}, portador do CPF nº ${mockData.funcionario.cpf}, que atualmente ocupa o cargo de ${mockData.funcionario.cargo} na empresa ${mockData.funcionario.empresa}.`
          });
          break;
        case 'termo-opcao-vt-promover':
          await termoOpcaoVTPromoverGenerator.generatePDF({
            funcionario: mockData.funcionario,
            opcao: 'ACEITA',
            valorVT: '50,00',
            data: new Date().toLocaleDateString('pt-BR'),
            observacoes: mockData.observacoes
          });
          break;
        case 'validacao-nr06':
          await validacaoNR06Generator.generatePDF({
            funcionario: mockData.funcionario,
            epis: [
              { nome: 'Capacete de Segurança', ca: 'CA12345', validade: '12/2025' },
              { nome: 'Óculos de Proteção', ca: 'CA67890', validade: '12/2025' },
              { nome: 'Calçado de Segurança', ca: 'CA11111', validade: '12/2025' }
            ],
            dataValidacao: new Date().toLocaleDateString('pt-BR'),
            responsavel: 'João Silva - Supervisor de Segurança',
            observacoes: mockData.observacoes
          });
          break;
        case 'termo-lgpd':
          await termoLGPDGenerator.generatePDF({
            funcionario: mockData.funcionario,
            consentimentos: [
              'Processamento de dados pessoais para fins trabalhistas',
              'Compartilhamento de dados com órgãos competentes quando necessário',
              'Uso de dados para comunicação interna e externa',
              'Armazenamento de dados em sistemas da empresa'
            ],
            data: new Date().toLocaleDateString('pt-BR'),
            observacoes: mockData.observacoes
          });
          break;
        case 'termo-protecao-dados-lgpd':
          await termoProtecaoDadosLGPDGenerator.generatePDF({
            funcionario: mockData.funcionario,
            consentimentos: [
              'Garantia de segurança e confidencialidade dos dados',
              'Uso exclusivo para finalidades trabalhistas',
              'Comunicação imediata em caso de vazamento de dados',
              'Manutenção dos dados apenas pelo tempo necessário'
            ],
            data: new Date().toLocaleDateString('pt-BR'),
            observacoes: mockData.observacoes
          });
          break;
        case 'formulario-abertura-vaga':
          await formularioAberturaVagaGenerator.generatePDF({
            vaga: {
              cargo: 'Vigilante',
              setor: 'Segurança',
              tipo: 'CLT',
              salario: '1.500,00',
              requisitos: 'Ensino médio completo, experiência em segurança, disponibilidade para trabalhar em escala.',
              descricao: 'Vaga para vigilante com experiência em segurança patrimonial, trabalho em escala 12x36.'
            },
            solicitante: {
              nome: 'Maria Silva',
              cargo: 'Gerente de RH',
              departamento: 'Recursos Humanos'
            },
            data: new Date().toLocaleDateString('pt-BR'),
            observacoes: mockData.observacoes
          });
          break;
        default:
          toast({
            title: 'Atenção',
            description: `Gerador para "${model.name}" ainda não implementado.`,
            variant: 'destructive'
          });
      }
      
      toast({
        title: 'Sucesso',
        description: `Documento "${model.name}" gerado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar o documento. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handlePreviewDocument = async (model: DocumentModel) => {
    if (!model.hasGenerator) {
      toast({
        title: 'Atenção',
        description: 'Não há relatório para visualizar. Este modelo ainda está em desenvolvimento.',
        variant: 'destructive'
      });
      return;
    }

    // Validar se há dados disponíveis
    if (!model || !model.id) {
      toast({
        title: 'Atenção',
        description: 'Não há dados disponíveis para visualizar o documento.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Dados mock para demonstração
      const mockData = {
        funcionario: {
          nome: 'João Silva Santos',
          cpf: '123.456.789-00',
          rg: '12.345.678-9',
          cargo: 'Vigia',
          empresa: 'Secure Guard Ltda',
          endereco: 'Rua das Flores, 123',
          cidade: 'Belo Horizonte',
          estado: 'MG',
          cep: '30100-000',
          telefone: '(31) 99999-9999',
          email: 'joao.silva@email.com',
          dataAdmissao: '01/01/2020'
        },
        equipamento: {
          tipo: 'Cartão Ótimo',
          marca: 'Ótimo',
          modelo: 'Vale-Transporte',
          numeroSerie: 'OT123456789',
          valor: '50,00'
        },
        contrato: {
          cargo: 'Vigia',
          salario: '1.500,00',
          periodo: 45,
          dataInicio: '01/01/2024',
          dataFim: '15/02/2024',
          horarioTrabalho: '08:00 às 18:00',
          localTrabalho: 'Sede da empresa'
        },
        declaracao: {
          tipo: 'CIPA',
          conteudo: 'Declaro que estou apto para participar da Comissão Interna de Prevenção de Acidentes (CIPA) da empresa TRANSPES, conforme legislação trabalhista vigente.',
          finalidade: 'Designação para CIPA'
        },
        dataEntrega: '15/01/2024',
        dataDeclaracao: '15/01/2024',
        dataContrato: '15/01/2024',
        localEntrega: 'Sede da empresa',
        localDeclaracao: 'Sede da empresa',
        localContrato: 'Sede da empresa',
        observacoes: 'Documento gerado automaticamente pelo sistema.'
      };

      let pdfBlob: Blob | null = null;

      // Gerar PDF blob baseado no modelo para visualização
      switch (model.id) {
        // Ordens de Serviço
        case 'ordem-servico-padrao':
          pdfBlob = await generatePDFBlob.ordemServico({
            ordem: {
              numero: 'OS-001',
              dataInicio: new Date().toISOString(),
              dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              observacoes: 'Ordem de serviço padrão gerada para visualização.',
              modelo: 'PADRAO',
              status: 'PENDENTE'
            },
            funcionario: {
              name: mockData.funcionario.nome,
              document: mockData.funcionario.cpf
            },
            cliente: {
              name: 'Cliente Exemplo',
              document: '12.345.678/0001-99'
            },
            empresa: {
              name: mockData.funcionario.empresa,
              document: '98.765.432/0001-11'
            },
            unidade: {
              name: 'Unidade Central',
              code: 'UC-001'
            },
            cargo: {
              name: mockData.funcionario.cargo
            }
          });
          break;
        case 'ordem-servico-csn':
          pdfBlob = await generatePDFBlob.ordemServico({
            ordem: {
              numero: 'OS-CSN-001',
              dataInicio: new Date().toISOString(),
              dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              observacoes: 'Ordem de serviço modelo CSN.',
              modelo: 'CSN',
              status: 'PENDENTE'
            },
            funcionario: {
              name: mockData.funcionario.nome,
              document: mockData.funcionario.cpf
            },
            cliente: {
              name: 'Companhia Siderúrgica Nacional',
              document: '33.042.730/0001-04'
            },
            empresa: {
              name: mockData.funcionario.empresa,
              document: '98.765.432/0001-11'
            },
            unidade: {
              name: 'Unidade CSN',
              code: 'CSN-001'
            },
            cargo: {
              name: mockData.funcionario.cargo
            }
          });
          break;
        case 'ordem-servico-aterpa':
          pdfBlob = await generatePDFBlob.ordemServico({
            ordem: {
              numero: 'OS-AT-001',
              dataInicio: new Date().toISOString(),
              dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              observacoes: 'Ordem de serviço modelo ATERPA.',
              modelo: 'ATERPA',
              status: 'PENDENTE'
            },
            funcionario: {
              name: mockData.funcionario.nome,
              document: mockData.funcionario.cpf
            },
            cliente: {
              name: 'Agência de Transporte do Estado do Pará',
              document: '12.345.678/0001-99'
            },
            empresa: {
              name: mockData.funcionario.empresa,
              document: '98.765.432/0001-11'
            },
            unidade: {
              name: 'Unidade ATERPA',
              code: 'AT-001'
            },
            cargo: {
              name: mockData.funcionario.cargo
            }
          });
          break;
        case 'ordem-servico-transpes':
          pdfBlob = await generatePDFBlob.ordemServico({
            ordem: {
              numero: 'OS-TP-001',
              dataInicio: new Date().toISOString(),
              dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              observacoes: 'Ordem de serviço modelo TRANSPES.',
              modelo: 'TRANSPES',
              status: 'PENDENTE'
            },
            funcionario: {
              name: mockData.funcionario.nome,
              document: mockData.funcionario.cpf
            },
            cliente: {
              name: 'Transportadora Pesada Ltda',
              document: '12.345.678/0001-99'
            },
            empresa: {
              name: mockData.funcionario.empresa,
              document: '98.765.432/0001-11'
            },
            unidade: {
              name: 'Unidade TRANSPES',
              code: 'TP-001'
            },
            cargo: {
              name: mockData.funcionario.cargo
            }
          });
          break;
        case 'asg-ordem-servico-aterpa':
          pdfBlob = await generatePDFBlob.ordemServico({
            ordem: {
              numero: 'OS-ASG-AT-001',
              dataInicio: new Date().toISOString(),
              dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              observacoes: 'Ordem de serviço ASG modelo ATERPA.',
              modelo: 'ASG_ATERPA',
              status: 'PENDENTE'
            },
            funcionario: {
              name: mockData.funcionario.nome,
              document: mockData.funcionario.cpf
            },
            cliente: {
              name: 'ASG ATERPA',
              document: '12.345.678/0001-99'
            },
            empresa: {
              name: mockData.funcionario.empresa,
              document: '98.765.432/0001-11'
            },
            unidade: {
              name: 'Unidade ASG ATERPA',
              code: 'ASG-AT-001'
            },
            cargo: {
              name: mockData.funcionario.cargo
            }
          });
          break;
        case 'asg-ordem-servico-transpes':
          pdfBlob = await generatePDFBlob.ordemServico({
            ordem: {
              numero: 'OS-ASG-TP-001',
              dataInicio: new Date().toISOString(),
              dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              observacoes: 'Ordem de serviço ASG modelo TRANSPES.',
              modelo: 'ASG_TRANSPES',
              status: 'PENDENTE'
            },
            funcionario: {
              name: mockData.funcionario.nome,
              document: mockData.funcionario.cpf
            },
            cliente: {
              name: 'ASG TRANSPES',
              document: '12.345.678/0001-99'
            },
            empresa: {
              name: mockData.funcionario.empresa,
              document: '98.765.432/0001-11'
            },
            unidade: {
              name: 'Unidade ASG TRANSPES',
              code: 'ASG-TP-001'
            },
            cargo: {
              name: mockData.funcionario.cargo
            }
          });
          break;
        case 'ordem-servico-recepcionista':
          pdfBlob = await generatePDFBlob.ordemServico({
            ordem: {
              numero: 'OS-RC-001',
              dataInicio: new Date().toISOString(),
              dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              observacoes: 'Ordem de serviço para recepcionista.',
              modelo: 'RECEPCIONISTA',
              status: 'PENDENTE'
            },
            funcionario: {
              name: mockData.funcionario.nome,
              document: mockData.funcionario.cpf
            },
            cliente: {
              name: 'Cliente Exemplo',
              document: '12.345.678/0001-99'
            },
            empresa: {
              name: mockData.funcionario.empresa,
              document: '98.765.432/0001-11'
            },
            unidade: {
              name: 'Recepção',
              code: 'RC-001'
            },
            cargo: {
              name: 'Recepcionista'
            }
          });
          break;
        case 'termo-responsabilidade-cartao-otimo':
          pdfBlob = await generatePDFBlob.termoResponsabilidadeCartaoOtimo(mockData);
          break;
        case 'termo-responsabilidade-cartao-bh-bus':
          pdfBlob = await generatePDFBlob.termoResponsabilidadeCartaoBhBus(mockData);
          break;
        case 'termo-responsabilidade-cartao-betim':
          pdfBlob = await generatePDFBlob.termoResponsabilidadeCartaoBetim(mockData);
          break;
        case 'termo-responsabilidade-celular':
          pdfBlob = await generatePDFBlob.termoResponsabilidadeCelular(mockData);
          break;
        case 'contrato-experiencia-45':
        case 'contrato-experiencia-60':
        case 'contrato-experiencia-90': {
          const periodo = parseInt(model.id.split('-')[2]);
          pdfBlob = await generatePDFBlob.contratoExperiencia({
            funcionario: {
              nome: mockData.funcionario.nome,
              cpf: mockData.funcionario.cpf,
              rg: mockData.funcionario.rg,
              endereco: mockData.funcionario.endereco,
              cidade: mockData.funcionario.cidade,
              estado: mockData.funcionario.estado,
              cep: mockData.funcionario.cep,
              telefone: mockData.funcionario.telefone,
              email: mockData.funcionario.email
            },
            empresa: {
              razaoSocial: mockData.funcionario.empresa,
              cnpj: '12.345.678/0001-99',
              endereco: 'Rua das Empresas, 456',
              cidade: 'Belo Horizonte',
              estado: 'MG',
              cep: '30100-000'
            },
            contrato: {
              cargo: mockData.contrato.cargo,
              salario: mockData.contrato.salario,
              periodo: periodo,
              dataInicio: mockData.contrato.dataInicio,
              dataFim: mockData.contrato.dataFim,
              horarioTrabalho: mockData.contrato.horarioTrabalho,
              localTrabalho: mockData.contrato.localTrabalho
            },
            dataContrato: mockData.dataContrato,
            localContrato: mockData.localContrato
          });
          break;
        }
        case 'declaracao-cipa-transpes':
          pdfBlob = await generatePDFBlob.declaracaoCipaTranspes(mockData);
          break;
        case 'declaracao-fins-escolares':
          pdfBlob = await generatePDFBlob.declaracaoFinsEscolares(mockData);
          break;
        case 'demissao-justa-causa':
          pdfBlob = await generatePDFBlob.demissaoJustaCausa({
            funcionario: mockData.funcionario,
            demissao: {
              tipo: 'JUSTA_CAUSA',
              motivo: 'Falta grave cometida pelo funcionário conforme art. 482 da CLT.',
              dataDemissao: new Date().toLocaleDateString('pt-BR'),
              dataUltimoDia: new Date().toLocaleDateString('pt-BR'),
              avisoPrevio: false
            },
            observacoes: mockData.observacoes
          });
          break;
        case 'carta-apresentacao':
          pdfBlob = await generatePDFBlob.cartaApresentacao({
            funcionario: mockData.funcionario,
            destinatario: 'Prezado(a) Senhor(a)',
            data: new Date().toLocaleDateString('pt-BR'),
            conteudo: `Venho por meio desta apresentar ${mockData.funcionario.nome}, portador do CPF nº ${mockData.funcionario.cpf}, que atualmente ocupa o cargo de ${mockData.funcionario.cargo} na empresa ${mockData.funcionario.empresa}.`
          });
          break;
        case 'termo-opcao-vt-promover':
          pdfBlob = await generatePDFBlob.termoOpcaoVT({
            funcionario: mockData.funcionario,
            opcao: 'ACEITA',
            valorVT: '50,00',
            data: new Date().toLocaleDateString('pt-BR'),
            observacoes: mockData.observacoes
          });
          break;
        case 'validacao-nr06':
          pdfBlob = await generatePDFBlob.validacaoNR06({
            funcionario: mockData.funcionario,
            epis: [
              { nome: 'Capacete de Segurança', ca: 'CA12345', validade: '12/2025' },
              { nome: 'Óculos de Proteção', ca: 'CA67890', validade: '12/2025' },
              { nome: 'Calçado de Segurança', ca: 'CA11111', validade: '12/2025' }
            ],
            dataValidacao: new Date().toLocaleDateString('pt-BR'),
            responsavel: 'João Silva - Supervisor de Segurança',
            observacoes: mockData.observacoes
          });
          break;
        case 'termo-lgpd':
          pdfBlob = await generatePDFBlob.termoLGPD({
            funcionario: mockData.funcionario,
            consentimentos: [
              'Processamento de dados pessoais para fins trabalhistas',
              'Compartilhamento de dados com órgãos competentes quando necessário',
              'Uso de dados para comunicação interna e externa',
              'Armazenamento de dados em sistemas da empresa'
            ],
            data: new Date().toLocaleDateString('pt-BR'),
            observacoes: mockData.observacoes
          });
          break;
        case 'termo-protecao-dados-lgpd':
          pdfBlob = await generatePDFBlob.termoProtecaoDadosLGPD({
            funcionario: mockData.funcionario,
            consentimentos: [
              'Garantia de segurança e confidencialidade dos dados',
              'Uso exclusivo para finalidades trabalhistas',
              'Comunicação imediata em caso de vazamento de dados',
              'Manutenção dos dados apenas pelo tempo necessário'
            ],
            data: new Date().toLocaleDateString('pt-BR'),
            observacoes: mockData.observacoes
          });
          break;
        case 'formulario-abertura-vaga':
          pdfBlob = await generatePDFBlob.formularioAberturaVaga({
            vaga: {
              cargo: 'Vigilante',
              setor: 'Segurança',
              tipo: 'CLT',
              salario: '1.500,00',
              requisitos: 'Ensino médio completo, experiência em segurança, disponibilidade para trabalhar em escala.',
              descricao: 'Vaga para vigilante com experiência em segurança patrimonial, trabalho em escala 12x36.'
            },
            solicitante: {
              nome: 'Maria Silva',
              cargo: 'Gerente de RH',
              departamento: 'Recursos Humanos'
            },
            data: new Date().toLocaleDateString('pt-BR'),
            observacoes: mockData.observacoes
          });
          break;
        default:
          toast({
            title: 'Atenção',
            description: `Visualização para "${model.name}" ainda não implementada.`,
            variant: 'destructive'
          });
          return;
      }

      // Abrir PDF em nova aba para visualização
      if (pdfBlob) {
        const url = window.URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
        
        toast({
          title: 'Sucesso',
          description: `Visualizando "${model.name}" em nova aba.`,
        });
      } else {
        toast({
          title: 'Atenção',
          description: 'Não foi possível gerar o preview do documento.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao visualizar documento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar preview do documento. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'ORDEM_SERVICO': return <FileText className="h-4 w-4" />;
      case 'TERMO_RESPONSABILIDADE': return <Shield className="h-4 w-4" />;
      case 'CONTRATO': return <FileSignature className="h-4 w-4" />;
      case 'DECLARACAO': return <FileCheck className="h-4 w-4" />;
      case 'DEMISSAO': return <UserX className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. Estatísticas no Topo (Padrão SST) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-2 bg-blue-500/10 rounded-full">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Total de Modelos</p>
              <h3 className="text-2xl font-bold text-seguranca-lightgray">{documentModels.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-2 bg-green-500/10 rounded-full">
              <Shield className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Disponíveis</p>
              <h3 className="text-2xl font-bold text-green-500">{documentModels.filter(m => m.hasGenerator).length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-2 bg-orange-500/10 rounded-full">
              <FileSignature className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Em Desenvolvimento</p>
              <h3 className="text-2xl font-bold text-orange-500">{documentModels.filter(m => !m.hasGenerator).length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-2 bg-purple-500/10 rounded-full">
              <FileCheck className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Categorias</p>
              <h3 className="text-2xl font-bold text-purple-500">{categories.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Filtros e Busca */}
      <Card className="bg-seguranca-graphite border-gray-600 w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-seguranca-lightgray">
            <Search className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Lista de Modelos por Categoria */}
      <Tabs defaultValue="ORDEM_SERVICO" className="w-full">
        <TabsList className="flex flex-wrap gap-2 bg-transparent p-0 mb-4 h-auto w-full">
          {categories.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id} 
              className="
                px-3 py-1.5
                text-xs sm:text-sm
                rounded-md 
                bg-seguranca-black 
                border border-gray-700 
                text-gray-400 
                data-[state=active]:bg-seguranca-yellow 
                data-[state=active]:text-seguranca-black 
                data-[state=active]:border-seguranca-yellow 
                hover:border-gray-500 
                transition-all
                flex-grow sm:flex-grow-0
              "
            >
              <div className="flex items-center gap-1.5">
                {getCategoryIcon(category.id)}
                <span className="whitespace-nowrap">{category.name}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-0 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
              {modelsByCategory.find(c => c.id === category.id)?.models.map(model => (
                <Card 
                  key={model.id} 
                  className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-all hover:shadow-lg flex flex-col h-full overflow-hidden"
                >
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="p-1.5 bg-seguranca-black rounded-lg text-gray-300">
                        {getCategoryIcon(model.category)}
                      </div>
                      <Badge 
                        variant={model.hasGenerator ? "default" : "secondary"}
                        className={`text-[10px] px-1.5 py-0 whitespace-nowrap ${
                          model.hasGenerator 
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        }`}
                      >
                        {model.hasGenerator ? "Disponível" : "Em Dev"}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-seguranca-lightgray mt-2 line-clamp-1" title={model.name}>
                      {model.name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-3 pt-0 flex-1 flex flex-col">
                    <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 flex-1">
                      {model.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewDocument(model)}
                        className="w-full h-7 text-[10px] px-1 bg-transparent border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-500"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleGenerateDocument(model)}
                        disabled={!model.hasGenerator}
                        className={`w-full h-7 text-[10px] px-1 ${
                          model.hasGenerator 
                            ? 'bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500' 
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Gerar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {modelsByCategory.find(c => c.id === category.id)?.models.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500 bg-seguranca-black/20 rounded-lg border border-gray-700 border-dashed">
                  <FileText className="h-12 w-12 mb-3 opacity-20" />
                  <p>Nenhum modelo encontrado nesta categoria</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ModelosDocumentosForm;
