import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Briefcase, 
  ArrowRight, 
  Info,
  Users,
  Building2
} from 'lucide-react';

const FuncoesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoToCargos = () => {
    navigate('/rh/cargos');
  };

  return (
    <StandardLayout title="Gestão de Funções">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-seguranca-darkred text-white">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-seguranca-lightgray">Gestão de Funções</h1>
              <p className="text-seguranca-lightgray/80">
                Gerencie as funções organizacionais da empresa
              </p>
            </div>
          </div>
        </div>

        {/* Alerta informativo */}
        <Alert className="bg-blue-500/10 border-blue-500/30 text-blue-400">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-blue-300">
            <strong>Importante:</strong> No sistema Secure Guard, as <strong>Funções</strong> são gerenciadas 
            através do módulo de <strong>Cargos</strong>. Esta abordagem unifica a gestão de posições 
            organizacionais e suas respectivas responsabilidades.
          </AlertDescription>
        </Alert>

        {/* Cards explicativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: O que são Funções/Cargos */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                <Briefcase className="w-5 h-5 text-seguranca-darkred" />
                Funções e Cargos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-seguranca-lightgray/80">
                No contexto empresarial, <strong>funções</strong> e <strong>cargos</strong> são conceitos 
                relacionados que definem as responsabilidades e posições dos colaboradores.
              </p>
              
              <div className="space-y-3">
                <div className="p-3 bg-seguranca-black rounded-lg">
                  <h4 className="font-medium text-seguranca-lightgray mb-1">Função</h4>
                  <p className="text-sm text-seguranca-lightgray/70">
                    Conjunto de atividades e responsabilidades exercidas
                  </p>
                </div>
                
                <div className="p-3 bg-seguranca-black rounded-lg">
                  <h4 className="font-medium text-seguranca-lightgray mb-1">Cargo</h4>
                  <p className="text-sm text-seguranca-lightgray/70">
                    Posição formal na estrutura organizacional
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Como funciona no sistema */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                <Building2 className="w-5 h-5 text-seguranca-darkred" />
                Como funciona no Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-seguranca-lightgray/80">
                O sistema unifica a gestão através do módulo <strong>Cargos</strong>, 
                que contempla todas as informações necessárias:
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-seguranca-lightgray/70">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Nome do cargo/função
                </div>
                <div className="flex items-center gap-2 text-sm text-seguranca-lightgray/70">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Descrição das responsabilidades
                </div>
                <div className="flex items-center gap-2 text-sm text-seguranca-lightgray/70">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Salário base
                </div>
                <div className="flex items-center gap-2 text-sm text-seguranca-lightgray/70">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Unidade de trabalho
                </div>
                <div className="flex items-center gap-2 text-sm text-seguranca-lightgray/70">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Benefícios associados
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card de redirecionamento */}
        <Card className="bg-gradient-to-r from-seguranca-darkred/20 to-seguranca-red/20 border-seguranca-darkred/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-seguranca-darkred text-white">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-seguranca-lightgray mb-1">
                    Gerenciar Cargos/Funções
                  </h3>
                  <p className="text-seguranca-lightgray/80">
                    Acesse o módulo completo para criar, editar e gerenciar todos os cargos da empresa
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleGoToCargos}
                className="bg-seguranca-darkred hover:bg-seguranca-red text-white flex items-center gap-2"
              >
                Ir para Cargos
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exemplos de cargos/funções comuns */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">
              Exemplos de Cargos/Funções na Segurança Privada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'Vigilante',
                'Supervisor de Segurança',
                'Porteiro',
                'Líder de Equipe',
                'Operador de CFTV',
                'Controlador de Acesso',
                'Rondante',
                'Auxiliar de Segurança'
              ].map((cargo, index) => (
                <div 
                  key={index}
                  className="p-3 bg-seguranca-black rounded-lg text-center border border-gray-700 hover:border-seguranca-darkred transition-colors"
                >
                  <span className="text-sm text-seguranca-lightgray">{cargo}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default FuncoesPage;
