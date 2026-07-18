import { Driver, VehicleClass } from '../types';

export class DriverRepository {
  private drivers = new Map<string, Driver>();

  constructor(seed = true) {
    if (seed) {
      this.seed();
    }
  }

  private seed(): void {
    const initial: Driver[] = [
      { id: 'drv-1', name: 'Oleh', vehicleClass: 'economy', location: { lat: 50.45, lng: 30.52 }, online: true, rating: 4.8 },
      { id: 'drv-2', name: 'Maria', vehicleClass: 'comfort', location: { lat: 50.46, lng: 30.53 }, online: true, rating: 4.9 },
      { id: 'drv-3', name: 'Ivan', vehicleClass: 'business', location: { lat: 50.44, lng: 30.51 }, online: false, rating: 4.6 },
      { id: 'drv-4', name: 'Petro', vehicleClass: 'economy', location: { lat: 50.50, lng: 30.60 }, online: true, rating: 4.7 }
    ];
    for (const d of initial) this.drivers.set(d.id, d);
  }

  findAvailableByClass(vehicleClass: VehicleClass): Driver[] {
    return Array.from(this.drivers.values()).filter(
      (d) => d.online && d.vehicleClass === vehicleClass
    );
  }

  findById(id: string): Driver | null {
    return this.drivers.get(id) ?? null;
  }

  setOnline(id: string, online: boolean): void {
    const d = this.drivers.get(id);
    if (d) d.online = online;
  }

  all(): Driver[] {
    return Array.from(this.drivers.values());
  }
}
