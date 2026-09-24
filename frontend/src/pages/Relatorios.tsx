import React from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import ReportGenerator from '@/components/reports/ReportGenerator';
import { useNavigate } from 'react-router-dom';
import { FileText, BarChart3, TrendingUp, Users, Building, Package, DollarSign, ChevronRight } from 'lucide-react';

const Relatorios: React.FC = () => {
  const navigate = useNavigate();
  const reportCategories = [
    {
      title: 'Recursos Humanos',
      description: 'Relatórios relacionados a funcionários e gestão de pessoal',
      icon: Users,
      reports: [
        { name: 'Relatório de Funcionários', description: 'Lista completa de funcionários', path: '/rh/relatorios/funcionarios' },
        { name: 'Relatório de Empresas', description: 'Empresas cadastradas no sistema' }
      ]
    },
    {
      title: 'Operacional',
      description: 'Relatórios de operações e controle',
      icon: BarChart3,
      reports: [
        { name: 'Relatório de Produtos', description: 'Catálogo de produtos' },
        { name: 'Relatório de Estoque', description: 'Situação atual do estoque' }
      ]
    },
    {
      title: 'Financeiro',
      description: 'Relatórios financeiros e contábeis',
      icon: DollarSign,
      reports: [
        { name: 'Relatório Financeiro', description: 'Movimentações financeiras' },
        { name: 'Relatório Consolidado', description: 'Visão geral do sistema' }
      ]
    }
  ];

  return (
    <StandardLayout 
      title="Relatórios" 
      subtitle="Geração de relatórios avançados do sistema"
    >
      <div className="space-y-8">
        
        {/* Gerador de Relatórios */}
        <div className="max-w-2xl">
          <ReportGenerator />
        </div>

        {/* Categorias de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportCategories.map((category, index) => (
            <div
              key={index}
              className="bg-seguranca-graphite rounded-xl p-6 border border-gray-600 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <category.icon className="text-seguranca-yellow" size={24} />
                <h3 className="text-lg font-semibold text-seguranca-lightgray">
                  {category.title}
                </h3>
              </div>
              
              <p className="text-seguranca-lightgray text-sm mb-4">
                {category.description}
              </p>
              
              <div className="space-y-2">
                {category.reports.map((report, reportIndex) => (
                  <div
                    key={reportIndex}
                    className={
                      'path' in report && report.path
                        ? 'flex items-center gap-2 rounded-lg p-2 -m-1 cursor-pointer hover:bg-seguranca-black/60 transition-colors'
                        : 'flex items-center gap-2'
                    }
                    onClick={
                      'path' in report && report.path
                        ? () => navigate((report as { path: string }).path)
                        : undefined
                    }
                    role={'path' in report && report.path ? 'button' : undefined}
                    tabIndex={'path' in report && report.path ? 0 : undefined}
                    onKeyDown={
                      'path' in report && report.path
                        ? e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate((report as { path: string }).path);
                            }
                          }
                        : undefined
                    }
                  >
                    <FileText className="text-gray-400" size={16} />
                    <div className="flex-1 min-w-0">
                      <div className="text-seguranca-lightgray text-sm font-medium flex items-center gap-1">
                        {report.name}
                        {'path' in report && report.path && (
                          <ChevronRight className="text-seguranca-yellow h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {report.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Informações Adicionais */}
        <div className="bg-seguranca-graphite rounded-xl p-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-seguranca-lightgray mb-4 flex items-center gap-2">
            <TrendingUp className="text-seguranca-yellow" size={20} />
            Sobre os Relatórios
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-seguranca-lightgray font-medium mb-2">Características:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Relatórios em PDF para impressão</li>
                <li>• Dados atualizados em tempo real</li>
                <li>• Filtros personalizáveis</li>
                <li>• Exportação automática</li>
                <li>• Controle de permissões</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-seguranca-lightgray font-medium mb-2">Permissões:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• <strong>Supervisor:</strong> Relatórios básicos</li>
                <li>• <strong>Gestor:</strong> Relatórios operacionais</li>
                <li>• <strong>Admin:</strong> Todos os relatórios</li>
                <li>• <strong>Super Admin:</strong> Acesso total</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </StandardLayout>
  );
};

export default Relatorios; 