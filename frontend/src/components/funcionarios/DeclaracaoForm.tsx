import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { FileText, Download, Eye, User, Calendar, FileCheck } from 'lucide-react';
import { declaracaoCipaTranspesGenerator, declaracaoFinsEscolaresGenerator } from '@/utils/declaracaoGenerator';

const mockFuncionarios = [
  { 
    id: '1', 
    name: 'CLÁUDIA MÁRCIA DA LUZ SILVA', 
    cpf: '716.910.306-00', 
    rg: 'MG-4.224.050',
    admissao: '2022-07-11', 
    demissao: '2023-01-11',
    endereco: 'Rua das Flores, 123, Centro, Contagem/MG', 
    cargo: 'Auxiliar Administrativo',
    genero: 'F' // F para feminino, M para masculino
  },
  { 
    id: '2', 
    name: 'João da Silva', 
    cpf: '123.456.789-00', 
    rg: 'MG-1.234.567',
    admissao: '2022-01-10', 
    demissao: null,
    endereco: 'Av. Brasil, 456, Centro, Contagem/MG', 
    cargo: 'Vigilante',
    genero: 'M'
  },
  { 
    id: '3', 
    name: 'Maria Oliveira', 
    cpf: '987.654.321-00', 
    rg: 'MG-9.876.543',
    admissao: '2023-03-15', 
    demissao: null,
    endereco: 'Rua das Palmeiras, 789, Bairro Novo, Contagem/MG', 
    cargo: 'Porteiro',
    genero: 'F'
  },
];

const DeclaracaoForm = () => {
  const [form, setForm] = useState({
    funcionarioId: '',
    dataInicio: '',
    dataFim: '',
    ultimoDiaTrabalho: '',
    cidadeEmissao: 'Contagem',
    dataEmissao: new Date().toLocaleDateString('pt-BR'),
    observacoes: '',
  });

  const [loading, setLoading] = useState(false);

  const funcionario = mockFuncionarios.find(f => f.id === form.funcionarioId);

  const getPronomeTratamento = (genero: string) => {
    return genero === 'F' ? 'Sra.' : 'Sr.';
  };

  const formatDateToBrazilian = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatDateToBrazilianExtended = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} de ${month} de ${year}`;
    } catch {
      return dateString;
    }
  };

  const handlePreview = () => {
    if (!funcionario) {
      alert('Selecione um funcionário!');
      return;
    }
    
    // TODO: Implementar preview da declaração
    console.log('Preview da declaração:', form);
  };

  const handleGerarPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionario) {
      alert('Selecione um funcionário!');
      return;
    }
    
    setLoading(true);
    try {
      const declaracaoData = {
        funcionario: {
          nome: funcionario.name,
          cpf: funcionario.cpf || '',
          rg: funcionario.rg || '',
          cargo: funcionario.cargo || '',
          genero: funcionario.genero || 'M',
        },
        declaracao: {
          dataInicio: form.dataInicio || funcionario.admissao,
          dataFim: form.dataFim || funcionario.demissao || '',
          ultimoDiaTrabalho: form.ultimoDiaTrabalho || form.dataFim || funcionario.demissao || '',
          cidadeEmissao: form.cidadeEmissao,
          dataEmissao: form.dataEmissao,
          observacoes: form.observacoes,
        }
      };

      if (form.tipoDeclaracao === 'CIPA_TRANSPES') {
        await declaracaoCipaTranspesGenerator.generatePDF(declaracaoData);
      } else if (form.tipoDeclaracao === 'FINS_ESCOLARES') {
        await declaracaoFinsEscolaresGenerator.generatePDF(declaracaoData);
      }
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-500" />
            Declaração de Funcionário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Funcionário */}
          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Select value={form.funcionarioId} onValueChange={(value) => setForm(prev => ({ ...prev, funcionarioId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent>
                {mockFuncionarios.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Informações do Funcionário Selecionado */}
          {funcionario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nome</Label>
                <Input value={funcionario.name} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">CPF</Label>
                <Input value={funcionario.cpf} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">RG</Label>
                <Input value={funcionario.rg} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cargo</Label>
                <Input value={funcionario.cargo} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pronome de Tratamento</Label>
                <Input value={getPronomeTratamento(funcionario.genero)} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Admissão</Label>
                <Input value={formatDateToBrazilian(funcionario.admissao)} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              {funcionario.demissao && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Data de Demissão</Label>
                  <Input value={formatDateToBrazilian(funcionario.demissao)} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
              )}
            </div>
          )}

          {/* Período de Trabalho */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início do Período</Label>
              <Input 
                type="date"
                value={form.dataInicio} 
                onChange={(e) => setForm(prev => ({ ...prev, dataInicio: e.target.value }))}
                placeholder="Deixe vazio para usar data de admissão"
              />
              <p className="text-sm text-gray-500">
                {funcionario ? `Padrão: ${formatDateToBrazilian(funcionario.admissao)}` : 'Selecione um funcionário'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Data de Fim do Período</Label>
              <Input 
                type="date"
                value={form.dataFim} 
                onChange={(e) => setForm(prev => ({ ...prev, dataFim: e.target.value }))}
                placeholder="Deixe vazio para usar data de demissão"
              />
              <p className="text-sm text-gray-500">
                {funcionario?.demissao ? `Padrão: ${formatDateToBrazilian(funcionario.demissao)}` : 'Funcionário ainda ativo'}
              </p>
            </div>
          </div>

          {/* Último Dia de Trabalho */}
          <div className="space-y-2">
            <Label>Último Dia de Trabalho</Label>
            <Input 
              type="date"
              value={form.ultimoDiaTrabalho} 
              onChange={(e) => setForm(prev => ({ ...prev, ultimoDiaTrabalho: e.target.value }))}
              placeholder="Deixe vazio para usar data de fim do período"
            />
            <p className="text-sm text-gray-500">
              {form.ultimoDiaTrabalho ? `Será exibido como: ${formatDateToBrazilianExtended(form.ultimoDiaTrabalho)}` : 'Deixe vazio para usar a data de fim do período'}
            </p>
          </div>

          {/* Local e Data de Emissão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade de Emissão</Label>
              <Input 
                value={form.cidadeEmissao} 
                onChange={(e) => setForm(prev => ({ ...prev, cidadeEmissao: e.target.value }))}
                placeholder="Ex: Contagem"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data de Emissão</Label>
              <Input 
                value={form.dataEmissao} 
                onChange={(e) => setForm(prev => ({ ...prev, dataEmissao: e.target.value }))}
                placeholder="DD/MM/AAAA"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações Adicionais</Label>
            <Textarea 
              value={form.observacoes} 
              onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre a declaração..."
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handlePreview} variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Declaração
            </Button>
            <Button onClick={handleGerarPDF} className="flex items-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Gerar Declaração
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeclaracaoForm;
