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

  async importUsers(users: Array<{ name: string; email: string; password: string; role?: string }>) {
    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    // Early format check — catch wrong-file uploads before iterating
    if (users.length > 0) {
      const sample = users[0] as Record<string, unknown>;
      const hasUserFields = 'name' in sample || 'email' in sample || 'password' in sample;
      if (!hasUserFields) {
        results.skipped = users.length;
        results.errors.push(
          'Wrong file format: expected objects with "name", "email", and "password" fields. ' +
          'Did you upload a tickets file by mistake? Use docs/sample-users.json for user import.'
        );
        return results;
      }
    }

    for (let i = 0; i < users.length; i++) {
      const dto = users[i];
      const row = `Row ${i + 1}`;
      try {
        const missing: string[] = [];
        if (!dto.name?.trim())     missing.push('name');
        if (!dto.email?.trim())    missing.push('email');
        if (!dto.password?.trim()) missing.push('password');
        if (missing.length > 0) {
          results.errors.push(`${row}: missing required field(s): ${missing.join(', ')}`);
          results.skipped++;
          continue;
        }
        const existing = await User.findOne({ where: { email: dto.email } });
        if (existing) {
          results.errors.push(`${row}: email already exists — ${dto.email}`);
          results.skipped++;
          continue;
        }
        const validRoles = ['operator', 'supervisor', 'admin'];
        const role = validRoles.includes(dto.role ?? '') ? (dto.role as UserRole) : 'operator';
        const hashed = await hashPassword(dto.password);
        await User.create({ name: dto.name.trim(), email: dto.email.trim(), password: hashed, role });
        results.imported++;
      } catch {
        results.errors.push(`${row}: unexpected error while saving ${dto.email ?? '(no email)'}`);
        results.skipped++;
      }
    }
    return results;
  },
};
