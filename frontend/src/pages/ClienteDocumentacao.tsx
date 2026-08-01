import React, { useState, useEffect, useCallback } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useGSAP } from '@/hooks/use-gsap';
import {
  Search, Plus, FolderTree, FileText, Upload, Download, Trash2,
  ChevronRight, ChevronDown, Folder, File, Building2, Calendar,
  Layers, Tag, AlertCircle, Edit3, X
} from 'lucide-react';
import { clientService } from '@/services/clientService';
import {
  clientDocumentationService, ClientDocumentation, ClientDocStage,
  ClientDocCategory, ClientDocFile, getMonthName
} from '@/services/clientDocumentationService';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type ViewLevel = 'clients' | 'periods' | 'stages';

interface ClientSummary {
  id: string;
  name: string;
  cnpj: string;
}

const ClienteDocumentacao: React.FC = () => {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('clients');
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<ClientDocumentation | null>(null);
  const [docs, setDocs] = useState<ClientDocumentation[]>([]);
  const [stages, setStages] = useState<ClientDocStage[]>([]);
  const [categories, setCategories] = useState<ClientDocCategory[]>([]);
  const [filesByCategory, setFilesByCategory] = useState<Record<string, ClientDocFile[]>>({});
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [showNewStageDialog, setShowNewStageDialog] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newDocYear, setNewDocYear] = useState(new Date().getFullYear());
  const [newDocMonth, setNewDocMonth] = useState(new Date().getMonth() + 1);
  const [newStageName, setNewStageName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(false);

  const { toast } = useToast();
  useGSAP();

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await clientService.getClients({ page: 0, size: 200 });
      const items = response.content || response;
      const mapped = Array.isArray(items)
        ? items.map((c: any) => ({ id: c.id, name: c.name, cnpj: c.cnpj || '' }))
        : [];
      setClients(mapped);
    } catch (error: any) {
      toast({ title: 'Erro', description: 'Erro ao carregar clientes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadDocs = useCallback(async (clientId: string) => {
    setIsLoading(true);
    try {
      const data = await clientDocumentationService.listByClient(clientId);
      setDocs(data);
    } catch (error: any) {
      toast({ title: 'Erro', description: 'Erro ao carregar documentações', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadStagesAndCategories = useCallback(async (docId: string) => {
    setIsLoading(true);
    try {
      const [stagesData, categoriesData] = await Promise.all([
        clientDocumentationService.listStages(docId),
        clientDocumentationService.listCategories(),
      ]);
      setStages(stagesData);
      setCategories(categoriesData);
    } catch (error: any) {
      toast({ title: 'Erro', description: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadFiles = useCallback(async (stageId: string, categoryId: string) => {
    try {
      const data = await clientDocumentationService.listFiles(stageId, categoryId);
      setFilesByCategory(prev => ({ ...prev, [`${stageId}-${categoryId}`]: data }));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleSelectClient = (client: ClientSummary) => {
    setSelectedClient(client);
    setSelectedDoc(null);
    setStages([]);
    setFilesByCategory({});
    setViewLevel('periods');
    loadDocs(client.id);
  };

  const handleSelectDoc = async (doc: ClientDocumentation) => {
    setSelectedDoc(doc);
    setFilesByCategory({});
    setExpandedStage(null);
    setViewLevel('stages');
    await loadStagesAndCategories(doc.id);
  };

  const handleToggleStage = (stageId: string) => {
    if (expandedStage === stageId) {
      setExpandedStage(null);
      return;
    }
    setExpandedStage(stageId);
    categories.forEach(cat => {
      const key = `${stageId}-${cat.id}`;
      if (!filesByCategory[key]) {
        loadFiles(stageId, cat.id);
      }
    });
  };

  const handleCreateDoc = async () => {
    if (!selectedClient) return;
    try {
      await clientDocumentationService.createDocumentation({
        clientId: selectedClient.id,
        year: newDocYear,
        month: newDocMonth,
      });
      setShowNewDocDialog(false);
      toast({ title: 'Sucesso', description: 'Documentação criada' });
      loadDocs(selectedClient.id);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao criar', variant: 'destructive' });
    }
  };

  const handleCreateStage = async () => {
    if (!selectedDoc || !newStageName.trim()) return;
    try {
      await clientDocumentationService.createStage({
        documentationId: selectedDoc.id,
        name: newStageName.trim(),
      });
      setShowNewStageDialog(false);
      setNewStageName('');
      toast({ title: 'Sucesso', description: 'Etapa criada' });
      loadStagesAndCategories(selectedDoc.id);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao criar etapa', variant: 'destructive' });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await clientDocumentationService.createCategory({ name: newCategoryName.trim() });
      setShowNewCategoryDialog(false);
      setNewCategoryName('');
      toast({ title: 'Sucesso', description: 'Categoria criada' });
      if (selectedDoc) {
        const cats = await clientDocumentationService.listCategories();
        setCategories(cats);
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao criar categoria', variant: 'destructive' });
    }
  };

  const handleUploadFile = async (stageId: string, categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await clientDocumentationService.uploadFile(stageId, categoryId, file);
      toast({ title: 'Sucesso', description: 'Arquivo enviado' });
      loadFiles(stageId, categoryId);
    } catch (error: any) {
      toast({ title: 'Erro', description: 'Erro ao enviar arquivo', variant: 'destructive' });
    }
    e.target.value = '';
  };

  const handleDeleteFile = async (fileId: string, stageId: string, categoryId: string) => {
    try {
      await clientDocumentationService.deleteFile(fileId);
      toast({ title: 'Sucesso', description: 'Arquivo excluído' });
      loadFiles(stageId, categoryId);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir arquivo', variant: 'destructive' });
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      await clientDocumentationService.deleteStage(stageId);
      toast({ title: 'Sucesso', description: 'Etapa excluída' });
      if (selectedDoc) loadStagesAndCategories(selectedDoc.id);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir etapa', variant: 'destructive' });
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await clientDocumentationService.deleteDocumentation(docId);
      toast({ title: 'Sucesso', description: 'Documentação excluída' });
      if (selectedClient) loadDocs(selectedClient.id);
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
        setViewLevel('periods');
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await clientDocumentationService.deleteCategory(categoryId);
      toast({ title: 'Sucesso', description: 'Categoria excluída' });
      if (selectedDoc) {
        const cats = await clientDocumentationService.listCategories();
        setCategories(cats);
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir categoria', variant: 'destructive' });
    }
  };

  const handleDownload = async (file: ClientDocFile) => {
    try {
      const blob = await clientDocumentationService.downloadFile(file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao baixar arquivo', variant: 'destructive' });
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj.includes(searchTerm)
  );

  const renderBreadcrumb = () => (
    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 flex-wrap">
      <button onClick={() => { setViewLevel('clients'); setSelectedClient(null); setSelectedDoc(null); }}
        className="hover:text-seguranca-yellow transition-colors">Clientes</button>
      {selectedClient && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => { setViewLevel('periods'); setSelectedDoc(null); setFilesByCategory({}); }}
            className="hover:text-seguranca-yellow transition-colors">{selectedClient.name}</button>
        </>
      )}
      {selectedDoc && (
        <>
          <ChevronRight size={14} />
          <span className="text-seguranca-yellow">{getMonthName(selectedDoc.month)}/{selectedDoc.year}</span>
        </>
      )}
    </div>
  );

  const renderClientList = () => (
    <>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar cliente por nome ou CNPJ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-seguranca-graphite border-gray-700 text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => (
          <Card key={client.id}
            className="bg-seguranca-graphite border-gray-700 p-4 cursor-pointer hover:border-seguranca-yellow transition-all"
            onClick={() => handleSelectClient(client)}>
            <div className="flex items-center gap-3">
              <Building2 className="text-seguranca-yellow flex-shrink-0" size={24} />
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{client.name}</p>
                <p className="text-gray-400 text-sm">{client.cnpj}</p>
              </div>
            </div>
          </Card>
        ))}
        {filteredClients.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <AlertCircle className="mx-auto mb-2" size={32} />
            <p>Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </>
  );

  const renderPeriodList = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{selectedClient?.name}</h2>
        <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
          <DialogTrigger asChild>
            <Button className="bg-seguranca-yellow text-black hover:bg-yellow-500">
              <Plus size={18} className="mr-1" /> Nova Documentação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white">
            <DialogHeader><DialogTitle>Nova Documentação</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Ano</label>
                <Input type="number" value={newDocYear} onChange={e => setNewDocYear(Number(e.target.value))}
                  className="bg-seguranca-black border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Mês</label>
                <Select value={String(newDocMonth)} onValueChange={v => setNewDocMonth(Number(v))}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{getMonthName(i + 1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateDoc} className="w-full bg-seguranca-yellow text-black hover:bg-yellow-500">
                Criar Documentação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {docs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="mx-auto mb-2" size={32} />
          <p>Nenhuma documentação encontrada para este cliente</p>
          <p className="text-sm mt-1">Clique em "Nova Documentação" para criar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => (
            <Card key={doc.id}
              className="bg-seguranca-graphite border-gray-700 p-4 cursor-pointer hover:border-seguranca-yellow transition-all"
              onClick={() => handleSelectDoc(doc)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="text-seguranca-yellow flex-shrink-0" size={24} />
                  <div>
                    <p className="text-white font-medium">{getMonthName(doc.month)}/{doc.year}</p>
                    <p className="text-gray-400 text-sm">{doc.stageCount} etapa(s)</p>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDeleteDoc(doc.id); }}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  const renderStageList = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">{selectedClient?.name}</h2>
          <p className="text-gray-400 text-sm">
            {selectedDoc && `${getMonthName(selectedDoc.month)}/${selectedDoc.year}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
                <Tag size={16} className="mr-1" /> Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-seguranca-graphite border-gray-700 text-white">
              <DialogHeader><DialogTitle>Nova Categoria de Documento</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Nome da categoria"
                  value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                  className="bg-seguranca-black border-gray-700 text-white" />
                <Button onClick={handleCreateCategory} className="w-full bg-seguranca-yellow text-black hover:bg-yellow-500">
                  Criar Categoria
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showNewStageDialog} onOpenChange={setShowNewStageDialog}>
            <DialogTrigger asChild>
              <Button className="bg-seguranca-yellow text-black hover:bg-yellow-500">
                <Plus size={18} className="mr-1" /> Nova Etapa
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-seguranca-graphite border-gray-700 text-white">
              <DialogHeader><DialogTitle>Nova Etapa</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Ex: 1ª Etapa"
                  value={newStageName} onChange={e => setNewStageName(e.target.value)}
                  className="bg-seguranca-black border-gray-700 text-white" />
                <Button onClick={handleCreateStage} className="w-full bg-seguranca-yellow text-black hover:bg-yellow-500">
                  Criar Etapa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Layers className="mx-auto mb-2" size={32} />
          <p>Nenhuma etapa criada</p>
          <p className="text-sm mt-1">Clique em "Nova Etapa" para criar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stages.map(stage => (
            <Card key={stage.id} className="bg-seguranca-graphite border-gray-700 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-seguranca-black/50 transition-colors"
                onClick={() => handleToggleStage(stage.id)}>
                <div className="flex items-center gap-3">
                  {expandedStage === stage.id ? <ChevronDown size={20} className="text-seguranca-yellow" />
                    : <ChevronRight size={20} className="text-seguranca-yellow" />}
                  <FolderTree className="text-seguranca-yellow" size={20} />
                  <span className="text-white font-medium">{stage.name}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDeleteStage(stage.id); }}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1">
                  <Trash2 size={16} />
                </button>
              </div>

              {expandedStage === stage.id && (
                <div className="border-t border-gray-700 p-4">
                  {categories.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">Nenhuma categoria disponível</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {categories.map(cat => {
                        const key = `${stage.id}-${cat.id}`;
                        const files = filesByCategory[key] || [];
                        return (
                          <div key={cat.id} className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Folder size={16} className="text-seguranca-yellow flex-shrink-0" />
                                <span className="text-gray-200 text-sm font-medium truncate">{cat.name}</span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <label className="cursor-pointer p-1 hover:text-seguranca-yellow text-gray-400 transition-colors">
                                  <Upload size={14} />
                                  <input type="file" className="hidden" onChange={e => handleUploadFile(stage.id, cat.id, e)} />
                                </label>
                                {!cat.isSystem && (
                                  <button onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-1 hover:text-red-500 text-gray-500 transition-colors">
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {files.length > 0 ? (
                              <ul className="space-y-1 mt-2">
                                {files.map(f => (
                                  <li key={f.id} className="flex items-center justify-between gap-2 text-xs text-gray-400 hover:text-white transition-colors group">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <File size={12} className="flex-shrink-0" />
                                      <span className="truncate">{f.originalName}</span>
                                      <span className="text-gray-600 flex-shrink-0">({f.displaySize})</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleDownload(f)}
                                        className="p-1 hover:text-seguranca-yellow transition-colors">
                                        <Download size={12} />
                                      </button>
                                      <button onClick={() => handleDeleteFile(f.id, stage.id, cat.id)}
                                        className="p-1 hover:text-red-500 transition-colors">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-600 text-xs mt-1">Nenhum arquivo</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );

  return (
    <StandardLayout title="Documentação de Clientes" subtitle="Gestão de documentação mensal por cliente">
      <div className="p-6">
        {renderBreadcrumb()}
        {viewLevel === 'clients' && renderClientList()}
        {viewLevel === 'periods' && renderPeriodList()}
        {viewLevel === 'stages' && renderStageList()}
      </div>
    </StandardLayout>
  );
};

export default ClienteDocumentacao;
