import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Cookie, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookie-consent');
    if (!cookieConsent) {
      // Show banner after a short delay
      setTimeout(() => {
        setShowBanner(true);
      }, 2000);
    } else {
      // Load saved preferences
      const savedPreferences = localStorage.getItem('cookie-preferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    
    setPreferences(allAccepted);
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-preferences', JSON.stringify(allAccepted));
    setShowBanner(false);
    
    // Initialize analytics and marketing cookies
    initializeCookies(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    
    setPreferences(onlyNecessary);
    localStorage.setItem('cookie-consent', 'rejected');
    localStorage.setItem('cookie-preferences', JSON.stringify(onlyNecessary));
    setShowBanner(false);
    
    // Only initialize necessary cookies
    initializeCookies(onlyNecessary);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent', 'customized');
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
    setShowBanner(false);
    setShowSettings(false);
    
    // Initialize cookies based on preferences
    initializeCookies(preferences);
  };

  const initializeCookies = (prefs: CookiePreferences) => {
    // Necessary cookies (always enabled)
    if (prefs.necessary) {
      // Set session cookies, security tokens, etc.
      console.log('🍪 Necessary cookies initialized');
    }

    // Analytics cookies
    if (prefs.analytics) {
      // Initialize Google Analytics, etc.
      console.log('📊 Analytics cookies initialized');
      // Example: gtag('consent', 'update', { 'analytics_storage': 'granted' });
    }

    // Marketing cookies
    if (prefs.marketing) {
      // Initialize marketing tracking, etc.
      console.log('📢 Marketing cookies initialized');
      // Example: gtag('consent', 'update', { 'ad_storage': 'granted' });
    }

    // Preference cookies
    if (prefs.preferences) {
      // Initialize user preferences
      console.log('⚙️ Preference cookies initialized');
    }
  };

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900 border-t border-gray-700 shadow-lg">
        <div className="container mx-auto max-w-6xl">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-yellow-600 rounded-lg">
                    <Cookie className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">
                      🍪 Usamos Cookies
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Utilizamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar conteúdo. 
                      Ao continuar navegando, você concorda com nossa{' '}
                      <a href="/politicas-privacidade" className="text-yellow-400 hover:text-yellow-300 underline">
                        Política de Privacidade
                      </a>.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectAll}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Rejeitar
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aceitar Todos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cookie Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Cookies
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Personalize suas preferências de cookies. Você pode alterar essas configurações a qualquer momento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Necessary Cookies */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <Label className="text-white font-semibold">Cookies Necessários</Label>
                </div>
                <p className="text-gray-300 text-sm">
                  Essenciais para o funcionamento básico do site. Não podem ser desabilitados.
                </p>
              </div>
              <Switch
                checked={preferences.necessary}
                disabled={true}
                className="opacity-50"
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  <Label className="text-white font-semibold">Cookies de Análise</Label>
                </div>
                <p className="text-gray-300 text-sm">
                  Nos ajudam a entender como você usa o site para melhorar a experiência.
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) => updatePreference('analytics', checked)}
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <Label className="text-white font-semibold">Cookies de Marketing</Label>
                </div>
                <p className="text-gray-300 text-sm">
                  Usados para personalizar anúncios e medir a eficácia de campanhas.
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) => updatePreference('marketing', checked)}
              />
            </div>

            {/* Preference Cookies */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="h-4 w-4 text-purple-400" />
                  <Label className="text-white font-semibold">Cookies de Preferências</Label>
                </div>
                <p className="text-gray-300 text-sm">
                  Lembram suas escolhas para personalizar sua experiência no site.
                </p>
              </div>
              <Switch
                checked={preferences.preferences}
                onCheckedChange={(checked) => updatePreference('preferences', checked)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePreferences}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Salvar Preferências
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;