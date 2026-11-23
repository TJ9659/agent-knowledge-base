import type { Request, Response } from 'express';
import { categoryService } from '../services/categoryService.js';

export const statsController = {
  async categories(_req: Request, res: Response) {
    res.json(await categoryService.stats());
  },
};
