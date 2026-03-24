import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { positionService, Position } from '@/services/positionService';
import { cboService, CBOItem } from '@/services/cboService';
import { useToast } from '@/hooks/use-toast';
import { 
  Briefcase, Loader2, CheckCircle, AlertCircle, 
  User, FileText, Sparkles, Building2, Star, Search, Hash
} from 'lucide-react';

interface NovoCargoModalProps {
  open: boolean;
  onClose: () => void;
  onCargoCreated: (cargo: { id: string; name: string; description: string }) => void;
}

const NovoCargoModal: React.FC<NovoCargoModalProps> = ({ open, onClose, onCargoCreated }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    description: '',
    cbo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positionSearchTerm, setPositionSearchTerm] = useState('');
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [cboSearchTerm, setCboSearchTerm] = useState('');
  const [filteredCBOs, setFilteredCBOs] = useState<CBOItem[]>([]);
  const [showCboDropdown, setShowCboDropdown] = useState(false);
  const [loadingCBO, setLoadingCBO] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Se for o campo name, atualizar o termo de busca
    if (name === 'name') {
      setPositionSearchTerm(value);
      setShowPositionDropdown(value.length > 0);
    }
    
    // Se for o campo cbo, atualizar o termo de busca
    if (name === 'cbo') {
      setCboSearchTerm(value);
      setShowCboDropdown(value.length > 0);
    }
  };

  // Buscar cargos ao digitar o nome
  useEffect(() => {
    const searchPositions = async () => {
      try {
        if (positionSearchTerm.trim().length > 0) {
          const searchResults = await positionService.searchPositions(positionSearchTerm.trim());
          setFilteredPositions(searchResults);
        } else {
          setFilteredPositions([]);
        }
      } catch (error) {
        console.error('Erro ao buscar cargos:', error);
        setFilteredPositions([]);
      }
    };

    // Debounce para evitar muitas requisições
    const timeoutId = setTimeout(() => {
      searchPositions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [positionSearchTerm]);

  // Buscar CBOs ao digitar o código ou título
  useEffect(() => {
    const searchCBOs = async () => {
      if (cboSearchTerm.trim().length === 0) {
        setFilteredCBOs([]);
        return;
      }

      setLoadingCBO(true);
      try {
        const searchTerm = cboSearchTerm.trim();
        console.log('🔍 Buscando CBO:', searchTerm);
        
        // Primeiro, buscar nos cargos do banco de dados
        let results: CBOItem[] = [];
        
        // Buscar cargos que tenham CBO correspondente
        try {
          const positions = await positionService.searchPositions(searchTerm);
          const cboFromPositions = positions
            .filter(p => p.cbo && (
              p.cbo.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.name.toLowerCase().includes(searchTerm.toLowerCase())
            ))
            .map(p => ({
              codigo: p.cbo!,
              titulo: p.name,
              sinonimo: p.description
            }));
          
          if (cboFromPositions.length > 0) {
            console.log('✅ CBOs encontrados no banco de dados:', cboFromPositions.length);
            results = cboFromPositions;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao buscar CBOs no banco:', error);
        }
        
        // Se não encontrou no banco, buscar na API externa (pulando base local primeiro)
        if (results.length === 0) {
          console.log('🌐 CBO não encontrado no banco, buscando na API externa...');
          const apiResults = await cboService.searchCBO(searchTerm, true); // skipLocal = true
          if (apiResults.length > 0) {
            results = apiResults;
          }
        }
        
        console.log('📋 Total de resultados encontrados:', results.length);
        setFilteredCBOs(results);
      } catch (error) {
        console.error('❌ Erro ao buscar CBOs:', error);
        setFilteredCBOs([]);
      } finally {
        setLoadingCBO(false);
      }
    };

    // Debounce para evitar muitas requisições
    const timeoutId = setTimeout(() => {
      searchCBOs();
    }, 500); // Delay maior para CBO pois pode fazer requisições externas

    return () => clearTimeout(timeoutId);
  }, [cboSearchTerm]);

  const handlePositionSelect = (position: Position) => {
    setForm(prev => ({
      ...prev,
      name: position.name,
      cbo: position.cbo || '',
      description: position.description || ''
    }));
    setPositionSearchTerm(position.name);
    setShowPositionDropdown(false);
  };

  const handlePositionInputFocus = () => {
    if (positionSearchTerm.length > 0 && filteredPositions.length > 0) {
      setShowPositionDropdown(true);
    }
  };

  const handlePositionInputBlur = () => {
    // Delay para permitir clique no dropdown
    setTimeout(() => {
      setShowPositionDropdown(false);
    }, 200);
  };

  const handleCboSelect = (cbo: CBOItem) => {
    setForm(prev => ({
      ...prev,
      cbo: cbo.codigo
    }));
    setCboSearchTerm(cbo.codigo);
    setShowCboDropdown(false);
  };

  const handleCboInputFocus = () => {
    if (cboSearchTerm.length > 0 && filteredCBOs.length > 0) {
      setShowCboDropdown(true);
    }
  };

  const handleCboInputBlur = () => {
    // Delay para permitir clique no dropdown
    setTimeout(() => {
      setShowCboDropdown(false);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      setError('Nome do cargo é obrigatório.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const newCargo = await positionService.createPosition({
        name: form.name.trim(),
        description: form.description.trim(),
        cbo: form.cbo.trim() || undefined,
        baseSalary: 0
      });
      
      toast({
        title: "Sucesso",
        description: "Cargo criado com sucesso!",
      });
      
      onCargoCreated(newCargo);
      onClose();
      setForm({ name: '', description: '', cbo: '' });
      setPositionSearchTerm('');
      setFilteredPositions([]);
    } catch (err) {
      setError('Erro ao criar cargo. Tente novamente.');
      toast({
        title: "Erro",
        description: "Não foi possível criar o cargo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
      setForm({ name: '', description: '', cbo: '' });
      setPositionSearchTerm('');
      setFilteredPositions([]);
      setShowPositionDropdown(false);
      setCboSearchTerm('');
      setFilteredCBOs([]);
      setShowCboDropdown(false);
      setError(null);
      onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-full max-h-[95vh] overflow-y-auto p-0 mx-4 sm:mx-0">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-seguranca-yellow p-4 sm:p-6 text-white sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <Briefcase className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <span className="truncate">Novo Cargo</span>
          </DialogTitle>
          <DialogDescription className="text-white/90 text-sm sm:text-base mt-1">
            Preencha os dados do novo cargo para sua organização
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Informações do Cargo */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Informações do Cargo</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-medium text-gray-300">Status</Label>
                  <Badge className="bg-seguranca-yellow/20 text-seguranca-yellow border-seguranca-yellow/30 text-xs sm:text-sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Novo Cargo
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-medium text-gray-300">Tipo</Label>
                  <Badge className="bg-seguranca-red/20 text-seguranca-red border-seguranca-red/30 text-xs sm:text-sm">
                    <Star className="h-3 w-3 mr-1" />
                    Posição Ativa
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Dados do Cargo */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-seguranca-red/20 rounded-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Dados do Cargo</h3>
              </div>

              {/* Nome do Cargo */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                  <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Nome do Cargo</span>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs ml-auto">
                    Obrigatório
                  </Badge>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onFocus={handlePositionInputFocus}
                    onBlur={handlePositionInputBlur}
                    placeholder="Ex: Analista de Segurança, Supervisor de Vigilância..."
                    required
                    disabled={loading}
                    className="pl-9 sm:pl-10 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow text-sm sm:text-base h-10 sm:h-11"
                  />
                  
                  {/* Dropdown de cargos */}
                  {showPositionDropdown && filteredPositions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredPositions.map((position) => (
                        <div
                          key={position.id}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0"
                          onClick={() => handlePositionSelect(position)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-seguranca-lightgray">{position.name}</span>
                            {position.cbo && (
                              <span className="text-xs text-gray-400">
                                CBO: {position.cbo}
                              </span>
                            )}
                            {position.description && (
                              <span className="text-xs text-gray-500 truncate">
                                {position.description}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Mensagem quando não há resultados */}
                  {showPositionDropdown && positionSearchTerm.trim() !== '' && filteredPositions.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-lg shadow-lg p-3">
                      <p className="text-xs text-gray-400 text-center">Nenhum cargo encontrado</p>
                    </div>
                  )}
                </div>
                {form.name && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span>Nome válido: {form.name.length} caracteres</span>
                  </div>
                )}
              </div>

              {/* CBO */}
              <div className="space-y-2">
                <Label htmlFor="cbo" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                  <Hash className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">CBO (Código Brasileiro de Ocupação)</span>
                  <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs ml-auto">
                    Opcional
                  </Badge>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  {loadingCBO && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
                  )}
                  <Input
                    id="cbo"
                    name="cbo"
                    value={form.cbo}
                    onChange={handleChange}
                    onFocus={handleCboInputFocus}
                    onBlur={handleCboInputBlur}
                    placeholder="Digite o código ou nome da ocupação (Ex: 5171-10, Vigilante...)"
                    disabled={loading}
                    className="pl-9 sm:pl-10 pr-9 sm:pr-10 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow text-sm sm:text-base h-10 sm:h-11"
                  />
                  
                  {/* Dropdown de CBOs */}
                  {showCboDropdown && filteredCBOs.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCBOs.map((cbo, index) => (
                        <div
                          key={`${cbo.codigo}-${index}`}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0"
                          onClick={() => handleCboSelect(cbo)}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-seguranca-lightgray">{cbo.titulo}</span>
                              <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                                {cbo.codigo}
                              </Badge>
                            </div>
                            {cbo.sinonimo && (
                              <span className="text-xs text-gray-500 mt-1">
                                Sinônimo: {cbo.sinonimo}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Mensagem quando não há resultados */}
                  {showCboDropdown && cboSearchTerm.trim() !== '' && filteredCBOs.length === 0 && !loadingCBO && (
                    <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-lg shadow-lg p-3">
                      <p className="text-xs text-gray-400 text-center">Nenhum CBO encontrado</p>
                    </div>
                  )}
                </div>
                {form.cbo && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span>CBO: {form.cbo}</span>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Descrição</span>
                  <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs ml-auto">
                    Opcional
                  </Badge>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Descreva as responsabilidades, requisitos e atividades do cargo..."
                  rows={4}
                  disabled={loading}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow text-sm sm:text-base resize-none"
                />
                {form.description && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span>Descrição válida: {form.description.length} caracteres</span>
                  </div>
                )}
              </div>
            </div>

            {/* Erro */}
            {error && (
              <Card className="bg-red-500/10 border-red-500/30">
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-red-300 font-medium break-words">{error}</span>
                  </div>
                </div>
              </Card>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-600">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-10 sm:h-11 text-sm sm:text-base order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !form.name.trim()}
                className="w-full sm:w-auto bg-gradient-to-r from-seguranca-red to-seguranca-yellow hover:from-seguranca-red/90 hover:to-seguranca-yellow/90 text-white font-medium h-10 sm:h-11 text-sm sm:text-base order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                    <span className="truncate">Criando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="truncate">Criar Cargo</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NovoCargoModal;
