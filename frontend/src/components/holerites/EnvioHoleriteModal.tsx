import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageSquare, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Funcionario, EnvioRequest, EnvioResponse } from '@/types/funcionario';
import { envioService } from '@/services/funcionarioService';
import holeriteService, { Holerite } from '@/services/holeriteService';

interface EnvioHoleriteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarios: Funcionario[];
  tipoEnvio: 'individual' | 'massa' | 'todos';
  funcionarioSelecionado?: Funcionario;
  tipoInicial?: 'email' | 'whatsapp';
}

export const EnvioHoleriteModal: React.FC<EnvioHoleriteModalProps> = ({
  open,
  onOpenChange,
  funcionarios,
  tipoEnvio,
  funcionarioSelecionado,
  tipoInicial
}) => {
  const [tipo, setTipo] = useState<'email' | 'whatsapp'>(tipoInicial || 'email');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<number[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<EnvioResponse | null>(null);
  const [holeritesProcessados, setHoleritesProcessados] = useState<Holerite[]>([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>('');
  const [carregandoPeriodos, setCarregandoPeriodos] = useState(false);
  const { toast } = useToast();

  const normalizeCpf = (value?: string) => (value ?? '').replace(/[^0-9]/g, '');

  const periodosDisponiveis = React.useMemo(() => {
    const base = tipoEnvio === 'individual' && funcionarioSelecionado
      ? holeritesProcessados.filter((h) => normalizeCpf(h.cpf) === normalizeCpf(funcionarioSelecionado.cpf))
      : holeritesProcessados;

    const unique = new Map<string, { month: number; year: number; label: string }>();
    base.forEach((h) => {
      if (!h.month || !h.year) return;
      const value = `${h.year}-${String(h.month).padStart(2, '0')}`;
      if (!unique.has(value)) {
        unique.set(value, {
          month: h.month,
          year: h.year,
          label: `${String(h.month).padStart(2, '0')}/${h.year}`
        });
      }
    });

    return Array.from(unique.entries())
      .map(([value, data]) => ({ value, ...data }))
      .sort((a, b) => (b.year - a.year) || (b.month - a.month));
  }, [holeritesProcessados, tipoEnvio, funcionarioSelecionado]);

  React.useEffect(() => {
    if (!open) return;
    if (periodosDisponiveis.length === 0) {
      setPeriodoSelecionado('');
      return;
    }
    if (!periodosDisponiveis.some((p) => p.value === periodoSelecionado)) {
      setPeriodoSelecionado(periodosDisponiveis[0].value);
    }
  }, [open, periodosDisponiveis, periodoSelecionado]);

  React.useEffect(() => {
    if (tipoEnvio === 'massa') {
      setFuncionariosSelecionados([]);
    }
  }, [tipoEnvio, tipo, periodoSelecionado]);

  // Mensagens padrão
  const mensagensPadrao = {
    email: {
      assunto: 'Holerite - SecuredGuard',
      mensagem: `Prezado(a) funcionário(a),

Segue em anexo o seu holerite.

Em caso de dúvidas, entre em contato com o departamento de RH.

Atenciosamente,
Equipe SecuredGuard`
    },
    whatsapp: {
      mensagem: `Olá! Seu holerite está disponível para download.

Acesse o sistema SecuredGuard para visualizar.

Em caso de dúvidas, entre em contato com o RH.

Obrigado!`
    }
  };

  // Inicializar com mensagens padrão
  React.useEffect(() => {
    if (tipo === 'email') {
      setAssunto(mensagensPadrao.email.assunto);
      setMensagem(mensagensPadrao.email.mensagem);
    } else {
      setMensagem(mensagensPadrao.whatsapp.mensagem);
    }
  }, [tipo]);

  // Selecionar funcionário individual
  React.useEffect(() => {
    if (tipoEnvio === 'individual' && funcionarioSelecionado) {
      setFuncionariosSelecionados([funcionarioSelecionado.id]);
    }
  }, [tipoEnvio, funcionarioSelecionado]);

  // Atualizar tipo quando o modal abrir com tipoInicial
  React.useEffect(() => {
    if (open && tipoInicial) {
      setTipo(tipoInicial);
    }
  }, [open, tipoInicial]);

  React.useEffect(() => {
    if (!open) {
      setHoleritesProcessados([]);
      setPeriodoSelecionado('');
      return;
    }
    let active = true;
    setCarregandoPeriodos(true);
    holeriteService.getProcessedHolerites()
      .then((data) => {
        if (!active) return;
        setHoleritesProcessados(data);
      })
      .catch((error) => {
        console.error('Erro ao carregar períodos processados:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os períodos processados.",
          variant: "destructive"
        });
      })
      .finally(() => {
        if (active) setCarregandoPeriodos(false);
      });
    return () => { active = false; };
  }, [open, toast]);

  const handleEnviar = async () => {
    const selectedPeriodo = periodosDisponiveis.find((p) => p.value === periodoSelecionado);
    if (!selectedPeriodo) {
      toast({
        title: "Erro",
        description: "Selecione o período do holerite para envio.",
        variant: "destructive"
      });
      return;
    }

    if (tipoEnvio === 'individual' && !funcionarioSelecionado) {
      toast({
        title: "Erro",
        description: "Nenhum funcionário selecionado.",
        variant: "destructive"
      });
      return;
    }

    if (tipoEnvio === 'massa' && funcionariosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um funcionário.",
        variant: "destructive"
      });
      return;
    }

    if (tipoEnvio === 'todos' && funcionariosDisponiveis.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum funcionário com holerite processado no período selecionado.",
        variant: "destructive"
      });
      return;
    }

    if (tipoEnvio === 'individual' && funcionarioSelecionado) {
      const cpfFuncionario = normalizeCpf(funcionarioSelecionado.cpf);
      const hasPeriodo = holeritesProcessados.some((h) =>
        normalizeCpf(h.cpf) === cpfFuncionario &&
        h.month === selectedPeriodo.month &&
        h.year === selectedPeriodo.year
      );
      if (!hasPeriodo) {
        toast({
          title: "Erro",
          description: "Este funcionário não possui holerite processado para o período selecionado.",
          variant: "destructive"
        });
        return;
      }
    }

    setEnviando(true);
    setResultado(null);

    try {
      const request: EnvioRequest = {
        tipo,
        assunto: tipo === 'email' ? assunto : undefined,
        mensagem,
        month: selectedPeriodo.month,
        year: selectedPeriodo.year
      };

      let response: EnvioResponse;

      if (tipoEnvio === 'individual' && funcionarioSelecionado) {
        request.funcionarioId = funcionarioSelecionado.id;
        request.cpf = normalizeCpf(funcionarioSelecionado.cpf);
        response = await envioService.enviarIndividual(request);
      } else if (tipoEnvio === 'massa') {
        request.funcionarioIds = funcionariosSelecionados;
        response = await envioService.enviarEmMassa(request);
      } else {
        response = await envioService.enviarTodos(request);
      }

      setResultado(response);

      if (response.sucesso) {
        toast({
          title: "Envio Realizado",
          description: response.mensagem,
        });
      } else {
        toast({
          title: "Erro no Envio",
          description: response.mensagem,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro ao enviar:', error);
      const apiMessage = error.response?.data?.mensagem || error.response?.data?.message;
      toast({
        title: "Erro",
        description: apiMessage || "Erro ao enviar holerites.",
        variant: "destructive"
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    if (!enviando) {
      setResultado(null);
      setFuncionariosSelecionados([]);
      onOpenChange(false);
    }
  };

  const getTitulo = () => {
    switch (tipoEnvio) {
      case 'individual':
        return `Enviar Holerite - ${funcionarioSelecionado?.nome}`;
      case 'massa':
        return 'Envio em Massa';
      case 'todos':
        return 'Enviar para Todos';
      default:
        return 'Enviar Holerite';
    }
  };

  const getFuncionariosDisponiveis = () => {
    let lista = tipo === 'email'
      ? funcionarios.filter(f => f.email)
      : funcionarios.filter(f => f.possuiWhatsapp && f.telefone);

    const selectedPeriodo = periodosDisponiveis.find((p) => p.value === periodoSelecionado);
    if (selectedPeriodo) {
      const cpfsPeriodo = new Set(
        holeritesProcessados
          .filter((h) => h.month === selectedPeriodo.month && h.year === selectedPeriodo.year)
          .map((h) => normalizeCpf(h.cpf))
      );
      lista = lista.filter((f) => cpfsPeriodo.has(normalizeCpf(f.cpf)));
    }

    return lista;
  };

  const funcionariosDisponiveis = getFuncionariosDisponiveis();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600 mx-4 sm:mx-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2 text-lg sm:text-xl">
            <Send className="text-seguranca-yellow flex-shrink-0" size={20} />
            <span className="break-words">{getTitulo()}</span>
          </DialogTitle>
        </DialogHeader>

        {!resultado ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Período do Holerite */}
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray text-sm sm:text-base">
                Período do holerite
              </Label>
              {carregandoPeriodos ? (
                <p className="text-xs text-gray-400">Carregando períodos processados...</p>
              ) : periodosDisponiveis.length === 0 ? (
                <p className="text-xs text-red-400">
                  Nenhum período processado disponível para envio.
                </p>
              ) : (
                <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodosDisponiveis.map((periodo) => (
                      <SelectItem key={periodo.value} value={periodo.value}>
                        {periodo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {tipoEnvio === 'individual' && funcionarioSelecionado && periodosDisponiveis.length > 0 && (
                <p className="text-xs text-gray-400">
                  Períodos disponíveis para {funcionarioSelecionado.nome}.
                </p>
              )}
            </div>

            {/* Tipo de Envio */}
            <div className="space-y-3">
              <Label className="text-seguranca-lightgray text-sm sm:text-base">Tipo de Envio</Label>
              <RadioGroup value={tipo} onValueChange={(value: 'email' | 'whatsapp') => setTipo(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="text-seguranca-lightgray flex items-center gap-2 text-sm sm:text-base">
                    <Mail size={16} className="flex-shrink-0" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="text-seguranca-lightgray flex items-center gap-2 text-sm sm:text-base">
                    <MessageSquare size={16} className="flex-shrink-0" />
                    WhatsApp
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Seleção de Funcionários (apenas para massa) */}
            {tipoEnvio === 'massa' && (
              <div className="space-y-3">
                <Label className="text-seguranca-lightgray text-sm sm:text-base">
                  Funcionários Disponíveis ({funcionariosDisponiveis.length})
                </Label>
                <div className="max-h-32 sm:max-h-40 overflow-y-auto space-y-2 border border-gray-600 rounded-lg p-2 sm:p-3">
                  {funcionariosDisponiveis.map((funcionario) => (
                    <div key={funcionario.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`func-${funcionario.id}`}
                        checked={funcionariosSelecionados.includes(funcionario.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFuncionariosSelecionados([...funcionariosSelecionados, funcionario.id]);
                          } else {
                            setFuncionariosSelecionados(funcionariosSelecionados.filter(id => id !== funcionario.id));
                          }
                        }}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <Label htmlFor={`func-${funcionario.id}`} className="text-seguranca-lightgray text-xs sm:text-sm leading-relaxed">
                        <span className="font-medium">{funcionario.nome}</span>
                        <br className="sm:hidden" />
                        <span className="text-gray-400"> - {funcionario.cpf}</span>
                        {tipo === 'email' && funcionario.email && (
                          <>
                            <br className="sm:hidden" />
                            <span className="text-gray-400 block sm:inline"> ({funcionario.email})</span>
                          </>
                        )}
                        {tipo === 'whatsapp' && funcionario.telefone && (
                          <>
                            <br className="sm:hidden" />
                            <span className="text-gray-400 block sm:inline"> ({funcionario.telefone})</span>
                          </>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assunto (apenas para email) */}
            {tipo === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="assunto" className="text-seguranca-lightgray text-sm sm:text-base">Assunto</Label>
                <Input
                  id="assunto"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Assunto do email"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm sm:text-base"
                />
              </div>
            )}

            {/* Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="mensagem" className="text-seguranca-lightgray text-sm sm:text-base">Mensagem</Label>
              <Textarea
                id="mensagem"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={4}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm sm:text-base resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={enviando}
                className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700 order-2 sm:order-1 flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEnviar}
                disabled={enviando}
                className="bg-seguranca-red hover:bg-seguranca-darkred order-1 sm:order-2 flex-1 sm:flex-none"
              >
                {enviando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                    <span className="hidden sm:inline">Enviando...</span>
                    <span className="sm:hidden">Enviando</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Enviar</span>
                    <span className="sm:hidden">Enviar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Resultado do Envio */
          <div className="space-y-4">
            <div className={`flex items-start gap-2 p-3 sm:p-4 rounded-lg ${
              resultado.sucesso 
                ? 'bg-green-900/20 border border-green-600' 
                : 'bg-red-900/20 border border-red-600'
            }`}>
              {resultado.sucesso ? (
                <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
              ) : (
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              )}
              <div className="min-w-0 flex-1">
                <h3 className={`font-medium text-sm sm:text-base ${
                  resultado.sucesso ? 'text-green-400' : 'text-red-400'
                }`}>
                  {resultado.sucesso ? 'Envio Concluído' : 'Erro no Envio'}
                </h3>
                <p className="text-seguranca-lightgray text-xs sm:text-sm break-words">{resultado.mensagem}</p>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-seguranca-black p-2 sm:p-3 rounded-lg">
                <p className="text-green-400 font-medium text-lg sm:text-xl">{resultado.totalEnviados}</p>
                <p className="text-gray-400 text-xs sm:text-sm">Enviados com Sucesso</p>
              </div>
              <div className="bg-seguranca-black p-2 sm:p-3 rounded-lg">
                <p className="text-red-400 font-medium text-lg sm:text-xl">{resultado.totalFalhas}</p>
                <p className="text-gray-400 text-xs sm:text-sm">Falhas</p>
              </div>
            </div>

            {/* Detalhes + ações de reenvio */}
            {resultado.detalhes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray text-sm sm:text-base">Detalhes do Envio</Label>
                <div className="max-h-32 sm:max-h-40 overflow-y-auto space-y-2">
                  {resultado.detalhes.map((detalhe, index) => (
                    <div key={index} className={`flex items-start gap-2 p-2 rounded ${
                      detalhe.enviado ? 'bg-green-900/20' : 'bg-red-900/20'
                    }`}>
                      {detalhe.enviado ? (
                        <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                      ) : (
                        <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-seguranca-lightgray text-xs sm:text-sm font-medium break-words">
                          {detalhe.nome} - {detalhe.cpf}
                        </p>
                        {!detalhe.enviado && detalhe.erro && (
                          <p className="text-red-400 text-xs break-words">{detalhe.erro} {' '} 
                            <button
                              className="underline text-seguranca-yellow ml-1"
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('open-logs-tab', { detail: { cpf: detalhe.cpf } }));
                              }}
                            >
                              Ver logs deste CPF
                            </button>
                          </p>
                        )}
                      </div>
                      {!detalhe.enviado && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                          onClick={async () => {
                            try {
                              const logs = await holeriteService.listSendLogs(detalhe.cpf);
                              const lastLog = logs?.[logs.length - 1];
                              if (lastLog?.id) {
                                await holeriteService.resendByLog(lastLog.id);
                                toast({ title: 'Reenvio solicitado', description: 'Tentando reenviar para ' + detalhe.nome });
                              }
                            } catch (e) {
                              toast({ title: 'Erro', description: 'Falha ao solicitar reenvio', variant: 'destructive' });
                            }
                          }}
                        >
                          Reenviar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={handleClose} className="bg-seguranca-red hover:bg-seguranca-darkred w-full sm:w-auto">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 