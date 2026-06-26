export function calculateHaversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateDetourKm(originLat: number, originLng: number, destLat: number, destLng: number, stopLat: number, stopLng: number): number {
  const distToStop = calculateHaversine(originLat, originLng, stopLat, stopLng);
  const distFromStop = calculateHaversine(stopLat, stopLng, destLat, destLng);
  const directDist = calculateHaversine(originLat, originLng, destLat, destLng);
  return (distToStop + distFromStop) - directDist;
}
