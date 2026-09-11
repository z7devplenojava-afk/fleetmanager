import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PontoAdminNav from '@/components/ponto/PontoAdminNav';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  User,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import timeRecordService, { TimeRecord } from '@/services/timeRecordService';

const AdminPontoPending: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [pendingRecords, setPendingRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    loadPendingRecords();
  }, []);

  const loadPendingRecords = async () => {
    try {
      setLoading(true);
      const response = await timeRecordService.getAdminRecords({ status: 'PENDING' });
      if (response.success) {
        setPendingRecords(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar registros pendentes:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao carregar registros',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleBatchApprove = async () => {
    if (!user?.id || selectedIds.size === 0) return;
    try {
      setProcessing(true);
      const response = await timeRecordService.batchApproveRecords(
        Array.from(selectedIds), user.id
      );
      if (response.success) {
        toast({
          title: '✅ Aprovados',
          description: response.message || `${selectedIds.size} registro(s) aprovado(s)`,
        });
        setSelectedIds(new Set());
        await loadPendingRecords();
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchReject = async () => {
    if (!user?.id || selectedIds.size === 0) return;
    if (!rejectReason.trim()) {
      toast({ title: 'Motivo obrigatório', description: 'Informe o motivo da rejeição', variant: 'destructive' });
      return;
    }
    try {
      setProcessing(true);
      const response = await timeRecordService.batchRejectRecords(
        Array.from(selectedIds), user.id, rejectReason
      );
      if (response.success) {
        toast({
          title: '✅ Rejeitados',
          description: response.message || `${selectedIds.size} registro(s) rejeitado(s)`,
        });
        setSelectedIds(new Set());
        setRejectReason('');
        setShowRejectDialog(false);
        await loadPendingRecords();
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSingleApprove = async (recordId: string) => {
    if (!user?.id) return;
    try {
      setProcessing(true);
      const response = await timeRecordService.approveRecord(recordId, user.id);
      if (response.success) {
        toast({ title: '✅ Aprovado', description: 'Registro aprovado com sucesso' });
        await loadPendingRecords();
      }
    } catch (error: any) {
      toast({
        title: 'Erro', description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSingleReject = async (recordId: string) => {
    if (!user?.id) return;
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    try {
      setProcessing(true);
      const response = await timeRecordService.rejectRecord(recordId, user.id, reason);
      if (response.success) {
        toast({ title: '✅ Rejeitado', description: 'Registro rejeitado' });
        await loadPendingRecords();
      }
    } catch (error: any) {
      toast({
        title: 'Erro', description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ENTRADA: 'Entrada', SAIDA: 'Saída',
      SAIDA_ALMOCO: 'Saída Almoço', RETORNO_ALMOCO: 'Retorno Almoço'
    };
    return labels[tipo] || tipo;
  };

  const filteredRecords = pendingRecords.filter(r =>
    r.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation + Header */}
        <PontoAdminNav 
          title="Aprovações Pendentes" 
          subtitle={`${pendingRecords.length} registro(s) aguardando aprovação`}
        />
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={loadPendingRecords}
            className="border-seguranca-yellow/30 hover:border-seguranca-yellow/50">
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>

        {/* Batch Actions */}
        {selectedIds.size > 0 && (
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-seguranca-lightgray font-medium">
                  {selectedIds.size} registro(s) selecionado(s)
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBatchApprove}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                      <CheckCircle className="mr-2 h-4 w-4" />}
                    Aprovar Selecionados
                  </Button>
                  <Button
                    onClick={() => { setActionType('reject'); setShowRejectDialog(true); }}
                    disabled={processing}
                    variant="destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar Selecionados
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedIds(new Set())}>
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-seguranca-gray" />
          <input
            placeholder="Buscar por funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-seguranca-black border border-seguranca-gray/30 text-seguranca-lightgray focus:border-seguranca-yellow/50 focus:outline-none"
          />
        </div>

        {/* Records List */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.size === filteredRecords.length && filteredRecords.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <CardTitle className="text-seguranca-lightgray text-lg">
                  Registros Pendentes
                </CardTitle>
              </div>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                {filteredRecords.length} pendente(s)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-seguranca-yellow" />
                <p className="text-seguranca-gray mt-4">Carregando...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-seguranca-gray">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500/50" />
                <p className="text-lg">Nenhum registro pendente!</p>
                <p className="text-sm mt-2">Todos os registros foram processados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      selectedIds.has(record.id)
                        ? 'border-yellow-500/50 bg-yellow-500/5'
                        : 'border-seguranca-gray/20 bg-seguranca-black/30 hover:border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedIds.has(record.id)}
                        onCheckedChange={() => toggleSelect(record.id)}
                      />
                      <div className="p-2 rounded-full bg-seguranca-gray/10">
                        <User className="h-5 w-5 text-seguranca-yellow" />
                      </div>
                      <div>
                        <div className="font-semibold text-seguranca-lightgray">
                          {record.employee?.name || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-seguranca-gray">
                          <Badge variant="outline" className="text-xs">
                            {getTipoLabel(record.recordType)}
                          </Badge>
                          <span>•</span>
                          <span>{format(new Date(record.recordedAt), "dd/MM/yyyy HH:mm")}</span>
                          {record.location && (
                            <>
                              <span>•</span>
                              <span>{record.location}</span>
                            </>
                          )}
                        </div>
                        {record.justification && (
                          <div className="text-xs text-seguranca-gray mt-1 flex items-start">
                            <Info className="h-3 w-3 mr-1 mt-0.5 shrink-0" />
                            <span className="italic">{record.justification}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSingleApprove(record.id)}
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700 h-8"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSingleReject(record.id)}
                        disabled={processing}
                        variant="destructive"
                        className="h-8"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md bg-seguranca-darkgray border-seguranca-gray/20">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center">
              <XCircle className="mr-2 h-5 w-5 text-red-500" />
              Rejeitar Registros
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray">
              {selectedIds.size} registro(s) serão rejeitados. Informe o motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da rejeição..."
              className="min-h-[100px] bg-seguranca-darkgray border-seguranca-gray/40 text-seguranca-lightgray"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleBatchReject}
                disabled={processing || !rejectReason.trim()}
                variant="destructive"
              >
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Rejeitar {selectedIds.size} Registro(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default AdminPontoPending;
