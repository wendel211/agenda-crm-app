import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

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

  const load = useCallback(async () => {
    try {
      setError(undefined);
      setData(await fetcher());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { data, loading, error, refetch: load };
}
