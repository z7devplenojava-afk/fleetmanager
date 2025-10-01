import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, CheckCircle, Calendar, DollarSign, Building2 } from 'lucide-react';
import { invoiceService, InvoiceSearchResult } from '@/services/invoiceService';
import { useToast } from '@/hooks/use-toast';

interface InvoiceSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (invoice: InvoiceSearchResult) => void;
  placeholder?: string;
  className?: string;
}

export const InvoiceSearch: React.FC<InvoiceSearchProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Digite o número da fatura...",
  className = ""
}) => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSearchResult | null>(null);
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
        const results = await invoiceService.searchInvoiceNumbers(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  // Buscar fatura completa quando selecionada
  const handleSuggestionClick = async (invoiceNumber: string) => {
    setIsLoading(true);
    try {
      const invoice = await invoiceService.getInvoiceByNumber(invoiceNumber);
      if (invoice) {
        setSelectedInvoice(invoice);
        onChange(invoiceNumber);
        onSelect?.(invoice);
        setShowSuggestions(false);
        
        toast({
          title: "Fatura encontrada",
          description: `Fatura ${invoiceNumber} selecionada com sucesso`,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar fatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da fatura",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar seleção
  const handleClear = () => {
    setSelectedInvoice(null);
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
          {selectedInvoice && (
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
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Informações da fatura selecionada */}
      {selectedInvoice && (
        <Card className="mt-2 border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    Fatura: {selectedInvoice.invoiceNumber}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {selectedInvoice.status}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm text-green-700">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    <span>{selectedInvoice.clientName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    <span>R$ {selectedInvoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Vencimento: {new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  {selectedInvoice.description && (
                    <div className="mt-2 text-xs text-green-600">
                      {selectedInvoice.description}
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-green-100"
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
