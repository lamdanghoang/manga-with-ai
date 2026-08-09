const IMAGE_MODEL = 'gemini-2.5-flash-image';

interface GenerateImageOptions {
  prompt: string;
  referenceImages?: { data: string; mimeType: string }[];
  aspectRatio?: string;
}

interface ImageResult {
  imageData: Buffer;
  mimeType: string;
  text?: string;
}

export async function generateImage(opts: GenerateImageOptions): Promise<ImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const parts: any[] = [{ text: opts.prompt }];
  for (const ref of opts.referenceImages || []) {
    parts.push({ inline_data: { mime_type: ref.mimeType, data: ref.data } });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }),
        signal: controller.signal,
      },
    );
    const data = await response.json() as any;
    if (!response.ok || data.error) throw new Error(`Gemini API request failed (${response.status})`);

    let imageData: Buffer | null = null;
    let mimeType = 'image/png';
    let text: string | undefined;
    for (const part of data.candidates?.[0]?.content?.parts || []) {
      if (part.text) text = part.text;
      else if (part.inlineData || part.inline_data) {
        const inline = part.inlineData || part.inline_data;
        imageData = Buffer.from(inline.data, 'base64');
        mimeType = inline.mimeType || inline.mime_type || 'image/png';
      }
    }
    if (!imageData) throw new Error('No image returned from Gemini');
    return { imageData, mimeType, text };
  } finally {
    clearTimeout(timeout);
  }
}
