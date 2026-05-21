// src/components/WhatsAppConnect.tsx
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/api/axios';
import { AxiosError } from 'axios';
import { Button } from '../components/ui/button';
import { Loader2, Smartphone } from 'lucide-react';

const WhatsAppConnect = ({ onConnectionSuccess, onConnectionFailure, projectId, isActive = true }: { onConnectionSuccess: () => void, onConnectionFailure: (error: string) => void, projectId: string, isActive?: boolean }) => {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const appId = import.meta.env.VITE_REACT_APP_META_APP_ID;
  const configId = import.meta.env.VITE_REACT_APP_META_CONFIG_ID;
  const apiVersion = 'v17.0';

  const processWhatsAppAuthCode = (code: string) => {
    return axiosInstance.post('/whatsapp/exchange-code', { code, projectId });
  };

  const handleAuthResponse = useCallback(async (response: any) => {
    if (response.authResponse && response.authResponse.code) {
      try {
        await processWhatsAppAuthCode(response.authResponse.code);
        onConnectionSuccess();
      } catch (error) {
        const errorMessage = error instanceof AxiosError ? error.response?.data?.message || 'Server-side error during token exchange.' : 'Server-side error during token exchange.';
        onConnectionFailure(errorMessage);
      }
    } else {
      onConnectionFailure('The connection process was cancelled or failed.');
    }
    setIsProcessing(false);
  }, [onConnectionSuccess, onConnectionFailure, projectId]);

  const fbLoginCallback = useCallback((response: any) => {
    handleAuthResponse(response);
  }, [handleAuthResponse]);

  useEffect(() => {
    if (window.FB) {
      setIsSdkLoaded(true);
      return;
    }
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: apiVersion,
      });
      setIsSdkLoaded(true);
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [appId, apiVersion]);

  useEffect(() => {
    const handleMessage = (event: any) => {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('Received session info message from popup:', data);
        }
      } catch {}
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const launchWhatsAppSignup = () => {
    if (!isSdkLoaded) {
      onConnectionFailure('SDK is not ready. Please wait a moment and try again.');
      return;
    }
    setIsProcessing(true);

    window.FB.login(fbLoginCallback, {
      config_id: configId,
      response_type: 'code',
      scope: 'whatsapp_business_messaging,whatsapp_business_management,business_management',
      override_default_response_type: true,
      extras: {
        sessionInfoVersion: '3',
        version: 'v4',
        featureType: 'whatsapp_business_app_onboarding'
      }
    });
  };

  const isDisabled = !isSdkLoaded || isProcessing;

  return (
    <Button
      onClick={launchWhatsAppSignup}
      disabled={isDisabled}
      className={`w-full h-12 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 ${
        isActive 
          ? 'text-white shadow-xl shadow-green-600/20' 
          : 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'
      }`}
      style={isActive ? { backgroundColor: "#22B573", fontWeight: 700 } : { fontWeight: 700 }}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Smartphone className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
      )}
      {isProcessing ? 'Connecting...' : 'Connect WhatsApp Account'}
    </Button>
  );
};

export default WhatsAppConnect;