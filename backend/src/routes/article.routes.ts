import { Router } from 'express';
import { articleController } from '../controllers/article.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createArticleSchema, updateArticleSchema } from '../schemas/article.schemas.js';

export const articleRouter = Router();

const canWrite = authorize('EDITOR', 'ADMIN');

articleRouter.use(authenticate);

articleRouter.get('/', articleController.list);
// before /:id, otherwise "mine" is read as an id
articleRouter.get('/mine', canWrite, articleController.listMine);
articleRouter.get('/:id', articleController.getById);
articleRouter.post('/', canWrite, validate(createArticleSchema), articleController.create);
articleRouter.put('/:id', canWrite, validate(updateArticleSchema), articleController.update);
articleRouter.delete('/:id', canWrite, articleController.remove);
