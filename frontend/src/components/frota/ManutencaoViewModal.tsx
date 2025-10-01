'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Wrench, 
  DollarSign, 
  MapPin, 
  Car, 
  AlertTriangle,
  X,
  Edit,
  Trash2,
  Image,
  FileText,
  Download,
  ZoomIn
} from 'lucide-react';

// Interface para manutenção
interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE' | 'IMPROVEMENT' | 'OTHER';
  description: string;
  cost?: number;
  provider?: string;
  mileage?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
  photos?: string[];
  documents?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ManutencaoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance: VehicleMaintenance | null;
  onEdit: (maintenance: VehicleMaintenance) => void; // Tornar onEdit obrigatório
  onDelete?: (maintenance: VehicleMaintenance) => void;
}

// Função para formatar data
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

// Função para formatar moeda
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para obter cor do status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
    case 'COMPLETED': return 'bg-green-100 text-green-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Função para obter cor da prioridade
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'LOW': return 'bg-green-100 text-green-800';
    case 'MEDIUM': return 'bg-blue-100 text-blue-800';
    case 'HIGH': return 'bg-yellow-100 text-yellow-800';
    case 'URGENT': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Função para obter cor do tipo
const getTypeColor = (type: string) => {
  switch (type) {
    case 'PREVENTIVE': return 'bg-blue-100 text-blue-800';
    case 'CORRECTIVE': return 'bg-red-100 text-red-800';
    case 'PREDICTIVE': return 'bg-purple-100 text-purple-800';
    case 'IMPROVEMENT': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Função para traduzir status
const translateStatus = (status: string) => {
  switch (status) {
    case 'SCHEDULED': return 'Agendada';
    case 'IN_PROGRESS': return 'Em Andamento';
    case 'COMPLETED': return 'Concluída';
    case 'CANCELLED': return 'Cancelada';
    default: return status;
  }
};

// Função para traduzir prioridade
const translatePriority = (priority: string) => {
  switch (priority) {
    case 'LOW': return 'Baixa';
    case 'MEDIUM': return 'Média';
    case 'HIGH': return 'Alta';
    case 'URGENT': return 'Urgente';
    default: return priority;
  }
};

// Função para traduzir tipo
const translateType = (type: string) => {
  switch (type) {
    case 'PREVENTIVE': return 'Preventiva';
    case 'CORRECTIVE': return 'Corretiva';
    case 'PREDICTIVE': return 'Preditiva';
    case 'IMPROVEMENT': return 'Melhoria';
    case 'OTHER': return 'Outro';
    default: return type;
  }
};

export function ManutencaoViewModal({ 
  isOpen, 
  onClose, 
  maintenance, 
  onEdit, // Adicionar onEdit aqui
  onDelete 
}: ManutencaoViewModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Debug: Log dos dados recebidos
  console.log('🔍 ManutencaoViewModal - Dados recebidos:', {
    isOpen,
    maintenanceId: maintenance?.id,
    maintenanceDate: maintenance?.date,
    maintenanceCreatedAt: maintenance?.createdAt,
    maintenanceType: maintenance?.maintenanceType,
    maintenanceStatus: maintenance?.status,
    maintenancePriority: maintenance?.priority,
    photos: maintenance?.photos,
    documents: maintenance?.documents,
    fullMaintenanceObject: maintenance // Adicionado para ver o objeto completo
  });

  if (!maintenance) return null;

  const handleEdit = () => {
    onEdit(maintenance); // Chamar onEdit diretamente
    onClose();
  };

  const handleDelete = () => {
    onDelete?.(maintenance);
    onClose();
  };

  const openLightbox = (imageSrc: string) => {
    setSelectedImage(imageSrc);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImage(null);
  };

  const isImageFile = (filename: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const hasImageExtension = imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    
    // Também considerar URLs do Unsplash como imagens
    const isUnsplashUrl = filename.includes('images.unsplash.com');
    
    return hasImageExtension || isUnsplashUrl;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto bg-seguranca-graphite border-gray-600 mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-seguranca-lightgray flex items-center gap-2">
            <Wrench className="text-seguranca-yellow" size={20} />
            Detalhes da Manutenção
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Veículo */}
          <div className="bg-seguranca-black/30 p-4 rounded-lg border border-gray-600">
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-3 flex items-center gap-2">
              <Car className="text-seguranca-yellow" size={18} />
              Informações do Veículo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400 text-sm">Placa:</span>
                <p className="text-seguranca-lightgray font-medium">{maintenance.vehiclePlate}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">ID do Veículo:</span>
                <p className="text-seguranca-lightgray font-mono text-sm break-all">{maintenance.vehicleId}</p>
              </div>
            </div>
          </div>

          {/* Informações da Manutenção */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-4">
              <div>
                <span className="text-gray-400 text-sm">Data da Manutenção:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-seguranca-lightgray font-medium">{formatDate(maintenance.date)}</p>
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Tipo:</span>
                <div className="mt-1">
                  <Badge className={getTypeColor(maintenance.maintenanceType)}>
                    <Wrench className="mr-1 h-3 w-3" />
                    {translateType(maintenance.maintenanceType)}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Status:</span>
                <div className="mt-1">
                  <Badge className={getStatusColor(maintenance.status)}>
                    {translateStatus(maintenance.status)}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Prioridade:</span>
                <div className="mt-1">
                  <Badge className={getPriorityColor(maintenance.priority)}>
                    {translatePriority(maintenance.priority)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-4">
              <div>
                <span className="text-gray-400 text-sm">Custo:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-4 w-4 text-green-400 font-semibold">R$</span>
                  <p className="text-seguranca-lightgray font-medium">
                    {formatCurrency(maintenance.cost)}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Fornecedor:</span>
                <p className="text-seguranca-lightgray mt-1">
                  {maintenance.provider || 'Não informado'}
                </p>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Quilometragem:</span>
                <p className="text-seguranca-lightgray mt-1">
                  {maintenance.mileage ? `${Number(maintenance.mileage).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km` : 'Não informado'}
                </p>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Data de Criação:</span>
                <p className="text-seguranca-lightgray mt-1">{formatDate(maintenance.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <span className="text-gray-400 text-sm">Descrição:</span>
            <p className="text-seguranca-lightgray mt-2 p-3 bg-seguranca-black/30 rounded-lg border border-gray-600">
              {maintenance.description}
            </p>
          </div>

          {/* Observações */}
          {maintenance.notes && (
            <div>
              <span className="text-gray-400 text-sm">Observações:</span>
              <p className="text-seguranca-lightgray mt-2 p-3 bg-seguranca-black/30 rounded-lg border border-gray-600">
                {maintenance.notes}
              </p>
            </div>
          )}

          {/* Fotos e Documentos */}
          {(maintenance.photos && maintenance.photos.length > 0) || (maintenance.documents && maintenance.documents.length > 0) ? (
            <div className="space-y-4">
              <span className="text-gray-400 text-sm">Anexos:</span>
              
              {/* Fotos */}
              {maintenance.photos && maintenance.photos.length > 0 && (
                <div>
                  <h4 className="text-seguranca-lightgray text-sm font-medium mb-3 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Fotos ({maintenance.photos.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {maintenance.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div 
                          className="aspect-square bg-seguranca-black/30 rounded-lg border border-gray-600 overflow-hidden cursor-pointer hover:border-seguranca-yellow transition-colors"
                          onClick={() => openLightbox(photo)}
                        >
                          <img 
                            src={photo.startsWith('http') ? photo : `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}${photo}`} 
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Erro ao carregar imagem:', photo);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('✅ Imagem carregada com sucesso:', photo);
                            }}
                          />
                          
                          {/* Overlay com ícone de zoom */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            
              {/* Documentos */}
              {maintenance.documents && maintenance.documents.length > 0 && (
                <div>
                  <h4 className="text-seguranca-lightgray text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentos ({maintenance.documents.length})
                  </h4>
                  <div className="space-y-2">
                    {maintenance.documents.map((document, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-seguranca-black/30 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                        <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-seguranca-lightgray flex-1 break-all">
                          {document.split('/').pop() || document}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500"
                          onClick={() => window.open(document, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">Nenhum anexo disponível para esta manutenção</p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-600">
            <Button
              onClick={handleEdit}
              className="w-full sm:flex-1 bg-seguranca-yellow text-seguranca-black hover:bg-yellow-400 transition-colors"
            >
              <Edit size={16} className="mr-2" />
              Editar Manutenção
            </Button>
            
            <Button
              onClick={handleDelete}
              variant="outline"
              className="w-full sm:flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
            >
              <Trash2 size={16} className="mr-2" />
              Excluir Manutenção
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full sm:flex-1 border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500 transition-colors"
            >
              <X size={16} className="mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Lightbox para visualização de imagens */}
      {lightboxOpen && selectedImage && (
        <Dialog open={lightboxOpen} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none">
            <DialogTitle className="sr-only">Visualização de imagem</DialogTitle>
            <div className="relative flex items-center justify-center min-h-[50vh]">
              {/* Botão de fechar */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full p-2"
                onClick={closeLightbox}
              >
                <X className="h-6 w-6" />
              </Button>
              
              {/* Imagem */}
              <img 
                src={selectedImage.startsWith('http') ? selectedImage : `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}${selectedImage}`} 
                alt="Visualização ampliada"
                className="max-w-full max-h-[90vh] object-contain"
                onClick={closeLightbox}
              />
              
              {/* Overlay clicável para fechar */}
              <div 
                className="absolute inset-0 -z-10" 
                onClick={closeLightbox}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
