import { User } from '../../db/sequelize';
import { comparePassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { createHttpError } from '../../utils/validate';

export const authService = {
  async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw createHttpError('Invalid email or password', 401);
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      throw createHttpError('Invalid email or password', 401);
    }

    const token = signToken({ id: user.id, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async getMe(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      throw createHttpError('User not found', 404);
    }
    return user;
  },
};
