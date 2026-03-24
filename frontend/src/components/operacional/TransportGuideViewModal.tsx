import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building, 
  Shield, 
  MapPin, 
  FileText, 
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from 'lucide-react';
import { TransportGuide, TransportGuideStatusLabels, TransportGuideStatusColors } from '@/types/transportGuide';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransportGuideViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guide: TransportGuide | null;
  onEdit?: () => void;
  onGeneratePDF?: () => void;
}

const TransportGuideViewModal: React.FC<TransportGuideViewModalProps> = ({
  open,
  onOpenChange,
  guide,
  onEdit,
  onGeneratePDF
}) => {
  if (!guide) return null;

  const getStatusBadge = () => {
    const label = TransportGuideStatusLabels[guide.status];
    const colorClass = TransportGuideStatusColors[guide.status];
    return <Badge className={colorClass}>{label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-500" />
              Detalhes da Guia de Transporte
            </DialogTitle>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações da Empresa */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informações da Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Empresa:</span>
                  <p className="font-medium">{guide.empresa}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">CNPJ:</span>
                  <p className="font-medium">{guide.cnpj}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Arma */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informações da Arma e Munições
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guide.numeroColete && (
                  <div>
                    <span className="text-sm text-muted-foreground">Nº do Colete:</span>
                    <p className="font-medium">{guide.numeroColete}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Nº da Arma:</span>
                  <p className="font-medium">{guide.numeroArma}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Calibre:</span>
                  <p className="font-medium">{guide.calibre}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Quantidade de Munições:</span>
                  <p className="font-medium">{guide.qtdMunicoes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Localização */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Informações de Localização
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Origem:</span>
                  <p className="font-medium mt-1">{guide.origem}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Destino:</span>
                  <p className="font-medium mt-1">{guide.destino}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Trajeto:</span>
                  <p className="font-medium mt-1">{guide.trajeto}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Motivo e Informações Adicionais */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Motivo e Informações Adicionais
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Motivo do Transporte:</span>
                  <p className="font-medium mt-1">{guide.motivo}</p>
                </div>
                {guide.arquivoGuiaPath && (
                  <div>
                    <span className="text-sm text-muted-foreground">Arquivo da Guia:</span>
                    <p className="font-medium mt-1 text-blue-500">
                      <a href={guide.arquivoGuiaPath} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Ver arquivo anexado
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações de Criação e Aprovação */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Criado por:
                  </span>
                  <p className="font-medium">{guide.createdBy}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Criado em:
                  </span>
                  <p className="font-medium">
                    {format(new Date(guide.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>

                {guide.approvedBy && (
                  <>
                    <div>
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Aprovado por:
                      </span>
                      <p className="font-medium">{guide.approvedBy}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Aprovado em:
                      </span>
                      <p className="font-medium">
                        {guide.approvedAt && format(new Date(guide.approvedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </>
                )}

                {guide.rejectedBy && (
                  <>
                    <div>
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Rejeitado por:
                      </span>
                      <p className="font-medium">{guide.rejectedBy}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Rejeitado em:
                      </span>
                      <p className="font-medium">
                        {guide.rejectedAt && format(new Date(guide.rejectedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    {guide.rejectionReason && (
                      <div className="col-span-2">
                        <span className="text-sm text-muted-foreground">Motivo da Rejeição:</span>
                        <p className="font-medium text-red-500">{guide.rejectionReason}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            {onGeneratePDF && (
              <Button 
                type="button" 
                variant="outline"
                onClick={onGeneratePDF}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            )}
            {onEdit && guide.status === 'DRAFT' && (
              <Button 
                type="button" 
                onClick={onEdit}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                Editar Guia
              </Button>
            )}
            <Button 
              type="button" 
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransportGuideViewModal;



























