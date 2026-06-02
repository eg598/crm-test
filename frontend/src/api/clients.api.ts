import api from './axios';
import { Client, PaginatedResponse, CreateClientDto } from '../types';

export const clientsApi = {
  list: (params: { search?: string; page?: number; limit?: number } = {}) =>
    api.get<PaginatedResponse<Client>>('/clients', { params }),

  getById: (id: number) =>
    api.get<Client>(`/clients/${id}`),

  create: (dto: CreateClientDto) =>
    api.post<Client>('/clients', dto),

  update: (id: number, dto: Partial<CreateClientDto>) =>
    api.put<Client>(`/clients/${id}`, dto),

  delete: (id: number) =>
    api.delete(`/clients/${id}`),
};
