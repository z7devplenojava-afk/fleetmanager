import React, { useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Printer, Download, Copy, Check, X, QrCode, User, Building, 
  MapPin, Calendar, Briefcase, Shield, Hash, Phone
} from 'lucide-react';
import { Employee } from '@/types/employee';

interface EmployeeCrachaModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeCrachaModal: React.FC<EmployeeCrachaModalProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!employee) return null;

  const companySigla = employee.company?.sigla || (employee as any).empresaNome || (employee as any).companyName || 'VIG';
  const companyFullName = employee.company?.name || 'FLUXBUS OPERAÇÕES & SEGURANÇA';
  const workSector = (employee as any).department?.name || employee.unit?.name || employee.workPost?.name || 'Matriz / Operacional';
  const matricula = employee.registrationNumber || 'N/A';
  const cargo = employee.position?.name || 'Vigilante Patrimonial';
  const cpfMasked = employee.cpf || '***.***.***-**';

  // Payload codificado no QR Code para leitura rápida por fiscais/portaria
  const qrPayload = JSON.stringify({
    app: 'FluxBus-RH',
    id: employee.id,
    matricula,
    nome: employee.name,
    cargo,
    empresa: companySigla,
    cpf: cpfMasked,
    valido: employee.status === 'ACTIVE'
  });

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}&color=000000&bgcolor=ffffff&margin=8`;

  const handleCopyData = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    toast({
      title: 'Dados copiados!',
      description: 'Payload de identificação do crachá copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = qrImageUrl;
    a.download = `QRCode_Cracha_${employee.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({
      title: 'Download iniciado',
      description: 'QR Code do crachá salvo com sucesso.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-2xl overflow-hidden">
        
        {/* Estilo de impressão exclusivo do Crachá */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-cracha, #printable-cracha * {
              visibility: visible;
            }
            #printable-cracha {
              position: fixed;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%) scale(1.1);
              box-shadow: none !important;
              border: 1px solid #333 !important;
            }
          }
        `}} />

        <div className="bg-[#14161f] border border-gray-800 rounded-3xl p-6 text-white shadow-2xl flex flex-col items-center">
          
          {/* Header do Modal */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-gray-800/80 mb-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm uppercase tracking-wide">
              <QrCode className="h-4 w-4" />
              <span>Crachá Digital & QR Code</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── CARD FÍSICO DO CRACHÁ (FORMATO VERTICAL PADRÃO) ── */}
          <div 
            id="printable-cracha"
            ref={printRef}
            className="w-72 bg-gradient-to-b from-[#1c202a] via-[#161820] to-[#0f1118] border-2 border-gray-700/80 rounded-2xl p-5 shadow-2xl flex flex-col items-center relative overflow-hidden text-center"
          >
            {/* Lanyard Hole */}
            <div className="w-10 h-2.5 rounded-full bg-gray-900 border border-gray-700 mb-3 shadow-inner" />

            {/* Tarja de Identidade Visual / Empresa */}
            <div className="w-full py-1.5 px-3 bg-red-600 rounded-lg text-white font-black text-xs uppercase tracking-wider mb-3 shadow-md flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>{companySigla} • {companyFullName.substring(0, 20)}</span>
            </div>

            {/* Foto / Avatar do Funcionário */}
            <div className="relative mb-3">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-gray-900 to-gray-800 border-2 border-red-500/60 p-1 flex items-center justify-center shadow-lg shadow-black/40">
                <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center text-red-500 font-bold text-3xl">
                  {employee.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#161820] ${
                employee.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-500'
              }`} />
            </div>

            {/* Nome do Funcionário */}
            <h3 className="font-black text-white text-base uppercase leading-tight tracking-wide mb-1 px-1">
              {employee.name}
            </h3>

            {/* Cargo / Função */}
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              {cargo}
            </p>

            {/* Dados de Matrícula e Posto */}
            <div className="w-full bg-gray-900/80 border border-gray-800 rounded-xl p-2.5 mb-3 text-[11px] text-gray-300 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 uppercase font-semibold">Matrícula:</span>
                <span className="font-mono font-bold text-white">{matricula}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 uppercase font-semibold">CPF:</span>
                <span className="font-mono text-gray-300">{cpfMasked}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 uppercase font-semibold">Setor:</span>
                <span className="text-white font-medium truncate max-w-[150px]">{workSector}</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-2 rounded-xl shadow-md border border-gray-200">
              <img 
                src={qrImageUrl} 
                alt="QR Code Crachá" 
                className="w-28 h-28 object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-2">
              Verificação Operacional FluxBus
            </p>
          </div>

          {/* ── BOTÕES DE AÇÃO ── */}
          <div className="w-full flex items-center gap-2 mt-5">
            <Button
              onClick={handlePrint}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 rounded-xl shadow-md shadow-red-600/30 flex items-center justify-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </Button>

            <Button
              variant="outline"
              onClick={handleDownload}
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-xs h-9 rounded-xl px-3"
              title="Baixar QR Code"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              onClick={handleCopyData}
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-xs h-9 rounded-xl px-3"
              title="Copiar dados"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeCrachaModal;
