import type { Request, Response } from 'express';
import { idParamSchema } from '../schemas/common.js';
import type { CategoryInput } from '../schemas/category.schemas.js';
import { categoryService } from '../services/categoryService.js';

export const categoryController = {
  async list(_req: Request, res: Response) {
    res.json(await categoryService.list());
  },

  async create(req: Request, res: Response) {
    res.status(201).json(await categoryService.create(req.body as CategoryInput));
  },

  async update(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    res.json(await categoryService.update(id, req.body as CategoryInput));
  },

  async remove(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    await categoryService.remove(id);
    res.status(204).end();
  },
};
