import { ai, IMAGE_MODEL } from './client';

interface GenerateImageOptions {
  prompt: string;
  referenceImages?: { data: string; mimeType: string }[];
  aspectRatio?: string;
  imageSize?: string;
}

interface ImageResult {
  imageData: Buffer;
  mimeType: string;
  text?: string;
}

export async function generateImage(opts: GenerateImageOptions): Promise<ImageResult> {
  const contents: any[] = [{ text: opts.prompt }];

  if (opts.referenceImages) {
    for (const ref of opts.referenceImages) {
      contents.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
    }
  }

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: opts.aspectRatio || '3:4',
        imageSize: opts.imageSize || '1K',
      },
    },
  });

  let imageData: Buffer | null = null;
  let mimeType = 'image/png';
  let text: string | undefined;

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.text) {
      text = part.text;
    } else if (part.inlineData) {
      imageData = Buffer.from(part.inlineData.data!, 'base64');
      mimeType = part.inlineData.mimeType || 'image/png';
    }
  }

  if (!imageData) throw new Error('No image returned from Gemini');
  return { imageData, mimeType, text };
}
