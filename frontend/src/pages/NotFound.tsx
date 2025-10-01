
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Logo from '../components/Logo';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-seguranca-black flex flex-col items-center justify-center p-6">
      <div className="bg-seguranca-graphite rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <Logo size="md" />
        </div>
        
        <div className="flex justify-center mb-4">
          <div className="bg-seguranca-yellow p-3 rounded-full">
            <AlertTriangle size={32} className="text-black" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-gray-400 mb-6">Página não encontrada</p>
        <p className="text-gray-400 mb-8">A página que você está procurando não existe ou foi removida.</p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Voltar
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Ir para o Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
