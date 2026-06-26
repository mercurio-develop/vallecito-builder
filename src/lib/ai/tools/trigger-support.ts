import { tool } from 'ai';
import { z } from 'zod';

export const triggerSupportAlert = tool({
  description: 'Triggers an emergency or high-priority support alert to human operators via the Ghost Phone. Use this when a user is lost, a service fails, or they explicitly request urgent human assistance.',
  parameters: z.object({
    message: z.string().describe('A detailed explanation of the user\'s issue, including any relevant context from the conversation.'),
    urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']).describe('The severity of the issue. Use "critical" for safety concerns or completely failed logistics.')
  }),
  // @ts-ignore
  execute: async ({ message, urgencyLevel }) => {
    // In a real implementation, this would POST to the Ghost Phone webhook
    console.log(`\n🚨 [GHOST PHONE ALERT] Urgency: ${urgencyLevel.toUpperCase()}`);
    console.log(`📝 Message: ${message}`);
    console.log(`🚨 =========================================\n`);

    return {
      success: true,
      statusMessage: "Support alert successfully sent to local human operators."
    };
  }
});