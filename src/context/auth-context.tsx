import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { fetchMyBusiness } from '@/data/business';
import { identifyMonitoringUser, reportError } from '@/lib/monitoring';
import { supabase } from '@/lib/supabase';
import type { Business } from '@/types';

interface AuthState {
  session: Session | null;
  business: Business | null;
  /** true enquanto sessão e negócio ainda não foram resolvidos no arranque. */
  loading: boolean;
  /** true quando o app foi aberto por um link de recuperação de senha. */
  passwordRecovery: boolean;
  clearPasswordRecovery: () => void;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const loadBusiness = useCallback(async (activeSession: Session | null) => {
    if (!activeSession) {
      setBusiness(null);
      return;
    }
    try {
      setBusiness(await fetchMyBusiness());
    } catch (error) {
      reportError(error, { operation: 'load_business', userId: activeSession.user.id });
      setBusiness(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadBusiness(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, next) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
      }
      setSession(next);
      await loadBusiness(next);
    });
    return () => subscription.subscription.unsubscribe();
  }, [loadBusiness]);

  // Deep link de recuperação de senha: extrai os tokens do fragmento da URL
  // (detectSessionInUrl é desligado no React Native) e abre a sessão temporária.
  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url || !url.includes('reset-password')) {
        return;
      }
      const fragment = url.split('#')[1];
      if (!fragment) {
        return;
      }
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          setPasswordRecovery(true);
        }
      }
    }

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  const refreshBusiness = useCallback(async () => {
    await loadBusiness(session);
  }, [loadBusiness, session]);

  const clearPasswordRecovery = useCallback(() => setPasswordRecovery(false), []);

  useEffect(() => {
    identifyMonitoringUser(session?.user.id, business?.id);
  }, [business?.id, session?.user.id]);

  return (
    <AuthContext.Provider
      value={{ session, business, loading, passwordRecovery, clearPasswordRecovery, refreshBusiness }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

/** Atalho para telas internas, onde o negócio é garantido pelo roteamento. */
export function useBusiness(): Business {
  const { business } = useAuth();
  if (!business) {
    throw new Error('Nenhum negócio carregado — a tela deveria estar atrás do guard de sessão');
  }
  return business;
}
