import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Bus, 
    Clock, 
    AlertTriangle, 
    MapPin, 
    Users, 
    Heart, 
    ChevronRight,
    Bell
} from 'lucide-react';

interface NotificationItem {
    id: string;
    time: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    badgeBg: string;
}

const NOTIFICATIONS: NotificationItem[] = [
    {
        id: '1',
        time: '08:12',
        title: 'O ônibus da linha Rosa já saiu do ponto',
        description: 'SHZ-3A40 ➔ Serra Verde',
        icon: Bus,
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20'
    },
    {
        id: '2',
        time: '08:05',
        title: 'Alteração no horário',
        description: 'O horário das 12:30 foi atualizado.',
        icon: Clock,
        color: 'text-blue-400',
        badgeBg: 'bg-blue-500/20'
    },
    {
        id: '3',
        time: '07:50',
        title: 'Atraso de 8 minutos',
        description: 'Na linha Azul - Belo Vale devido a trânsito intenso.',
        icon: AlertTriangle,
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/20'
    },
    {
        id: '4',
        time: '07:30',
        title: 'Nova parada disponível',
        description: 'Ponto: Av. do Contorno, 3450 habilitado para embarque.',
        icon: MapPin,
        color: 'text-purple-400',
        badgeBg: 'bg-purple-500/20'
    },
    {
        id: '5',
        time: '07:15',
        title: 'Atualização de ocupação',
        description: 'Linha Verde com 92% de ocupação no momento.',
        icon: Users,
        color: 'text-pink-400',
        badgeBg: 'bg-pink-500/20'
    }
];

export const PassengerNotificationsTab: React.FC = () => {
    return (
        <div className="space-y-4 max-w-md mx-auto pb-6">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-400" /> Notificações
                </h3>
                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                    5 novas hoje
                </Badge>
            </div>

            <div className="space-y-3">
                {NOTIFICATIONS.map((item) => (
                    <Card key={item.id} className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-2xl shadow-lg hover:border-slate-700 transition-all flex items-start gap-3.5">
                        <div className={`p-2.5 rounded-xl ${item.badgeBg} ${item.color} shrink-0`}>
                            <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono font-bold text-slate-400">{item.time}</span>
                                <ChevronRight className="h-4 w-4 text-slate-600" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-100 mt-0.5">{item.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Banner Motivacional (Imagem 2) */}
            <Card className="bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-slate-900 border-blue-800/40 text-white p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
                <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl">
                    <Heart className="h-6 w-6 text-blue-400 fill-blue-400/20" />
                </div>
                <div>
                    <h5 className="text-xs font-black text-white">Viaje com mais tranquilidade!</h5>
                    <p className="text-[11px] text-slate-300">A Viação São Silvestre cuida de você.</p>
                </div>
            </Card>
        </div>
    );
};

export default PassengerNotificationsTab;
