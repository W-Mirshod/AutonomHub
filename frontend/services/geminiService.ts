
import { GoogleGenAI, Type } from "@google/genai";
import { Plan, Agent, MarketingMetrics } from '../types';
import { VEO_MODEL, SCRIPT_MODEL } from '../constants';

const SCRIPT_GENERATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A short, catchy title for the entire video sequence."
    },
    scenes: {
      type: Type.ARRAY,
      description: "An array of scenes that make up the video.",
      items: {
        type: Type.OBJECT,
        properties: {
          sceneNumber: {
            type: Type.INTEGER,
            description: "The sequential number of the scene, starting from 1."
          },
          script: {
            type: Type.STRING,
            description: "A short script or description of what happens in this scene."
          },
          prompt: {
            type: Type.STRING,
            description: "A detailed, cinematic prompt for a video generation model (like Veo) to create this scene. Should be visually descriptive."
          }
        },
        required: ["sceneNumber", "script", "prompt"]
      }
    }
  },
  required: ["title", "scenes"]
};

export const generateScriptAndPrompts = async (
  userInput: string, 
  hasImage: boolean, 
  numberOfScenes: number, 
  agent: Agent,
  marketingData?: MarketingMetrics
): Promise<Omit<Plan, 'id' | 'timestamp'>> => {
  if (!process.env.API_KEY) {
    throw new Error("API key not found. Please select an API key.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageContext = hasImage
    ? 'The user has provided a starting image for the first scene. The prompt for scene 1 should describe an action or evolution based on this image.'
    : '';

  let agentContext = `You are an AI Video Production Agent with the following persona: "${agent.instruction}".`;

  if (agent.id === 'marketer' && marketingData) {
    agentContext += `
      \n\nCRITICAL DATA CONTEXT:
      You are analyzing the user's ${marketingData.platform} profile.
      - Avg Engagement: ${marketingData.engagementRate}
      - Top Demographic: ${marketingData.topDemographic}
      - Retention Dropoff Point: ${marketingData.retentionDropoff}
      
      STRATEGY:
      - The video MUST address the retention dropoff at ${marketingData.retentionDropoff} by having a visual change or surprise exactly then.
      - Tailor the visual style to appeal to ${marketingData.topDemographic}.
    `;
  }

  const contents = `
    ${agentContext}
    
    Task: Based on the user request, create a plan for a short video composed of exactly ${numberOfScenes} connected scenes.
    For each scene, provide a script and a detailed visual prompt for a text-to-video generation model.
    ${imageContext}
    The final output must be in JSON format.
    
    User request: "${userInput}"
  `;

  const response = await ai.models.generateContent({
    model: SCRIPT_MODEL,
    contents: contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: SCRIPT_GENERATION_SCHEMA,
    },
  });

  const rawJson = response.text ? response.text.trim() : "{}";
  const parsedResponse = JSON.parse(rawJson);

  // Validate that the model returned the correct number of scenes
  if (!parsedResponse.scenes || parsedResponse.scenes.length !== numberOfScenes) {
    console.warn(`Model did not return the requested number of scenes. Expected ${numberOfScenes}, got ${parsedResponse.scenes?.length || 0}.`);
  }

  const plan: Omit<Plan, 'id' | 'timestamp'> = {
    title: parsedResponse.title,
    scenes: parsedResponse.scenes.map((scene: any) => ({
      ...scene,
      status: 'pending',
    })),
    agentId: agent.id,
    marketingData: marketingData
  };
  return plan;
};


export interface VideoGenerationConfig {
    prompt: string;
    aspectRatio: '16:9' | '9:16';
    image?: {
        base64: string;
        mimeType: string;
    } | null;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isGeminiRateLimitError = (e: any): boolean => {
    const errorDetails = e.error || {};
    return errorDetails.status === 'RESOURCE_EXHAUSTED' || errorDetails.code === 429;
};


export const generateVideoForScene = async (config: VideoGenerationConfig): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key not found. Please select an API key.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const payload: any = {
        model: VEO_MODEL,
        prompt: config.prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: config.aspectRatio,
        }
    };

    if (config.image?.base64 && config.image?.mimeType) {
        payload.image = {
            imageBytes: config.image.base64,
            mimeType: config.image.mimeType,
        };
    }


    let attempt = 0;
    const maxAttempts = 4;
    const initialDelay = 20000; // Start with a 20s delay for Veo's low RPM

    while (attempt < maxAttempts) {
        attempt++;
        try {
            let operation = await ai.models.generateVideos(payload);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) {
                throw new Error("Video generation failed to produce a download link.");
            }
            
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!response.ok) {
                throw new Error(`Failed to download video file. Status: ${response.status}`);
            }
            const videoBlob = await response.blob();
            return URL.createObjectURL(videoBlob);
        } catch (e: any) {
            if (isGeminiRateLimitError(e) && attempt < maxAttempts) {
                const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff: 20s, 40s, 80s
                console.warn(`Rate limit exceeded on attempt ${attempt}. Retrying in ${delay / 1000} seconds...`);
                await sleep(delay);
            } else {
                console.error(`Failed on attempt ${attempt}:`, e);
                throw e; // Re-throw if not a rate limit error or if max attempts are reached.
            }
        }
    }
    
    throw new Error(`Failed to generate video after ${maxAttempts} attempts due to persistent rate limiting.`);
};
