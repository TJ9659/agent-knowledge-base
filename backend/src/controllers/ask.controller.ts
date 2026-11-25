import type { Request, Response } from 'express';
import type { AskInput } from '../schemas/ask.schemas.js';
import { askService } from '../services/askService.js';

export const askController = {
  async ask(req: Request, res: Response) {
    const { question } = req.body as AskInput;
    res.json(await askService.ask(question));
  },
};
