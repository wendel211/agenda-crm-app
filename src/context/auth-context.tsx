import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { fetchMyBusinessContext } from '@/data/business';
import { identifyMonitoringUser, reportError } from '@/lib/monitoring';
import { hasPermission, type Permission } from '@/lib/permissions';
import { registerDevicePushToken } from '@/lib/reminders';
import { supabase } from '@/lib/supabase';
import type { Business, BusinessMembership } from '@/types';

interface AuthState {
  session: Session | null;
  business: Business | null;
  membership: BusinessMembership | null;
  /** true enquanto sessão e negócio ainda não foram resolvidos no arranque. */
  loading: boolean;
  /** true quando o app foi aberto por um link de recuperação de senha. */
  passwordRecovery: boolean;
  clearPasswordRecovery: () => void;
  refreshBusiness: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [membership, setMembership] = useState<BusinessMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const loadBusiness = useCallback(async (activeSession: Session | null) => {
    if (!activeSession) {
      setBusiness(null);
      setMembership(null);
      return;
    }
    try {
      const context = await fetchMyBusinessContext();
      setBusiness(context?.business ?? null);
      setMembership(context?.membership ?? null);
      if (context?.business) {
        registerDevicePushToken(context.business.id, activeSession.user.id).catch(() => undefined);
      }
    } catch (error) {
      reportError(error, { operation: 'load_business', userId: activeSession.user.id });
      setBusiness(null);
      setMembership(null);
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

  // Supabase retorna recuperação, convite e magic link pelo fragmento da URL.
  // Como detectSessionInUrl é desligado no React Native, abrimos a sessão aqui.
  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url) {
        return;
      }
      const fragment = url.split('#')[1];
      if (!fragment) {
        return;
      }
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error && type === 'recovery') {
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
  const can = useCallback(
    (permission: Permission) => hasPermission(membership?.role, permission),
    [membership?.role],
  );

  useEffect(() => {
    identifyMonitoringUser(session?.user.id, business?.id);
  }, [business?.id, session?.user.id]);

  return (
    <AuthContext.Provider
      value={{
        session,
        business,
        membership,
        loading,
        passwordRecovery,
        clearPasswordRecovery,
        refreshBusiness,
        can,
      }}
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
