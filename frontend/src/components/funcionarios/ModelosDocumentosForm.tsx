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
import { documentModels, categories, getModelsByCategory, DocumentModel } from '@/utils/documentModels';
import { termoResponsabilidadeCartaoOtimoGenerator, termoResponsabilidadeCelularGenerator } from '@/utils/termoResponsabilidadeGenerator';
import { contratoExperienciaGenerator } from '@/utils/contratoExperienciaGenerator';
import { declaracaoCipaTranspesGenerator, declaracaoFinsEscolaresGenerator } from '@/utils/declaracaoGenerator';

const ModelosDocumentosForm = () => {
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
      alert(`Gerador para "${model.name}" ainda não implementado.`);
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
          email: 'joao.silva@email.com'
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
        default:
          alert(`Gerador para "${model.name}" ainda não implementado.`);
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o documento. Tente novamente.');
    }
  };

  const handlePreviewDocument = (model: DocumentModel) => {
    console.log('Visualizando documento:', model.name);
    // Implementar visualização
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
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Modelos de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Selecione um modelo de documento para gerar ou visualizar
            </p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar modelos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Modelos por Categoria */}
      <Tabs defaultValue="ORDEM_SERVICO" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              {getCategoryIcon(category.id)}
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modelsByCategory.find(c => c.id === category.id)?.models.map(model => (
                <Card key={model.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium leading-tight">
                        {model.name}
                      </CardTitle>
                      <Badge variant={model.hasGenerator ? "default" : "secondary"}>
                        {model.hasGenerator ? "Disponível" : "Em desenvolvimento"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-4">
                      {model.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewDocument(model)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleGenerateDocument(model)}
                        disabled={!model.hasGenerator}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Gerar PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {modelsByCategory.find(c => c.id === category.id)?.models.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum modelo encontrado para a busca.' : 'Nenhum modelo disponível nesta categoria.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {documentModels.filter(m => m.hasGenerator).length}
              </div>
              <div className="text-xs text-muted-foreground">Disponíveis</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {documentModels.filter(m => !m.hasGenerator).length}
              </div>
              <div className="text-xs text-muted-foreground">Em desenvolvimento</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {getModelsByCategory('ORDEM_SERVICO').length}
              </div>
              <div className="text-xs text-muted-foreground">Ordens de Serviço</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {getModelsByCategory('TERMO_RESPONSABILIDADE').length}
              </div>
              <div className="text-xs text-muted-foreground">Termos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {getModelsByCategory('CONTRATO').length}
              </div>
              <div className="text-xs text-muted-foreground">Contratos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {getModelsByCategory('OUTROS').length}
              </div>
              <div className="text-xs text-muted-foreground">Outros</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelosDocumentosForm;
