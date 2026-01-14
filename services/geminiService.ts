
import { GoogleGenAI, Type } from "@google/genai";
import { Order, Product } from "../types";

export const analyzeStockConflict = async (orders: Order[], products: Product[]) => {
  const pendingOrders = orders.filter(o => o.status === 'pending');
  
  // Create instance right before use to ensure latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze current inventory vs pending orders.
      Inventory: ${JSON.stringify(products)}
      Pending Orders: ${JSON.stringify(pendingOrders)}
      
      Provide a summary in Thai. Identify if any product is at risk of running out. 
      Suggest priority for confirmation.`,
    config: {
      systemInstruction: "You are a warehouse management assistant specialized in inventory optimization.",
      temperature: 0.7,
    }
  });

  return response.text;
};

export const generateOrderResponseSchema = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.STRING, description: "Analysis of the stock situation" },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          orderId: { type: Type.STRING },
          decision: { type: Type.STRING, enum: ["CONFIRM", "REJECT", "PARTIAL"] },
          reason: { type: Type.STRING }
        }
      }
    }
  }
};
