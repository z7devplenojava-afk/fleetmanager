import React from 'react';
import { X, MapPin, Clock, User, Building, Camera, FileText, QrCode, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Visit } from '@/types/visit';

interface VisitViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit | null;
  onEdit: (visit: Visit) => void;
  onDelete: (visitId: string) => void;
}

export const VisitViewModal: React.FC<VisitViewModalProps> = ({
  open,
  onOpenChange,
  visit,
  onEdit,
  onDelete,
}) => {
  console.log('👁️ VisitViewModal renderizado - visit:', visit);
  
  if (!visit) {
    console.warn('⚠️ VisitViewModal: visit é null ou undefined');
    return null;
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    try {
      return timeString.substring(0, 5);
    } catch (e) {
      return timeString;
    }
  };

  const formatDateTime = (dateString: string | null | undefined, timeString: string | null | undefined) => {
    if (!dateString || !timeString) {
      const date = dateString ? formatDate(dateString) : 'N/A';
      const time = timeString ? formatTime(timeString) : 'N/A';
      return `${date} ${time}`;
    }
    try {
      // LocalDate vem como "2024-12-07" e LocalTime como "14:30:00" ou "14:30"
      const date = new Date(`${dateString}T${timeString}`);
      if (isNaN(date.getTime())) {
        // Se falhar, tentar formatar manualmente
        return `${formatDate(dateString)} ${formatTime(timeString)}`;
      }
      return date.toLocaleString('pt-BR');
    } catch (e) {
      // Fallback: formatar manualmente
      return `${formatDate(dateString)} ${formatTime(timeString)}`;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', className: 'bg-blue-500 text-white' },
      SCHEDULED: { label: 'Agendada', className: 'bg-blue-500 text-white' },
      IN_PROGRESS: { label: 'Em Andamento', className: 'bg-yellow-500 text-white' },
      COMPLETED: { label: 'Concluída', className: 'bg-green-500 text-white' },
      NOT_COMPLETED: { label: 'Não Realizada', className: 'bg-gray-500 text-white' },
      CANCELLED: { label: 'Cancelada', className: 'bg-red-500 text-white' },
      MISSED: { label: 'Não Realizada', className: 'bg-gray-500 text-white' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status || 'Desconhecido', className: 'bg-gray-500 text-white' };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleEdit = () => {
    onEdit(visit);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta visita?')) {
      onDelete(visit.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-700">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-white text-xl">
              Detalhes da Visita
            </DialogTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="border-red-600 text-red-400 hover:bg-red-900"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="font-medium">Data e Horário:</span>
                  </div>
                  <p className="text-white ml-6">{formatDateTime(visit.visitDate, visit.visitTime)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-300">
                    <span className="font-medium">Status:</span>
                  </div>
                  <div className="ml-6">{getStatusBadge(visit.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300">
                    <User className="w-4 h-4 mr-2" />
                    <span className="font-medium">Supervisor:</span>
                  </div>
                  <p className="text-white ml-6">{visit.supervisorName || 'N/A'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-300">
                    <Building className="w-4 h-4 mr-2" />
                    <span className="font-medium">Posto de Trabalho:</span>
                  </div>
                  <p className="text-white ml-6">{visit.workPostName || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <Building className="w-4 h-4 mr-2" />
                  <span className="font-medium">Cliente:</span>
                </div>
                <p className="text-white ml-6">{visit.clientName || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          {(visit.latitude || visit.longitude || visit.locationAddress) && (
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {visit.locationAddress && (
                  <div className="space-y-1">
                    <div className="text-gray-300 font-medium">Endereço:</div>
                    <p className="text-white">{visit.locationAddress}</p>
                  </div>
                )}
                
                {(visit.latitude || visit.longitude) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visit.latitude && (
                      <div className="space-y-1">
                        <div className="text-gray-300 font-medium">Latitude:</div>
                        <p className="text-white">{visit.latitude}</p>
                      </div>
                    )}
                    
                    {visit.longitude && (
                      <div className="space-y-1">
                        <div className="text-gray-300 font-medium">Longitude:</div>
                        <p className="text-white">{visit.longitude}</p>
                      </div>
                    )}
                  </div>
                )}

                {visit.latitude && visit.longitude && (
                  <div className="mt-4">
                    <a
                      href={`https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-seguranca-yellow hover:text-seguranca-yellow/80"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Ver no Google Maps
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* QR Code */}
          {visit.qrCodeScanned && (
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <QrCode className="w-5 h-5 mr-2" />
                  QR Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-300 font-medium">Status:</span>
                    {visit.qrCodeVerified ? (
                      <Badge className="bg-green-500 text-white">
                        Verificado
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500 text-white">
                        Não Verificado
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-gray-300 font-medium">Dados do QR Code:</div>
                    <p className="text-white text-sm bg-seguranca-graphite p-2 rounded font-mono">
                      {visit.qrCodeScanned}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Funcionários Presentes */}
          {visit.presentEmployees && visit.presentEmployees.length > 0 && (
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Funcionários Presentes ({visit.presentEmployees.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {visit.presentEmployees.map((employeeId, index) => (
                    <Badge key={index} className="bg-seguranca-yellow text-black">
                      {visit.presentEmployeeNames?.[index] || `Funcionário ${employeeId}`}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Descrição e Observações */}
          {(visit.description || visit.observations) && (
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Descrição e Observações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {visit.description && (
                  <div className="space-y-2">
                    <div className="text-gray-300 font-medium">Descrição:</div>
                    <p className="text-white whitespace-pre-wrap">{visit.description}</p>
                  </div>
                )}
                
                {visit.observations && (
                  <div className="space-y-2">
                    <div className="text-gray-300 font-medium">Observações:</div>
                    <p className="text-white whitespace-pre-wrap">{visit.observations}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fotos */}
          {visit.photos && visit.photos.length > 0 && (
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Fotos ({visit.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {visit.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={`/api/files/${photo}`}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded border border-gray-600 cursor-pointer hover:opacity-80"
                        onClick={() => window.open(`/api/files/${photo}`, '_blank')}
                      />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Arquivos */}
          {visit.attachedFiles && visit.attachedFiles.length > 0 && (
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Arquivos ({visit.attachedFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {visit.attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-seguranca-graphite rounded border border-gray-700">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-white">{file}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/api/files/${file}`, '_blank')}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações do Sistema */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-400 space-y-1">
              {visit.createdAt && (
                <div>Criado em: {formatDateTime(visit.createdAt.split('T')[0], '00:00')}</div>
              )}
              {visit.createdByName && <div>Criado por: {visit.createdByName}</div>}
              {visit.updatedAt && (
                <div>Atualizado em: {formatDateTime(visit.updatedAt.split('T')[0], '00:00')}</div>
              )}
              {visit.updatedByName && <div>Atualizado por: {visit.updatedByName}</div>}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
