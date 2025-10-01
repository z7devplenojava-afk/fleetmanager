import React from 'react';
import Navbar from '@/components/Navbar';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PoliticasPrivacidade: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <>
      <SEO 
        title="Política de Privacidade - Promover Vigilância"
        description="Conheça nossa política de privacidade e como protegemos seus dados pessoais. Transparência e segurança em primeiro lugar."
        keywords="política de privacidade, LGPD, proteção de dados, segurança de informações, transparência"
        type="website"
        url="https://promover.com.br/politicas-privacidade"
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
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Política de Privacidade</h1>
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
                    <Eye className="h-5 w-5 mr-2 text-red-600" />
                    Introdução
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>
                    A Promover Vigilância Patrimonial Ltda. ("nós", "nossa" ou "empresa") 
                    está comprometida com a proteção da privacidade e dos dados pessoais de 
                    nossos clientes, funcionários e visitantes do site.
                  </p>
                  <p>
                    Esta Política de Privacidade descreve como coletamos, usamos, armazenamos 
                    e protegemos suas informações pessoais, em conformidade com a Lei Geral de 
                    Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações aplicáveis.
                  </p>
                </CardContent>
              </Card>

              {/* Dados Coletados */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Database className="h-5 w-5 mr-2 text-red-600" />
                    Dados Pessoais Coletados
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>Coletamos os seguintes tipos de dados pessoais:</p>
                  
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Dados de Identificação:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Nome completo</li>
                      <li>CPF/CNPJ</li>
                      <li>Data de nascimento</li>
                      <li>RG</li>
                      <li>Endereço completo</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Dados de Contato:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Telefone fixo e celular</li>
                      <li>E-mail</li>
                      <li>Endereço residencial e comercial</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Dados Profissionais:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Empresa onde trabalha</li>
                      <li>Cargo/função</li>
                      <li>Área de atuação</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Finalidades */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-red-600" />
                    Finalidades do Tratamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>Utilizamos seus dados pessoais para as seguintes finalidades:</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-white font-semibold">Serviços de Segurança:</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Prestação de serviços de vigilância</li>
                        <li>Controle de acesso</li>
                        <li>Monitoramento 24h</li>
                        <li>Relatórios de segurança</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-white font-semibold">Comunicação:</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Atendimento ao cliente</li>
                        <li>Envio de orçamentos</li>
                        <li>Comunicações comerciais</li>
                        <li>Suporte técnico</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compartilhamento */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lock className="h-5 w-5 mr-2 text-red-600" />
                    Compartilhamento de Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>
                    Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, 
                    exceto nas seguintes situações:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Com seu consentimento expresso</li>
                    <li>Para cumprimento de obrigação legal ou regulatória</li>
                    <li>Para proteção de direitos da empresa</li>
                    <li>Com prestadores de serviços que atuam em nosso nome</li>
                    <li>Em caso de transferência de controle societário</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Segurança */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-red-600" />
                    Segurança dos Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>
                    Implementamos medidas técnicas e organizacionais adequadas para proteger 
                    seus dados pessoais contra:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Acesso não autorizado</li>
                      <li>Alteração indevida</li>
                      <li>Divulgação não autorizada</li>
                    </ul>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Destruição acidental</li>
                      <li>Perda de dados</li>
                      <li>Vazamento de informações</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Direitos */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-red-600" />
                    Seus Direitos
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>Você tem os seguintes direitos em relação aos seus dados pessoais:</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Confirmar a existência de tratamento</li>
                      <li>Acessar seus dados</li>
                      <li>Corrigir dados incompletos</li>
                      <li>Solicitar anonimização</li>
                    </ul>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Solicitar exclusão</li>
                      <li>Revogar consentimento</li>
                      <li>Portabilidade de dados</li>
                      <li>Informações sobre compartilhamento</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Contato */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Contato</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-4">
                  <p>
                    Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de 
                    Privacidade, entre em contato conosco:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Dados de Contato:</h4>
                      <p>E-mail: privacidade@promovervigilancia.com.br</p>
                      <p>Telefone: (31) 2559-1245</p>
                      <p>Endereço: Rua Cel. João Camargos, 267 - Centro - Contagem - MG</p>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold mb-2">Encarregado de Dados (DPO):</h4>
                      <p>Nome: [Nome do DPO]</p>
                      <p>E-mail: dpo@promovervigilancia.com.br</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alterações */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Alterações na Política</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300">
                  <p>
                    Esta Política de Privacidade pode ser atualizada periodicamente. 
                    Recomendamos que você revise esta página regularmente para se manter 
                    informado sobre como protegemos suas informações.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PoliticasPrivacidade;
