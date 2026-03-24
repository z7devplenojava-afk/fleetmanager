import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';

const AvaliacaoDesempenho: React.FC = () => {
  const navigate = useNavigate();

  return (
    <StandardLayout
      title="Avaliação de Desempenho"
      subtitle="Acompanhe o desenvolvimento dos colaboradores, defina metas individuais e mantenha o histórico completo de feedbacks."
    >
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 text-white">
            <ClipboardCheck className="h-8 w-8 text-seguranca-yellow" />
            <span className="text-2xl font-semibold">Visão Geral</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                📈 Ciclos de Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>
                Em breve você poderá criar ciclos completos de avaliação de desempenho,
                com definição de metas, prazos e responsáveis pelo feedback.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <ArrowLeftRight className="h-4 w-4" />
                Histórico de avaliações anteriores por colaborador
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle2 className="h-4 w-4" />
                Indicadores visuais de progresso e pendências
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                🧩 Status do Módulo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>
                Estamos finalizando a adequação das APIs e do fluxo de aprovação. Enquanto isso,
                você pode utilizar os relatórios do módulo de RH ou exportar planilhas personalizadas.
              </p>
              <div className="rounded-lg border border-gray-600 bg-gray-800/40 p-4">
                <p className="text-sm text-gray-400">
                  <strong className="text-seguranca-yellow">Novidade:</strong> a integração com
                  o módulo de Metas Corporativas permitirá vincular avaliações a objetivos estratégicos.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                onClick={() => navigate('/rh')}
              >
                Voltar para RH
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </StandardLayout>
  );
};

export default AvaliacaoDesempenho;

