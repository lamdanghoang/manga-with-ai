import { ai, TEXT_MODEL } from './client';

interface GenerateStructuredOptions {
  prompt: string;
  systemInstruction?: string;
  schema: Record<string, unknown>;
}

export async function generateStructuredJSON<T>(opts: GenerateStructuredOptions): Promise<T> {
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: opts.prompt,
    config: {
      systemInstruction: opts.systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: opts.schema as any,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text response from Gemini');
  return JSON.parse(text) as T;
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: { systemInstruction },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text response from Gemini');
  return text;
}
