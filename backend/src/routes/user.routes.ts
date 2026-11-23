import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../schemas/user.schemas.js';

export const userRouter = Router();

userRouter.use(authenticate, authorize('ADMIN'));

userRouter.get('/', userController.list);
userRouter.get('/:id', userController.getById);
userRouter.post('/', validate(createUserSchema), userController.create);
userRouter.put('/:id', validate(updateUserSchema), userController.update);
userRouter.delete('/:id', userController.deactivate);
