import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function generateZagatProfile(rating: number, rawReviews: string) {
  const result = await generateObject({
    model: google('gemini-2.5-pro'),
    system: `You are an expert Zagat Guide editor. You will receive a Google Rating (e.g. 4.6) and raw review texts for a business. You must return a JSON object with:
1. scoreQuality, scoreVibe, scoreService.
First, calculate the baseline out of 30: (Google Rating / 5.0) * 30.
Then, adjust the Quality, Vibe, and Service scores slightly up or down from that baseline based strictly on the sentiment found in the raw reviews.
- Quality: look for mentions of "delicious," "authentic," "cold," or "bland."
- Vibe: look for "beautiful views," "loud music," "cozy," or "dirty bathrooms."
- Service: look for "friendly staff," "slow," "welcoming," or "rude."
(e.g., if the baseline is 27, but reviews rave about the food and complain about slow waiters, adjust Quality to 29, Vibe to 27, Service to 24).
2. zagatSummary: A 2-to-3 sentence review that synthesizes the opinions. You MUST embed 3 or 4 short, punchy quotes from the raw reviews directly into your sentences (e.g., This 'hidden gem' offers 'stunning valley views').`,
    prompt: `Google Rating: ${rating}\n\nRaw Reviews: \n\n${rawReviews}`,
    schema: z.object({
      scoreQuality: z.number().min(0).max(30).describe('Quality score out of 30, adjusted from baseline by sentiment.'),
      scoreVibe: z.number().min(0).max(30).describe('Vibe score out of 30, adjusted from baseline by sentiment.'),
      scoreService: z.number().min(0).max(30).describe('Service score out of 30, adjusted from baseline by sentiment.'),
      zagatSummary: z.string().describe('A 2-to-3 sentence review embedding 3 or 4 punchy quotes from the raw reviews.')
    })
  });

  return result.object;
}
