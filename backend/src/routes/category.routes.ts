import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { categorySchema } from '../schemas/category.schemas.js';

export const categoryRouter = Router();

// anyone logged in can read, only admins can change
categoryRouter.use(authenticate);

categoryRouter.get('/', categoryController.list);
categoryRouter.post('/', authorize('ADMIN'), validate(categorySchema), categoryController.create);
categoryRouter.put('/:id', authorize('ADMIN'), validate(categorySchema), categoryController.update);
categoryRouter.delete('/:id', authorize('ADMIN'), categoryController.remove);
