import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Mail, 
  MessageSquare, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Download,
  X
} from 'lucide-react';
import { payslipService, ProcessingResult, ProcessingStatus } from '@/services/payslipService';
import { Funcionario } from '@/types/funcionario';

interface UnifiedPayslipUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarios: Funcionario[];
  onSuccess?: () => void;
}

export const UnifiedPayslipUpload: React.FC<UnifiedPayslipUploadProps> = ({
  open,
  onOpenChange,
  funcionarios,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState<'email' | 'whatsapp'>('email');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<number[]>([]);
  const [modoEnvio, setModoEnvio] = useState<'individual' | 'massa' | 'todos'>('todos');
  const [funcionarioIndividual, setFuncionarioIndividual] = useState<Funcionario | null>(null);
  
  // Estados de processamento
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultado, setResultado] = useState<ProcessingResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [progress, setProgress] = useState(0);
  
  const { toast } = useToast();

  // Mensagens padrão
  const mensagensPadrao = {
    email: {
      assunto: 'Holerite - Mês de Referência',
      mensagem: 'Segue em anexo seu holerite do mês de referência. Em caso de dúvidas, entre em contato conosco.'
    },
    whatsapp: {
      mensagem: 'Olá! Segue seu holerite do mês de referência. Em caso de dúvidas, entre em contato conosco.'
    }
  };

  // Inicializar mensagens padrão
  useEffect(() => {
    if (tipo === 'email') {
      setAssunto(mensagensPadrao.email.assunto);
      setMensagem(mensagensPadrao.email.mensagem);
    } else {
      setMensagem(mensagensPadrao.whatsapp.mensagem);
    }
  }, [tipo]);

  // Monitorar status assíncrono
  useEffect(() => {
    if (sessionId && isProcessing) {
      const interval = setInterval(async () => {
        try {
          const status = await payslipService.getProcessingStatus(sessionId);
          setStatus(status);
          
          if (status.status === 'COMPLETED') {
            setIsProcessing(false);
            setProgress(100);
            toast({
              title: "Processamento Concluído",
              description: "Upload, processamento e envio finalizados com sucesso!",
            });
            onSuccess?.();
          } else if (status.status === 'FAILED') {
            setIsProcessing(false);
            setProgress(0);
            toast({
              title: "Erro no Processamento",
              description: "Ocorreu um erro durante o processamento.",
              variant: "destructive"
            });
          } else {
            // Atualizar progresso baseado no status
            if (status.status === 'PROCESSING') {
              setProgress(50);
            } else if (status.status === 'SENDING') {
              setProgress(75);
            }
          }
        } catch (error) {
          console.error('Erro ao verificar status:', error);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [sessionId, isProcessing, toast, onSuccess]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF válido.",
        variant: "destructive"
      });
    }
  };

  const handleProcessar = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive"
      });
      return;
    }

    if (!mensagem.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma mensagem.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setResultado(null);
    setProgress(0);

    try {
      const options: any = {
        mensagem: mensagem.trim()
      };

      if (tipo === 'email' && assunto.trim()) {
        options.assunto = assunto.trim();
      }

      // Configurar funcionários baseado no modo
      if (modoEnvio === 'individual' && funcionarioIndividual) {
        options.funcionarioId = funcionarioIndividual.id;
      } else if (modoEnvio === 'massa' && funcionariosSelecionados.length > 0) {
        options.funcionarioIds = funcionariosSelecionados;
      }

      // Usar processamento assíncrono para melhor UX
      const response = await payslipService.uploadProcessAndSendAsync(file, tipo, options);
      setSessionId(response.sessionId);
      setStatus({ sessionId: response.sessionId, status: 'PROCESSING', message: response.message });
      setProgress(25);

      toast({
        title: "Processamento Iniciado",
        description: "O arquivo está sendo processado e enviado em segundo plano.",
      });

    } catch (error: any) {
      console.error('Erro no processamento:', error);
      setIsProcessing(false);
      setProgress(0);
      
      let errorMessage = 'Erro desconhecido ao processar o arquivo';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setFile(null);
      setResultado(null);
      setSessionId(null);
      setStatus(null);
      setProgress(0);
      setFuncionariosSelecionados([]);
      setFuncionarioIndividual(null);
      onOpenChange(false);
    }
  };

  const getFuncionariosDisponiveis = () => {
    if (tipo === 'email') {
      return funcionarios.filter(f => f.email);
    } else {
      return funcionarios.filter(f => f.possuiWhatsapp && f.telefone);
    }
  };

  const funcionariosDisponiveis = getFuncionariosDisponiveis();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] bg-seguranca-graphite border-gray-600 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Upload className="text-seguranca-yellow" size={20} />
            Upload e Envio Unificado de Holerites
          </DialogTitle>
        </DialogHeader>

        {!isProcessing && !status ? (
          <div className="space-y-6">
            {/* Upload de Arquivo */}
            <div className="space-y-3">
              <Label className="text-seguranca-lightgray">Arquivo PDF</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
                {file && (
                  <Button variant="outline" size="sm" className="border-gray-600 text-seguranca-lightgray">
                    <FileText size={16} className="mr-1" />
                    {file.name.substring(0, 20) + (file.name.length > 20 ? '...' : '')}
                  </Button>
                )}
              </div>
            </div>

            {/* Tipo de Envio */}
            <div className="space-y-3">
              <Label className="text-seguranca-lightgray">Tipo de Envio</Label>
              <RadioGroup value={tipo} onValueChange={(value: 'email' | 'whatsapp') => setTipo(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="text-seguranca-lightgray flex items-center gap-2">
                    <Mail size={16} />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="text-seguranca-lightgray flex items-center gap-2">
                    <MessageSquare size={16} />
                    WhatsApp
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Modo de Envio */}
            <div className="space-y-3">
              <Label className="text-seguranca-lightgray">Modo de Envio</Label>
              <RadioGroup value={modoEnvio} onValueChange={(value: 'individual' | 'massa' | 'todos') => setModoEnvio(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="text-seguranca-lightgray">Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="massa" id="massa" />
                  <Label htmlFor="massa" className="text-seguranca-lightgray">Em Massa (Selecionar)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="todos" id="todos" />
                  <Label htmlFor="todos" className="text-seguranca-lightgray">Todos ({funcionariosDisponiveis.length})</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Seleção de Funcionário Individual */}
            {modoEnvio === 'individual' && (
              <div className="space-y-3">
                <Label className="text-seguranca-lightgray">Funcionário</Label>
                <select
                  value={funcionarioIndividual?.id || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    const func = funcionarios.find(f => f.id === id);
                    setFuncionarioIndividual(func || null);
                  }}
                  className="w-full bg-seguranca-black border border-gray-600 text-seguranca-lightgray rounded-md px-3 py-2"
                >
                  <option value="">Selecione um funcionário</option>
                  {funcionariosDisponiveis.map((funcionario) => (
                    <option key={funcionario.id} value={funcionario.id}>
                      {funcionario.nome} - {funcionario.cpf}
                      {tipo === 'email' && funcionario.email && ` (${funcionario.email})`}
                      {tipo === 'whatsapp' && funcionario.telefone && ` (${funcionario.telefone})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Seleção de Funcionários em Massa */}
            {modoEnvio === 'massa' && (
              <div className="space-y-3">
                <Label className="text-seguranca-lightgray">
                  Funcionários Disponíveis ({funcionariosDisponiveis.length})
                </Label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-600 rounded-lg p-3">
                  {funcionariosDisponiveis.map((funcionario) => (
                    <div key={funcionario.id} className="flex items-center space-x-2">
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
                      />
                      <Label htmlFor={`func-${funcionario.id}`} className="text-seguranca-lightgray text-sm">
                        {funcionario.nome} - {funcionario.cpf}
                        {tipo === 'email' && funcionario.email && ` (${funcionario.email})`}
                        {tipo === 'whatsapp' && funcionario.telefone && ` (${funcionario.telefone})`}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assunto (apenas para email) */}
            {tipo === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="assunto" className="text-seguranca-lightgray">Assunto</Label>
                <Input
                  id="assunto"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Assunto do email"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            )}

            {/* Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="mensagem" className="text-seguranca-lightgray">Mensagem</Label>
              <Textarea
                id="mensagem"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={4}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleProcessar}
                disabled={!file || !mensagem.trim() || 
                  (modoEnvio === 'individual' && !funcionarioIndividual) ||
                  (modoEnvio === 'massa' && funcionariosSelecionados.length === 0)}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                <Send className="mr-2 h-4 w-4" />
                Processar e Enviar
              </Button>
            </div>
          </div>
        ) : (
          /* Status do Processamento */
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {status?.status === 'COMPLETED' ? (
                  <CheckCircle className="text-green-400" size={20} />
                ) : status?.status === 'FAILED' ? (
                  <AlertCircle className="text-red-400" size={20} />
                ) : (
                  <Clock className="text-yellow-400" size={20} />
                )}
                <div>
                  <h3 className={`font-medium ${
                    status?.status === 'COMPLETED' ? 'text-green-400' : 
                    status?.status === 'FAILED' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {status?.status === 'COMPLETED' ? 'Processamento Concluído' :
                     status?.status === 'FAILED' ? 'Processamento Falhou' :
                     'Processamento em Andamento'}
                  </h3>
                  <p className="text-seguranca-lightgray text-sm">{status?.message}</p>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-seguranca-lightgray">
                  <span>Progresso</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Estágios do Processamento */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className={`p-3 rounded-lg ${
                  progress >= 25 ? 'bg-green-900/20 border border-green-600' : 'bg-gray-800'
                }`}>
                  <Upload size={16} className={`mx-auto mb-1 ${
                    progress >= 25 ? 'text-green-400' : 'text-gray-500'
                  }`} />
                  <p className={`text-xs ${
                    progress >= 25 ? 'text-green-400' : 'text-gray-500'
                  }`}>Upload</p>
                </div>
                <div className={`p-3 rounded-lg ${
                  progress >= 50 ? 'bg-green-900/20 border border-green-600' : 'bg-gray-800'
                }`}>
                  <FileText size={16} className={`mx-auto mb-1 ${
                    progress >= 50 ? 'text-green-400' : 'text-gray-500'
                  }`} />
                  <p className={`text-xs ${
                    progress >= 50 ? 'text-green-400' : 'text-gray-500'
                  }`}>Processamento</p>
                </div>
                <div className={`p-3 rounded-lg ${
                  progress >= 75 ? 'bg-green-900/20 border border-green-600' : 'bg-gray-800'
                }`}>
                  <Send size={16} className={`mx-auto mb-1 ${
                    progress >= 75 ? 'text-green-400' : 'text-gray-500'
                  }`} />
                  <p className={`text-xs ${
                    progress >= 75 ? 'text-green-400' : 'text-gray-500'
                  }`}>Envio</p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              {status?.status === 'COMPLETED' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={() => {
                      setFile(null);
                      setResultado(null);
                      setSessionId(null);
                      setStatus(null);
                      setProgress(0);
                      setFuncionariosSelecionados([]);
                      setFuncionarioIndividual(null);
                    }}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Novo Upload
                  </Button>
                </>
              ) : status?.status === 'FAILED' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={() => {
                      setSessionId(null);
                      setStatus(null);
                      setProgress(0);
                      setIsProcessing(false);
                    }}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                    Tentar Novamente
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled
                  className="border-gray-600 text-seguranca-lightgray"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 