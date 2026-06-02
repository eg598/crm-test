import api from './axios';
import { User, CreateUserDto } from '../types';

export const usersApi = {
  list: () => api.get<User[]>('/users'),

  getById: (id: number) => api.get<User>(`/users/${id}`),

  create: (dto: CreateUserDto) => api.post<User>('/users', dto),

  update: (id: number, dto: Partial<CreateUserDto>) => api.put<User>(`/users/${id}`, dto),

  delete: (id: number) => api.delete(`/users/${id}`),
};
