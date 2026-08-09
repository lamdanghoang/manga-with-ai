const TEXT_MODEL = 'gemini-3-flash-preview';

async function callGemini(body: unknown): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json() as any;
    if (!response.ok || data.error) throw new Error(`Gemini text API request failed (${response.status})`);
    return data;
  } finally { clearTimeout(timeout); }
}

export async function generateStructuredJSON<T>(opts: { prompt: string; systemInstruction?: string; schema: Record<string, unknown> }): Promise<T> {
  const body: any = { contents: [{ parts: [{ text: opts.prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: opts.schema } };
  if (opts.systemInstruction) body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  const data = await callGemini(body);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text response from Gemini');
  return JSON.parse(text) as T;
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const body: any = { contents: [{ parts: [{ text: prompt }] }] };
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };
  const data = await callGemini(body);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text response from Gemini');
  return text;
}
