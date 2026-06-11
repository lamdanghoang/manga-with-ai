import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const R2_CONFIGURED = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
const API_URL = process.env.PUBLIC_API_URL || `http://localhost:${process.env.API_PORT || 4000}`;
const LOCAL_DIR = path.resolve('uploads');

if (!R2_CONFIGURED && !fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

async function uploadToR2(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const key = `panels/${filename}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export function uploadImageSync(buffer: Buffer, mimeType: string): string {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(LOCAL_DIR, filename), buffer);
  return `${API_URL}/uploads/${filename}`;
}

export async function uploadImage(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const filename = `${randomUUID()}.${ext}`;

  if (R2_CONFIGURED) {
    return uploadToR2(buffer, mimeType, filename);
  }

  fs.writeFileSync(path.join(LOCAL_DIR, filename), buffer);
  return `${API_URL}/uploads/${filename}`;
}
