import { Router, Request, Response } from 'express';
import { AuthService, UserAlreadyExistsError, InvalidCredentialsError } from '../services/authService';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  router.post('/register', async (req: Request, res: Response) => {
    const { phone, password } = req.body ?? {};
    if (!phone || !password) {
      res.status(400).json({ error: 'phone and password are required' });
      return;
    }
    try {
      const user = await authService.register(phone, password);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof UserAlreadyExistsError) {
        res.status(409).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Internal error' });
    }
  });

  router.post('/login', async (req: Request, res: Response) => {
    const { phone, password } = req.body ?? {};
    if (!phone || !password) {
      res.status(400).json({ error: 'phone and password are required' });
      return;
    }
    try {
      const result = await authService.login(phone, password);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        res.status(401).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Internal error' });
    }
  });

  return router;
}
