import { GoogleGenAI, Modality, Type, LiveSession } from "@google/genai";
import { MODELS, SYSTEM_INSTRUCTIONS } from '../constants';

// We must create a new instance when needed to ensure fresh API key usage
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  // 1. Fast Triage (Lite model)
  async quickTriage(symptoms: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.FAST,
      contents: symptoms,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS.TRIAGE,
      }
    });
    return response.text;
  },

  // 2. Chatbot (Pro model) - Updated for Multimodal
  async chat(message: string, images: string[] = [], history: any[] = []) {
    const ai = getAI();
    let contents: any = message;

    if (images && images.length > 0) {
        const parts: any[] = [{ text: message }];
        images.forEach(img => {
            // Expecting data:image/xyz;base64,DATA
            const [meta, data] = img.split(',');
            const mimeType = meta.split(':')[1].split(';')[0];
            parts.push({
                inlineData: {
                    mimeType,
                    data
                }
            });
        });
        contents = { parts };
    }

    const response = await ai.models.generateContent({
      model: MODELS.CHAT,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS.MEDICAL,
      }
    });
    return response.text;
  },

  // 3. Image Analysis (Pro Vision)
  async analyzeImage(base64Image: string, prompt: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.VISION,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      }
    });
    return response.text;
  },

  // 4. Video Analysis (Pro Vision)
  async analyzeVideo(base64Video: string, prompt: string, mimeType: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.VIDEO,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Video } },
          { text: prompt }
        ]
      }
    });
    return response.text;
  },

  // 5. Google Maps (Flash 2.5)
  async findNearby(query: string, location: { lat: number; lng: number }) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.MAPS,
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.lat,
              longitude: location.lng
            }
          }
        }
      }
    });
    return {
      text: response.text,
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  },

  // 6. Search Grounding (Flash 3)
  async research(query: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.SEARCH,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return {
      text: response.text,
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  },

  // 7. Thinking Mode (Pro 3)
  async thinkDeep(query: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.THINKING,
      contents: query,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        systemInstruction: SYSTEM_INSTRUCTIONS.RESEARCH
      }
    });
    return response.text;
  },

  // 8. Image Generation (Pro 3 Image)
  async generateAnatomyImage(prompt: string, aspectRatio: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE_GEN,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any, // Cast to any to avoid strict enum type issues if string passed
          imageSize: '1K'
        }
      }
    });
    
    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  },

  // 9. Transcription (Flash 3)
  async transcribeAudio(base64Audio: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.TRANSCRIPTION,
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/mp3', data: base64Audio } }, // Assuming mp3/wav common format
          { text: "Transcribe this medical note accurately." }
        ]
      }
    });
    return response.text;
  },

  // 10. TTS (Flash 2.5 TTS)
  async generateSpeech(text: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.TTS,
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' } // Deep, calm voice
          }
        }
      }
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  },

  // 11. Live Connect
  async connectLive(callbacks: any) {
    const ai = getAI();
    return ai.live.connect({
      model: MODELS.LIVE,
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' }}
        },
        systemInstruction: SYSTEM_INSTRUCTIONS.MEDICAL + " You are speaking in a voice consultation."
      }
    });
  },

  // 12. Sentiment Analysis
  async analyzeSentiment(text: string): Promise<'positive' | 'neutral' | 'negative'> {
    if (!text) return 'neutral';
    const ai = getAI();
    try {
      const response = await ai.models.generateContent({
        model: MODELS.FAST,
        contents: `Analyze the sentiment of this text. Return ONLY one word: "positive", "negative", or "neutral". Text: "${text.substring(0, 500)}"`,
      });
      const result = response.text?.toLowerCase().trim() || 'neutral';
      if (result.includes('positive')) return 'positive';
      if (result.includes('negative')) return 'negative';
      return 'neutral';
    } catch (e) {
      return 'neutral';
    }
  }
};