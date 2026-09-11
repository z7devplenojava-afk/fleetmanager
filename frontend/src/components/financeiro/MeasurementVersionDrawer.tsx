import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, History, FileCode, CheckCircle, User, Calendar } from 'lucide-react';
import { measurementService } from '@/services/measurementService';

interface MeasurementVersionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bulletinId: string | null;
}

export const MeasurementVersionDrawer: React.FC<MeasurementVersionDrawerProps> = ({
  isOpen,
  onClose,
  bulletinId
}) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && bulletinId) {
      loadVersions(bulletinId);
    }
  }, [isOpen, bulletinId]);

  const loadVersions = async (id: string) => {
    try {
      const data = await measurementService.getVersions(id);
      setVersions(data);
      if (data && data.length > 0) {
        setSelectedVersion(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de versões:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-seguranca-graphite border-gray-600 text-seguranca-lightgray overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold flex items-center gap-2 text-seguranca-lightgray">
            <History className="h-5 w-5 text-seguranca-yellow" />
            Histórico Imutável de Versões (PRD 1.0)
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            Registro auditável de revisões e snapshots da medição
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhuma versão registrada para esta medição.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <Card
                  key={v.id}
                  onClick={() => setSelectedVersion(v)}
                  className={`cursor-pointer transition-all border p-3 ${selectedVersion?.id === v.id ? 'bg-seguranca-black border-seguranca-yellow' : 'bg-seguranca-black/50 border-gray-700 hover:border-gray-500'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-seguranca-yellow text-seguranca-black font-bold">
                      Versão {v.versionNumber}
                    </Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {v.createdAt ? new Date(v.createdAt).toLocaleString('pt-BR') : 'Data Recente'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mb-1">
                    <strong className="text-gray-400">Justificativa:</strong> {v.justification || 'Revisão da medição'}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <User size={12} /> {v.createdBy || 'Sistema'}
                    </span>
                    <span className="text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle size={12} /> Snapshot JSON Validado
                    </span>
                  </div>
                </Card>
              ))}

              {selectedVersion && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-xs font-semibold text-seguranca-yellow mb-2 flex items-center gap-1">
                    <FileCode size={14} /> Dados do Snapshot JSON da Versão {selectedVersion.versionNumber}
                  </h4>
                  <pre className="bg-seguranca-black p-3 rounded text-[10px] text-emerald-400 font-mono overflow-x-auto max-h-48 border border-gray-800">
                    {JSON.stringify(JSON.parse(selectedVersion.snapshotJson || '{}'), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
