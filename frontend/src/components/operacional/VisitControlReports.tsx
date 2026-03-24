import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Filter, FileText, Eye, Trash2, Plus, Paperclip } from 'lucide-react';
import { visitControlService, VisitControlFilters, VisitControlReport } from '@/services/visitControlService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const VisitControlReports: React.FC = () => {
  const { toast } = useToast();
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<VisitControlReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<VisitControlReport | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filters, setFilters] = useState<VisitControlFilters>({
    workPostId: undefined,
    status: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  useEffect(() => {
    loadWorkPosts();
    loadReports();
  }, []);

  const loadWorkPosts = async () => {
    try {
      const data = await workPostService.getWorkPosts();
      setWorkPosts(data);
    } catch (error) {
      console.error('Erro ao carregar postos de trabalho:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar postos de trabalho',
        variant: 'destructive',
      });
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const data = await visitControlService.getAllReports();
      setReports(data || []);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar relatórios',
        variant: 'destructive',
      });
    } finally {
      setLoadingReports(false);
    }
  };

  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      const report = await visitControlService.generateAndSaveReport(filters);
      
      toast({
        title: 'Sucesso',
        description: 'Relatório gerado e salvo com sucesso.',
      });
      
      await loadReports();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório PDF. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report: VisitControlReport) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const handleDownloadReport = async (reportId: string, fileName: string) => {
    try {
      const blob = await visitControlService.downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Sucesso',
        description: 'Relatório baixado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao baixar relatório. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este relatório?')) {
      return;
    }

    try {
      await visitControlService.deleteReport(reportId);
      toast({
        title: 'Sucesso',
        description: 'Relatório excluído com sucesso.',
      });
      await loadReports();
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir relatório. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFilterChange = (key: keyof VisitControlFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({
      workPostId: undefined,
      status: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Relatórios de Visitas</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gere e gerencie relatórios de visitas filtrados por setor/posto de trabalho, data e status
          </p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">
            <Plus className="h-4 w-4 mr-2" />
            Gerar Relatório
          </TabsTrigger>
          <TabsTrigger value="list">
            <FileText className="h-4 w-4 mr-2" />
            Relatórios Gerados ({reports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Posto de Trabalho */}
            <div className="space-y-2">
              <Label htmlFor="workPost">Posto de Trabalho</Label>
              <Select
                value={filters.workPostId || 'all'}
                onValueChange={(value) => handleFilterChange('workPostId', value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="workPost">
                  <SelectValue placeholder="Todos os postos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os postos</SelectItem>
                  {workPosts.map((workPost) => (
                    <SelectItem key={workPost.id} value={workPost.id}>
                      {workPost.name} {workPost.postCode && `(${workPost.postCode})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value as any)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="SCHEDULED">Agendada</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                  <SelectItem value="COMPLETED">Concluída</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full sm:w-auto"
            >
              Limpar Filtros
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <FileText className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Gerados</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReports ? (
                <div className="flex items-center justify-center h-32">
                  <FileText className="h-6 w-6 animate-spin mr-2" />
                  <span>Carregando relatórios...</span>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum relatório encontrado</h3>
                  <p className="text-muted-foreground">
                    Gere seu primeiro relatório na aba "Gerar Relatório"
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data de Geração</TableHead>
                      <TableHead>Filtros</TableHead>
                      <TableHead>Total de Visitas</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Criado por</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {report.workPostName && (
                              <Badge variant="outline">Posto: {report.workPostName}</Badge>
                            )}
                            {report.status && (
                              <Badge variant="outline">Status: {report.status}</Badge>
                            )}
                            {report.startDate && report.endDate && (
                              <Badge variant="outline">
                                {format(new Date(report.startDate), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(report.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{report.totalVisits}</TableCell>
                        <TableCell>{formatFileSize(report.fileSize)}</TableCell>
                        <TableCell>{report.createdByName || 'Sistema'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReport(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadReport(report.id, report.fileName)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Relatório</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="attachments">Anexos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Arquivo</Label>
                    <p className="text-sm">{selectedReport.fileName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tamanho</Label>
                    <p className="text-sm">{formatFileSize(selectedReport.fileSize)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total de Visitas</Label>
                    <p className="text-sm">{selectedReport.totalVisits}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data de Geração</Label>
                    <p className="text-sm">
                      {format(new Date(selectedReport.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  {selectedReport.workPostName && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Posto de Trabalho</Label>
                      <p className="text-sm">{selectedReport.workPostName}</p>
                    </div>
                  )}
                  {selectedReport.status && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <p className="text-sm">{selectedReport.status}</p>
                    </div>
                  )}
                  {selectedReport.startDate && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data Início</Label>
                      <p className="text-sm">
                        {format(new Date(selectedReport.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {selectedReport.endDate && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data Fim</Label>
                      <p className="text-sm">
                        {format(new Date(selectedReport.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleDownloadReport(selectedReport.id, selectedReport.fileName)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const blob = await visitControlService.viewReport(selectedReport.id);
                        const url = window.URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        // Limpar a URL após um tempo para liberar memória
                        setTimeout(() => window.URL.revokeObjectURL(url), 100);
                      } catch (error) {
                        console.error('Erro ao visualizar relatório:', error);
                        toast({
                          title: 'Erro',
                          description: 'Erro ao visualizar relatório. Tente novamente.',
                          variant: 'destructive',
                        });
                      }
                    }}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar PDF
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="attachments" className="space-y-4">
                <div className="text-center py-8">
                  <Paperclip className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Anexos</h3>
                  <p className="text-muted-foreground mb-4">
                    Funcionalidade de anexos será implementada em breve
                  </p>
                  <Button variant="outline" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Anexo
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitControlReports;

