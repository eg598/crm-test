import { useCallback, useEffect, useState } from 'react';
import { Client } from '../types';
import { clientsApi } from '../api/clients.api';
import { useDebounce } from './useDebounce';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await clientsApi.list({ search: debouncedSearch || undefined, page, limit: 20 });
      setClients(res.data.data);
      setTotal(res.data.total);
    } catch {
      setError('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = (client: Client) => {
    setClients((prev) => [client, ...prev]);
    setTotal((prev) => prev + 1);
  };

  const updateClient = (updated: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const removeClient = (id: number) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    setTotal((prev) => prev - 1);
  };

  return {
    clients,
    total,
    page,
    setPage,
    isLoading,
    error,
    search,
    setSearch,
    fetchClients,
    addClient,
    updateClient,
    removeClient,
  };
}
