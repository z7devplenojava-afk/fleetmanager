import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { FileText, Download, Eye, User, Building, Calendar, MapPin, Phone, Mail, IdCard, FileSignature } from 'lucide-react';

const mockFuncionarios = [
  { 
    id: '1', 
    name: 'João da Silva', 
    cpf: '123.456.789-00',
    rg: 'MG-12.345.678-9',
    pis: '123.45678.90-1',
    ctps: '123456789012',
    admissao: '2022-01-10', 
    cargo: 'Vigilante', 
    setor: 'Portaria', 
    endereco: 'Rua das Flores, 123, Centro, Contagem/MG',
    telefone: '(31) 99999-9999',
    email: 'joao.silva@email.com',
    estadoCivil: 'Casado',
    escolaridade: 'Ensino Médio Completo',
    dataNascimento: '1985-05-15',
    nacionalidade: 'Brasileira',
    naturalidade: 'Contagem/MG'
  },
  { 
    id: '2', 
    name: 'Maria Oliveira', 
    cpf: '987.654.321-00',
    rg: 'MG-98.765.432-1',
    pis: '987.65432.10-9',
    ctps: '987654321098',
    admissao: '2023-03-15', 
    cargo: 'Porteiro', 
    setor: 'Recepção', 
    endereco: 'Av. Brasil, 456, Centro, Contagem/MG',
    telefone: '(31) 88888-8888',
    email: 'maria.oliveira@email.com',
    estadoCivil: 'Solteira',
    escolaridade: 'Ensino Superior Incompleto',
    dataNascimento: '1990-08-22',
    nacionalidade: 'Brasileira',
    naturalidade: 'Belo Horizonte/MG'
  },
  { 
    id: '3', 
    name: 'Carlos Santos', 
    cpf: '111.222.333-44',
    rg: 'MG-11.222.333-4',
    pis: '111.22233.44-5',
    ctps: '111222333444',
    admissao: '2023-06-20', 
    cargo: 'Supervisor', 
    setor: 'Administrativo', 
    endereco: 'Rua das Palmeiras, 789, Bairro Novo, Contagem/MG',
    telefone: '(31) 77777-7777',
    email: 'carlos.santos@email.com',
    estadoCivil: 'Divorciado',
    escolaridade: 'Ensino Superior Completo',
    dataNascimento: '1988-12-10',
    nacionalidade: 'Brasileira',
    naturalidade: 'São Paulo/SP'
  },
];

const mockEmpresas = [
  { id: '1', name: 'PROMOVER TERCEIRIZACAO & SERVIÇOS LTDA', cnpj: '12.345.678/0001-99', endereco: 'Av. das Empresas, 456, Centro, Contagem/MG' },
  { id: '2', name: 'EMPRESA BETA', cnpj: '98.765.432/0001-11', endereco: 'Rua Alfa, 789, Centro, Contagem/MG' },
];

