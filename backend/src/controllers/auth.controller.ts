import type { Request, Response } from 'express';
import type { LoginInput } from '../schemas/auth.schemas.js';
import { authService } from '../services/authService.js';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from '../utils/cookies.js';

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput;
    const { accessToken, refreshToken, user } = await authService.login(email, password);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
  },

  async refresh(req: Request, res: Response) {
    try {
      const { accessToken, refreshToken, user } = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
      setRefreshCookie(res, refreshToken);
      res.json({ accessToken, user });
    } catch (err) {
      clearRefreshCookie(res);
      throw err;
    }
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(res);
    res.status(204).end();
  },

  async me(req: Request, res: Response) {
    res.json(await authService.me(req.user!.id));
  },
};
