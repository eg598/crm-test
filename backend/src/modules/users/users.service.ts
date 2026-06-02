import { Op } from 'sequelize';
import { User } from '../../db/sequelize';
import { hashPassword } from '../../utils/hash';
import { createHttpError } from '../../utils/validate';
import { UserRole } from '../../db/models/User';

interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export const usersService = {
  async listUsers() {
    return User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
  },

  async getUserById(id: number) {
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!user) throw createHttpError('User not found', 404);
    return user;
  },

  async createUser(dto: CreateUserDto) {
    const existing = await User.findOne({ where: { email: dto.email } });
    if (existing) throw createHttpError('Email already in use', 409);

    const hashed = await hashPassword(dto.password);
    const user = await User.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
      role: dto.role ?? 'operator',
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
  },

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await User.findByPk(id);
    if (!user) throw createHttpError('User not found', 404);

    if (dto.email && dto.email !== user.email) {
      const existing = await User.findOne({ where: { email: dto.email, id: { [Op.ne]: id } } });
      if (existing) throw createHttpError('Email already in use', 409);
    }

    if (dto.password) {
      dto = { ...dto, password: await hashPassword(dto.password) };
    }

    await user.update(dto);
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },

  async deleteUser(id: number) {
    const user = await User.findByPk(id);
    if (!user) throw createHttpError('User not found', 404);
    await user.destroy();
  },
};
