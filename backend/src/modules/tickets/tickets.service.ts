import { Op, Transaction, WhereOptions } from 'sequelize';
import { sequelize, Ticket, TicketHistory, User, Client } from '../../db/sequelize';
import { createHttpError } from '../../utils/validate';
import { UserRole, User as UserModel } from '../../db/models/User';
import { TicketStatus, TicketPriority } from '../../db/models/Ticket';

interface RequestUser {
  id: number;
  role: UserRole;
}

interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  clientId?: number;
  assignedUserId?: number;
  search?: string;
  cursor?: number;
  limit?: number;
  overdue?: boolean;
}

interface CreateTicketDto {
  title: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
  deadline?: string;
  clientId?: number;
  assignedUserId?: number;
}

interface UpdateTicketDto {
  title?: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  deadline?: string | null;
  clientId?: number;
  assignedUserId?: number;
}

async function logHistory(
  ticketId: number,
  action: string,
  userId: number | null,
  transaction: Transaction
) {
  await TicketHistory.create(
    { ticketId, action, userId, timestamp: new Date() },
    { transaction }
  );
}

export const ticketsService = {
  async listTickets(user: RequestUser, filters: TicketFilters) {
    const { status, priority, category, clientId, assignedUserId, search, cursor, overdue } = filters;
    const limit = Math.min(filters.limit ?? 50, 100);

    const where: WhereOptions = {};

    // Operator scope: only assigned tickets — enforced at DB level
    if (user.role === 'operator') {
      (where as Record<string, unknown>).assignedUserId = user.id;
    } else if (assignedUserId) {
      (where as Record<string, unknown>).assignedUserId = assignedUserId;
    }

    if (status) (where as Record<string, unknown>).status = status;
    if (priority) (where as Record<string, unknown>).priority = priority;
    if (category) (where as Record<string, unknown>).category = category;
    if (clientId) (where as Record<string, unknown>).clientId = clientId;

    if (search) {
      (where as Record<string, unknown>)[Op.or as unknown as string] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (overdue) {
      (where as Record<string, unknown>).deadline = { [Op.lt]: new Date() };
      (where as Record<string, unknown>).status = { [Op.notIn]: ['resolved', 'closed'] };
    }

    // Cursor-based pagination for performance on large datasets
    if (cursor) {
      (where as Record<string, unknown>).id = { [Op.gt]: cursor };
    }

    const tickets = await Ticket.findAll({
      where,
      limit,
      order: cursor ? [['id', 'ASC']] : [['createdAt', 'DESC']],
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'contactPerson'] },
        { model: UserModel, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
      ],
    });

    // Total count for UI (separate query, can be cached)
    const total = await Ticket.count({ where: user.role === 'operator' ? { assignedUserId: user.id } : {} });

    const nextCursor = tickets.length === limit ? tickets[tickets.length - 1].id : undefined;

    return { data: tickets, total, limit, nextCursor };
  },

  async getTicketById(id: number, user: RequestUser) {
    const ticket = await Ticket.findByPk(id, {
      include: [
        { model: Client, as: 'client' },
        { model: UserModel, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
        {
          model: TicketHistory,
          as: 'history',
          include: [{ model: UserModel, as: 'actor', attributes: ['id', 'name'] }],
          order: [['timestamp', 'ASC']],
        },
      ],
    });

    if (!ticket) throw createHttpError('Ticket not found', 404);

    if (user.role === 'operator' && ticket.assignedUserId !== user.id) {
      throw createHttpError('Forbidden', 403);
    }

    return ticket;
  },

  async createTicket(dto: CreateTicketDto, user: RequestUser) {
    return sequelize.transaction(async (t) => {
      const assignedUserId = dto.assignedUserId ?? null;

      const ticket = await Ticket.create(
        {
          title: dto.title,
          description: dto.description ?? null,
          category: dto.category ?? null,
          priority: dto.priority ?? 'medium',
          status: 'new',
          deadline: dto.deadline ? new Date(dto.deadline) : null,
          clientId: dto.clientId ?? null,
          assignedUserId,
        },
        { transaction: t }
      );

      const actor = await User.findByPk(user.id, { attributes: ['name'] });
      await logHistory(ticket.id, `Ticket created by ${actor?.name ?? 'unknown'}`, user.id, t);

      return ticket;
    });
  },

  async updateTicket(id: number, dto: UpdateTicketDto, user: RequestUser) {
    return sequelize.transaction(async (t) => {
      const ticket = await Ticket.findByPk(id, { transaction: t });
      if (!ticket) throw createHttpError('Ticket not found', 404);

      if (user.role === 'operator' && ticket.assignedUserId !== user.id) {
        throw createHttpError('Forbidden', 403);
      }

      // Operators cannot reassign or change priority
      if (user.role === 'operator') {
        delete dto.assignedUserId;
        delete dto.priority;
      }

      const changes: string[] = [];
      if (dto.status && dto.status !== ticket.status) {
        changes.push(`Status: ${ticket.status} → ${dto.status}`);
      }
      if (dto.priority && dto.priority !== ticket.priority) {
        changes.push(`Priority: ${ticket.priority} → ${dto.priority}`);
      }
      if (dto.assignedUserId && dto.assignedUserId !== ticket.assignedUserId) {
        changes.push(`Assignee changed`);
      }

      const updatePayload = {
        ...dto,
        deadline: dto.deadline !== undefined ? (dto.deadline ? new Date(dto.deadline) : null) : undefined,
      };
      await ticket.update(updatePayload, { transaction: t });

      if (changes.length > 0) {
        const actor = await User.findByPk(user.id, { attributes: ['name'] });
        await logHistory(ticket.id, `Updated by ${actor?.name ?? 'unknown'}: ${changes.join(', ')}`, user.id, t);
      }

      return ticket;
    });
  },

  async updateStatus(id: number, status: TicketStatus, user: RequestUser) {
    const OPERATOR_STATUSES: TicketStatus[] = ['in_progress', 'waiting', 'resolved'];

    return sequelize.transaction(async (t) => {
      const ticket = await Ticket.findByPk(id, { transaction: t });
      if (!ticket) throw createHttpError('Ticket not found', 404);

      if (user.role === 'operator' && ticket.assignedUserId !== user.id) {
        throw createHttpError('Forbidden', 403);
      }

      if (user.role === 'operator' && !OPERATOR_STATUSES.includes(status)) {
        throw createHttpError('Operators may only set in_progress, waiting, or resolved', 403);
      }

      const prevStatus = ticket.status;
      await ticket.update({ status }, { transaction: t });

      const actor = await User.findByPk(user.id, { attributes: ['name'] });
      await logHistory(
        ticket.id,
        `Status changed from "${prevStatus}" to "${status}" by ${actor?.name ?? 'unknown'}`,
        user.id,
        t
      );

      return ticket;
    });
  },

  async assignTicket(id: number, assignedUserId: number, user: RequestUser) {
    return sequelize.transaction(async (t) => {
      const ticket = await Ticket.findByPk(id, { transaction: t });
      if (!ticket) throw createHttpError('Ticket not found', 404);

      const prevAssignee = ticket.assignedUserId
        ? await User.findByPk(ticket.assignedUserId, { attributes: ['name'] })
        : null;
      const newAssignee = await User.findByPk(assignedUserId, { attributes: ['name'] });
      if (!newAssignee) throw createHttpError('Assignee user not found', 404);

      await ticket.update({ assignedUserId }, { transaction: t });

      const actor = await User.findByPk(user.id, { attributes: ['name'] });
      await logHistory(
        ticket.id,
        `Reassigned from "${prevAssignee?.name ?? 'unassigned'}" to "${newAssignee.name}" by ${actor?.name ?? 'unknown'}`,
        user.id,
        t
      );

      return ticket;
    });
  },

  async deleteTicket(id: number) {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) throw createHttpError('Ticket not found', 404);
    await ticket.destroy();
  },
};
