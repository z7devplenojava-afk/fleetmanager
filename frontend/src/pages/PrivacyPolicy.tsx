import React from 'react';
import SEO from '@/components/SEO';
import { PublicLayout } from '@/components/PublicLayout';
import { Shield, Eye, Lock, Database, UserCheck, FileText } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const seoData = {
    title: 'Políticas de Privacidade - Secured Guard',
    description: 'Conheça nossas políticas de privacidade e como protegemos seus dados pessoais. Transparência e segurança em primeiro lugar.',
    keywords: 'políticas de privacidade, proteção de dados, LGPD, segurança da informação, privacidade',
    canonical: '/politicas-privacidade'
  };

  return (
    <PublicLayout>
      <SEO {...seoData} />
      
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 bg-blue-100 rounded-full">
                <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
              Políticas de Privacidade
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Transparência e proteção dos seus dados pessoais são nossas prioridades
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
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                  Introdução
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  A Secured Guard valoriza a privacidade e a proteção dos dados pessoais de nossos clientes, 
                  funcionários e visitantes. Esta Política de Privacidade descreve como coletamos, usamos, 
                  armazenamos e protegemos suas informações pessoais.
                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) 
                  e outras legislações aplicáveis de proteção de dados.
                </p>
              </section>

              {/* Dados Coletados */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Database className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                  Dados Coletados
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Dados Pessoais</h3>
                    <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 ml-4">
                      <li>Nome completo</li>
                      <li>CPF</li>
                      <li>RG</li>
                      <li>Data de nascimento</li>
                      <li>Endereço residencial</li>
                      <li>Telefone e e-mail</li>
                      <li>Dados bancários (para pagamentos)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Dados Profissionais</h3>
                    <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 ml-4">
                      <li>Histórico profissional</li>
                      <li>Certificações e cursos</li>
                      <li>Dados de contrato de trabalho</li>
                      <li>Informações de folha de pagamento</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Finalidade */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                  Finalidade do Tratamento
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Utilizamos seus dados pessoais para as seguintes finalidades:
                </p>
                <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-2 ml-4">
                  <li>Prestação de serviços de segurança</li>
                  <li>Gestão de recursos humanos</li>
                  <li>Controle de acesso e segurança</li>
                  <li>Comunicação com clientes e funcionários</li>
                  <li>Cumprimento de obrigações legais</li>
                  <li>Melhoria de nossos serviços</li>
                </ul>
              </section>

              {/* Compartilhamento */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                  Compartilhamento de Dados
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Seus dados pessoais não são compartilhados com terceiros, exceto nas seguintes situações:
                </p>
                <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-2 ml-4">
                  <li>Com seu consentimento expresso</li>
                  <li>Para cumprimento de obrigações legais</li>
                  <li>Com autoridades competentes quando necessário</li>
                  <li>Com prestadores de serviços que atuam em nosso nome</li>
                </ul>
              </section>

              {/* Segurança */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                  Segurança dos Dados
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Implementamos medidas técnicas e organizacionais para proteger seus dados:
                </p>
                <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-2 ml-4">
                  <li>Criptografia de dados sensíveis</li>
                  <li>Controle de acesso restrito</li>
                  <li>Monitoramento de segurança 24/7</li>
                  <li>Backup regular dos dados</li>
                  <li>Treinamento de funcionários em proteção de dados</li>
                </ul>
              </section>

              {/* Direitos */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                  Seus Direitos
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Você tem os seguintes direitos sobre seus dados pessoais:
                </p>
                <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-2 ml-4">
                  <li>Acesso aos seus dados</li>
                  <li>Correção de dados incorretos</li>
                  <li>Exclusão de dados desnecessários</li>
                  <li>Portabilidade dos dados</li>
                  <li>Revogação do consentimento</li>
                  <li>Informações sobre o tratamento</li>
                </ul>
              </section>

              {/* Contato */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Contato
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
                </p>
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                  <p className="text-sm sm:text-base text-gray-700 mb-2">
                    <strong>E-mail:</strong> privacidade@securedguard.com.br
                  </p>
                  <p className="text-sm sm:text-base text-gray-700 mb-2">
                    <strong>Telefone:</strong> (31) 99999-9999
                  </p>
                  <p className="text-sm sm:text-base text-gray-700">
                    <strong>Endereço:</strong> Rua das Flores, 123 - Centro, Belo Horizonte - MG
                  </p>
                </div>
              </section>

              {/* Alterações */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Alterações na Política
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Esta política pode ser atualizada periodicamente. Alterações significativas serão 
                  comunicadas através de nossos canais oficiais. Recomendamos que você revise 
                  esta política regularmente.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PrivacyPolicy;
