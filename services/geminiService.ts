import { GoogleGenAI, Type } from "@google/genai";

// Ensure we have the API key. In a real app, this is handled via environment variables.
// The instructions specify using process.env.API_KEY directly.
const getAIClient = async () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Uses Gemini 3 Pro with Thinking Mode to analyze the route and predict delays.
 */
export const analyzeRouteImpact = async (
  origin: string,
  destination: string,
  currentLocation: string
) => {
  const ai = await getAIClient();
  
  const prompt = `
    Analyze a logistics route for a parcel in India.
    Origin: ${origin}
    Destination: ${destination}
    Current Location: ${currentLocation}
    
    Consider potential weather patterns (e.g. monsoon, heatwaves), typical traffic congestion for this route (Indian highways/cities), and general logistics challenges in India.
    
    Provide a detailed reasoning of potential delays. 
    Estimate a "Delay Probability" percentage (0-100).
    Suggest a recommended action for the customer.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Thinking budget for deep analysis
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: { type: Type.STRING, description: "Short summary of prediction" },
            reasoning: { type: Type.STRING, description: "Detailed thought process and analysis" },
            delayProbability: { type: Type.NUMBER, description: "Probability of delay as a percentage integer" },
            weatherImpact: { type: Type.STRING, description: "Specific weather concerns" },
            recommendedAction: { type: Type.STRING, description: "Advice for the customer" },
          },
        },
      },
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Uses Gemini 3 Flash with Google Search to get real-time info.
 */
export const fetchLiveConditions = async (location: string) => {
  const ai = await getAIClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Get current real-time conditions for logistics in ${location}, India.
        Return 3 distinct parts: 
        1. Current Traffic Status (congestion, roadworks).
        2. Current Weather Status (temp, rain, visibility).
        3. Critical Alerts (if any severe weather or traffic warnings exist, otherwise empty array).
      `,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                trafficStatus: { type: Type.STRING, description: "Current traffic conditions summary" },
                weatherStatus: { type: Type.STRING, description: "Current weather conditions summary" },
                alerts: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "List of critical alerts" 
                }
            }
        }
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri || "#",
    })) || [];

    const parsed = response.text ? JSON.parse(response.text) : { trafficStatus: "Unavailable", weatherStatus: "Unavailable", alerts: [] };

    return {
      data: parsed,
      sources,
    };
  } catch (error) {
    console.error("Live fetch failed:", error);
    return { 
        data: { trafficStatus: "Data Unavailable", weatherStatus: "Data Unavailable", alerts: [] }, 
        sources: [] 
    };
  }
};

/**
 * Uses Veo to generate a predictive delivery simulation video.
 */
export const generateDeliverySimulation = async (prompt: string) => {
  const ai = await getAIClient();

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!videoUri) {
        throw new Error("Video generation returned no URI.");
    }
    
    // Append API Key as per guidelines for fetching/playback
    return `${videoUri}&key=${process.env.API_KEY}`;
  } catch (error) {
    console.error("Veo simulation failed:", error);
    throw error;
  }
};
