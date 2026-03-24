import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, User, Building, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
// import { QRCodeSVG } from 'qrcode.react'; // Not in package.json, will use simple display or check again

import { StandardLayout } from '@/components/StandardLayout';

const PassengerQRCode: React.FC = () => {
    const { user } = useAuth();

    // QRCode data structure from PRD: passengerId, name, company, time, pointCode
    const qrData = JSON.stringify({
        id: user?.id,
        name: user?.name,
        company: 'Vale', // Mock
        timestamp: new Date().toISOString()
    });

    return (
        <StandardLayout title="Meu Embarque" subtitle="Apresente este QR Code para realizar seu embarque">
            <div className="p-4 space-y-6 max-w-md mx-auto">
                <Card className="bg-white p-6 flex flex-col items-center justify-center">
                    <CardHeader className="text-center">
                        <CardTitle className="text-seguranca-black flex items-center justify-center gap-2">
                            <User className="text-seguranca-red" /> {user?.name}
                        </CardTitle>
                    </CardHeader>
                    <div className="bg-gray-100 p-8 rounded-xl border-2 border-dashed border-gray-300">
                        {/* Placeholder for QR Code - typically would use a library like qrcode.react */}
                        <div className="w-48 h-48 bg-seguranca-black flex items-center justify-center text-white text-center p-4">
                            [QR CODE]
                        </div>
                    </div>
                    <p className="mt-6 text-sm text-gray-500 text-center">
                        Apresente este código ao motorista no momento do embarque.
                    </p>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Info size={20} className="text-seguranca-yellow" /> Meus Dados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <User className="text-gray-400" size={20} />
                            <div>
                                <p className="text-xs text-gray-500">Passageiro</p>
                                <p className="text-white font-medium">{user?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Building className="text-gray-400" size={20} />
                            <div>
                                <p className="text-xs text-gray-500">Unidade</p>
                                <p className="text-white font-medium">Operação Vale - S11D</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Button className="w-full bg-seguranca-red hover:bg-seguranca-darkred text-white py-6 text-lg">
                    ATUALIZAR CÓDIGO
                </Button>
            </div>
        </StandardLayout>
    );
};

export default PassengerQRCode;
