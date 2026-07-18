import { Location } from '../types';

// Rough bounding box around Kyiv used as the demo "service area".
const SERVICE_AREA = {
  minLat: 50.30,
  maxLat: 50.60,
  minLng: 30.30,
  maxLng: 30.75
};

export function isWithinServiceArea(location: Location): boolean {
  return (
    location.lat >= SERVICE_AREA.minLat &&
    location.lat <= SERVICE_AREA.maxLat &&
    location.lng >= SERVICE_AREA.minLng &&
    location.lng <= SERVICE_AREA.maxLng
  );
}
