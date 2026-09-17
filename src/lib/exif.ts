// src/lib/exif.ts
import exifr from 'exifr';

export interface GeotagResult {
  latitude: number | null;
  longitude: number | null;
  hasGeotag: boolean;
  distanceFromCampusMeters?: number;
  isInCampusBounds?: boolean;
}

// VIT Main Campus Center Coordinates (Vellore)
export const VIT_CAMPUS_LAT = 12.9698;
export const VIT_CAMPUS_LNG = 79.1559;

// Calculate distance in meters using the Haversine formula
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number = VIT_CAMPUS_LAT,
  lon2: number = VIT_CAMPUS_LNG
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export async function extractGeotagFromImage(file: File | Blob): Promise<GeotagResult> {
  try {
    const output = await exifr.gps(file);
    if (output && typeof output.latitude === 'number' && typeof output.longitude === 'number') {
      const distance = calculateDistanceMeters(output.latitude, output.longitude);
      return {
        latitude: Number(output.latitude.toFixed(5)),
        longitude: Number(output.longitude.toFixed(5)),
        hasGeotag: true,
        distanceFromCampusMeters: distance,
        isInCampusBounds: distance <= 1500, // within 1.5km of VIT campus
      };
    }
  } catch (err) {
    console.warn('Could not extract EXIF GPS data:', err);
  }

  return {
    latitude: null,
    longitude: null,
    hasGeotag: false,
  };
}
