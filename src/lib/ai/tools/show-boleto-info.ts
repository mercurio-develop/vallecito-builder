import { z } from "zod";
import { tool } from "ai";

export const BOLETO_DATA = {
  all: {
    title: "Boleto Turístico Integral",
    days: 10,
    foreignPrice: "130 PEN (~$35 USD)",
    nationalPrice: "70 PEN",
    description: "Includes 16 major archaeological sites and museums across Cusco and the Sacred Valley.",
    mapUrl: "https://cuscoperu.b-cdn.net/wp-content/uploads/2023/06/Mapa-del-Boleto-Turistico-Integral-del-Cusco-scaled.jpg",
    places: ["Sacsayhuaman", "Q'enqo", "Puka Pukara", "Tambomachay", "Pisac", "Ollantaytambo", "Chinchero", "Moray", "Tipon", "Pikillaqta", "Museums..."]
  },
  I: {
    title: "Circuito I - Sitios de la Ciudad",
    days: 1,
    foreignPrice: "70 PEN (~$19 USD)",
    nationalPrice: "40 PEN",
    description: "Valid for 1 day. Covers the 4 ruins just above Cusco city.",
    mapUrl: "https://cuscoperu.b-cdn.net/wp-content/uploads/2023/06/Mapa-del-Boleto-Turistico-Parcial-Circuito-I-scaled.jpg",
    places: ["Sacsayhuaman", "Q'enqo", "Puka Pukara", "Tambomachay"]
  },
  II: {
    title: "Circuito II - Museos y Valle Sur",
    days: 2,
    foreignPrice: "70 PEN (~$19 USD)",
    nationalPrice: "40 PEN",
    description: "Valid for 2 days. Covers South Valley ruins and city museums.",
    mapUrl: "https://cuscoperu.b-cdn.net/wp-content/uploads/2023/06/Mapa-del-Boleto-Turistico-Parcial-Circuito-II-scaled.jpg",
    places: ["Tipon", "Pikillaqta", "Museo Histórico Regional", "Museo de Arte Contemporáneo", "Museo de Arte Popular", "Centro Qosqo de Arte Nativo", "Monumento a Pachacutec"]
  },
  III: {
    title: "Circuito III - Valle Sagrado",
    days: 2,
    foreignPrice: "70 PEN (~$19 USD)",
    nationalPrice: "40 PEN",
    description: "Valid for 2 days. Covers the major Sacred Valley ruins.",
    mapUrl: "https://cuscoperu.b-cdn.net/wp-content/uploads/2023/06/Mapa-del-Boleto-Turistico-Parcial-Circuito-III-scaled.jpg",
    places: ["Pisac Ruins", "Ollantaytambo Ruins", "Chinchero Ruins", "Moray"]
  }
};

export const showBoletoInfo = tool({
  description: "Displays information, prices, and maps for the Boleto Turístico del Cusco (Cusco Tourist Ticket) and its different circuits.",
  parameters: z.object({
    circuit: z.enum(["all", "I", "II", "III"]).describe("Which circuit to show information about. 'all' shows the full ticket. I is City Ruins, II is South Valley/Museums, III is Sacred Valley."),
    message: z.string().describe("A brief conversational message to the user explaining the ticket.")
  }),
  // @ts-ignore
  execute: async ({ circuit, message }) => {
    return {
      circuit,
      message,
      data: BOLETO_DATA[circuit as keyof typeof BOLETO_DATA]
    };
  }
});
