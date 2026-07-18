import { Ride } from '../types';

export class RideRepository {
  private rides = new Map<string, Ride>();
  private nextId = 1;

  create(ride: Omit<Ride, 'id'>): Ride {
    const full: Ride = { ...ride, id: `ride-${this.nextId++}` };
    this.rides.set(full.id, full);
    return full;
  }

  findById(id: string): Ride | null {
    return this.rides.get(id) ?? null;
  }

  update(id: string, patch: Partial<Ride>): Ride | null {
    const existing = this.rides.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.rides.set(id, updated);
    return updated;
  }

  clear(): void {
    this.rides.clear();
    this.nextId = 1;
  }
}
