import { askAvailability } from './ask-availability';
import { askUserLocation } from './ask-user-location';
import { buildItinerary } from './build-itinerary';
import { buildMacroTrip } from './build-macro-trip';
import { findNearby } from './find-nearby';
import { mutateItinerary } from './mutate-itinerary';
import { searchDatabase } from './search-database';
import { searchDayTours } from './search-day-tours';
import { showBoletoInfo } from './show-boleto-info';
import { estimateTaxiFare } from './taxi-estimator';
import { triggerSupportAlert } from './trigger-support';
import { queryExpatsGuide } from './query-expats-guide';

// Export the native Vercel AI SDK tools
export const toolsRegistry = {
  askAvailability,
  askUserLocation,
  buildItinerary,
  buildMacroTrip,
  findNearby,
  mutateItinerary,
  searchDatabase,
  searchDayTours,
  showBoletoInfo,
  estimateTaxiFare,
  triggerSupportAlert,
  queryExpatsGuide
};
