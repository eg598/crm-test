import { TicketComment, Ticket, User } from '../../db/sequelize';
import { createHttpError } from '../../utils/validate';
import { UserRole } from '../../db/models/User';

interface RequestUser {
  id: number;
  role: UserRole;
}

export const commentsService = {
  async listComments(ticketId: number, user: RequestUser) {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw createHttpError('Ticket not found', 404);

    if (user.role === 'operator' && ticket.assignedUserId !== user.id) {
      throw createHttpError('Forbidden', 403);
    }

    return TicketComment.findAll({
      where: { ticketId },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'ASC']],
    });
  },

  async addComment(ticketId: number, body: string, user: RequestUser) {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw createHttpError('Ticket not found', 404);

    if (user.role === 'operator' && ticket.assignedUserId !== user.id) {
      throw createHttpError('Forbidden', 403);
    }

    const comment = await TicketComment.create({ ticketId, userId: user.id, body });

    return TicketComment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
    });
  },
};
