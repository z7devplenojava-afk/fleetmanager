import React from 'react';
import SEO from '@/components/SEO';
import { PublicLayout } from '@/components/PublicLayout';
import { FileText, Scale, Users, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const TermsAndConditions: React.FC = () => {
  const seoData = {
    title: 'Termos e Condições - Secured Guard',
    description: 'Conheça nossos termos e condições de uso dos serviços. Transparência e clareza em nossos compromissos.',
    keywords: 'termos e condições, condições de uso, contrato de serviços, segurança, vigilância',
    canonical: '/termos-condicoes'
  };

  return (
    <PublicLayout>
      <SEO {...seoData} />
      
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 bg-green-100 rounded-full">
                <Scale className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
              Termos e Condições
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Transparência e clareza em nossos compromissos e responsabilidades
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-4">
              Última atualização: 17 de setembro de 2025
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
            <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
              
              {/* Introdução */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                  Introdução
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Estes Termos e Condições regulam o uso dos serviços oferecidos pela Secured Guard, 
                  empresa especializada em soluções de segurança e vigilância. Ao contratar nossos 
                  serviços, você concorda com todas as condições estabelecidas neste documento.
                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  É importante que você leia atentamente todos os termos antes de utilizar nossos serviços.
                </p>
              </section>

              {/* Definições */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                  Definições
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Secured Guard</h3>
                    <p className="text-sm sm:text-base text-gray-700">
                      Refere-se à empresa Secured Guard, prestadora de serviços de segurança e vigilância.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Cliente</h3>
                    <p className="text-sm sm:text-base text-gray-700">
                      Pessoa física ou jurídica que contrata os serviços da Secured Guard.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Serviços</h3>
                    <p className="text-sm sm:text-base text-gray-700">
                      Todos os serviços de segurança, vigilância e monitoramento oferecidos pela empresa.
                    </p>
                  </div>
                </div>
              </section>

              {/* Serviços Oferecidos */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                  Serviços Oferecidos
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  A Secured Guard oferece os seguintes serviços:
                </p>
                <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-2 ml-4">
                  <li>Vigilância patrimonial 24 horas</li>
                  <li>Controle de acesso</li>
                  <li>Monitoramento por câmeras</li>
                  <li>Segurança pessoal</li>
                  <li>Transporte de valores</li>
                  <li>Consultoria em segurança</li>
                  <li>Treinamento de equipes de segurança</li>
                </ul>
              </section>

              {/* Responsabilidades do Cliente */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                  Responsabilidades do Cliente
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  O cliente se compromete a:
                </p>
                <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-2 ml-4">
                  <li>Fornecer informações verdadeiras e atualizadas</li>
                  <li>Efetuar pagamentos nos prazos estabelecidos</li>
                  <li>Permitir acesso às instalações para prestação dos serviços</li>
                  <li>Comunicar alterações relevantes que possam afetar os serviços</li>
                  <li>Respeitar as normas de segurança estabelecidas</li>
                  <li>Não interferir no trabalho dos profissionais de segurança</li>
                </ul>
              </section>

              {/* Responsabilidades da Secured Guard */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                  Responsabilidades da Secured Guard
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  A Secured Guard se compromete a:
                </p>
                <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-2 ml-4">
                  <li>Prestar serviços com qualidade e profissionalismo</li>
                  <li>Manter confidencialidade das informações do cliente</li>
                  <li>Fornecer profissionais qualificados e treinados</li>
                  <li>Cumprir os prazos e horários estabelecidos</li>
                  <li>Manter equipamentos em perfeito funcionamento</li>
                  <li>Comunicar incidentes relevantes ao cliente</li>
                </ul>
              </section>

              {/* Pagamentos */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                  Condições de Pagamento
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Formas de Pagamento</h3>
                    <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 ml-4">
                      <li>Boleto bancário</li>
                      <li>Transferência bancária</li>
                      <li>Cartão de crédito</li>
                      <li>PIX</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Prazos</h3>
                    <p className="text-sm sm:text-base text-gray-700">
                      Os pagamentos devem ser efetuados até o vencimento estabelecido no contrato. 
                      Atrasos podem resultar em suspensão dos serviços.
                    </p>
                  </div>
                </div>
              </section>

              {/* Limitações */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                  Limitações de Responsabilidade
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  A Secured Guard não se responsabiliza por:
                </p>
                <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-2 ml-4">
                  <li>Danos causados por força maior ou caso fortuito</li>
                  <li>Perdas decorrentes de falhas de terceiros</li>
                  <li>Danos não cobertos pelo seguro contratado</li>
                  <li>Interrupções de serviços por motivos externos</li>
                  <li>Danos causados por negligência do cliente</li>
                </ul>
              </section>

              {/* Rescisão */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                  Rescisão do Contrato
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  O contrato pode ser rescindido nas seguintes situações:
                </p>
                <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-2 ml-4">
                  <li>Por mútuo acordo entre as partes</li>
                  <li>Por descumprimento das obrigações contratuais</li>
                  <li>Por atraso no pagamento superior a 30 dias</li>
                  <li>Por solicitação do cliente com aviso prévio de 30 dias</li>
                </ul>
              </section>

              {/* Disposições Gerais */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                  Disposições Gerais
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Lei Aplicável</h3>
                    <p className="text-sm sm:text-base text-gray-700">
                      Estes termos são regidos pela legislação brasileira, especialmente o Código Civil 
                      e o Código de Defesa do Consumidor.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Foro</h3>
                    <p className="text-sm sm:text-base text-gray-700">
                      Fica eleito o foro da comarca de Belo Horizonte/MG para dirimir questões 
                      relacionadas a estes termos.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Alterações</h3>
                    <p className="text-sm sm:text-base text-gray-700">
                      Estes termos podem ser alterados a qualquer momento, sendo as alterações 
                      comunicadas aos clientes através de nossos canais oficiais.
                    </p>
                  </div>
                </div>
              </section>

              {/* Contato */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Contato
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Para esclarecimentos sobre estes termos, entre em contato:
                </p>
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                  <p className="text-sm sm:text-base text-gray-700 mb-2">
                    <strong>E-mail:</strong> contratos@securedguard.com.br
                  </p>
                  <p className="text-sm sm:text-base text-gray-700 mb-2">
                    <strong>Telefone:</strong> (31) 99999-9999
                  </p>
                  <p className="text-sm sm:text-base text-gray-700">
                    <strong>Endereço:</strong> Rua das Flores, 123 - Centro, Belo Horizonte - MG
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default TermsAndConditions;
