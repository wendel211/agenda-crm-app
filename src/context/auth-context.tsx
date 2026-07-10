import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { fetchMyBusiness } from '@/data/business';
import { supabase } from '@/lib/supabase';
import type { Business } from '@/types';

interface AuthState {
  session: Session | null;
  business: Business | null;
  /** true enquanto sessão e negócio ainda não foram resolvidos no arranque. */
  loading: boolean;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBusiness = useCallback(async (activeSession: Session | null) => {
    if (!activeSession) {
      setBusiness(null);
      return;
    }
    try {
      setBusiness(await fetchMyBusiness());
    } catch {
      setBusiness(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadBusiness(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      await loadBusiness(next);
    });
    return () => subscription.subscription.unsubscribe();
  }, [loadBusiness]);

  const refreshBusiness = useCallback(async () => {
    await loadBusiness(session);
  }, [loadBusiness, session]);

  return (
    <AuthContext.Provider value={{ session, business, loading, refreshBusiness }}>
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
