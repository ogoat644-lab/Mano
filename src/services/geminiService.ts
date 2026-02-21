import { GoogleGenAI, Type } from "@google/genai";
import { Audience } from "../types";

const SYSTEM_INSTRUCTION = `You are the Virtual Heritage Guide, a world-class expert in global heritage sites, history, and cultural preservation. 
Your goal is to provide engaging, accurate, and insightful information about historical landmarks, ancient civilizations, and cultural traditions across the world (from the Taj Mahal and Hampi to the Great Wall of China and Machu Picchu).

Audience Context:
- If the audience is 'kids': Use a fun, energetic, and simple tone. Focus on exciting stories, legends, and "cool facts". Suggest interactive or fun activities they can do at the site. Avoid overly complex jargon.
- If the audience is 'adults': Provide deep, detailed historical facts, architectural analysis, and academic context. Focus on preservation, geopolitical history, and intricate details.
- If the audience is 'general': Maintain a balanced, sophisticated yet accessible tone.
- If the audience is 'family': Use a warm, inclusive tone that appeals to both children and adults. Focus on shared experiences, "did you know" facts that spark conversation, and collaborative activities.

Grade-Specific Logic (for Kids):
- If a grade (1-10) is provided, tailor the complexity of the language and the type of activities to that specific grade level.

Special Modes (especially for Family/Kids):
1. MCQ Quizzes: Provide 3-5 playful questions to test knowledge.
2. Scavenger Hunts: Provide a list of 3-4 "items" or "details" to look for in a virtual or real visit.
3. Animated Storytelling: Tell a legend or historical event as a captivating story with dramatic flair.
4. Detailed Research Report: When asked for "detailed research", provide a structured response with sections: 
   - **Historical Significance**: Deep dive into the site's past.
   - **Visitor Rating**: Mention the community rating.
   - **Best Timing to Visit**: Practical advice on seasons and hours.
   - **Location & Access**: Use the Google Maps tool to provide precise location details.

Guidelines:
1. Be informative and passionate about global history and culture.
2. Provide practical travel tips.
3. Explain historical facts with context.
4. Use Markdown for formatting.
5. Encourage cultural respect and sustainable tourism globally.

Always respond in a way that feels like a personal, high-end tour guide tailored to the specified audience.`;

export async function getHeritageResponse(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  audience: Audience = 'general',
  grade?: number
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const lowerMessage = message.toLowerCase();
  
  // Detect if user is asking for an image
  const imageKeywords = ['image', 'picture', 'photo', 'show me', 'generate', 'draw', 'visualize'];
  const isImageRequest = imageKeywords.some(keyword => lowerMessage.includes(keyword)) && 
                         (lowerMessage.includes('site') || lowerMessage.includes('temple') || lowerMessage.includes('monument') || lowerMessage.includes('heritage') || lowerMessage.includes('place'));

  if (isImageRequest) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Generate a high-quality, realistic image of the following Indian or global heritage site or historical scene for a ${audience} audience ${grade ? `(Grade ${grade})` : ''}: ${message}. Also provide a brief, engaging description.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    let text = "";
    let imageUrl = "";

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        text += part.text;
      }
    }

    return { text: text || "Here is the visual you requested.", imageUrl };
  }

  // Detect special requests
  const isQuizRequest = ['quiz', 'test', 'mcq', 'question', 'challenge'].some(k => lowerMessage.includes(k));
  const isScavengerRequest = ['scavenger', 'hunt', 'find', 'search'].some(k => lowerMessage.includes(k));
  const isStoryRequest = ['story', 'legend', 'tell me a tale', 'once upon a time'].some(k => lowerMessage.includes(k));

  // Detect if user is asking for a location/map
  const mapKeywords = ['location', 'map', 'where is', 'directions', 'nearby', 'find', 'research', 'timing', 'visit'];
  const isMapRequest = mapKeywords.some(keyword => lowerMessage.includes(keyword));

  const model = isMapRequest ? "gemini-2.5-flash" : "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION}\n\nCURRENT AUDIENCE: ${audience.toUpperCase()}${grade ? `\nCURRENT GRADE: ${grade}` : ''}`,
      tools: isMapRequest ? [{ googleMaps: {} }] : undefined,
      responseMimeType: (isQuizRequest || isScavengerRequest) ? "application/json" : "text/plain",
      responseSchema: (isQuizRequest || isScavengerRequest) ? {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The introductory text or story." },
          mcq: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.INTEGER }
                  },
                  required: ["question", "options", "correctAnswer"]
                }
              }
            }
          },
          scavengerHunt: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    task: { type: Type.STRING },
                    hint: { type: Type.STRING }
                  },
                  required: ["task", "hint"]
                }
              }
            },
            required: ["title", "items"]
          }
        },
        required: ["text"]
      } : undefined
    },
  });

  if (isMapRequest) {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const mapsLinks = chunks?.filter(c => c.maps).map(c => ({
      uri: c.maps?.uri,
      title: c.maps?.title || "View on Google Maps"
    }));
    
    return { 
      text: response.text,
      mapsLinks 
    };
  }

  if (isQuizRequest || isScavengerRequest) {
    try {
      const data = JSON.parse(response.text);
      return { 
        text: data.text, 
        mcq: data.mcq ? { 
          questions: data.mcq.questions, 
          isCompleted: false 
        } : undefined,
        scavengerHunt: data.scavengerHunt ? {
          title: data.scavengerHunt.title,
          items: data.scavengerHunt.items.map((i: any) => ({ ...i, isFound: false })),
          isCompleted: false
        } : undefined
      };
    } catch (e) {
      console.error("Failed to parse JSON", e);
      return { text: response.text };
    }
  }

  return { text: response.text, isStory: isStoryRequest };
}
