import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { FileText, Download, Eye, User, Calendar, AlertTriangle } from 'lucide-react';
import { advertenciaDisciplinarGenerator } from '@/utils/advertenciaDisciplinarGenerator';

const mockFuncionarios = [
  { id: '1', name: 'TALITA MARTINS DE AZEVEDO', cpf: '123.456.789-00', admissao: '2022-01-10', endereco: 'Rua das Flores, 123, Centro, Contagem/MG', cargo: 'Vigilante' },
  { id: '2', name: 'João da Silva', cpf: '987.654.321-00', admissao: '2023-03-15', endereco: 'Av. Brasil, 456, Centro, Contagem/MG', cargo: 'Porteiro' },
  { id: '3', name: 'Maria Oliveira', cpf: '111.222.333-44', admissao: '2023-06-20', endereco: 'Rua das Palmeiras, 789, Bairro Novo, Contagem/MG', cargo: 'Supervisor' },
];

const AdvertenciaDisciplinarForm = () => {
  const [form, setForm] = useState({
    funcionarioId: '',
    motivo: '',
    dataFaltas: '',
    dataRetorno: '',
    observacoes: '',
    dataEmissao: new Date().toLocaleDateString('pt-BR'),
  });

  const [loading, setLoading] = useState(false);

  const funcionario = mockFuncionarios.find(f => f.id === form.funcionarioId);

  const motivosAdvertencia = [
    'Falta sem justificativa',
    'Atraso frequente',
    'Não cumprimento de normas',
    'Falta de comunicação com supervisão',
    'Comportamento inadequado',
    'Não uso de EPI',
    'Outro motivo',
  ];

  const handlePreview = () => {
    if (!funcionario) {
      alert('Selecione um funcionário!');
      return;
    }
    
    // TODO: Implementar preview da advertência
    console.log('Preview da advertência:', form);
  };

  const handleGerarPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionario) {
      alert('Selecione um funcionário!');
      return;
    }
    
    setLoading(true);
    try {
      const advertenciaData = {
        funcionario: {
          nome: funcionario.name,
          cpf: funcionario.cpf || '',
          cargo: funcionario.cargo || '',
          dataAdmissao: funcionario.admissao || '',
          endereco: funcionario.endereco || '',
        },
        advertencia: {
          motivo: form.motivo,
          dataFaltas: form.dataFaltas,
          dataRetorno: form.dataRetorno,
          observacoes: form.observacoes,
          dataEmissao: form.dataEmissao,
        }
      };

      await advertenciaDisciplinarGenerator.generatePDF(advertenciaData);
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
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Advertência Disciplinar
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
                <Label className="text-sm font-medium">Cargo</Label>
                <Input value={funcionario.cargo} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Admissão</Label>
                <Input value={new Date(funcionario.admissao).toLocaleDateString('pt-BR')} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">Endereço</Label>
                <Input value={funcionario.endereco} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
            </div>
          )}

          {/* Motivo da Advertência */}
          <div className="space-y-2">
            <Label>Motivo da Advertência</Label>
            <Select value={form.motivo} onValueChange={(value) => setForm(prev => ({ ...prev, motivo: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivosAdvertencia.map(motivo => (
                  <SelectItem key={motivo} value={motivo}>{motivo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Datas das Faltas */}
          <div className="space-y-2">
            <Label>Datas das Faltas</Label>
            <Input 
              value={form.dataFaltas} 
              onChange={(e) => setForm(prev => ({ ...prev, dataFaltas: e.target.value }))}
              placeholder="Ex: 29/08 e 03/09/24"
            />
            <p className="text-sm text-gray-500">Informe as datas das faltas separadas por vírgula</p>
          </div>

          {/* Data de Retorno */}
          <div className="space-y-2">
            <Label>Data de Retorno</Label>
            <Input 
              value={form.dataRetorno} 
              onChange={(e) => setForm(prev => ({ ...prev, dataRetorno: e.target.value }))}
              placeholder="Ex: 24/09/24"
            />
          </div>

          {/* Data de Emissão */}
          <div className="space-y-2">
            <Label>Data de Emissão</Label>
            <Input 
              value={form.dataEmissao} 
              onChange={(e) => setForm(prev => ({ ...prev, dataEmissao: e.target.value }))}
              placeholder="DD/MM/AAAA"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações Adicionais</Label>
            <Textarea 
              value={form.observacoes} 
              onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre a advertência..."
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handlePreview} variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Advertência
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
                  Gerar Advertência
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvertenciaDisciplinarForm;
