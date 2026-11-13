'use client';

import React, { useCallback, useState } from 'react';
import { UniversalQrScannerModal } from '@/components/common/UniversalQrScannerModal';
import { VehicleScannedDetailsModal } from './VehicleScannedDetailsModal';
import fleetService, { VehicleQRCodeData } from '@/services/fleetService';
import { useToast } from '@/hooks/use-toast';

export interface QRScanResult {
    driverId?: string;
    driverName?: string;
    driverCnh?: string;
    vehicleId?: string;
    clientId?: string;
    plate?: string;
    odometer?: number;
    rawText?: string;
}

interface QRCodeScannerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScan: (result: QRScanResult) => void;
    /** Se true, abre automaticamente o modal de detalhes do veículo escaneado (Padrão: true) */
    showDetailsOnVehicleScan?: boolean;
    /** Callback opcional quando usuário clica para abrir OS do veículo escaneado */
    onOpenWorkOrder?: (vehicleId: string, plate: string) => void;
}

/**
 * Formatos aceitos no QR Code:
 * - JSON: {"driverId":"uuid","driverName":"nome","cnh":"123","vehicleId":"uuid","plate":"ABC1D23"}
 * - Passaporte de Veículo / Crachá formatado (com chaves VEICULO, MOTORISTA/RESP, CNH, KM, ID)
 * - driver:uuid ou driver:cnh
 * - vehicle:uuid ou vehicle:plate
 * - ABC-1234 ou ABC1D23 - placa direta Mercosul / antiga
 * - UUID direto
 * - qualquer texto - fallback como rawText
 */
const parseQRContent = (decodedText: string): QRScanResult | null => {
    const trimmed = decodedText.trim();
    if (!trimmed) return null;

    try {
        // Formato JSON
        if (trimmed.startsWith('{')) {
            const obj = JSON.parse(trimmed) as Record<string, any>;
            const result: QRScanResult = { rawText: trimmed };
            if (obj.driverId) result.driverId = String(obj.driverId);
            if (obj.driverName || obj.motorista || obj.driver) {
                result.driverName = String(obj.driverName || obj.motorista || obj.driver);
            }
            if (obj.cnh || obj.driverCnh) result.driverCnh = String(obj.cnh || obj.driverCnh);
            if (obj.vehicleId || obj.id) result.vehicleId = String(obj.vehicleId || obj.id);
            if (obj.plate || obj.placa) {
                result.plate = String(obj.plate || obj.placa).toUpperCase().replace(/[^A-Z0-9]/g, '');
            }
            if (obj.clientId) result.clientId = String(obj.clientId);
            if (obj.odometer || obj.km) result.odometer = Number(obj.odometer || obj.km);
            return result;
        }

        // Formato de texto multi-linha (ex: passaporte de crachá do veículo ou condutor)
        if (trimmed.includes('\n') || trimmed.includes('|') || trimmed.includes(':')) {
            const result: QRScanResult = { rawText: trimmed };

            // Extrair ID de veículo
            const idMatch = trimmed.match(/(?:ID|VEICULO_ID|VEHICLE_ID):\s*([0-9a-fA-F-]{36})/i);
            if (idMatch) result.vehicleId = idMatch[1].trim();

            // Extrair Placa
            const plateMatch = trimmed.match(/(?:VEICULO|VEÍCULO|PLACA|PLATE):\s*([A-Z0-9-]{7,8})/i);
            if (plateMatch) {
                result.plate = plateMatch[1].toUpperCase().replace(/[^A-Z0-9]/g, '');
            }

            // Extrair Motorista/Responsável
            const driverMatch = trimmed.match(/(?:MOTORISTA\/RESP|MOTORISTA|CONDUTOR|DRIVER):\s*([^\n\r|]+)/i);
            if (driverMatch) {
                const dName = driverMatch[1].trim();
                if (dName && !dName.toLowerCase().includes('não atribuído') && !dName.toLowerCase().includes('nao atribuido')) {
                    result.driverName = dName;
                }
            }

            // Extrair CNH
            const cnhMatch = trimmed.match(/CNH:\s*([0-9]+)/i);
            if (cnhMatch) result.driverCnh = cnhMatch[1].trim();

            // Extrair KM
            const kmMatch = trimmed.match(/(?:KM|ODÔMETRO|ODOMETRO):\s*(\d+)/i);
            if (kmMatch) result.odometer = Number(kmMatch[1]);

            if (result.vehicleId || result.plate || result.driverName || result.driverCnh) {
                return result;
            }
        }

        if (trimmed.toLowerCase().startsWith('client:')) {
            const id = trimmed.slice(7).trim();
            return id ? { clientId: id, rawText: trimmed } : null;
        }
        if (trimmed.toLowerCase().startsWith('driver:')) {
            const val = trimmed.slice(7).trim();
            return val ? { driverId: val, rawText: trimmed } : null;
        }
        if (trimmed.toLowerCase().startsWith('cnh:')) {
            const val = trimmed.slice(4).trim();
            return val ? { driverCnh: val, rawText: trimmed } : null;
        }
        if (trimmed.toLowerCase().startsWith('vehicle:')) {
            const val = trimmed.slice(8).trim();
            return val ? { vehicleId: val, rawText: trimmed } : null;
        }
        if (trimmed.toLowerCase().startsWith('plate:')) {
            const val = trimmed.slice(6).trim().toUpperCase();
            return val ? { plate: val, rawText: trimmed } : null;
        }

        // Reconhecimento de placa brasileira padrão ou Mercosul
        const clean = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(clean) || /^[A-Z]{3}[0-9]{4}$/.test(clean)) {
            return { plate: clean, rawText: trimmed };
        }

        // UUID direto
        if (/^[0-9a-fA-F-]{36}$/.test(trimmed)) {
            return { vehicleId: trimmed, rawText: trimmed };
        }

        return { rawText: trimmed, vehicleId: trimmed };
    } catch {
        return { rawText: trimmed, vehicleId: trimmed };
    }
};

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
    open,
    onOpenChange,
    onScan,
    showDetailsOnVehicleScan = true,
    onOpenWorkOrder,
}) => {
    const { toast } = useToast();
    const [scannedVehicleData, setScannedVehicleData] = useState<VehicleQRCodeData | null>(null);
    const [showVehicleDetails, setShowVehicleDetails] = useState<boolean>(false);

    const handleScanSuccess = useCallback(
        async (decodedText: string) => {
            console.log('📡 QR Code detectado:', decodedText);
            const result = parseQRContent(decodedText) || { rawText: decodedText };
            console.log('🔍 Resultado do parse:', result);

            // Fechar o modal de leitura de câmera
            onOpenChange(false);
            onScan(result);

            // Se for identificado como veículo e a opção de exibir detalhes estiver habilitada
            if (showDetailsOnVehicleScan && (result.plate || result.vehicleId)) {
                try {
                    let vehicleData: VehicleQRCodeData | null = null;
                    if (result.plate) {
                        vehicleData = await fleetService.getVehicleQRCodeByPlate(result.plate);
                    } else if (result.vehicleId) {
                        vehicleData = await fleetService.getVehicleQRCodeData(result.vehicleId);
                    }

                    if (vehicleData) {
                        setScannedVehicleData(vehicleData);
                        setShowVehicleDetails(true);
                    }
                } catch (err: any) {
                    console.warn('Não foi possível carregar dados detalhados do veículo escaneado:', err);
                    // Não bloqueia o fluxo de scan caso seja apenas uma leitura simples
                }
            }
        },
        [onScan, onOpenChange, showDetailsOnVehicleScan]
    );

    return (
        <>
            <UniversalQrScannerModal
                isOpen={open}
                onClose={() => onOpenChange(false)}
                onScanSuccess={handleScanSuccess}
                title="Ler QR Code da Frota / Portaria"
                description="Aponte a câmera para o QR Code do veículo ou motorista"
                placeholderManual="Digite a placa, ID ou cole o conteúdo do QR Code..."
                allowManualInput={true}
            />

            {/* Modal de Detalhes Completo do Veículo Escaneado */}
            <VehicleScannedDetailsModal
                isOpen={showVehicleDetails}
                data={scannedVehicleData}
                onClose={() => {
                    setShowVehicleDetails(false);
                    setScannedVehicleData(null);
                }}
                onOpenWorkOrder={onOpenWorkOrder}
            />
        </>
    );
};

export default QRCodeScanner;
