export type Role = 'operator' | 'supervisor' | 'admin';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Client {
  id: number;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  comment: string | null;
  createdAt: string;
}

export interface TicketHistory {
  id: number;
  ticketId: number;
  action: string;
  userId: number | null;
  actor?: { id: number; name: string };
  timestamp: string;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  userId: number;
  body: string;
  author?: { id: number; name: string; role: Role };
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  priority: Priority;
  status: TicketStatus;
  deadline: string | null;
  clientId: number | null;
  assignedUserId: number | null;
  client?: Pick<Client, 'id' | 'name' | 'contactPerson'>;
  assignedUser?: Pick<User, 'id' | 'name' | 'email'>;
  history?: TicketHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  nextCursor?: number;
}

export interface TicketFilters {
  status?: TicketStatus | '';
  priority?: Priority | '';
  category?: string;
  clientId?: number;
  assignedUserId?: number;
  search?: string;
  cursor?: number;
  limit?: number;
  overdue?: boolean;
}

export interface CreateTicketDto {
  title: string;
  description?: string;
  category?: string;
  priority?: Priority;
  deadline?: string;
  clientId?: number;
  assignedUserId?: number;
}

export interface CreateClientDto {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  comment?: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: Role;
}
