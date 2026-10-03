export interface GeocodedLocation {
  city: string;
  area: string;
  district?: string;
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
  displayName: string;
}

export interface GeolocationSuccessResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  city: string;
  area: string;
  district: string;
  formattedAddress: string;
}

export interface GeolocationErrorResult {
  code: number;
  type: 'permission_denied' | 'position_unavailable' | 'timeout' | 'unsupported' | 'unknown';
  errorMessage: string;
  userMessage: string;
}

/**
 * Filters out noise names like industrial parks, company names, unnamed roads, etc.
 */
export function isNoiseLocationName(name?: string): boolean {
  if (!name) return true;
  const lower = name.toLowerCase().trim();
  const noiseKeywords = [
    'mahindra',
    'world city',
    'industrial',
    'commercial',
    'unnamed',
    'sipcot',
    'tidel',
    'estate',
    'sez',
    'technopark',
    'infopark',
    'expressway',
    'bypass',
    'highway',
    'toll',
    'plaza',
  ];
  return noiseKeywords.some((keyword) => lower.includes(keyword));
}

/**
 * Calculates Great-Circle distance between two points on earth using the Haversine formula.
 * @returns distance in kilometers, or undefined if coordinates are missing.
 */
export function calculateDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | undefined {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return undefined;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10; // 1 decimal place
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formats distance into clean string badge (e.g. "2.4 km away", "< 500 m away").
 */
export function formatDistance(km?: number): string {
  if (km === undefined || isNaN(km)) return '';
  if (km < 0.5) return '< 500 m away';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

/**
 * Real Reverse Geocoding using OpenStreetMap Nominatim API.
 * Translates exact device coordinates into human-readable area & city.
 * Strict priority order: suburb -> neighbourhood -> town -> city -> district.
 * If reverse geocoding cannot resolve an address, returns clear status without making up a city.
 */
export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number
): Promise<{ city: string; area: string; district: string; formatted: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'RentoraMarketplace/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Reverse geocoding HTTP ${res.status}`);
    }

    const data = await res.json();
    const address = data.address || {};

    // 1. Resolve District / Major Town / City
    let district = '';
    if (address.city && !isNoiseLocationName(address.city)) {
      district = address.city;
    } else if (address.town && !isNoiseLocationName(address.town)) {
      district = address.town;
    } else if (address.state_district && !isNoiseLocationName(address.state_district)) {
      district = address.state_district;
    } else if (address.district && !isNoiseLocationName(address.district)) {
      district = address.district;
    } else if (address.county && !isNoiseLocationName(address.county)) {
      district = address.county;
    }

    // 2. Resolve Area by Strict Priority Order:
    // Suburb -> Neighbourhood -> Village / Hamlet -> Town -> City -> District
    let area = '';
    if (address.suburb && !isNoiseLocationName(address.suburb)) {
      area = address.suburb;
    } else if (address.neighbourhood && !isNoiseLocationName(address.neighbourhood)) {
      area = address.neighbourhood;
    } else if (address.village && !isNoiseLocationName(address.village)) {
      area = address.village;
    } else if (address.hamlet && !isNoiseLocationName(address.hamlet)) {
      area = address.hamlet;
    } else if (address.town && !isNoiseLocationName(address.town)) {
      area = address.town;
    } else if (address.city && !isNoiseLocationName(address.city)) {
      area = address.city;
    } else if (address.city_district && !isNoiseLocationName(address.city_district)) {
      area = address.city_district;
    } else if (address.district && !isNoiseLocationName(address.district)) {
      area = address.district;
    } else if (address.state_district && !isNoiseLocationName(address.state_district)) {
      area = address.state_district;
    } else {
      area = district;
    }

    if (!district && area) {
      district = area;
    }

    // 3. Format address cleanly
    let formatted = '';
    if (area && district && area.toLowerCase() !== district.toLowerCase()) {
      formatted = `${area}, ${district}`;
    } else if (area || district) {
      formatted = area || district;
    } else {
      formatted = 'Current coordinates detected, but the address could not be determined.';
    }

    if (typeof window !== 'undefined') {
      console.log(`[Rentora GPS] Reverse geocoded (${latitude.toFixed(5)}, ${longitude.toFixed(5)}) -> "${formatted}"`);
    }

    return {
      city: district || 'Current Location',
      area: area || 'Current Area',
      district: district || 'Current District',
      formatted: formatted,
    };
  } catch (error) {
    console.warn('[Rentora GPS] Reverse geocoding network error:', error);
    return {
      city: 'Current Location',
      area: 'Current Area',
      district: 'Current District',
      formatted: 'Current coordinates detected, but the address could not be determined.',
    };
  }
}

