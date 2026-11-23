import type { Request, Response } from 'express';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.js';
import type { CreateUserInput, UpdateUserInput } from '../schemas/user.schemas.js';
import { userService } from '../services/userService.js';

export const userController = {
  async list(req: Request, res: Response) {
    res.json(await userService.list(paginationQuerySchema.parse(req.query)));
  },

  async getById(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    res.json(await userService.getById(id));
  },

  async create(req: Request, res: Response) {
    res.status(201).json(await userService.create(req.body as CreateUserInput));
  },

  async update(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    res.json(await userService.update(req.user!, id, req.body as UpdateUserInput));
  },

  async deactivate(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    await userService.deactivate(req.user!, id);
    res.status(204).end();
  },
};
