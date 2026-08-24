// Координаты склада
export const WAREHOUSE = {
  lat: 40.07864357602892,
  lng: -8.318314774564351,
};

// Вместимость одной машины: 20 тонн
export const TRUCK_CAPACITY_KG = 20000;

// Тип результата поиска города
export type CityResult = {
  displayName: string;
  lat: number;
  lng: number;
};

// Haversine — прямое расстояние между двумя точками в км
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
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

// Дорожное расстояние ≈ прямое × 1.35
export function roadDistanceKm(lat: number, lng: number): number {
  const straight = haversineKm(WAREHOUSE.lat, WAREHOUSE.lng, lat, lng);
  return Math.round(straight * 1.35);
}

// Тариф за 1 машину (до 20 000 кг) по зоне расстояния
export function getDeliveryRatePerTruck(distanceKm: number): number {
  if (distanceKm <= 100) return 750;
  if (distanceKm <= 200) return 850;
  if (distanceKm <= 300) return 1000;
  if (distanceKm <= 400) return 950;
  if (distanceKm <= 500) return 1450;

  // Для расстояний свыше 500 км:
  // пока используем последний известный тариф.
  // При желании позже можно добавить новые зоны.
  return 1450;
}

// Сколько машин нужно для веса
export function getTruckCount(weightKg: number): number {
  return Math.ceil(weightKg / TRUCK_CAPACITY_KG);
}

// Цена доставки
export function calcDelivery(distanceKm: number, weightKg: number): number {
  if (weightKg <= 0) return 0;

  const trucks = getTruckCount(weightKg);
  const ratePerTruck = getDeliveryRatePerTruck(distanceKm);

  return trucks * ratePerTruck;
}

// Доп. helper, если хотите сразу получать все данные для UI
export function getDeliveryQuote(lat: number, lng: number, weightKg: number) {
  const distanceKm = roadDistanceKm(lat, lng);
  const trucks = getTruckCount(weightKg);
  const ratePerTruck = getDeliveryRatePerTruck(distanceKm);
  const total = calcDelivery(distanceKm, weightKg);

  return {
    distanceKm,
    trucks,
    ratePerTruck,
    total,
  };
}

// Поиск города через Nominatim (OpenStreetMap)
export async function searchCities(query: string): Promise<CityResult[]> {
  const q = query.trim();

  if (q.length < 2) return [];

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(q)}` +
    `&format=jsonv2` +
    `&limit=6` +
    `&addressdetails=1` +
    `&featureType=city`;

  const res = await fetch(url, {
    headers: {
      "Accept-Language": "pt,en",
      "User-Agent": "EuroMuro-Configurator/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`Nominatim error: ${res.status}`);
  }

  const data = await res.json();

  return data.map((item: any) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}