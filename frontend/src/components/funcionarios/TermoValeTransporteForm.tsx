import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { FileText, Download, Eye, User, Building, Calendar, MapPin, CreditCard } from 'lucide-react';

const mockFuncionarios = [
  { id: '1', name: 'João da Silva', cpf: '123.456.789-00', admissao: '2022-01-10', endereco: 'Rua das Flores, 123, Centro, Contagem/MG', cargo: 'Vigilante' },
  { id: '2', name: 'Maria Oliveira', cpf: '987.654.321-00', admissao: '2023-03-15', endereco: 'Av. Brasil, 456, Centro, Contagem/MG', cargo: 'Porteiro' },
  { id: '3', name: 'Carlos Santos', cpf: '111.222.333-44', admissao: '2023-06-20', endereco: 'Rua das Palmeiras, 789, Bairro Novo, Contagem/MG', cargo: 'Supervisor' },
];

const mockEmpresas = [
  { id: '1', name: 'PROMOVER TERCEIRIZACAO & SERVIÇOS LTDA', cnpj: '12.345.678/0001-99', endereco: 'Av. das Empresas, 456, Centro, Contagem/MG' },
  { id: '2', name: 'EMPRESA BETA', cnpj: '98.765.432/0001-11', endereco: 'Rua Alfa, 789, Centro, Contagem/MG' },
];

const TermoValeTransporteForm = () => {
  const [form, setForm] = useState({
    funcionarioId: '',
    empresaId: '',
    valorVale: '',
    tipoVale: '',
    dataInicio: '',
    dataFim: '',
    observacoes: '',
  });

  const [loading, setLoading] = useState(false);

  const funcionario = mockFuncionarios.find(f => f.id === form.funcionarioId);
  const empresa = mockEmpresas.find(e => e.id === form.empresaId);

  const tiposVale = [
    'Vale Transporte',
    'Vale Combustível',
    'Auxílio Transporte',
    'Reembolso de Passagem',
  ];

  const handlePreview = () => {
    // TODO: Implementar preview do termo
    console.log('Preview do termo:', form);
  };

  const handleGerarPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionario || !empresa) {
      alert('Selecione funcionário e empresa!');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        templateName: 'termo-vale-transporte.html',
        nome: funcionario.name,
        cpf: funcionario.cpf || '',
        cargo: funcionario.cargo || '',
        empresa: empresa.name,
        dataAdmissao: funcionario.admissao || '',
        enderecoFuncionario: funcionario.endereco || '',
        cnpjEmpresa: empresa.cnpj || '',
        enderecoEmpresa: empresa.endereco || '',
        valorVale: form.valorVale,
        tipoVale: form.tipoVale,
        dataInicio: form.dataInicio,
        dataFim: form.dataFim,
        observacoes: form.observacoes,
        dataAtual: new Date().toLocaleDateString('pt-BR')
      };
      
      const response = await fetch('/api/documents/generate-pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Erro ao gerar PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `termo-vale-transporte-${funcionario.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
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
            <CreditCard className="h-5 w-5" />
            Termo de Compromisso de Vale-Transporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Funcionário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={form.empresaId} onValueChange={(value) => setForm(prev => ({ ...prev, empresaId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {mockEmpresas.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          {/* Informações da Empresa Selecionada */}
          {empresa && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Razão Social</Label>
                <Input value={empresa.name} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">CNPJ</Label>
                <Input value={empresa.cnpj} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">Endereço</Label>
                <Input value={empresa.endereco} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
            </div>
          )}

          {/* Configurações do Vale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Vale</Label>
              <Select value={form.tipoVale} onValueChange={(value) => setForm(prev => ({ ...prev, tipoVale: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposVale.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Valor do Vale</Label>
              <Input 
                value={form.valorVale} 
                onChange={(e) => setForm(prev => ({ ...prev, valorVale: e.target.value }))}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          {/* Período de Validade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input 
                type="date" 
                value={form.dataInicio} 
                onChange={(e) => setForm(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Input 
                type="date" 
                value={form.dataFim} 
                onChange={(e) => setForm(prev => ({ ...prev, dataFim: e.target.value }))}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea 
              value={form.observacoes} 
              onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre o vale transporte..."
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handlePreview} variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Termo
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
                  Gerar Termo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermoValeTransporteForm; 