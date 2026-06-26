import { tool } from 'ai';
import { z } from 'zod';

export const askUserLocation = tool({
  description: 'Displays a button in the chat asking the user to share their current GPS location. Use this when the user is starting their journey and you need their exact starting point.',
  parameters: z.object({
    message: z.string().describe('A custom message to display above the button, e.g. "To calculate your route, please share your current location."')
  }),
  // @ts-ignore
  execute: async ({ message }: any) => {
    return {
      requested: true,
      message
    };
  }
} as any);
