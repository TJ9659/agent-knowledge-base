import type { Request, Response } from 'express';
import {
  articleListQuerySchema,
  type CreateArticleInput,
  type UpdateArticleInput,
} from '../schemas/article.schemas.js';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.js';
import { articleService } from '../services/articleService.js';

export const articleController = {
  async list(req: Request, res: Response) {
    res.json(await articleService.list(req.user!, articleListQuerySchema.parse(req.query)));
  },

  async listMine(req: Request, res: Response) {
    res.json(await articleService.listMine(req.user!, paginationQuerySchema.parse(req.query)));
  },

  async getById(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    res.json(await articleService.getById(req.user!, id));
  },

  async create(req: Request, res: Response) {
    res.status(201).json(await articleService.create(req.user!, req.body as CreateArticleInput));
  },

  async update(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    res.json(await articleService.update(req.user!, id, req.body as UpdateArticleInput));
  },

  async remove(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    await articleService.remove(req.user!, id);
    res.status(204).end();
  },
};