/**
 * Real Forward Geocoding Search using OpenStreetMap Nominatim API.
 */
export async function searchLocationsReal(query: string): Promise<GeocodedLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&addressdetails=1&limit=6&countrycodes=in`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'RentoraMarketplace/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data: any[] = await res.json();
    return data
      .map((item) => {
        const address = item.address || {};

        let district =
          address.city ||
          address.town ||
          address.state_district ||
          address.district ||
          address.county ||
          item.name;

        if (isNoiseLocationName(district)) {
          district = address.state_district || address.state || item.name;
        }

        let area =
          address.suburb ||
          address.neighbourhood ||
          address.town ||
          address.city ||
          item.name;

        if (isNoiseLocationName(area)) {
          area = district;
        }

        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        return {
          city: district,
          area: area,
          district: district,
          latitude: lat,
          longitude: lon,
          lat: lat,
          lng: lon,
          displayName: item.display_name,
        };
      })
      .filter((loc) => !isNoiseLocationName(loc.area) || !isNoiseLocationName(loc.city));
  } catch (error) {
    console.warn('Forward geocode search error', error);
    return [];
  }
}

/**
 * PRODUCTION-LEVEL REAL DEVICE GEOLOCATION ENGINE
 * 
 * Invokes browser Geolocation API on explicit user click.
 * Strictly uses fresh GPS reading (maximumAge: 0, enableHighAccuracy: true).
 * No background tracking. No mock coordinates. No guessed nearest towns.
 */
export function getLiveBrowserPosition(): Promise<GeolocationSuccessResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      const err: GeolocationErrorResult = {
        code: 0,
        type: 'unsupported',
        errorMessage: 'Geolocation is not supported by your browser.',
        userMessage: 'Your browser does not support location access. Please search your location manually.',
      };
      reject(err);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = position.timestamp;

        console.log('[Rentora Geolocation] Fresh GPS obtained:', {
          latitude,
          longitude,
          accuracy: `${Math.round(accuracy)}m`,
          timestamp: new Date(timestamp).toISOString(),
        });

        try {
          const { city, area, district, formatted } = await reverseGeocodeCoords(latitude, longitude);
          resolve({
            latitude,
            longitude,
            accuracy,
            timestamp,
            city,
            area,
            district,
            formattedAddress: formatted,
          });
        } catch (err) {
          console.warn('[locationUtils] reverse geocode fallback:', err);
          resolve({
            latitude,
            longitude,
            accuracy,
            timestamp,
            city: 'Current Location',
            area: 'Current Area',
            district: 'Current District',
            formattedAddress: 'Current coordinates detected, but the address could not be determined.',
          });
        }
      },
      (error) => {
        let errType: GeolocationErrorResult['type'] = 'unknown';
        let userMessage = 'Unable to access your current location. Please try again or search manually.';

        if (error.code === error.PERMISSION_DENIED) {
          errType = 'permission_denied';
          userMessage = 'Location access is required to use your current location. Please enable location permission and try again.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errType = 'position_unavailable';
          userMessage = 'Unable to access your current location. Please enable location services and try again.';
        } else if (error.code === error.TIMEOUT) {
          errType = 'timeout';
          userMessage = 'Unable to get your current location right now. Please try again.';
        }

        console.warn(`[Rentora Geolocation] Error (code ${error.code}):`, error.message);

        const errorResult: GeolocationErrorResult = {
          code: error.code,
          type: errType,
          errorMessage: error.message,
          userMessage,
        };
        reject(errorResult);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // STRICT: zero cached position
      }
    );
  });
}
