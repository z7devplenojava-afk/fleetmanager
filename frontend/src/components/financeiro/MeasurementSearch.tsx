import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, CheckCircle, Calendar, DollarSign, Building2, FileText } from 'lucide-react';
import { invoiceService } from '@/services/invoiceService';
import { useToast } from '@/hooks/use-toast';

interface MeasurementSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (measurement: any) => void;
  placeholder?: string;
  className?: string;
}

export const MeasurementSearch: React.FC<MeasurementSearchProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Digite o número da medição...",
  className = ""
}) => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Buscar sugestões quando o valor muda
  useEffect(() => {
    const searchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await invoiceService.searchMeasurementNumbers(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Erro ao buscar sugestões de medição:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  // Buscar medição completa quando selecionada
  const handleSuggestionClick = async (measurementNumber: string) => {
    setIsLoading(true);
    try {
      // Por enquanto, vamos simular os dados da medição
      // Em uma implementação real, você criaria um endpoint específico para buscar medições
      const measurement = {
        measurementNumber,
        description: `Medição ${measurementNumber}`,
        amount: 0,
        clientName: 'Cliente não informado',
        dueDate: new Date().toISOString(),
        status: 'PENDENTE'
      };
      
      setSelectedMeasurement(measurement);
      onChange(measurementNumber);
      onSelect?.(measurement);
      setShowSuggestions(false);
      
      toast({
        title: "Medição encontrada",
        description: `Medição ${measurementNumber} selecionada com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao buscar medição:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da medição",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar seleção
  const handleClear = () => {
    setSelectedMeasurement(null);
    onChange('');
    onSelect?.(null as any);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
          {selectedMeasurement && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Informações da medição selecionada */}
      {selectedMeasurement && (
        <Card className="mt-2 border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Medição: {selectedMeasurement.measurementNumber}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {selectedMeasurement.status}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    <span>{selectedMeasurement.clientName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    <span>R$ {selectedMeasurement.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Data: {new Date(selectedMeasurement.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  {selectedMeasurement.description && (
                    <div className="mt-2 text-xs text-blue-600">
                      {selectedMeasurement.description}
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
