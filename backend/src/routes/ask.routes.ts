import { Router } from 'express';
import { askController } from '../controllers/ask.controller.js';
import { authenticate } from '../middleware/auth.js';
import { askLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { askSchema } from '../schemas/ask.schemas.js';

export const askRouter = Router();

// every role can ask, the limiter needs req.user so it runs after authenticate
askRouter.post('/', authenticate, askLimiter, validate(askSchema), askController.ask);
