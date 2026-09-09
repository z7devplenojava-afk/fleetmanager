import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUp, FileText, CheckCircle2, AlertCircle, Loader2, Building, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { employeeService } from '@/services/employeeService';

interface EmployeePdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeePdfImportModal: React.FC<EmployeePdfImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo em formato PDF.',
          variant: 'destructive',
        });
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const res = await employeeService.importEmployeePdf(file);
      setResult(res);

      toast({
        title: 'Importação Concluída!',
        description: res.message || `${res.totalProcessed || 0} funcionário(s) importado(s) com sucesso.`,
      });

      onSuccess();
    } catch (err: any) {
      toast({
        title: 'Erro na Importação',
        description: err.message || 'Falha ao processar o arquivo PDF.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <FileUp className="w-6 h-6 text-red-500" />
            Importar Ficha de Registro (PDF)
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Selecione o arquivo PDF contendo um ou <strong>múltiplos funcionários</strong>. O sistema reconhecerá automaticamente a Empresa (CNPJ/Razão Social) e cadastrará/atualizará todos os registros encontrados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="border-2 border-dashed border-zinc-700 hover:border-red-500/50 rounded-lg p-6 text-center transition-colors">
            <input
              type="file"
              accept=".pdf"
              id="pdf-upload"
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />
            <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <FileText className="w-10 h-10 text-red-500/80" />
              {file ? (
                <div className="text-sm font-medium text-zinc-200">
                  <p>{file.name}</p>
                  <p className="text-xs text-zinc-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-zinc-300">Clique para selecionar o PDF com Fichas</p>
                  <p className="text-xs text-zinc-500">Suporta arquivos PDF individuais ou com múltiplos funcionários</p>
                </>
              )}
            </label>
          </div>

          {result && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between text-emerald-400 font-semibold text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Resultado da Importação:</span>
                </div>
                <span className="text-xs bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  {result.totalProcessed || 0} Processado(s)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/60 p-2.5 rounded border border-zinc-800">
                <div><span className="text-zinc-400">Novos Cadastrados:</span> <strong className="text-emerald-400">{result.createdCount || 0}</strong></div>
                <div><span className="text-zinc-400">Atualizados:</span> <strong className="text-blue-400">{result.updatedCount || 0}</strong></div>
              </div>

              {result.employees && result.employees.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <p className="text-xs font-semibold text-zinc-300">Funcionários Processados:</p>
                  {result.employees.map((emp: any, idx: number) => (
                    <div key={idx} className="text-xs p-2 bg-zinc-900/80 rounded border border-zinc-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                          <User className="w-3 h-3 text-zinc-400" />
                          <span>{emp.employeeName}</span>
                        </div>
                        {emp.companyName && (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                            <Building className="w-3 h-3 text-zinc-500" />
                            <span>{emp.companyName}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${emp.isNew ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                        {emp.isNew ? 'Novo' : 'Atualizado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleClose} disabled={loading} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
            {result ? 'Fechar' : 'Cancelar'}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!file || loading}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando PDF Multi-Funcionário...
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4" />
                  Importar Registros
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
