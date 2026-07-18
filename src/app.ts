import express, { Express } from 'express';
import { UserRepository } from './repositories/UserRepository';
import { DriverRepository } from './repositories/DriverRepository';
import { RideRepository } from './repositories/RideRepository';
import { AuthService } from './services/authService';
import { RideService } from './services/rideService';
import { createAuthRoutes } from './routes/authRoutes';
import { createRideRoutes } from './routes/rideRoutes';

export interface AppDependencies {
  userRepo?: UserRepository;
  driverRepo?: DriverRepository;
  rideRepo?: RideRepository;
}

/**
 * Builds a fresh Express app with its own in-memory repositories.
 * Accepting dependencies as parameters (dependency injection) is what makes
 * the app easy to exercise with test doubles in unit/integration tests.
 */
export function createApp(deps: AppDependencies = {}): Express {
  const userRepo = deps.userRepo ?? new UserRepository();
  const driverRepo = deps.driverRepo ?? new DriverRepository();
  const rideRepo = deps.rideRepo ?? new RideRepository();

  const authService = new AuthService(userRepo);
  const rideService = new RideService(rideRepo, driverRepo);

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/auth', createAuthRoutes(authService));
  app.use('/rides', createRideRoutes(rideService));

  return app;
}
