import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import type { PaginationQuery } from '../schemas/common.js';
import type { CreateUserInput, UpdateUserInput } from '../schemas/user.schemas.js';
import type { AuthUser } from '../types/express.js';
import { HttpError } from '../utils/HttpError.js';
import { hashPassword } from '../utils/password.js';

async function getOrThrow(id: number) {
  const user = await userRepository.findById(id);
  if (!user) throw HttpError.notFound('User not found');
  return user;
}

export const userService = {
  async list({ page, pageSize }: PaginationQuery) {
    const { rows, total } = await userRepository.list({ skip: (page - 1) * pageSize, take: pageSize });
    return { data: rows, page, pageSize, total };
  },

  getById(id: number) {
    return getOrThrow(id);
  },

  async create(input: CreateUserInput) {
    if (await userRepository.existsByEmail(input.email)) {
      throw HttpError.conflict('Email is already in use');
    }
    const { password, ...rest } = input;
    return userRepository.create({ ...rest, passwordHash: await hashPassword(password) });
  },

  async update(currentUser: AuthUser, id: number, input: UpdateUserInput) {
    const target = await getOrThrow(id);

    // the system admin always stays an active admin with the same login
    if (target.isProtected && (input.role || input.email || input.isActive !== undefined)) {
      throw HttpError.forbidden('This account is protected. Only its name can be changed.');
    }

    // stops an admin locking themselves out
    if (id === currentUser.id && (input.isActive === false || (input.role && input.role !== 'ADMIN'))) {
      throw HttpError.badRequest('You cannot deactivate or demote your own account');
    }

    if (input.email && (await userRepository.existsByEmail(input.email, id))) {
      throw HttpError.conflict('Email is already in use');
    }

    const user = await userRepository.update(id, input);

    // force a fresh login so the new role or status takes effect
    if (input.isActive === false || input.role) {
      await refreshTokenRepository.deleteAllForUser(id);
    }
    return user;
  },

  // soft delete, keeps their articles
  async deactivate(currentUser: AuthUser, id: number) {
    const target = await getOrThrow(id);
    if (target.isProtected) {
      throw HttpError.forbidden('This account is protected and cannot be deactivated.');
    }
    if (id === currentUser.id) {
      throw HttpError.badRequest('You cannot deactivate your own account');
    }
    await userRepository.update(id, { isActive: false });
    await refreshTokenRepository.deleteAllForUser(id);
  },
};
