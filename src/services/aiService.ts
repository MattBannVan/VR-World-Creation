import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SceneObject {
  id: string;
  type: "box" | "sphere" | "cylinder" | "torus" | "plane" | "light" | "model";
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: string;
  metadata?: any;
}

export interface SceneGraph {
  objects: SceneObject[];
  environment: {
    skyColor: string;
    groundColor: string;
    fog: boolean;
  };
}

export const generateSceneFromPrompt = async (prompt: string): Promise<SceneGraph> => {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an expert 3D environment designer for a VR world creation engine.
    Convert user prompts into a structured JSON scene graph.
    
    The scene graph should include:
    - 'objects': A list of 3D primitives (box, sphere, cylinder, torus, plane).
    - 'environment': Environmental settings.
    
    Guidelines:
    - Use 'id' as a unique string for each object.
    - Positions, rotations, and scales are in 3D coordinates.
    - Colors are hex strings.
    - Be creative and interpret high-level descriptions (e.g., 'a futuristic city', 'a peaceful garden') into many primitive shapes.
    - The ground should usually be a large 'plane' at y: -1.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["objects", "environment"],
          properties: {
            objects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "type", "position", "rotation", "scale", "color"],
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["box", "sphere", "cylinder", "torus", "plane", "light", "model"] },
                  position: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      z: { type: Type.NUMBER }
                    }
                  },
                  rotation: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      z: { type: Type.NUMBER }
                    }
                  },
                  scale: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      z: { type: Type.NUMBER }
                    }
                  },
                  color: { type: Type.STRING }
                }
              }
            },
            environment: {
              type: Type.OBJECT,
              properties: {
                skyColor: { type: Type.STRING },
                groundColor: { type: Type.STRING },
                fog: { type: Type.BOOLEAN }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}") as SceneGraph;
  } catch (error) {
    console.error("AI Scene Generation failed:", error);
    throw error;
  }
};
