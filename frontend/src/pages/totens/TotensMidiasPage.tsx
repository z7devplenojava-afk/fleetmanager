import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { 
  Film, 
  Upload, 
  Image as ImageIcon, 
  Search, 
  RefreshCw, 
  Trash2, 
  HardDrive,
  FileText,
  Music,
  Eye,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Download,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { kioskService } from '@/services/kioskService';
import { KioskMediaAsset, MediaType } from '@/types/kiosk';

export const TotensMidiasPage: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados principais
  const [mediaList, setMediaList] = useState<KioskMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Modal de Upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Modal de Preview
  const [previewMedia, setPreviewMedia] = useState<KioskMediaAsset | null>(null);

  // Modal de Exclusão
  const [mediaToDelete, setMediaToDelete] = useState<KioskMediaAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carregar dados
  const loadMedia = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await kioskService.getMediaAssets();
      setMediaList(data || []);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar mídias',
        description: err?.response?.data?.message || 'Falha ao buscar os arquivos de mídia.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  // Formatação de bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Estatísticas
  const stats = useMemo(() => {
    const total = mediaList.length;
    const images = mediaList.filter((m) => m.mediaType === 'IMAGE').length;
    const videos = mediaList.filter((m) => m.mediaType === 'VIDEO').length;
    const totalBytes = mediaList.reduce((acc, curr) => acc + (curr.fileSizeBytes || 0), 0);
    return {
      total,
      images,
      videos,
      storageFormatted: formatBytes(totalBytes),
    };
  }, [mediaList]);

  // Filtragem
  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.checksumSha256.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === 'ALL' || item.mediaType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [mediaList, searchTerm, selectedType]);

  // Manipuladores de Arquivo / Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!customName) {
        setCustomName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!customName) {
        setCustomName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: 'Selecione um arquivo',
        description: 'É necessário escolher uma imagem, vídeo ou documento.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      await kioskService.uploadMedia(selectedFile, customName || selectedFile.name);
      toast({
        title: 'Upload concluído!',
        description: 'Mídia salva e disponível para uso nas apresentações dos totens.',
      });
      setIsUploadOpen(false);
      setSelectedFile(null);
      setCustomName('');
      loadMedia(true);
    } catch (err: any) {
      toast({
        title: 'Erro no upload',
        description: err?.response?.data?.message || 'Falha ao enviar arquivo de mídia.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Excluir Mídia
  const handleDeleteMedia = async () => {
    if (!mediaToDelete) return;
    setIsDeleting(true);
    try {
      await kioskService.deleteMedia(mediaToDelete.id);
      toast({
        title: 'Mídia removida',
        description: `O arquivo ${mediaToDelete.name} foi excluído do repositório.`,
      });
      setMediaToDelete(null);
      loadMedia(true);
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir mídia',
        description: err?.response?.data?.message || 'Falha ao remover o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Copiar SHA-256
  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    toast({
      title: 'Checksum copiado',
      description: 'Hash SHA-256 copiado para a área de transferência.',
    });
  };

  // Ícone por tipo
  const renderTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className="h-4 w-4 text-emerald-400" />;
      case 'VIDEO':
        return <FileVideo className="h-4 w-4 text-cyan-400" />;
      case 'AUDIO':
        return <Music className="h-4 w-4 text-amber-400" />;
      case 'DOCUMENT':
      default:
        return <FileText className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <StandardLayout
      title="Biblioteca de Mídias"
      subtitle="Gerenciamento de imagens, vídeos e assets em alta resolução para os totens"
    >
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Film className="h-6 w-6 text-primary" />
              Biblioteca de Mídias
            </h1>
            <p className="text-sm text-muted-foreground">
              Armazene vídeos institucionais, imagens publicitárias e informativos com controle de integridade SHA-256.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMedia(true)}
              disabled={refreshing || loading}
              className="gap-2 rounded-xl border-border hover:bg-card"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              onClick={() => {
                setSelectedFile(null);
                setCustomName('');
                setIsUploadOpen(true);
              }}
              className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md"
            >
              <Upload className="h-4 w-4" />
              Fazer Upload de Mídia
            </Button>
          </div>
        </div>

        {/* Resumo / Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total de Arquivos</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{stats.total}</h3>
              </div>
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Film className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Imagens & Banners</p>
                <h3 className="text-2xl font-bold text-emerald-500 mt-1">{stats.images}</h3>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <ImageIcon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Vídeos em Alta Definição</p>
                <h3 className="text-2xl font-bold text-cyan-400 mt-1">{stats.videos}</h3>
              </div>
              <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
                <FileVideo className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Espaço Utilizado</p>
                <h3 className="text-2xl font-bold text-purple-400 mt-1">{stats.storageFormatted}</h3>
              </div>
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
                <HardDrive className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome do arquivo ou checksum..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-card border-border"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              aria-label="Filtrar por tipo de mídia"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="IMAGE">Imagens</option>
              <option value="VIDEO">Vídeos</option>
              <option value="AUDIO">Áudios</option>
              <option value="DOCUMENT">Documentos PDF</option>
            </select>
          </div>
        </div>

        {/* Grid de Mídias */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <Card key={n} className="border-border bg-card/60 animate-pulse h-56">
                <CardContent className="p-0" />
              </Card>
            ))}
          </div>
        ) : filteredMedia.length === 0 ? (
          <Card className="border-border bg-card/60">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                <Film className="h-10 w-10" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-semibold text-foreground">
                  {mediaList.length === 0 ? 'Nenhuma mídia armazenada' : 'Nenhuma mídia encontrada'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {mediaList.length === 0
                    ? 'Faça o upload do primeiro vídeo, banner ou documento para compor as telas dos totens.'
                    : 'Tente alterar os termos de busca ou filtros.'}
                </p>
              </div>
              {mediaList.length === 0 && (
                <Button 
                  onClick={() => setIsUploadOpen(true)}
                  className="gap-2 bg-primary text-white rounded-xl"
                >
                  <Upload className="h-4 w-4" />
                  Fazer Upload Agora
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredMedia.map((asset) => (
              <Card 
                key={asset.id} 
                className="group border-border bg-card hover:border-primary/50 transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-sm"
              >
                {/* Visualizador / Thumbnail */}
                <div 
                  className="relative aspect-video bg-muted/60 flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => setPreviewMedia(asset)}
                >
                  {asset.mediaType === 'IMAGE' ? (
                    <img 
                      src={`/api/kiosk-media/${asset.id}/thumbnail`} 
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : asset.mediaType === 'VIDEO' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950/40 text-cyan-400 group-hover:scale-105 transition-transform duration-300">
                      <FileVideo className="h-10 w-10 mb-1" />
                      <span className="text-[11px] font-mono text-zinc-300">Vídeo</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      {renderTypeIcon(asset.mediaType)}
                      <span className="text-xs mt-1">{asset.mediaType}</span>
                    </div>
                  )}

                  {/* Badge de tipo flutuante */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1">
                    {renderTypeIcon(asset.mediaType)}
                    <span>{asset.mediaType}</span>
                  </div>

                  {/* Overlay com botão Preview */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary" className="gap-1.5 rounded-lg text-xs h-8">
                      <Eye className="h-3.5 w-3.5" />
                      Visualizar
                    </Button>
                  </div>
                </div>

                {/* Detalhes do Arquivo */}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1" title={asset.name}>
                      {asset.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatBytes(asset.fileSizeBytes)}</span>
                      {asset.width && asset.height && (
                        <span>{asset.width}x{asset.height}px</span>
                      )}
                    </div>
                  </div>

                  {/* Checksum SHA-256 */}
                  <div className="p-2 rounded-lg bg-muted/40 border border-border/60 text-[11px] flex items-center justify-between">
                    <span className="font-mono text-muted-foreground truncate max-w-[170px]" title={asset.checksumSha256}>
                      SHA: {asset.checksumSha256.substring(0, 16)}...
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySha(asset.checksumSha256)}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                      title="Copiar Checksum Completo"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Ações */}
                  <div className="pt-1 flex items-center justify-between gap-1 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                    >
                      <a href={`/api/kiosk-media/${asset.id}/content`} download={asset.name} target="_blank" rel="noreferrer">
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Baixar
                      </a>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMediaToDelete(asset)}
                      className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                      title="Excluir Arquivo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Upload de Mídia */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload de Mídia para Totens
            </DialogTitle>
            <DialogDescription>
              Envie fotos, vídeos ou PDFs. O arquivo será assinado com hash SHA-256 para cache seguro nos totens.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 py-2">
            {/* Dropzone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                dragActive ? 'border-primary bg-primary/10' : 'border-border/80 bg-background hover:bg-muted/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/mp4,video/webm,audio/*,application/pdf"
                onChange={handleFileChange}
              />
              <div className="p-3 bg-primary/10 text-primary rounded-xl mb-2">
                <Upload className="h-6 w-6" />
              </div>
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Clique para selecionar ou arraste o arquivo aqui
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formatos suportados: MP4, WebM, PNG, JPG, WebP, SVG, PDF
                  </p>
                </div>
              )}
            </div>

            {/* Nome customizado */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nome de Identificação no Sistema
              </label>
              <Input
                placeholder="Ex: Vídeo Institucional 2026, Banner Frotas..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                disabled={uploading}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={uploading || !selectedFile}
                className="bg-primary text-white hover:bg-primary/90 rounded-xl"
              >
                {uploading ? 'Enviando e Processando...' : 'Iniciar Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview */}
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {previewMedia?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              MIME: {previewMedia?.mimeType} • Tamanho: {previewMedia && formatBytes(previewMedia.fileSizeBytes)}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 flex items-center justify-center bg-black/80 rounded-2xl overflow-hidden max-h-[500px]">
            {previewMedia?.mediaType === 'IMAGE' ? (
              <img 
                src={`/api/kiosk-media/${previewMedia.id}/content`} 
                alt={previewMedia.name}
                className="max-h-[480px] w-auto object-contain"
              />
            ) : previewMedia?.mediaType === 'VIDEO' ? (
              <video 
                src={`/api/kiosk-media/${previewMedia.id}/content`} 
                controls 
                autoPlay 
                className="max-h-[480px] w-full"
              />
            ) : previewMedia?.mediaType === 'AUDIO' ? (
              <div className="p-8 w-full flex flex-col items-center justify-center">
                <Music className="h-12 w-12 text-primary mb-4" />
                <audio src={`/api/kiosk-media/${previewMedia.id}/content`} controls className="w-full" />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-2 text-primary" />
                <p>Visualização direta indisponível para este tipo.</p>
                <Button asChild variant="outline" className="mt-4">
                  <a href={`/api/kiosk-media/${previewMedia?.id}/content`} target="_blank" rel="noreferrer">
                    Abrir em nova aba
                  </a>
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="justify-between">
            <span className="text-xs font-mono text-muted-foreground self-center">
              SHA: {previewMedia?.checksumSha256}
            </span>
            <Button onClick={() => setPreviewMedia(null)} className="rounded-xl">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={!!mediaToDelete} onOpenChange={(open) => !open && setMediaToDelete(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              Excluir Mídia
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o arquivo <strong className="text-foreground">{mediaToDelete?.name}</strong>?
              Se este arquivo estiver sendo exibido em algum slide ativo de totem, ele deixará de ser reproduzido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setMediaToDelete(null)}
              disabled={isDeleting}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteMedia}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default TotensMidiasPage;
