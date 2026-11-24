export interface NearbyVetFacility {
  id: string;
  name: string;
  category: 'Veterinary Clinic' | 'Animal Hospital' | 'Animal Welfare NGO';
  address: string;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  directionsUrl: string;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number; label: string }> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'PawHeal-PetCare/1.0',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error('Unable to look up that location right now.');
  }
  const items = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!items.length) {
    throw new Error('No matching location was found. Try a city name or postal code.');
  }
  return {
    lat: Number(items[0].lat),
    lng: Number(items[0].lon),
    label: items[0].display_name,
  };
}

interface OverpassElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export async function searchNearbyVetFacilities(params: {
  lat: number;
  lng: number;
  radiusKm?: number;
  categoryFilter?: string;
}): Promise<NearbyVetFacility[]> {
  const radiusMeters = Math.min(Math.max(Math.round((params.radiusKm ?? 10) * 1000), 1000), 30000);

  const overpassQuery = `
[out:json][timeout:15];
(
  node["amenity"="veterinary"](around:${radiusMeters},${params.lat},${params.lng});
  way["amenity"="veterinary"](around:${radiusMeters},${params.lat},${params.lng});
  node["healthcare"="veterinary"](around:${radiusMeters},${params.lat},${params.lng});
  way["healthcare"="veterinary"](around:${radiusMeters},${params.lat},${params.lng});
  node["amenity"="animal_shelter"](around:${radiusMeters},${params.lat},${params.lng});
  way["amenity"="animal_shelter"](around:${radiusMeters},${params.lat},${params.lng});
);
out center tags 40;
`;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'User-Agent': 'PawHeal-PetCare/1.0',
    },
    body: `data=${encodeURIComponent(overpassQuery)}`,
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error('Nearby clinic directory is temporarily busy. Please try again shortly.');
  }

  const json = (await response.json()) as { elements?: OverpassElement[] };
  const elements = json.elements ?? [];

  const results: NearbyVetFacility[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;

    const name = tags.name?.trim();
    if (!name) continue;

    const lowerName = name.toLowerCase();
    let category: NearbyVetFacility['category'] = 'Veterinary Clinic';
    if (tags.amenity === 'animal_shelter' || lowerName.includes('shelter') || lowerName.includes('welfare') || lowerName.includes('rescue') || lowerName.includes('ngo')) {
      category = 'Animal Welfare NGO';
    } else if (lowerName.includes('hospital') || lowerName.includes('emergency') || tags.emergency === 'yes') {
      category = 'Animal Hospital';
    }

    if (params.categoryFilter && params.categoryFilter !== 'All' && category !== params.categoryFilter) {
      continue;
    }

    const addressParts = [
      tags['addr:housenumber'] && tags['addr:street']
        ? `${tags['addr:housenumber']} ${tags['addr:street']}`
        : tags['addr:street'],
      tags['addr:city'] || tags['addr:suburb'],
      tags['addr:postcode'],
    ].filter(Boolean);

    const address =
      addressParts.length > 0
        ? addressParts.join(', ')
        : tags['addr:full'] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    results.push({
      id: `${el.type}-${el.id}`,
      name,
      category,
      address,
      phone: tags.phone || tags['contact:phone'] || null,
      website: tags.website || tags['contact:website'] || null,
      openingHours: tags.opening_hours || null,
      lat,
      lng,
      distanceKm: haversineKm(params.lat, params.lng, lat, lng),
      directionsUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
    });
  }

  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}
