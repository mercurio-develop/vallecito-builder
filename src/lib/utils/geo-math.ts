/**
 * Haversine formula to calculate distance between two lat/lng points in kilometers.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculates estimated travel time based on distance.
 * Returns an object with the mode of transport, formatted time string, and distance.
 */
export function calculateTravelEstimate(lat1: number | undefined, lon1: number | undefined, lat2: number | undefined, lon2: number | undefined) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const distanceKm = calculateDistance(lat1, lon1, lat2, lon2);
  
  if (distanceKm < 1.5) {
    const timeMins = Math.ceil(distanceKm * 12);
    return {
      mode: 'WALKING',
      label: `🚶‍♂️ Walking (approx ${timeMins || 1} mins)`,
      distanceKm
    };
  } else {
    const timeMins = Math.ceil(distanceKm * 2.5); // roughly 24km/h average in valley
    return {
      mode: 'DRIVING',
      label: `🚗 Drive (approx ${timeMins} mins)`,
      distanceKm
    };
  }
}
