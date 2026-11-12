import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  FileText, 
  Calendar, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Loader2,
  PackageCheck,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

export interface EPIDeliveryFormItem {
  id?: string;
  equipmentId?: string;
  equipmentName?: string;
  caNumber?: string;
  quantity: number;
  deliveryReason?: string;
  observations?: string;
}

export interface EPIDeliveryForm {
  id: string;
  deliveryDate: string;
  status: string;
  observations?: string;
  verifiedByAlmoxarifado?: boolean;
  responsibleEmployeeName?: string;
  companyName?: string;
  items?: EPIDeliveryFormItem[];
  createdAt?: string;
}

export const EpiForms: React.FC = () => {
  const { toast } = useToast();
  const [forms, setForms] = useState<EPIDeliveryForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<EPIDeliveryForm | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadEpiForms();
  }, []);

  const loadEpiForms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/employee-portal/epi-forms');
      setForms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar fichas de EPI:', error);
      toast({
        title: 'Aviso',
        description: 'Não foi possível carregar as fichas de EPI no momento.',
        variant: 'destructive',
      });
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (formId: string) => {
    setDownloadingId(formId);
    try {
      const response = await api.get(`/api/employee-portal/epi-forms/${formId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ficha-entrega-epi-${formId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso',
        description: 'Download da ficha de EPI iniciado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao baixar PDF da ficha:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o PDF da ficha de EPI.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredForms = forms.filter(f => {
    const term = searchTerm.toLowerCase();
    const dateMatch = f.deliveryDate?.toLowerCase().includes(term);
    const itemMatch = f.items?.some(it => 
      it.equipmentName?.toLowerCase().includes(term) || 
      it.caNumber?.toLowerCase().includes(term)
    );
    const obsMatch = f.observations?.toLowerCase().includes(term);
    return dateMatch || itemMatch || obsMatch || !term;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Fichas de Entrega de EPI
          </h2>
          <p className="text-sm text-muted-foreground">
            Histórico completo dos Equipamentos de Proteção Individual fornecidos e comprovantes assinados
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por EPI, CA ou data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Carregando suas fichas de EPI...</p>
        </div>
      ) : filteredForms.length === 0 ? (
        <Card className="border-dashed border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <PackageCheck className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Nenhuma ficha de EPI encontrada</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {searchTerm 
                ? 'Nenhum resultado corresponde à sua busca.' 
                : 'Você ainda não possui fichas de entrega de EPI registradas pelo SESMT/Almoxarifado.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredForms.map((form) => {
            const itemCount = form.items?.length || 0;
            const deliveryFormatted = form.deliveryDate 
              ? new Date(form.deliveryDate + 'T12:00:00').toLocaleDateString('pt-BR') 
              : 'Data não informada';

            return (
              <Card 
                key={form.id} 
                className="border-border bg-card hover:border-primary/40 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          Ficha de EPI #{form.id.substring(0, 8).toUpperCase()}
                        </CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          Entrega: {deliveryFormatted}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={form.status === 'CONCLUIDO' ? 'default' : 'secondary'} className="text-[11px] font-bold">
                      {form.status || 'CONCLUÍDO'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Itens Principais */}
                  <div className="bg-muted/40 rounded-xl p-3 border border-border/50 text-xs space-y-2">
                    <div className="flex justify-between font-bold text-muted-foreground border-b border-border/50 pb-1">
                      <span>Equipamentos ({itemCount})</span>
                      <span>Qtd</span>
                    </div>
                    {form.items && form.items.length > 0 ? (
                      <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                        {form.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-foreground">
                            <span className="truncate pr-2 font-medium">
                              • {it.equipmentName || 'EPI Padrão'} {it.caNumber ? `(CA ${it.caNumber})` : ''}
                            </span>
                            <span className="font-mono font-bold text-primary">{it.quantity} un</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">Itens gerais registrados na ficha física.</p>
                    )}
                  </div>

                  {form.observations && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">
                      Obs: {form.observations}
                    </p>
                  )}

                  {/* Ações */}
                  <div className="pt-2 flex items-center gap-2 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedForm(form)}
                      className="flex-1 text-xs h-9 border-border hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      Visualizar
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleDownloadPdf(form.id)}
                      disabled={downloadingId === form.id}
                      className="flex-1 text-xs h-9 font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {downloadingId === form.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Download className="h-3.5 w-3.5 mr-1" />
                      )}
                      Baixar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes da Ficha */}
      {selectedForm && (
        <Dialog open={Boolean(selectedForm)} onOpenChange={(open) => !open && setSelectedForm(null)}>
          <DialogContent className="max-w-2xl bg-card border-border text-foreground">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <ShieldCheck className="h-5 w-5" />
                Ficha de Entrega de EPI
              </div>
              <DialogTitle className="text-xl font-bold">
                Detalhes da Ficha #{selectedForm.id.substring(0, 8).toUpperCase()}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-sm mt-2">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border text-xs">
                <div>
                  <span className="text-muted-foreground block">Data de Entrega:</span>
                  <span className="font-bold text-foreground">
                    {selectedForm.deliveryDate ? new Date(selectedForm.deliveryDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status do Registro:</span>
                  <Badge variant="outline" className="font-bold text-primary mt-0.5">
                    {selectedForm.status || 'CONCLUÍDO'}
                  </Badge>
                </div>
                {selectedForm.responsibleEmployeeName && (
                  <div>
                    <span className="text-muted-foreground block">Responsável pela Entrega:</span>
                    <span className="font-bold text-foreground">{selectedForm.responsibleEmployeeName}</span>
                  </div>
                )}
                {selectedForm.companyName && (
                  <div>
                    <span className="text-muted-foreground block">Empresa Emitente:</span>
                    <span className="font-bold text-foreground">{selectedForm.companyName}</span>
                  </div>
                )}
              </div>

              {/* Tabela de Itens */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Equipamentos Entregues
                </h4>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/80 text-muted-foreground">
                      <tr>
                        <th className="p-2.5 text-left font-bold">Equipamento</th>
                        <th className="p-2.5 text-center font-bold">Nº C.A.</th>
                        <th className="p-2.5 text-center font-bold">Qtd</th>
                        <th className="p-2.5 text-left font-bold">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {selectedForm.items && selectedForm.items.length > 0 ? (
                        selectedForm.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-2.5 font-semibold text-foreground">{it.equipmentName || 'EPI'}</td>
                            <td className="p-2.5 text-center font-mono">{it.caNumber || 'S/N'}</td>
                            <td className="p-2.5 text-center font-bold text-primary">{it.quantity}</td>
                            <td className="p-2.5 text-muted-foreground">{it.deliveryReason || 'Admissão / Periódico'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">
                            Sem itens individualizados nesta ficha.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Termo de Responsabilidade Legal NR-06 */}
              <div className="p-3 bg-muted/30 rounded-xl border border-border/70 text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground block mb-1">Declaração de Recebimento (NR-06):</span>
                Declaro ter recebido da empresa os EPIs acima relacionados, em perfeito estado de conservação e funcionamento,
                obrigando-me a usá-los exclusivamente em serviço, zelar por sua guarda e comunicar qualquer alteração que os torne
                impróprios para uso.
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedForm(null)}>
                Fechar
              </Button>
              <Button 
                onClick={() => handleDownloadPdf(selectedForm.id)}
                disabled={downloadingId === selectedForm.id}
                className="bg-primary text-primary-foreground font-bold"
              >
                {downloadingId === selectedForm.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Download className="h-4 w-4 mr-1.5" />
                )}
                Baixar Ficha em PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EpiForms;