const FichaRegistroFuncionarioForm = () => {
  const [form, setForm] = useState({
    funcionarioId: '',
    empresaId: '',
    dataRegistro: '',
    responsavelRegistro: '',
    observacoes: '',
    documentosEntregues: [] as string[],
  });

  const [loading, setLoading] = useState(false);

  const funcionario = mockFuncionarios.find(f => f.id === form.funcionarioId);
  const empresa = mockEmpresas.find(e => e.id === form.empresaId);

  const documentosOptions = [
    'Carteira de Identidade (RG)',
    'CPF',
    'Carteira de Trabalho (CTPS)',
    'PIS/PASEP',
    'Título de Eleitor',
    'Certificado de Reservista',
    'Certidão de Nascimento',
    'Certidão de Casamento',
    'Comprovante de Residência',
    'Foto 3x4',
    'Exame Médico Admissional',
    'Exame Toxicológico',
    'Certificado de Treinamento',
    'Outros',
  ];

  const handleDocumentoToggle = (documento: string) => {
    setForm(prev => ({
      ...prev,
      documentosEntregues: prev.documentosEntregues.includes(documento)
        ? prev.documentosEntregues.filter(d => d !== documento)
        : [...prev.documentosEntregues, documento]
    }));
  };

  const handlePreview = () => {
    // TODO: Implementar preview da ficha
    console.log('Preview da ficha:', { form, funcionario, empresa });
  };

  const handleGerarPDF = async (e) => {
    e.preventDefault();
    
    if (!funcionario || !empresa) {
      alert('Selecione funcionário e empresa!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        templateName: 'ficha-registro-funcionario.html',
        // Dados do Funcionário
        funcionario: funcionario.name,
        cpf: funcionario.cpf,
        rg: funcionario.rg,
        pis: funcionario.pis,
        ctps: funcionario.ctps,
        dataNascimento: funcionario.dataNascimento,
        nacionalidade: funcionario.nacionalidade,
        naturalidade: funcionario.naturalidade,
        estadoCivil: funcionario.estadoCivil,
        escolaridade: funcionario.escolaridade,
        telefone: funcionario.telefone,
        email: funcionario.email,
        endereco: funcionario.endereco,
        // Dados da Empresa
        empresa: empresa.name,
        cnpj: empresa.cnpj,
        enderecoEmpresa: empresa.endereco,
        // Dados do Registro
        dataAdmissao: funcionario.admissao,
        cargo: funcionario.cargo,
        setor: funcionario.setor,
        dataRegistro: form.dataRegistro,
        responsavelRegistro: form.responsavelRegistro,
        documentosEntregues: form.documentosEntregues,
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
      a.download = `ficha-registro-${funcionario.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
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
            <FileSignature className="h-5 w-5" />
            Ficha de Registro do Funcionário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Funcionário e Empresa */}
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

          {/* Informações Pessoais do Funcionário */}
          {funcionario && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações Pessoais
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome Completo</Label>
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
                  <Label className="text-sm font-medium">Data de Nascimento</Label>
                  <Input value={new Date(funcionario.dataNascimento).toLocaleDateString('pt-BR')} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nacionalidade</Label>
                  <Input value={funcionario.nacionalidade} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Naturalidade</Label>
                  <Input value={funcionario.naturalidade} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estado Civil</Label>
                  <Input value={funcionario.estadoCivil} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Escolaridade</Label>
                  <Input value={funcionario.escolaridade} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Telefone</Label>
                  <Input value={funcionario.telefone} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">E-mail</Label>
                  <Input value={funcionario.email} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Endereço</Label>
                  <Input value={funcionario.endereco} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          )}

          {/* Informações Profissionais */}
          {funcionario && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Informações Profissionais
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cargo</Label>
                  <Input value={funcionario.cargo} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Setor</Label>
                  <Input value={funcionario.setor} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Data de Admissão</Label>
                  <Input value={new Date(funcionario.admissao).toLocaleDateString('pt-BR')} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">PIS/PASEP</Label>
                  <Input value={funcionario.pis} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">CTPS</Label>
                  <Input value={funcionario.ctps} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          )}

          {/* Informações da Empresa */}
          {empresa && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Informações da Empresa
              </h4>
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
            </div>
          )}

          {/* Dados do Registro */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dados do Registro
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Registro</Label>
                <Input 
                  type="date" 
                  value={form.dataRegistro} 
                  onChange={(e) => setForm(prev => ({ ...prev, dataRegistro: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Responsável pelo Registro</Label>
                <Input 
                  value={form.responsavelRegistro} 
                  onChange={(e) => setForm(prev => ({ ...prev, responsavelRegistro: e.target.value }))}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>
          </div>

          {/* Documentos Entregues */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium flex items-center gap-2">
              <IdCard className="h-4 w-4" />
              Documentos Entregues
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {documentosOptions.map(documento => (
                <Button
                  key={documento}
                  type="button"
                  variant={form.documentosEntregues.includes(documento) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDocumentoToggle(documento)}
                  className="justify-start"
                >
                  {documento}
                </Button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea 
              value={form.observacoes} 
              onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre o registro do funcionário..."
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handlePreview} variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Ficha
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
                  Gerar Ficha
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FichaRegistroFuncionarioForm; 