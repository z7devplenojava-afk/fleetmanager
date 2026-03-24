import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Save,
  Plus,
  Trash2,
  Edit,
  X,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RondaTipo, RondaPrioridade } from '@/types/rondas';

interface TipoConfig {
  id: string;
  tipo: RondaTipo;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
}

interface PrioridadeConfig {
  id: string;
  prioridade: RondaPrioridade;
  nome: string;
  descricao?: string;
  cor: string;
  tempoMaximo: number; // em minutos
  ativo: boolean;
}

export const RondasConfiguracoes: React.FC = () => {
  const [tipos, setTipos] = useState<TipoConfig[]>([
    { id: '1', tipo: 'PREVENTIVA', nome: 'Preventiva', descricao: 'Ronda preventiva de rotina', cor: 'blue', ativo: true },
    { id: '2', tipo: 'PATRULHAMENTO', nome: 'Patrulhamento', descricao: 'Patrulhamento de área', cor: 'green', ativo: true },
    { id: '3', tipo: 'VIGILANCIA', nome: 'Vigilância', descricao: 'Vigilância especial', cor: 'purple', ativo: true },
    { id: '4', tipo: 'EMERGENCIA', nome: 'Emergência', descricao: 'Ronda de emergência', cor: 'red', ativo: true },
    { id: '5', tipo: 'ESPECIAL', nome: 'Especial', descricao: 'Ronda especial', cor: 'orange', ativo: true },
  ]);

  const [prioridades, setPrioridades] = useState<PrioridadeConfig[]>([
    { id: '1', prioridade: 'BAIXA', nome: 'Baixa', descricao: 'Prioridade baixa', cor: 'gray', tempoMaximo: 120, ativo: true },
    { id: '2', prioridade: 'MEDIA', nome: 'Média', descricao: 'Prioridade média', cor: 'blue', tempoMaximo: 90, ativo: true },
    { id: '3', prioridade: 'ALTA', nome: 'Alta', descricao: 'Prioridade alta', cor: 'orange', tempoMaximo: 60, ativo: true },
    { id: '4', prioridade: 'CRITICA', nome: 'Crítica', descricao: 'Prioridade crítica', cor: 'red', tempoMaximo: 30, ativo: true },
  ]);

  const [editingTipo, setEditingTipo] = useState<string | null>(null);
  const [editingPrioridade, setEditingPrioridade] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveTipos = async () => {
    try {
      setLoading(true);
      // Aqui você salvaria no backend
      // await rondasService.saveTiposConfig(tipos);
      toast({
        title: "Sucesso",
        description: "Configurações de tipos salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar tipos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrioridades = async () => {
    try {
      setLoading(true);
      // Aqui você salvaria no backend
      // await rondasService.savePrioridadesConfig(prioridades);
      toast({
        title: "Sucesso",
        description: "Configurações de prioridades salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar prioridades:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTipoAtivo = (id: string) => {
    setTipos(prev => prev.map(t => t.id === id ? { ...t, ativo: !t.ativo } : t));
  };

  const togglePrioridadeAtivo = (id: string) => {
    setPrioridades(prev => prev.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p));
  };

  const getColorClass = (cor: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colors[cor] || colors.gray;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Configurações de Tipos */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
              Tipos de Rondas
            </CardTitle>
            <Button
              onClick={handleSaveTipos}
              disabled={loading}
              className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-black"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {tipos.map((tipo) => (
              <Card key={tipo.id} className="bg-seguranca-black/50 border-gray-700">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getColorClass(tipo.cor)}>
                          {tipo.nome}
                        </Badge>
                        <span className="text-xs text-gray-400">({tipo.tipo})</span>
                        {tipo.ativo ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <X className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </div>
                      {tipo.descricao && (
                        <p className="text-sm text-gray-400">{tipo.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTipoAtivo(tipo.id)}
                        className={tipo.ativo ? "text-green-400 hover:text-green-300" : "text-gray-400 hover:text-gray-300"}
                      >
                        {tipo.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Prioridades */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
              Prioridades de Rondas
            </CardTitle>
            <Button
              onClick={handleSavePrioridades}
              disabled={loading}
              className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-black"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {prioridades.map((prioridade) => (
              <Card key={prioridade.id} className="bg-seguranca-black/50 border-gray-700">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getColorClass(prioridade.cor)}>
                          {prioridade.nome}
                        </Badge>
                        <span className="text-xs text-gray-400">({prioridade.prioridade})</span>
                        {prioridade.ativo ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <X className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </div>
                      {prioridade.descricao && (
                        <p className="text-sm text-gray-400">{prioridade.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Tempo máximo:</span>
                        <span className="text-white font-medium">
                          {Math.floor(prioridade.tempoMaximo / 60)}h {prioridade.tempoMaximo % 60}min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePrioridadeAtivo(prioridade.id)}
                        className={prioridade.ativo ? "text-green-400 hover:text-green-300" : "text-gray-400 hover:text-gray-300"}
                      >
                        {prioridade.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurações Gerais */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
              Configurações Gerais
            </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tempoAlerta" className="text-sm text-gray-300">
                Tempo de Alerta para Atraso (minutos)
              </Label>
              <Input
                id="tempoAlerta"
                type="number"
                defaultValue={15}
                className="bg-seguranca-black border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notificacoes" className="text-sm text-gray-300">
                Notificações
              </Label>
              <Select defaultValue="todos">
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as notificações</SelectItem>
                  <SelectItem value="importantes">Apenas importantes</SelectItem>
                  <SelectItem value="nenhuma">Nenhuma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-black"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

