import { useCallback, useEffect, useState } from 'react';
import { Ticket, TicketFilters, TicketStatus } from '../types';
import { ticketsApi } from '../api/tickets.api';
import { useDebounce } from './useDebounce';

export function useTickets(initialFilters: TicketFilters = {}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TicketFilters>(initialFilters);

  const debouncedSearch = useDebounce(filters.search, 300);

  const fetchTickets = useCallback(async (append = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: TicketFilters = {
        ...filters,
        search: debouncedSearch,
        cursor: append ? nextCursor : undefined,
      };
      // Remove empty values
      Object.keys(params).forEach((k) => {
        const key = k as keyof TicketFilters;
        if (params[key] === '' || params[key] === undefined) delete params[key];
      });

      const res = await ticketsApi.list(params);
      setTotal(res.data.total);
      setNextCursor(res.data.nextCursor);
      setTickets((prev) => (append ? [...prev, ...res.data.data] : res.data.data));
    } catch {
      setError('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }, [filters, debouncedSearch, nextCursor]);

  useEffect(() => {
    fetchTickets(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority, filters.category, filters.clientId, filters.assignedUserId, filters.overdue, debouncedSearch]);

  const updateTicketStatus = async (id: number, status: TicketStatus) => {
    const previousTickets = tickets;
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await ticketsApi.updateStatus(id, status);
    } catch {
      setTickets(previousTickets);
      setError('Failed to update ticket status');
    }
  };

  const removeTicket = (id: number) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    setTotal((prev) => prev - 1);
  };

  const addTicket = (ticket: Ticket) => {
    setTickets((prev) => [ticket, ...prev]);
    setTotal((prev) => prev + 1);
  };

  const updateTicket = (updated: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  return {
    tickets,
    total,
    nextCursor,
    isLoading,
    error,
    filters,
    setFilters,
    fetchTickets,
    updateTicketStatus,
    removeTicket,
    addTicket,
    updateTicket,
  };
}
