import React from 'react';
import { getEnvironmentInfo, isDebugMode } from '@/config/environment';

/**
 * Componente que mostra o ambiente atual (apenas em modo debug)
 */
export const EnvironmentIndicator: React.FC = () => {
  if (!isDebugMode()) {
    return null;
  }

  const envInfo = getEnvironmentInfo();
  
  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'local':
        return 'bg-blue-500';
      case 'ci':
        return 'bg-purple-500';
      case 'dev':
        return 'bg-green-500';
      case 'test':
        return 'bg-yellow-500';
      case 'prod':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`${getEnvironmentColor(envInfo.environment)} text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg cursor-pointer`}
        title={`Ambiente: ${envInfo.config.name}\nAPI: ${envInfo.config.apiUrl}\nHostname: ${envInfo.hostname}`}
        onClick={() => {
          console.group('🌍 Environment Info');
          console.log(envInfo);
          console.groupEnd();
        }}
      >
        {envInfo.environment.toUpperCase()}
      </div>
    </div>
  );
};

export default EnvironmentIndicator;
