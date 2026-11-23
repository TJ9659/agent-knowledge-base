import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

export const statsRouter = Router();

statsRouter.use(authenticate, authorize('ADMIN'));

statsRouter.get('/categories', statsController.categories);
