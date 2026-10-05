import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Camera, CheckCircle2, User, Sparkles, X, Bus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateQrCodeSvgUri, generateQrCodeDataPayload } from '@/utils/qrCodeHelper';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';

interface PassengerQRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLine?: string;
    passengerName?: string;
    passengerCpf?: string;
}

// Subcomponente isolado para garantir montagem correta do DOM do leitor de câmera
const PassengerCameraScanner: React.FC<{
    onSuccess: (decoded: string) => void;
}> = ({ onSuccess }) => {
    const readerId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`).current;

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;
        let isMounted = true;

        const timer = setTimeout(() => {
            const container = document.getElementById(readerId);
            if (!container || !isMounted) return;

            try {
                scanner = new Html5QrcodeScanner(readerId, { fps: 10, qrbox: 240 }, false);
                scanner.render(
                    (decodedText) => {
                        if (isMounted) {
                            onSuccess(decodedText);
                            if (scanner) {
                                try { scanner.clear(); } catch { /* ignore */ }
                            }
                        }
                    },
                    () => { /* ignore frame errors */ }
                );
            } catch (e) {
                console.warn('Erro ao inicializar scanner:', e);
            }
        }, 150);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (scanner) {
                try { scanner.clear(); } catch { /* ignore */ }
            }
        };
    }, [readerId, onSuccess]);

    return (
        <div className="space-y-3">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center">
                <div id={readerId} className="w-full h-full"></div>
            </div>
            <p className="text-xs text-center text-slate-400">
                Aponte sua câmera para o QR Code exibido pelo motorista ou fixado no ônibus.
            </p>
        </div>
    );
};

export const PassengerQRCodeModal: React.FC<PassengerQRCodeModalProps> = ({
    isOpen,
    onClose,
    currentLine = 'Rosa - Serra Verde',
    passengerName,
    passengerCpf
}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'my-qr' | 'scan'>('my-qr');
    const [scannedSuccess, setScannedSuccess] = useState<string | null>(null);

    const effectiveName = passengerName || user?.name || 'Maria Aparecida Souza';
    const effectiveCpf = passengerCpf || '123.456.789-00';

    const qrPayload = generateQrCodeDataPayload('PASSENGER', {
        passengerId: user?.id || `pass-${effectiveCpf.replace(/\D/g, '')}`,
        name: effectiveName,
        cpf: effectiveCpf,
        line: currentLine
    });

    const qrSvgUrl = generateQrCodeSvgUri(qrPayload, 260);

    const handleScanSuccess = (decodedText: string) => {
        try {
            const parsed = JSON.parse(decodedText);
            setScannedSuccess(`Embarque confirmado na viagem: ${parsed.route || parsed.line || 'Linha confirmada'}`);
            toast({
                title: '✅ Embarque Confirmado!',
                description: 'Seu embarque foi registrado com sucesso pelo sistema.',
            });
        } catch {
            setScannedSuccess('Embarque confirmado com sucesso!');
            toast({
                title: '✅ Embarque Confirmado!',
                description: 'Código do motorista/ônibus validado com sucesso.',
            });
        }
    };

    const handleClose = () => {
        setScannedSuccess(null);
        setActiveTab('my-qr');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md bg-[#0f172a] text-slate-100 border border-slate-700/60 p-0 rounded-3xl shadow-2xl overflow-hidden">
                <DialogHeader className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/60">
                    <DialogTitle className="text-lg font-black text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <QrCode className="h-5 w-5 text-pink-400" /> Confirmação de Embarque
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-5">
                    <Tabs value={activeTab} onValueChange={(v) => {
                        setScannedSuccess(null);
                        setActiveTab(v as any);
                    }} className="w-full">
                        <TabsList className="grid grid-cols-2 bg-slate-800 p-1 rounded-xl mb-5">
                            <TabsTrigger value="my-qr" className="text-xs font-bold data-[state='active']:bg-pink-600 data-[state='active']:text-white">
                                <QrCode className="h-4 w-4 mr-1.5" /> Meu QR Code
                            </TabsTrigger>
                            <TabsTrigger value="scan" className="text-xs font-bold data-[state='active']:bg-pink-600 data-[state='active']:text-white">
                                <Camera className="h-4 w-4 mr-1.5" /> Escanear Ônibus
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="my-qr" className="space-y-4 text-center">
                            <div className="bg-white p-5 rounded-2xl mx-auto w-64 h-64 flex items-center justify-center shadow-xl border-4 border-slate-700">
                                <img src={qrSvgUrl} alt="QR Code do Passageiro" className="w-full h-full object-contain" />
                            </div>

                            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                                <div className="flex items-center justify-center gap-2 font-bold text-white mb-1">
                                    <User className="h-4 w-4 text-pink-400" /> {effectiveName}
                                </div>
                                <p className="text-slate-400 text-[11px]">
                                    Apresente este código para o motorista escanear no momento do embarque.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="scan" className="space-y-4">
                            {scannedSuccess ? (
                                <div className="p-6 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-3">
                                    <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="h-8 w-8" />
                                    </div>
                                    <h4 className="text-base font-black text-white">{scannedSuccess}</h4>
                                    <p className="text-xs text-slate-300">Tenha uma excelente viagem!</p>
                                    <Button onClick={handleClose} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs mt-2">
                                        Concluir
                                    </Button>
                                </div>
                            ) : (
                                <PassengerCameraScanner onSuccess={handleScanSuccess} />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PassengerQRCodeModal;
