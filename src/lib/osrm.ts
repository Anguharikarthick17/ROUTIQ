export interface RouteResponse {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [lat, lng] array for Leaflet
  source: 'OSRM' | 'Simulated Network Geometry';
  isEstimate: boolean;
}

export async function fetchRoadRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteResponse> {
  const osrmBase =
    import.meta.env.VITE_OSRM_ROUTING_URL ||
    'https://router.project-osrm.org/route/v1/driving';

  // OSRM expects coordinates in lon,lat order
  const url = `${osrmBase}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Number((route.distance / 1000).toFixed(1));
        const durationMinutes = Math.max(1, Math.round(route.duration / 60));
        // OSRM geojson returns coordinates as [lon, lat], Leaflet polyline needs [lat, lon]
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );

        return {
          distanceKm,
          durationMinutes,
          coordinates,
          source: 'OSRM',
          isEstimate: false,
        };
      }
    }
  } catch {
    // Graceful fallback to street-grid simulated path when offline or rate-limited
  }

  // Graceful fallback: Manhattan/L-turn urban waypoints to simulate road routing
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;

  // Approximate Haversine for base distance * road winding factor 1.28
  const R = 6371; // km
  const dLat = ((endLat - startLat) * Math.PI) / 180;
  const dLon = ((endLng - startLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((startLat * Math.PI) / 180) *
      Math.cos((endLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDist = R * c;
  const roadDist = Number((straightDist * 1.28).toFixed(1));
  const estMins = Math.max(5, Math.round((roadDist / 32) * 60)); // Avg 32 km/h urban speed

  const fallbackCoords: [number, number][] = [
    [startLat, startLng],
    [startLat + (midLat - startLat) * 0.5, startLng + 0.002],
    [midLat, midLng],
    [midLat + (endLat - midLat) * 0.5, midLng - 0.002],
    [endLat, endLng],
  ];

  return {
    distanceKm: roadDist,
    durationMinutes: estMins,
    coordinates: fallbackCoords,
    source: 'Simulated Network Geometry',
    isEstimate: true,
  };
}

