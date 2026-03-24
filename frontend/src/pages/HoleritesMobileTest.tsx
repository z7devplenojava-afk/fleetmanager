/**
 * 📱 VERSÃO DE TESTE MOBILE - Ultra Simplificada
 * 
 * Esta é uma versão GARANTIDA de funcionar em qualquer dispositivo.
 * Sem efeitos, sem animações complexas - apenas funcionalidade.
 */

import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { FileText, Receipt, MessageSquare, RefreshCw, Plus } from 'lucide-react';

const HoleritesMobileTest: React.FC = () => {
  const [activeTab, setActiveTab] = useState('holerites');

  return (
    <StandardLayout>
      <div className="space-y-4">
        {/* Header Ultra Simples */}
        <div className="bg-gray-800 rounded p-4">
          <h1 className="text-white text-xl font-bold">Holerites</h1>
          <p className="text-gray-400 text-sm mt-1">Sistema de documentos</p>
        </div>

        {/* Tabs Ultra Simples - GARANTIDAS de funcionar */}
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            <button
              onClick={() => setActiveTab('holerites')}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${
                activeTab === 'holerites'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white'
              }`}
            >
              📄 Holerites
            </button>
            
            <button
              onClick={() => setActiveTab('comprovantes')}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${
                activeTab === 'comprovantes'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white'
              }`}
            >
              🧾 Comprovantes
            </button>
            
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white'
              }`}
            >
              📨 Logs
            </button>
            
            <button
              onClick={() => setActiveTab('unificacao')}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${
                activeTab === 'unificacao'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white'
              }`}
            >
              🔄 Unificar
            </button>
          </div>
        </div>

        {/* Conteúdo conforme aba ativa */}
        {activeTab === 'holerites' && (
          <div className="space-y-4">
            {/* Cards Simples */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-red-900/20 border border-red-500 rounded p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-red-300 text-sm">Total Holerites</p>
                    <p className="text-white text-2xl font-bold">80</p>
                  </div>
                  <FileText className="w-10 h-10 text-red-500" />
                </div>
              </div>
              
              <div className="bg-green-900/20 border border-green-500 rounded p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-green-300 text-sm">Processados</p>
                    <p className="text-white text-2xl font-bold">80</p>
                  </div>
                  <FileText className="w-10 h-10 text-green-500" />
                </div>
              </div>
            </div>

            {/* Botão Grande */}
            <button className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-base">
              + Importar Holerites
            </button>

            {/* Lista Simples */}
            <div className="bg-gray-800 rounded p-4">
              <h3 className="text-white font-bold mb-3">Lista de Holerites</h3>
              <div className="space-y-2">
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-white font-medium">João Silva</p>
                  <p className="text-gray-400 text-sm">CPF: 123.456.789-00</p>
                  <p className="text-gray-400 text-sm">Período: 10/2025</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-white font-medium">Maria Santos</p>
                  <p className="text-gray-400 text-sm">CPF: 987.654.321-00</p>
                  <p className="text-gray-400 text-sm">Período: 10/2025</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comprovantes' && (
          <div className="space-y-4">
            {/* Cards Simples */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-green-900/20 border border-green-500 rounded p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-green-300 text-sm">Total Comprovantes</p>
                    <p className="text-white text-2xl font-bold">75</p>
                  </div>
                  <Receipt className="w-10 h-10 text-green-500" />
                </div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500 rounded p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-blue-300 text-sm">Processados</p>
                    <p className="text-white text-2xl font-bold">75</p>
                  </div>
                  <Receipt className="w-10 h-10 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Botão Grande */}
            <button className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-base">
              + Importar Comprovantes
            </button>

            {/* Lista Simples */}
            <div className="bg-gray-800 rounded p-4">
              <h3 className="text-white font-bold mb-3">Lista de Comprovantes</h3>
              <div className="space-y-2">
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-white font-medium">João Silva</p>
                  <p className="text-gray-400 text-sm">CPF: 123.456.789-00</p>
                  <p className="text-gray-400 text-sm">Período: 10/2025</p>
                  <p className="text-green-400 text-sm">Transferência: 05/11/2025</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-white font-medium">Maria Santos</p>
                  <p className="text-gray-400 text-sm">CPF: 987.654.321-00</p>
                  <p className="text-gray-400 text-sm">Período: 10/2025</p>
                  <p className="text-green-400 text-sm">Transferência: 05/11/2025</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-gray-800 rounded p-4">
            <h3 className="text-white font-bold mb-3">Logs de Envio</h3>
            <p className="text-gray-400">Histórico de envios...</p>
          </div>
        )}

        {activeTab === 'unificacao' && (
          <div className="bg-gray-800 rounded p-4">
            <h3 className="text-white font-bold mb-3">Unificação</h3>
            <p className="text-gray-400">Unificar documentos...</p>
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default HoleritesMobileTest;

