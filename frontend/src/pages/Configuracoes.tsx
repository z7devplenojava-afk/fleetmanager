import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell,
  Cloud, 
  CreditCard, 
  Lock, 
  Mail, 
  MessageSquare, 
  Save, 
  Shield, 
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Configuracoes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState({
    contractUpdates: true,
    paymentReceived: true,
    scheduleChanges: true,
    dailySummary: false
  });

  const [empresaForm, setEmpresaForm] = useState({
    nome: 'Segurança Total LTDA',
    cnpj: '12.345.678/0001-90',
    inscricao_estadual: '123.456.789.000',
    endereco: 'Av. Paulista, 1000, São Paulo - SP',
    telefone: '(11) 3123-4567',
    email: 'contato@segurancatotal.com.br',
    website: 'www.segurancatotal.com.br'
  });

  const handleEmpresaChange = (field: string, value: string) => {
    setEmpresaForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEmpresa = () => {
    toast({
      title: "Dados da empresa salvos",
      description: "As informações da empresa foram atualizadas com sucesso.",
    });
  };

  const handleSaveSeguranca = () => {
    toast({
      title: "Configurações de segurança salvas",
      description: "As configurações de segurança foram atualizadas com sucesso.",
    });
  };

  const handleSaveNotificacoes = () => {
    toast({
      title: "Preferências de notificação salvas",
      description: "Suas preferências de notificação foram atualizadas com sucesso.",
    });
  };

  const handleSaveIntegracoes = () => {
    toast({
      title: "Integrações salvas",
      description: "As configurações de integração foram atualizadas com sucesso.",
    });
  };

  const handleSaveOperacional = () => {
    toast({
      title: "Configurações operacionais salvas",
      description: "As configurações operacionais foram atualizadas com sucesso.",
    });
  };

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Alertas no topo da página */}
        <div className="space-y-3">
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Atenção:</strong> Sistema de notificações por email habilitado. Verifique suas configurações de SMTP.
            </AlertDescription>
          </Alert>
          
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <Bell className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Novidade:</strong> Sistema de alertas operacionais está ativo. Configure suas preferências na aba Operacional.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Configurações</h1>
            <p className="text-gray-400 mt-1">Gerencie as configurações do sistema</p>
          </div>
        </div>

        <Tabs defaultValue="empresa" className="w-full">
          <TabsList className="grid grid-cols-6 w-full bg-seguranca-graphite border-gray-600">
            <TabsTrigger value="empresa" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">Empresa</TabsTrigger>
            <TabsTrigger value="usuarios" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">Usuários</TabsTrigger>
            <TabsTrigger value="seguranca" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">Segurança</TabsTrigger>
            <TabsTrigger value="notificacoes" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">Notificações</TabsTrigger>
            <TabsTrigger value="integracao" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">Integrações</TabsTrigger>
            <TabsTrigger value="operacional" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow">Operacional</TabsTrigger>
          </TabsList>
          
          {/* Aba Dados da Empresa */}
          <TabsContent value="empresa" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Dados da Empresa</CardTitle>
                <CardDescription className="text-gray-400">
                  Informações gerais sobre a empresa e contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-seguranca-lightgray">Nome da Empresa</Label>
                    <Input 
                      id="nome" 
                      value={empresaForm.nome} 
                      onChange={(e) => handleEmpresaChange('nome', e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj" className="text-seguranca-lightgray">CNPJ</Label>
                    <Input 
                      id="cnpj" 
                      value={empresaForm.cnpj} 
                      onChange={(e) => handleEmpresaChange('cnpj', e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inscricao_estadual" className="text-seguranca-lightgray">Inscrição Estadual</Label>
                  <Input 
                    id="inscricao_estadual" 
                    value={empresaForm.inscricao_estadual} 
                    onChange={(e) => handleEmpresaChange('inscricao_estadual', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco" className="text-seguranca-lightgray">Endereço</Label>
                  <Input 
                    id="endereco" 
                    value={empresaForm.endereco} 
                    onChange={(e) => handleEmpresaChange('endereco', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-seguranca-lightgray">Telefone</Label>
                    <Input 
                      id="telefone" 
                      value={empresaForm.telefone} 
                      onChange={(e) => handleEmpresaChange('telefone', e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-seguranca-lightgray">Email</Label>
                    <Input 
                      id="email" 
                      value={empresaForm.email} 
                      onChange={(e) => handleEmpresaChange('email', e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-seguranca-lightgray">Website</Label>
                  <Input 
                    id="website" 
                    value={empresaForm.website} 
                    onChange={(e) => handleEmpresaChange('website', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveEmpresa}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Dados da Empresa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Usuários */}
          <TabsContent value="usuarios" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Gerenciamento de Usuários</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie os usuários que têm acesso ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex-1">
                    <Input 
                      placeholder="Pesquisar usuários..." 
                      className="max-w-sm bg-seguranca-black border-gray-600 text-seguranca-lightgray" 
                    />
                  </div>
                  <Button className="bg-seguranca-red hover:bg-seguranca-darkred">
                    <Users className="h-4 w-4 mr-2" /> Adicionar Usuário
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-seguranca-lightgray">Nome</TableHead>
                      <TableHead className="text-seguranca-lightgray">Email</TableHead>
                      <TableHead className="text-seguranca-lightgray">Função</TableHead>
                      <TableHead className="text-seguranca-lightgray">Status</TableHead>
                      <TableHead className="text-seguranca-lightgray">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-seguranca-red/20 flex items-center justify-center text-seguranca-darkred">
                            A
                          </div>
                          <span className="text-seguranca-lightgray">Admin</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">{user?.email}</TableCell>
                      <TableCell className="text-seguranca-lightgray">Administrador</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Ativo
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="mr-2 border-gray-600 text-seguranca-lightgray">
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50">
                          Desativar
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Segurança */}
          <TabsContent value="seguranca" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Configurações de Segurança</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie as configurações de segurança do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-seguranca-lightgray">
                    <Lock className="h-5 w-5" /> Autenticação
                  </h3>
                  
                  <div className="flex items-start space-x-3 pl-2">
                    <Checkbox id="two_factor" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="two_factor" className="text-seguranca-lightgray">
                        Habilitar autenticação de dois fatores (2FA)
                      </Label>
                      <p className="text-sm text-gray-400">
                        Requer uma verificação adicional ao fazer login
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-seguranca-lightgray">
                    <Shield className="h-5 w-5" /> Políticas de Senha
                  </h3>
                  
                  <div className="grid gap-3 pl-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox id="password_expiry" defaultChecked />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="password_expiry" className="text-seguranca-lightgray">
                          Expirar senhas a cada 90 dias
                        </Label>
                        <p className="text-sm text-gray-400">
                          Os usuários serão solicitados a redefinir suas senhas
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox id="password_requirements" defaultChecked />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="password_requirements" className="text-seguranca-lightgray">
                          Requisitos de senha forte
                        </Label>
                        <p className="text-sm text-gray-400">
                          Mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas e números
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox id="failed_attempts" defaultChecked />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="failed_attempts" className="text-seguranca-lightgray">
                          Bloquear conta após 5 tentativas falhas
                        </Label>
                        <p className="text-sm text-gray-400">
                          A conta será bloqueada temporariamente após múltiplas tentativas falhas
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveSeguranca}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                    <Save className="h-4 w-4 mr-2" /> Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Notificações */}
          <TabsContent value="notificacoes" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Configurações de Notificações</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie como e quando você recebe notificações por email e alertas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sistema de Email */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-seguranca-lightgray">
                    <Mail className="h-5 w-5" /> Sistema de Email
                  </h3>
                  
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <strong>Status:</strong> Servidor SMTP configurado e funcionando corretamente.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid gap-4 pl-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="contract_updates" 
                        checked={emailNotifications.contractUpdates}
                        onCheckedChange={(checked) => 
                          setEmailNotifications(prev => ({ ...prev, contractUpdates: checked as boolean }))
                        }
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="contract_updates" className="text-seguranca-lightgray">
                          Atualizações de contratos
                        </Label>
                        <p className="text-sm text-gray-400">
                          Receba notificações quando contratos forem criados, atualizados ou expirarem
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="payment_received" 
                        checked={emailNotifications.paymentReceived}
                        onCheckedChange={(checked) => 
                          setEmailNotifications(prev => ({ ...prev, paymentReceived: checked as boolean }))
                        }
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="payment_received" className="text-seguranca-lightgray">
                          Pagamentos recebidos
                        </Label>
                        <p className="text-sm text-gray-400">
                          Notificações sobre pagamentos confirmados e recebidos
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="schedule_changes" 
                        checked={emailNotifications.scheduleChanges}
                        onCheckedChange={(checked) => 
                          setEmailNotifications(prev => ({ ...prev, scheduleChanges: checked as boolean }))
                        }
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="schedule_changes" className="text-seguranca-lightgray">
                          Mudanças de escala
                        </Label>
                        <p className="text-sm text-gray-400">
                          Alertas sobre alterações em escalas e horários
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="daily_summary" 
                        checked={emailNotifications.dailySummary}
                        onCheckedChange={(checked) => 
                          setEmailNotifications(prev => ({ ...prev, dailySummary: checked as boolean }))
                        }
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="daily_summary" className="text-seguranca-lightgray">
                          Resumo diário
                        </Label>
                        <p className="text-sm text-gray-400">
                          Receba um resumo diário das atividades do sistema
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveNotificacoes}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                    <Save className="h-4 w-4 mr-2" /> Salvar Preferências
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Integrações */}
          <TabsContent value="integracao" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Integrações</CardTitle>
                <CardDescription className="text-gray-400">
                  Conecte o sistema com outros serviços
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-md bg-blue-100 flex items-center justify-center">
                      <Cloud className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium text-seguranca-lightgray">API de Integração</h3>
                      <p className="text-sm text-gray-400">
                        Conecte seus sistemas externos
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">Configurar</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-md bg-green-100 flex items-center justify-center">
                      <CreditCard className="text-green-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium text-seguranca-lightgray">Gateway de Pagamento</h3>
                      <p className="text-sm text-gray-400">
                        Integre com seu provedor de pagamentos
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">Conectar</Button>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveIntegracoes}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                    <Save className="h-4 w-4 mr-2" /> Salvar Integrações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Operacional */}
          <TabsContent value="operacional" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Configurações Operacionais</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie alertas e configurações operacionais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Alertas Operacionais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-seguranca-lightgray">
                    <Bell className="h-5 w-5" /> Alertas Operacionais
                  </h3>
                  
                  <div className="grid gap-3 pl-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox id="late_arrival" defaultChecked />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="late_arrival" className="text-seguranca-lightgray">
                          Atraso de funcionários
                        </Label>
                        <p className="text-sm text-gray-400">
                          Alertar quando funcionários chegarem atrasados aos postos
                        </p>
                      </div>
                    </div>
                    
                                        <div className="flex items-start space-x-3">
                      <Checkbox id="contract_expiry" defaultChecked />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="contract_expiry" className="text-seguranca-lightgray">
                          Vencimento de contratos
                        </Label>
                        <p className="text-sm text-gray-400">
                          Alertar sobre contratos próximos ao vencimento (30 dias)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox id="vehicle_maintenance" defaultChecked />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="vehicle_maintenance" className="text-seguranca-lightgray">
                          Manutenção de veículos
                        </Label>
                        <p className="text-sm text-gray-400">
                          Notificar sobre manutenções preventivas agendadas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox id="equipment_check" />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="equipment_check" className="text-seguranca-lightgray">
                          Verificação de equipamentos
                        </Label>
                        <p className="text-sm text-gray-400">
                          Alertar sobre equipamentos que precisam de verificação
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configurações de Horário */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-seguranca-lightgray">
                    <MessageSquare className="h-5 w-5" /> Configurações de Horário
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 pl-2">
                    <div className="space-y-2">
                      <Label className="text-seguranca-lightgray">Horário de início do expediente</Label>
                      <Input 
                        type="time" 
                        defaultValue="08:00"
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-seguranca-lightgray">Horário de fim do expediente</Label>
                      <Input 
                        type="time" 
                        defaultValue="18:00"
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveOperacional}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                    <Save className="h-4 w-4 mr-2" /> Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default Configuracoes;
