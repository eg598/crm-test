import { Op } from 'sequelize';
import { Client, Ticket } from '../../db/sequelize';
import { createHttpError } from '../../utils/validate';

interface ClientFilters {
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateClientDto {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  comment?: string;
}

export const clientsService = {
  async listClients({ search, page = 1, limit = 20 }: ClientFilters) {
    const offset = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { contactPerson: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Client.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return { data: rows, total: count, page, limit };
  },

  async getClientById(id: number) {
    const client = await Client.findByPk(id, {
      include: [{ model: Ticket, as: 'tickets', attributes: ['id', 'title', 'status', 'priority'] }],
    });
    if (!client) throw createHttpError('Client not found', 404);
    return client;
  },

  async createClient(dto: CreateClientDto) {
    return Client.create(dto);
  },

  async updateClient(id: number, dto: Partial<CreateClientDto>) {
    const client = await Client.findByPk(id);
    if (!client) throw createHttpError('Client not found', 404);
    await client.update(dto);
    return client;
  },

  async deleteClient(id: number) {
    const client = await Client.findByPk(id);
    if (!client) throw createHttpError('Client not found', 404);
    await client.destroy();
  },
};
