import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { reportError } from '@/lib/monitoring';

interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
  refetch: () => Promise<void>;
}

/**
 * Busca dados quando a tela ganha foco — assim listas se atualizam
 * automaticamente ao voltar de um formulário.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[]): QueryState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);
  const dependencyKey = JSON.stringify(deps);

  const load = useCallback(async () => {
    try {
      setError(undefined);
      setData(await fetcherRef.current());
    } catch (cause) {
      reportError(cause, { operation: 'query_load', dependencyKey });
      setError(cause instanceof Error ? cause.message : 'Erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [dependencyKey]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { data, loading, error, refetch: load };
}
