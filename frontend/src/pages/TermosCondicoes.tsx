import React from 'react';
import Navbar from '@/components/Navbar';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Scale, Users, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermosCondicoes: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <>
      <SEO 
        title="Termos e Condições - Promover Vigilância"
        description="Conheça nossos termos e condições de uso dos serviços de segurança patrimonial. Transparência e clareza em nossos contratos."
        keywords="termos e condições, contrato de prestação de serviços, vigilância patrimonial, condições comerciais"
        type="website"
        url="https://promover.com.br/termos-condicoes"
      />
      
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={handleGoBack}
                className="text-gray-400 hover:text-white mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-600 rounded-lg">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Termos e Condições</h1>
              </div>
              
              <p className="text-gray-300 text-lg">
                Última atualização: 01/01/2025
              </p>
            </div>

            {/* Conteúdo */}
            <div className="space-y-6">
              {/* Introdução */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-red-600" />
                    Introdução
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>
                    Estes Termos e Condições ("Termos") regem o uso dos serviços oferecidos 
                    pela Promover Vigilância Patrimonial Ltda. ("Promover", "nós", "nossa" ou "empresa").
                  </p>
                  <p>
                    Ao contratar nossos serviços, você concorda em cumprir e estar sujeito a 
                    estes Termos. Recomendamos que leia atentamente este documento antes de 
                    utilizar nossos serviços.
                  </p>
                </CardContent>
              </Card>

              {/* Definições */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="h-5 w-5 mr-2 text-red-600" />
                    Definições
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-white font-semibold">Cliente:</h4>
                      <p className="ml-4">Pessoa física ou jurídica que contrata nossos serviços.</p>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold">Serviços:</h4>
                      <p className="ml-4">Vigilância patrimonial, portaria, controle de acesso, facilities e demais serviços oferecidos.</p>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold">Contrato:</h4>
                      <p className="ml-4">Acordo formal entre a Promover e o Cliente para prestação de serviços.</p>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold">Posto de Serviço:</h4>
                      <p className="ml-4">Local onde os serviços de segurança são prestados.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Serviços Oferecidos */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-red-600" />
                    Serviços Oferecidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>A Promover oferece os seguintes serviços:</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-white font-semibold">Segurança:</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Vigilância Patrimonial 24h</li>
                        <li>Portaria e Recepção</li>
                        <li>Controle de Acesso</li>
                        <li>Vigia e Rondas</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-white font-semibold">Facilities:</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Limpeza e Conservação</li>
                        <li>Manutenção Preventiva</li>
                        <li>Jardinagem</li>
                        <li>Recepção e Atendimento</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Obrigações do Cliente */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-red-600" />
                    Obrigações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>O Cliente se compromete a:</p>
                  
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Fornecer informações verdadeiras e atualizadas</li>
                    <li>Efetuar pagamentos nos prazos acordados</li>
                    <li>Fornecer infraestrutura adequada para prestação dos serviços</li>
                    <li>Respeitar os profissionais da Promover</li>
                    <li>Comunicar alterações que possam afetar os serviços</li>
                    <li>Cumprir as normas de segurança do posto</li>
                    <li>Fornecer acesso às áreas necessárias para prestação dos serviços</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Obrigações da Promover */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-red-600" />
                    Obrigações da Promover
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>A Promover se compromete a:</p>
                  
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Prestar serviços com qualidade e eficiência</li>
                    <li>Manter profissionais treinados e qualificados</li>
                    <li>Respeitar horários e escalas acordadas</li>
                    <li>Fornecer equipamentos necessários para os serviços</li>
                    <li>Manter sigilo sobre informações do Cliente</li>
                    <li>Comunicar incidentes relevantes</li>
                    <li>Cumprir todas as obrigações trabalhistas e previdenciárias</li>
                    <li>Manter seguro de responsabilidade civil</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Pagamentos */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Condições de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Formas de Pagamento:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Boleto bancário</li>
                      <li>Transferência bancária</li>
                      <li>PIX</li>
                      <li>Cartão de crédito (parcelado)</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Prazos:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Pagamento até o dia 10 do mês subsequente</li>
                      <li>Multa de 2% por atraso</li>
                      <li>Juros de 1% ao mês sobre valores em atraso</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Limitações de Responsabilidade */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Limitações de Responsabilidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>
                    A responsabilidade da Promover está limitada aos seguintes aspectos:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Prestação dos serviços conforme especificado no contrato</li>
                    <li>Danos causados por negligência comprovada de nossos profissionais</li>
                    <li>Valor máximo equivalente a 12 meses de serviços prestados</li>
                    <li>Exclusão de responsabilidade por danos indiretos ou lucros cessantes</li>
                    <li>Exclusão de responsabilidade por eventos de força maior</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Rescisão */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Rescisão do Contrato</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Pelo Cliente:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Com aviso prévio de 30 dias</li>
                      <li>Em caso de descumprimento das obrigações da Promover</li>
                      <li>Por necessidade do negócio (com multa de 50% do valor restante)</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Pela Promover:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Em caso de atraso superior a 30 dias no pagamento</li>
                      <li>Por descumprimento das obrigações do Cliente</li>
                      <li>Por alterações que inviabilizem a prestação dos serviços</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Disposições Gerais */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Disposições Gerais</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Estes Termos são regidos pela legislação brasileira</li>
                    <li>Foro da comarca de Contagem/MG para dirimir questões</li>
                    <li>Alterações devem ser feitas por escrito</li>
                    <li>Invalidação de uma cláusula não afeta as demais</li>
                    <li>Comunicações devem ser feitas por escrito</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Contato */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Contato</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>
                    Para esclarecimentos sobre estes Termos e Condições, entre em contato:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Dados de Contato:</h4>
                      <p>E-mail: juridico@promovervigilancia.com.br</p>
                      <p>Telefone: (31) 2559-1245</p>
                      <p>Endereço: Rua Cel. João Camargos, 267 - Centro - Contagem - MG</p>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold mb-2">Horário de Atendimento:</h4>
                      <p>Segunda a Sexta: 8h às 18h</p>
                      <p>Sábado: 8h às 12h</p>
                      <p>Emergências: 24h por dia</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermosCondicoes;
