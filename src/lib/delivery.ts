// Координаты склада — Синтра
const WAREHOUSE = { lat: 38.7977, lng: -9.3906 };

// Тариф: €/км/тонна
export const RATE_PER_KM_PER_TON = 20;

// Haversine — прямое расстояние между двумя точками в км
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Дорожное расстояние ≈ прямое × 1.35 (коэффициент дорог Португалии)
export function roadDistanceKm(lat: number, lng: number): number {
  const straight = haversineKm(WAREHOUSE.lat, WAREHOUSE.lng, lat, lng);
  return Math.round(straight * 1.35);
}

// Цена доставки
export function calcDelivery(distanceKm: number, weightKg: number): number {
  const tons = weightKg / 1000;
  return Math.round(distanceKm * tons * RATE_PER_KM_PER_TON);
}

// Тип результата поиска города
export type CityResult = {
  displayName: string;
  lat: number;
  lng: number;
};

// Поиск города через Nominatim (OpenStreetMap)
export async function searchCities(query: string): Promise<CityResult[]> {
  if (query.length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&featuretype=city,town,village&addressdetails=1`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'pt,en', 'User-Agent': 'EuroMuro-Configurator/1.0' }
  });
  const data = await res.json();
  return data.map((item: any) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}