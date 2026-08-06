import { execSync } from 'child_process';
import * as fs from 'fs';

const TEXT_MODEL = 'gemini-2.5-flash';

function callGemini(body: string): any {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`;
  const apiKey = process.env.GEMINI_API_KEY!;
  const tmpFile = `/tmp/gemini_text_${Date.now()}.json`;

  fs.writeFileSync(tmpFile, body);
  try {
    const result = execSync(
      `curl -sk -X POST "${url}" -H "x-goog-api-key: ${apiKey}" -H "Content-Type: application/json" -d @${tmpFile}`,
      { maxBuffer: 10 * 1024 * 1024, timeout: 120000 }
    );
    return JSON.parse(result.toString());
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

export async function generateStructuredJSON<T>(opts: { prompt: string; systemInstruction?: string; schema: Record<string, unknown> }): Promise<T> {
  const body: any = {
    contents: [{ parts: [{ text: opts.prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: opts.schema,
    },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }

  const data = callGemini(JSON.stringify(body));
  if (data.error) throw new Error(`Gemini text API: ${data.error.message?.slice(0, 200)}`);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text response from Gemini');
  return JSON.parse(text) as T;
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const body: any = { contents: [{ parts: [{ text: prompt }] }] };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const data = callGemini(JSON.stringify(body));
  if (data.error) throw new Error(`Gemini text API: ${data.error.message?.slice(0, 200)}`);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text response from Gemini');
  return text;
}
