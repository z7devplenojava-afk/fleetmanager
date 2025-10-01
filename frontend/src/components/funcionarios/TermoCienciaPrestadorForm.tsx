import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { FileText, Download, Eye, User, Calendar, Shield } from 'lucide-react';
import { termoCienciaPrestadorGenerator } from '@/utils/termoCienciaPrestadorGenerator';

const mockFuncionarios = [
  { 
    id: '1', 
    name: 'GABRIEL AILTON DE ALMEIDA MOREIRA', 
    cpf: '150.364.497-97', 
    admissao: '2024-01-15', 
    endereco: 'Rua das Flores, 123, Centro, Contagem/MG', 
    cargo: 'Prestador de Serviços'
  },
  { 
    id: '2', 
    name: 'João da Silva', 
    cpf: '123.456.789-00', 
    admissao: '2022-01-10', 
    endereco: 'Av. Brasil, 456, Centro, Contagem/MG', 
    cargo: 'Prestador de Serviços'
  },
  { 
    id: '3', 
    name: 'Maria Oliveira', 
    cpf: '987.654.321-00', 
    admissao: '2023-03-15', 
    endereco: 'Rua das Palmeiras, 789, Bairro Novo, Contagem/MG', 
    cargo: 'Prestador de Serviços'
  },
];

const TermoCienciaPrestadorForm = () => {
  const [form, setForm] = useState({
    funcionarioId: '',
    cidadeEmissao: 'Contagem/MG',
    dataEmissao: new Date().toLocaleDateString('pt-BR'),
    observacoes: '',
  });

  const [loading, setLoading] = useState(false);

  const funcionario = mockFuncionarios.find(f => f.id === form.funcionarioId);

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
      alert('Selecione um prestador de serviços!');
      return;
    }
    
    // TODO: Implementar preview do termo de ciência
    console.log('Preview do termo de ciência:', form);
  };

  const handleGerarPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionario) {
      alert('Selecione um prestador de serviços!');
      return;
    }
    
    setLoading(true);
    try {
      const termoCienciaData = {
        funcionario: {
          nome: funcionario.name,
          cpf: funcionario.cpf || '',
          cargo: funcionario.cargo || '',
          endereco: funcionario.endereco || '',
        },
        termo: {
          cidadeEmissao: form.cidadeEmissao,
          dataEmissao: form.dataEmissao,
          observacoes: form.observacoes,
        }
      };

      await termoCienciaPrestadorGenerator.generatePDF(termoCienciaData);
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
            <Shield className="h-5 w-5 text-blue-500" />
            Termo de Ciência do Prestador de Serviços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Funcionário */}
          <div className="space-y-2">
            <Label>Prestador de Serviços</Label>
            <Select value={form.funcionarioId} onValueChange={(value) => setForm(prev => ({ ...prev, funcionarioId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o prestador de serviços" />
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
                <Label className="text-sm font-medium">Cargo</Label>
                <Input value={funcionario.cargo} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Admissão</Label>
                <Input value={formatDateToBrazilian(funcionario.admissao)} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">Endereço</Label>
                <Input value={funcionario.endereco} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
            </div>
          )}

          {/* Local e Data de Emissão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade de Emissão</Label>
              <Input 
                value={form.cidadeEmissao} 
                onChange={(e) => setForm(prev => ({ ...prev, cidadeEmissao: e.target.value }))}
                placeholder="Ex: Contagem/MG"
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
              placeholder="Observações adicionais sobre o termo de ciência..."
              rows={3}
            />
          </div>

          {/* Informações sobre o Documento */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Sobre este Documento</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Este termo de ciência confirma que o prestador de serviços está ciente da Diretriz de Prevenção 
              e Controle do Uso Indevido de Álcool e/ou de Outras Drogas, cuja finalidade é a preservação 
              da saúde e segurança de todos os colaboradores e prestadores de serviços.
            </p>
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handlePreview} variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Termo de Ciência
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
                  Gerar Termo de Ciência
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermoCienciaPrestadorForm;
