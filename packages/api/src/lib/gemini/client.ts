import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const TEXT_MODEL = 'gemini-2.5-pro';
export const IMAGE_MODEL = 'gemini-3-pro-image-preview';

export { ai };
