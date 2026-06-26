import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { tool } from 'ai';

export const getBusinessDetails = tool({
  description: 'Looks up specific details for a local business by its exact name, returning operating hours, contact phone, website, and editorial summary.',
  parameters: z.object({
    businessName: z.string().describe('The exact name of the business to look up.'),
  }),
  // @ts-ignore
  // @ts-ignore
  execute: async ({ businessName }: any) => {
    try {
      const business = await prisma.business.findFirst({
        where: {
          name: {
            contains: businessName,
          }
        },
        select: {
          name: true,
          description: true,
          whatsapp: true,
          tagline: true,
          priceTier: true,
          category: true,
        }
      });

      if (!business) {
        return { error: `Could not find a business matching "${businessName}".` };
      }

      return {
        name: business.name,
        operatingHours: 'Not available',
        contactPhone: business.whatsapp || 'Not available',
        editorialSummary: business.description || business.tagline || 'Not available',
        priceEstimate: business.priceTier || 'Not available',
        category: business.category || 'Not available',
      };
    } catch (e) {
      console.error(e);
      return { error: 'Failed to look up business details.' };
    }
  }
});
