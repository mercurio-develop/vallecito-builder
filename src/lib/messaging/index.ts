import twilio from 'twilio';

type MessagePayload = {
  phone: string;
  body: string;
};

type AvailabilityPayload = {
  phone: string;
  vendorName: string;
  requestedTime?: string;
  partySize?: number;
};

export class MessagingService {
  private static instance: MessagingService;
  private twilioClient: any;

  private constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
    }
  }

  public static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  /**
   * Primary method for sending messages.
   * Uses Twilio in production, or can be forced to local Ghost Phone for campaigns.
   */
  async sendMessage({ phone, body }: MessagePayload, provider: 'twilio' | 'ghost' = 'twilio') {
    const formattedPhone = phone.startsWith('+') ? phone : `+51${phone.replace(/\D/g, '')}`;

    if (provider === 'twilio' && this.twilioClient) {
      console.log(`[Messaging] Sending via Twilio to ${formattedPhone}`);
      return await this.twilioClient.messages.create({
        body,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}`,
        to: `whatsapp:${formattedPhone}`
      });
    }

    // Fallback or explicit request for Ghost Phone (Local)
    return await this.sendToGhostPhone('/api/message/send', { phone, message: body });
  }

  /**
   * Specialized method for availability checks
   */
  async askAvailability(payload: AvailabilityPayload, provider: 'twilio' | 'ghost' = 'twilio') {
    if (provider === 'twilio' && this.twilioClient) {
      const body = `Hello ${payload.vendorName}! 🛎️\n\nVallecito Concierge here. We have a client requesting a booking:\nTime: ${payload.requestedTime || 'As soon as possible'}\nParty Size: ${payload.partySize || '1'}\n\nPlease reply YES to confirm availability or NO if you are full.`;
      return this.sendMessage({ phone: payload.phone, body }, 'twilio');
    }

    return await this.sendToGhostPhone('/api/message/ask-availability', payload);
  }

  private async sendToGhostPhone(endpoint: string, data: any) {
    const url = process.env.GHOST_PHONE_URL ?? '';
    const secret = process.env.WEBHOOK_SECRET || 'dev-secret';

    console.log(`[Messaging] Sending to Local Ghost Phone: ${url}${endpoint}`);

    try {
      const response = await fetch(`${url}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secret}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Ghost Phone responded with ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Messaging] Ghost Phone error:', error);
      throw error;
    }
  }
}

export const messaging = MessagingService.getInstance();
