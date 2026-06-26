export const DEFAULT_COORDS = {
  lat: -13.3047, // Defaulting to Urubamba
  lng: -72.1167,
};

export const AI_CONCIERGE_INITIAL_MESSAGE = "Welcome to Vallecito. ✨\n\nI am your AI Journey Designer. Are you looking to plan a single day, or an extended expedition spanning multiple days? If multiple days, please share your expected arrival and departure dates.";

export const SACRED_VALLEY_LOCATIONS = [
  "Urubamba", "Pisac", "Maras", "Ollantaytambo", "Chinchero", "Calca", "Cusco", "Machu Picchu"
];

export const COORDS_MAP: Record<string, { lat: number; lng: number }> = {
  urubamba:      { lat: -13.3047, lng: -72.1167 },
  cusco:         { lat: -13.5226, lng: -71.9673 },
  taray:         { lat: -13.4300, lng: -71.8600 },
  pisac:         { lat: -13.4225, lng: -71.8488 },
  ollantaytambo: { lat: -13.2588, lng: -72.2633 },
  calca:         { lat: -13.3333, lng: -71.9667 },
  chinchero:     { lat: -13.3833, lng: -72.0500 },
  maras:         { lat: -13.3400, lng: -72.1500 },
  poroy:         { lat: -13.4900, lng: -72.0400 },
  // Aguas Calientes town center — where all businesses/hotels/restaurants are
  // (ruins are at -13.1631, -72.5450 but no tourist services there)
  "machu-picchu":  { lat: -13.1547, lng: -72.5252 },
  "aguas-calientes":{ lat: -13.1547, lng: -72.5252 },
  yucay:           { lat: -13.3183, lng: -72.0833 },
};
