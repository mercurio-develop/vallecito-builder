import { tool } from 'ai';
import { z } from 'zod';
import { EXPATS_KNOWLEDGE_BASE } from '../knowledge/expats-guide';

export const queryExpatsGuide = tool({
  description: 'Search the comprehensive Expats Guide to the Sacred Valley. Use this to find information about local customs, safety, transportation, food, culture, history, and practical tips for tourists and expats living in or visiting Cusco and the Sacred Valley.',
  parameters: z.object({
    query: z.string().describe('The topic or question to search the guide for, e.g. "altitude sickness", "colectivo", "safety".'),
  }),
  // @ts-ignore
  execute: async ({ query }) => {
    // In a real RAG system, this would do vector search.
    // For now, since the text isn't massive, we can return the whole thing or a chunk
    // But since it's a tool, the LLM will just read what we return.
    
    // We'll just return the full text for the model to read contextually.
    return {
      knowledgeBase: EXPATS_KNOWLEDGE_BASE,
      message: `Here is the comprehensive guide. Please extract the answer for '${query}' from this text.`
    };
  }
});
