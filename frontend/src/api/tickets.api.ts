import api from './axios';
import { Ticket, PaginatedResponse, TicketFilters, CreateTicketDto, TicketStatus, TicketComment } from '../types';

export interface TicketImportRow {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  deadline?: string;
  clientEmail?: string;
  assignedEmail?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export const ticketsApi = {
  list: (filters: TicketFilters = {}) =>
    api.get<PaginatedResponse<Ticket>>('/tickets', { params: filters }),

  getById: (id: number) =>
    api.get<Ticket>(`/tickets/${id}`),

  create: (dto: CreateTicketDto) =>
    api.post<Ticket>('/tickets', dto),

  update: (id: number, dto: Partial<CreateTicketDto & { status: TicketStatus }>) =>
    api.put<Ticket>(`/tickets/${id}`, dto),

  updateStatus: (id: number, status: TicketStatus) =>
    api.patch<Ticket>(`/tickets/${id}/status`, { status }),

  assign: (id: number, assignedUserId: number) =>
    api.patch<Ticket>(`/tickets/${id}/assign`, { assignedUserId }),

  delete: (id: number) =>
    api.delete(`/tickets/${id}`),

  listComments: (ticketId: number) =>
    api.get<TicketComment[]>(`/tickets/${ticketId}/comments`),

  addComment: (ticketId: number, body: string) =>
    api.post<TicketComment>(`/tickets/${ticketId}/comments`, { body }),

  import: (tickets: TicketImportRow[]) =>
    api.post<ImportResult>('/tickets/import', { tickets }),
};
