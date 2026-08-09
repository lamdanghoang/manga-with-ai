import { execSync } from 'child_process';
import * as fs from 'fs';

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

  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`;
  const tmpFile = `/tmp/gemini_img_${Date.now()}.json`;
  fs.writeFileSync(tmpFile, body);

  let data: any;
  try {
    console.log('[IMAGE] Calling curl for image generation...');
    const result = execSync(
      `curl -sk -X POST "${url}" -H "x-goog-api-key: ${apiKey}" -H "Content-Type: application/json" -d @${tmpFile}`,
      { maxBuffer: 50 * 1024 * 1024, timeout: 120000 }
    );
    console.log('[IMAGE] Curl returned, parsing response...');
    data = JSON.parse(result.toString());
    if (data.error) {
      throw new Error(`Gemini API request failed (${data.error.code})`);
    }
    const respParts = data.candidates?.[0]?.content?.parts || [];
    console.log('[IMAGE] Parts:', respParts.length, respParts.map((p: any) => p.text ? 'text' : p.inlineData ? 'image' : 'other'));
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }

  const responseParts = data.candidates?.[0]?.content?.parts || [];
  let imageData: Buffer | null = null;
  let mimeType = 'image/png';
  let text: string | undefined;

  for (const part of responseParts) {
    if (part.text) text = part.text;
    else if (part.inlineData || part.inline_data) {
      const inline = part.inlineData || part.inline_data;
      imageData = Buffer.from(inline.data, 'base64');
      mimeType = inline.mimeType || inline.mime_type || 'image/png';
    }
  }

  if (!imageData) throw new Error('No image returned from Gemini');
  console.log('[IMAGE] Got image, size:', imageData.length, 'bytes');
  return { imageData, mimeType, text };
}
