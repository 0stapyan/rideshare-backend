import { Router, Response } from 'express';
import { RideService } from '../services/rideService';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  NoDriverAvailableError,
  OutsideServiceAreaError,
  RideNotFoundError,
  InvalidRideStateError
} from '../types';

export function createRideRoutes(rideService: RideService): Router {
  const router = Router();

  // Business process #1: book a ride
  router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { pickup, destination, vehicleClass, isPeakHour } = req.body ?? {};
    if (!pickup || !destination || !vehicleClass) {
      res.status(400).json({ error: 'pickup, destination and vehicleClass are required' });
      return;
    }
    try {
      const ride = rideService.bookRide({
        riderId: req.user!.sub,
        pickup,
        destination,
        vehicleClass,
        isPeakHour: !!isPeakHour
      });
      res.status(201).json(ride);
    } catch (err) {
      if (err instanceof OutsideServiceAreaError) {
        res.status(422).json({ error: err.message, code: err.code });
        return;
      }
      if (err instanceof NoDriverAvailableError) {
        res.status(409).json({ error: err.message, code: err.code });
        return;
      }
      res.status(500).json({ error: 'Internal error' });
    }
  });

  router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    // simple lookup left intentionally minimal for this demo
    res.status(501).json({ error: 'Not implemented in this demo' });
  });

  router.post('/:id/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const ride = rideService.cancelRide(req.params.id);
      res.status(200).json(ride);
    } catch (err) {
      if (err instanceof RideNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof InvalidRideStateError) {
        res.status(409).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Internal error' });
    }
  });

  // Business process #2: complete a ride and charge the final fare
  router.post('/:id/complete', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { actualDistanceKm } = req.body ?? {};
    try {
      const result = rideService.completeRide(req.params.id, actualDistanceKm);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof RideNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof InvalidRideStateError) {
        res.status(409).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Internal error' });
    }
  });

  return router;
}
