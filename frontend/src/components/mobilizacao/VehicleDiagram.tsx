import React from 'react';
import type { BodyType, ViewArea } from './DamagePointsMap';

interface VehicleDiagramProps {
  bodyType: BodyType;
  view: ViewArea;
  orientation?: 'right' | 'left';
  className?: string;
}

export const VehicleDiagram: React.FC<VehicleDiagramProps> = ({
  bodyType,
  view,
  orientation = 'right',
  className = ''
}) => {
  const flipClass = orientation === 'left' && view === 'side' ? '-scale-x-100' : '';

  // Renderização de Gráficos Vetoriais Precisos para Cada Veículo e Cada Vista
  const renderSvgContent = () => {
    switch (bodyType) {
      case 'pickup':
        return renderPickup(view);
      case 'van':
        return renderVan(view);
      case 'bus_urban':
        return renderBusUrban(view);
      case 'bus_road':
        return renderBusRoad(view);
      case 'bus_dd':
        return renderBusDD(view);
      case 'microbus':
        return renderMicrobus(view);
      case 'car':
      default:
        return renderCar(view);
    }
  };

  // --- 1. PICAPE / UTILITÁRIO (Saveiro / Strada / Hilux) ---
  const renderPickup = (view: ViewArea) => {
    if (view === 'side') {
      return (
        <svg viewBox="0 0 800 350" className="w-full h-full">
          <defs>
            <linearGradient id="pickupBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          {/* Sombra */}
          <ellipse cx="400" cy="310" rx="350" ry="18" fill="#000000" opacity="0.6" filter="blur(8px)" />
          {/* Caçamba Aberta */}
          <rect x="500" y="160" width="220" height="85" rx="6" fill="url(#pickupBody)" stroke="#94a3b8" strokeWidth="2" />
          <rect x="510" y="165" width="200" height="40" fill="#334155" opacity="0.3" rx="4" />
          {/* Cabine */}
          <path d="M 120,245 L 120,210 L 220,135 L 490,135 L 510,170 L 510,245 Z" fill="url(#pickupBody)" stroke="#94a3b8" strokeWidth="2" />
          {/* Para-brisa e Vidro Lateral */}
          <path d="M 230,143 L 310,143 L 310,200 L 195,200 Z" fill="url(#glass)" stroke="#475569" strokeWidth="2" />
          <path d="M 320,143 L 475,143 L 485,200 L 320,200 Z" fill="url(#glass)" stroke="#475569" strokeWidth="2" />
          {/* Linha da Porta */}
          <line x1="315" y1="140" x2="315" y2="245" stroke="#94a3b8" strokeWidth="2" />
          <rect x="330" y="180" width="30" height="6" rx="3" fill="#64748b" />
          {/* Rodas */}
          <g>
            <circle cx="230" cy="250" r="45" fill="#0f172a" stroke="#334155" strokeWidth="4" />
            <circle cx="230" cy="250" r="24" fill="#94a3b8" stroke="#475569" strokeWidth="3" />
            <circle cx="230" cy="250" r="8" fill="#0f172a" />
            <circle cx="590" cy="250" r="45" fill="#0f172a" stroke="#334155" strokeWidth="4" />
            <circle cx="590" cy="250" r="24" fill="#94a3b8" stroke="#475569" strokeWidth="3" />
            <circle cx="590" cy="250" r="8" fill="#0f172a" />
          </g>
          {/* Farol e Lanterna */}
          <path d="M 120,205 L 145,205 L 140,225 L 120,225 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
          <rect x="710" y="175" width="10" height="30" rx="3" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5" />
        </svg>
      );
    }

    if (view === 'front') {
      return (
        <svg viewBox="0 0 400 350" className="w-full h-full">
          <defs>
            <linearGradient id="pickupFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <ellipse cx="200" cy="315" rx="160" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
          {/* Corpo Frontal Picape */}
          <path d="M 60,280 L 70,180 L 110,100 L 290,100 L 330,180 L 340,280 Z" fill="url(#pickupFront)" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Para-brisa */}
          <path d="M 115,108 L 285,108 L 315,175 L 85,175 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          {/* Grade Frontal Robusta de Picape */}
          <rect x="100" y="195" width="200" height="50" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <line x1="110" y1="210" x2="290" y2="210" stroke="#64748b" strokeWidth="3" />
          <line x1="110" y1="230" x2="290" y2="230" stroke="#64748b" strokeWidth="3" />
          {/* Faróis Principais */}
          <rect x="75" y="195" width="45" height="30" rx="6" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
          <rect x="280" y="195" width="45" height="30" rx="6" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
          {/* Para-choque Picape */}
          <rect x="65" y="255" width="270" height="30" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="2" />
          <rect x="150" y="260" width="100" height="18" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
          {/* Retrovisores */}
          <rect x="35" y="150" width="30" height="20" rx="4" fill="#1e293b" />
          <rect x="335" y="150" width="30" height="20" rx="4" fill="#1e293b" />
          {/* Pneus Frontais */}
          <rect x="50" y="270" width="30" height="35" rx="6" fill="#0f172a" />
          <rect x="320" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        </svg>
      );
    }

    // Rear View - Picape (Tampa de Caçamba)
    return (
      <svg viewBox="0 0 400 350" className="w-full h-full">
        <ellipse cx="200" cy="315" rx="160" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
        {/* Corpo Traseiro Picape */}
        <rect x="65" y="130" width="270" height="150" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2.5" />
        {/* Tampa da Caçamba */}
        <rect x="90" y="145" width="220" height="105" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
        <rect x="170" y="155" width="60" height="12" rx="4" fill="#475569" />
        {/* Vidro Traseiro Pequeno */}
        <rect x="110" y="90" width="180" height="40" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        {/* Lanternas Traseiras Verticais */}
        <rect x="70" y="150" width="18" height="70" rx="4" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
        <rect x="312" y="150" width="18" height="70" rx="4" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
        {/* Para-choque e Placa */}
        <rect x="60" y="260" width="280" height="28" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
        <rect x="150" y="265" width="100" height="18" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
        <rect x="50" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        <rect x="320" y="270" width="30" height="35" rx="6" fill="#0f172a" />
      </svg>
    );
  };

  // --- 2. VAN / FURGÃO (Sprinter / Master) ---
  const renderVan = (view: ViewArea) => {
    if (view === 'side') {
      return (
        <svg viewBox="0 0 800 350" className="w-full h-full">
          <ellipse cx="400" cy="315" rx="360" ry="18" fill="#000000" opacity="0.6" filter="blur(8px)" />
          {/* Corpo Alto de Van Sprinter */}
          <path d="M 100,245 L 100,160 L 160,95 L 720,95 L 720,245 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Janelas Laterais de Van Passageiro */}
          <path d="M 170,105 L 280,105 L 280,165 L 170,165 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="290" y="105" width="130" height="60" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="430" y="105" width="130" height="60" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="570" y="105" width="130" height="60" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          {/* Porta Deslizante */}
          <line x1="425" y1="100" x2="425" y2="245" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2" />
          <rect x="440" y="180" width="20" height="6" rx="3" fill="#64748b" />
          {/* Rodas */}
          <circle cx="210" cy="250" r="45" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="210" cy="250" r="22" fill="#94a3b8" stroke="#475569" strokeWidth="3" />
          <circle cx="610" cy="250" r="45" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="610" cy="250" r="22" fill="#94a3b8" stroke="#475569" strokeWidth="3" />
          {/* Farol e Lanterna */}
          <path d="M 100,165 L 125,165 L 120,185 L 100,185 Z" fill="#fef08a" stroke="#eab308" strokeWidth="1.5" />
          <rect x="710" y="140" width="10" height="50" rx="3" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5" />
        </svg>
      );
    }

    if (view === 'front') {
      return (
        <svg viewBox="0 0 400 350" className="w-full h-full">
          <ellipse cx="200" cy="315" rx="150" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
          {/* Corpo Frontal Sprinter */}
          <path d="M 70,280 L 75,120 L 105,65 L 295,65 L 325,120 L 330,280 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Para-brisa Alto */}
          <path d="M 110,75 L 290,75 L 315,145 L 85,145 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          {/* Grade Mercedes Sprinter */}
          <rect x="110" y="165" width="180" height="55" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <circle cx="200" cy="192" r="16" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          {/* Faróis Sleek Sprinter */}
          <path d="M 75,165 L 105,165 L 105,195 L 75,185 Z" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
          <path d="M 325,165 L 295,165 L 295,195 L 325,185 Z" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
          {/* Para-choque e Retrovisores */}
          <rect x="65" y="245" width="270" height="35" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="2" />
          <rect x="150" y="252" width="100" height="20" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
          <rect x="35" y="110" width="32" height="40" rx="4" fill="#1e293b" />
          <rect x="333" y="110" width="32" height="40" rx="4" fill="#1e293b" />
          <rect x="55" y="270" width="30" height="35" rx="6" fill="#0f172a" />
          <rect x="315" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        </svg>
      );
    }

    // Rear View - Van Sprinter (Portas Duplas)
    return (
      <svg viewBox="0 0 400 350" className="w-full h-full">
        <ellipse cx="200" cy="315" rx="150" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
        <rect x="70" y="65" width="260" height="215" rx="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
        {/* Linha Central Portas Duplas */}
        <line x1="200" y1="65" x2="200" y2="280" stroke="#cbd5e1" strokeWidth="3" />
        {/* Vidros Traseiros Duplos */}
        <rect x="90" y="80" width="95" height="65" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        <rect x="215" y="80" width="95" height="65" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        {/* Lanternas Verticais Sprinter */}
        <rect x="72" y="120" width="16" height="110" rx="4" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
        <rect x="312" y="120" width="16" height="110" rx="4" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
        {/* Para-choque e Placa */}
        <rect x="65" y="255" width="270" height="28" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="2" />
        <rect x="150" y="260" width="100" height="18" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
        <rect x="55" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        <rect x="315" y="270" width="30" height="35" rx="6" fill="#0f172a" />
      </svg>
    );
  };

  // --- 3. ÔNIBUS URBANO (Apache Vip / Torino) ---
  const renderBusUrban = (view: ViewArea) => {
    if (view === 'side') {
      return (
        <svg viewBox="0 0 800 350" className="w-full h-full">
          <ellipse cx="400" cy="315" rx="370" ry="18" fill="#000000" opacity="0.6" filter="blur(8px)" />
          {/* Corpo Reto de Ônibus Urbano */}
          <rect x="80" y="80" width="650" height="165" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Faixa Amarela / Estilo Transporte Urbano */}
          <rect x="80" y="170" width="650" height="20" fill="#eab308" />
          {/* Janelas Retangulares Grandes */}
          <rect x="170" y="95" width="100" height="60" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="280" y="95" width="100" height="60" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="390" y="95" width="100" height="60" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="500" y="95" width="100" height="60" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="610" y="95" width="100" height="60" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          {/* Porta Dianteira e Porta Central Dupla */}
          <rect x="100" y="95" width="55" height="150" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="127" y1="95" x2="127" y2="245" stroke="#94a3b8" strokeWidth="2" />
          {/* Rodas de Ônibus com Calotas */}
          <circle cx="210" cy="245" r="42" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="210" cy="245" r="20" fill="#cbd5e1" stroke="#475569" strokeWidth="3" />
          <circle cx="590" cy="245" r="42" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="590" cy="245" r="20" fill="#cbd5e1" stroke="#475569" strokeWidth="3" />
        </svg>
      );
    }

    if (view === 'front') {
      return (
        <svg viewBox="0 0 400 350" className="w-full h-full">
          <ellipse cx="200" cy="315" rx="160" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
          {/* Frente Plana de Ônibus Urbano */}
          <rect x="60" y="55" width="280" height="225" rx="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Caixa do Itinerário / Letreiro Digital */}
          <rect x="100" y="70" width="200" height="30" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
          <text x="200" y="90" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="monospace">ITABIRA / CENTRO</text>
          {/* Para-brisa Amplo de Ônibus */}
          <rect x="75" y="110" width="250" height="75" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <line x1="200" y1="110" x2="200" y2="185" stroke="#334155" strokeWidth="2" />
          {/* Faróis Circulares Triplos de Ônibus Urbano */}
          <g fill="#fef08a" stroke="#eab308" strokeWidth="1.5">
            <circle cx="85" cy="210" r="10" />
            <circle cx="85" cy="230" r="10" />
            <circle cx="315" cy="210" r="10" />
            <circle cx="315" cy="230" r="10" />
          </g>
          {/* Para-choque e Placa */}
          <rect x="55" y="250" width="290" height="30" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="2" />
          <rect x="150" y="256" width="100" height="18" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
          {/* Espelhos Retrovisores Panorâmicos de Ônibus */}
          <path d="M 55,90 L 25,90 L 25,145 L 50,145" fill="none" stroke="#1e293b" strokeWidth="4" />
          <path d="M 345,90 L 375,90 L 375,145 L 350,145" fill="none" stroke="#1e293b" strokeWidth="4" />
          <rect x="50" y="270" width="30" height="35" rx="6" fill="#0f172a" />
          <rect x="320" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        </svg>
      );
    }

    // Rear View - Ônibus Urbano
    return (
      <svg viewBox="0 0 400 350" className="w-full h-full">
        <ellipse cx="200" cy="315" rx="160" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
        <rect x="60" y="55" width="280" height="225" rx="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
        {/* Letreiro Traseiro */}
        <rect x="130" y="70" width="140" height="24" rx="4" fill="#0284c7" />
        <text x="200" y="86" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="monospace">LINHA 080</text>
        {/* Vidro Traseiro */}
        <rect x="85" y="105" width="230" height="50" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        {/* Grelha de Refrigeração do Motor Traseiro */}
        <rect x="100" y="175" width="200" height="40" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <line x1="110" y1="185" x2="290" y2="185" stroke="#475569" strokeWidth="2" />
        <line x1="110" y1="195" x2="290" y2="195" stroke="#475569" strokeWidth="2" />
        <line x1="110" y1="205" x2="290" y2="205" stroke="#475569" strokeWidth="2" />
        {/* Lanternas Triplas Circulares */}
        <g fill="#ef4444" stroke="#dc2626" strokeWidth="1.5">
          <circle cx="75" cy="180" r="8" />
          <circle cx="75" cy="200" r="8" fill="#f59e0b" />
          <circle cx="75" cy="220" r="8" fill="#ffffff" />
          <circle cx="325" cy="180" r="8" />
          <circle cx="325" cy="200" r="8" fill="#f59e0b" />
          <circle cx="325" cy="220" r="8" fill="#ffffff" />
        </g>
        {/* Para-choque */}
        <rect x="55" y="250" width="290" height="30" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="2" />
        <rect x="150" y="256" width="100" height="18" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
        <rect x="50" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        <rect x="320" y="270" width="30" height="35" rx="6" fill="#0f172a" />
      </svg>
    );
  };

  // --- 4. ÔNIBUS RODOVIÁRIO (Paradiso 1200 / G8) ---
  const renderBusRoad = (view: ViewArea) => {
    if (view === 'side') {
      return (
        <svg viewBox="0 0 800 350" className="w-full h-full">
          <ellipse cx="400" cy="315" rx="370" ry="18" fill="#000000" opacity="0.6" filter="blur(8px)" />
          {/* Ônibus Rodoviário High-Deck */}
          <path d="M 80,240 L 80,110 Q 140,75 220,75 L 720,75 L 720,240 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Janelas Panorâmicas Continuas Fumê */}
          <path d="M 120,85 Q 160,85 220,85 L 710,85 L 710,145 L 120,145 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          {/* Portinholas do Bagageiro Inferior */}
          <g stroke="#cbd5e1" strokeWidth="2" fill="none">
            <rect x="230" y="175" width="80" height="60" rx="4" />
            <rect x="320" y="175" width="80" height="60" rx="4" />
            <rect x="410" y="175" width="80" height="60" rx="4" />
            <rect x="500" y="175" width="80" height="60" rx="4" />
          </g>
          {/* Rodas Rodoviárias */}
          <circle cx="210" cy="245" r="42" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="210" cy="245" r="20" fill="#cbd5e1" stroke="#475569" strokeWidth="3" />
          <circle cx="590" cy="245" r="42" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="590" cy="245" r="20" fill="#cbd5e1" stroke="#475569" strokeWidth="3" />
          <circle cx="670" cy="245" r="42" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="670" cy="245" r="20" fill="#cbd5e1" stroke="#475569" strokeWidth="3" />
        </svg>
      );
    }

    if (view === 'front') {
      return (
        <svg viewBox="0 0 400 350" className="w-full h-full">
          <ellipse cx="200" cy="315" rx="160" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
          {/* Frente Aerodinâmica G8 / Paradiso 1200 */}
          <path d="M 60,280 L 65,110 Q 120,55 200,55 Q 280,55 335,110 L 340,280 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Para-brisa Panorâmico Curvo */}
          <path d="M 80,115 Q 130,70 200,70 Q 270,70 320,115 L 325,170 L 75,170 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          {/* Faróis LED Agressivos */}
          <path d="M 75,200 L 125,195 L 115,225 L 75,225 Z" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
          <path d="M 325,200 L 275,195 L 285,225 L 325,225 Z" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
          {/* Retrovisores Aerodinâmicos */}
          <path d="M 65,85 C 30,85 20,130 40,150" fill="none" stroke="#1e293b" strokeWidth="5" />
          <path d="M 335,85 C 370,85 380,130 360,150" fill="none" stroke="#1e293b" strokeWidth="5" />
          {/* Para-choque */}
          <rect x="55" y="245" width="290" height="35" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="2" />
          <rect x="150" y="252" width="100" height="20" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
          <rect x="50" y="270" width="30" height="35" rx="6" fill="#0f172a" />
          <rect x="320" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        </svg>
      );
    }

    // Rear View - Ônibus Rodoviário
    return (
      <svg viewBox="0 0 400 350" className="w-full h-full">
        <ellipse cx="200" cy="315" rx="160" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
        <path d="M 60,280 L 65,100 L 95,55 L 305,55 L 335,100 L 340,280 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
        {/* Tampa do Motor com Aletas */}
        <rect x="90" y="165" width="220" height="75" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        <line x1="105" y1="180" x2="295" y2="180" stroke="#475569" strokeWidth="2" />
        <line x1="105" y1="195" x2="295" y2="195" stroke="#475569" strokeWidth="2" />
        <line x1="105" y1="210" x2="295" y2="210" stroke="#475569" strokeWidth="2" />
        {/* Lanternas LED Verticais */}
        <rect x="70" y="145" width="16" height="90" rx="4" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
        <rect x="314" y="145" width="16" height="90" rx="4" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
        <rect x="55" y="250" width="290" height="30" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="2" />
        <rect x="150" y="256" width="100" height="18" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
        <rect x="50" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        <rect x="320" y="270" width="30" height="35" rx="6" fill="#0f172a" />
      </svg>
    );
  };

  // --- 5. DOUBLE DECKER (DD) ---
  const renderBusDD = (view: ViewArea) => {
    if (view === 'side') {
      return (
        <svg viewBox="0 0 800 350" className="w-full h-full">
          <ellipse cx="400" cy="315" rx="370" ry="18" fill="#000000" opacity="0.6" filter="blur(8px)" />
          {/* Ônibus Imponente 2 Andares (Double Decker) */}
          <path d="M 80,240 L 80,75 L 140,40 L 720,40 L 720,240 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Janelas Superior e Inferior */}
          <rect x="150" y="55" width="550" height="50" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="250" y="125" width="450" height="45" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          {/* Rodas */}
          <circle cx="210" cy="245" r="42" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="590" cy="245" r="42" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="670" cy="245" r="42" fill="#0f172a" stroke="#334155" strokeWidth="4" />
        </svg>
      );
    }

    if (view === 'front') {
      return (
        <svg viewBox="0 0 400 350" className="w-full h-full">
          <ellipse cx="200" cy="315" rx="160" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
          <rect x="60" y="35" width="280" height="245" rx="12" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Vidros Duplos Superior e Inferior */}
          <rect x="75" y="50" width="250" height="70" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="75" y="130" width="250" height="60" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="55" y="245" width="290" height="35" rx="6" fill="#334155" />
          <rect x="50" y="270" width="30" height="35" rx="6" fill="#0f172a" />
          <rect x="320" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 400 350" className="w-full h-full">
        <ellipse cx="200" cy="315" rx="160" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
        <rect x="60" y="35" width="280" height="245" rx="12" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
        <rect x="85" y="50" width="230" height="55" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        <rect x="90" y="165" width="220" height="75" rx="6" fill="#1e293b" />
        <rect x="50" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        <rect x="320" y="270" width="30" height="35" rx="6" fill="#0f172a" />
      </svg>
    );
  };

  // --- 6. MICRO-ÔNIBUS (Volare) ---
  const renderMicrobus = (view: ViewArea) => {
    if (view === 'side') {
      return (
        <svg viewBox="0 0 800 350" className="w-full h-full">
          <ellipse cx="400" cy="315" rx="320" ry="18" fill="#000000" opacity="0.6" filter="blur(8px)" />
          <path d="M 120,240 L 120,130 L 180,90 L 680,90 L 680,240 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          <rect x="200" y="105" width="460" height="55" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <circle cx="230" cy="245" r="40" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="570" cy="245" r="40" fill="#0f172a" stroke="#334155" strokeWidth="4" />
        </svg>
      );
    }

    if (view === 'front') {
      return (
        <svg viewBox="0 0 400 350" className="w-full h-full">
          <ellipse cx="200" cy="315" rx="140" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
          <path d="M 75,280 L 80,120 L 110,70 L 290,70 L 320,120 L 325,280 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          <path d="M 115,80 L 285,80 L 310,145 L 90,145 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="70" y="245" width="260" height="35" rx="6" fill="#334155" />
          <rect x="60" y="270" width="30" height="35" rx="6" fill="#0f172a" />
          <rect x="310" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 400 350" className="w-full h-full">
        <ellipse cx="200" cy="315" rx="140" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
        <rect x="75" y="70" width="250" height="210" rx="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
        <rect x="95" y="85" width="210" height="60" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        <rect x="60" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        <rect x="310" y="270" width="30" height="35" rx="6" fill="#0f172a" />
      </svg>
    );
  };

  // --- 7. CARRO DE APOIO / PASSEIO (Gol / Onix / Hatch) ---
  const renderCar = (view: ViewArea) => {
    if (view === 'side') {
      return (
        <svg viewBox="0 0 800 350" className="w-full h-full">
          <ellipse cx="400" cy="310" rx="300" ry="16" fill="#000000" opacity="0.6" filter="blur(8px)" />
          {/* Silhueta Hatch Compacto */}
          <path d="M 140,245 L 140,215 L 230,165 L 360,135 L 530,135 L 610,185 L 660,245 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          <path d="M 240,170 L 350,143 L 350,200 L 210,200 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <path d="M 360,143 L 520,143 L 590,190 L 360,200 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <circle cx="240" cy="250" r="42" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="240" cy="250" r="20" fill="#cbd5e1" stroke="#475569" strokeWidth="3" />
          <circle cx="560" cy="250" r="42" fill="#0f172a" stroke="#334155" strokeWidth="4" />
          <circle cx="560" cy="250" r="20" fill="#cbd5e1" stroke="#475569" strokeWidth="3" />
        </svg>
      );
    }

    if (view === 'front') {
      return (
        <svg viewBox="0 0 400 350" className="w-full h-full">
          <ellipse cx="200" cy="315" rx="140" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
          <path d="M 80,280 L 90,190 L 130,120 L 270,120 L 310,190 L 320,280 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          <path d="M 135,128 L 265,128 L 295,185 L 105,185 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="75" y="255" width="250" height="28" rx="6" fill="#334155" />
          <rect x="60" y="270" width="30" height="35" rx="6" fill="#0f172a" />
          <rect x="310" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 400 350" className="w-full h-full">
        <ellipse cx="200" cy="315" rx="140" ry="14" fill="#000000" opacity="0.6" filter="blur(6px)" />
        <rect x="80" y="140" width="240" height="135" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
        <rect x="105" y="100" width="190" height="45" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        <rect x="60" y="270" width="30" height="35" rx="6" fill="#0f172a" />
        <rect x="310" y="270" width="30" height="35" rx="6" fill="#0f172a" />
      </svg>
    );
  };

  return (
    <div className={`w-full h-full flex items-center justify-center ${flipClass} ${className}`}>
      {renderSvgContent()}
    </div>
  );
};
