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

  async importTickets(
    dtos: Array<{
      title?: string;
      description?: string;
      category?: string;
      priority?: string;
      status?: string;
      deadline?: string;
      clientEmail?: string;
      assignedEmail?: string;
    }>
  ) {
    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    // Early format check — catch wrong-file uploads before iterating
    if (dtos.length > 0) {
      const sample = dtos[0] as Record<string, unknown>;
      const hasTicketFields = 'title' in sample || 'category' in sample || 'deadline' in sample;
      if (!hasTicketFields) {
        results.skipped = dtos.length;
        results.errors.push(
          'Wrong file format: expected objects with at least a "title" field. ' +
          'Did you upload a users file by mistake? Use docs/sample-tickets-100.json for ticket import.'
        );
        return results;
      }
    }

    // Pre-load lookup maps — one DB round-trip for all emails
    const allClients = await Client.findAll({ attributes: ['id', 'email'] });
    const clientMap = new Map(
      allClients.filter((c) => c.email).map((c) => [c.email!.toLowerCase(), c.id])
    );

    const allOperators = await User.findAll({ where: { role: 'operator' }, attributes: ['id', 'email'] });
    const operatorMap = new Map(allOperators.map((u) => [u.email.toLowerCase(), u.id]));

    const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);
    const VALID_STATUSES   = new Set(['new', 'in_progress', 'waiting', 'resolved', 'closed']);

    const toCreate: {
      title: string; description: string | null; category: string | null;
      priority: TicketPriority; status: TicketStatus;
      deadline: Date | null; clientId: number | null; assignedUserId: number | null;
    }[] = [];

    for (let i = 0; i < dtos.length; i++) {
      const dto = dtos[i];
      const row = `Row ${i + 1}`;

      if (!dto.title?.trim()) {
        results.errors.push(`${row}: title is required`);
        results.skipped++;
        continue;
      }

      // Parse deadline safely — skip if the string is not a valid date
      let deadline: Date | null = null;
      if (dto.deadline) {
        const d = new Date(dto.deadline);
        if (isNaN(d.getTime())) {
          results.errors.push(`${row}: invalid deadline format "${dto.deadline}" — skipping deadline`);
        } else {
          deadline = d;
        }
      }

      toCreate.push({
        title:          dto.title.trim(),
        description:    dto.description?.trim() || null,
        category:       dto.category?.trim() || null,
        priority:       (VALID_PRIORITIES.has(dto.priority ?? '') ? dto.priority : 'medium') as TicketPriority,
        status:         (VALID_STATUSES.has(dto.status ?? '') ? dto.status : 'new') as TicketStatus,
        deadline,
        clientId:       dto.clientEmail ? (clientMap.get(dto.clientEmail.toLowerCase()) ?? null) : null,
        assignedUserId: dto.assignedEmail ? (operatorMap.get(dto.assignedEmail.toLowerCase()) ?? null) : null,
      });
    }

    if (toCreate.length > 0) {
      try {
        await Ticket.bulkCreate(toCreate as Parameters<typeof Ticket.bulkCreate>[0]);
        results.imported = toCreate.length;
      } catch (err) {
        const msg = (err as Error)?.message ?? 'database error';
        results.errors.push(`Bulk insert failed: ${msg}`);
        results.skipped += toCreate.length;
      }
    }

    return results;
  },
};
