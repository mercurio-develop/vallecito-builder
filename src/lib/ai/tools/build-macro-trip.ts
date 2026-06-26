import { tool } from 'ai';
import { macroTripSchema } from '../schemas/planner-schema';

export const buildMacroTrip = tool({
  description: `Generates a multi-day luxury macro trip plan for the Sacred Valley.
USE THIS when the user requests a multi-day trip spanning several dates, after gathering their travel dates, exertion profile, and interests.
This establishes the "macro-skeleton" (sleep towns, narrative arc) before drilling down into daily micro-routing.`,
  parameters: macroTripSchema,
  // @ts-ignore
  // @ts-ignore
  execute: async (payload: any) => {
    // Return the generated macro trip payload so it can be rendered by the UI
    return payload;
  }
});
