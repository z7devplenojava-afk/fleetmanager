import React, { useEffect, useRef } from 'react';

interface ReCaptchaProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (element: string | HTMLElement, options: any) => number;
    };
  }
}

export const ReCaptcha: React.FC<ReCaptchaProps> = ({
  siteKey,
  onVerify,
  onExpire,
  onError,
  className = ''
}) => {
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Load reCAPTCHA script if not already loaded
    if (!window.grecaptcha) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Initialize reCAPTCHA when ready
    const initRecaptcha = () => {
      if (window.grecaptcha && recaptchaRef.current) {
        window.grecaptcha.ready(() => {
          if (recaptchaRef.current) {
            widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
              sitekey: siteKey,
              callback: onVerify,
              'expired-callback': onExpire,
              'error-callback': onError,
              size: 'invisible'
            });
          }
        });
      }
    };

    // Wait for reCAPTCHA to be ready
    if (window.grecaptcha) {
      initRecaptcha();
    } else {
      const checkRecaptcha = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(checkRecaptcha);
          initRecaptcha();
        }
      }, 100);
    }

    return () => {
      // Cleanup
      if (widgetIdRef.current !== null) {
        // Note: grecaptcha.reset() is not available for invisible reCAPTCHA
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify, onExpire, onError]);

  const execute = async (): Promise<string> => {
    if (window.grecaptcha) {
      try {
        const token = await window.grecaptcha.execute(siteKey, {
          action: 'candidate_submit'
        });
        return token;
      } catch (error) {
        console.error('reCAPTCHA execution failed:', error);
        throw error;
      }
    } else {
      throw new Error('reCAPTCHA not loaded');
    }
  };

  return (
    <div className={className}>
      <div ref={recaptchaRef}></div>
      {/* Hidden button to trigger reCAPTCHA */}
      <button
        type="button"
        onClick={execute}
        style={{ display: 'none' }}
        id="recaptcha-trigger"
      >
        Verify
      </button>
    </div>
  );
};

// Hook for easy reCAPTCHA usage
export const useReCaptcha = (siteKey: string) => {
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const execute = async (): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!window.grecaptcha) {
        throw new Error('reCAPTCHA not loaded');
      }

      const token = await window.grecaptcha.execute(siteKey, {
        action: 'candidate_submit'
      });
      
      setToken(token);
      return token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'reCAPTCHA verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setToken(null);
    setError(null);
  };

  return {
    token,
    isLoading,
    error,
    execute,
    reset
  };
}; 