import api from './axios';
import { AuthUser } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password }),

  me: () => api.get<AuthUser>('/auth/me'),

  logout: () => api.post('/auth/logout').catch(() => {}),
};
