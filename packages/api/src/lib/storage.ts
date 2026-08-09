import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const R2_CONFIGURED = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
const API_URL = process.env.PUBLIC_API_URL || `http://localhost:${process.env.API_PORT || 4000}`;
const LOCAL_DIR = path.resolve('uploads');

if (!R2_CONFIGURED && !fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

async function uploadToR2(buffer: Buffer, mimeType: string, key: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { NodeHttpHandler } = await import('@smithy/node-http-handler');
  const https = await import('https');

  const agent = new https.Agent({ rejectUnauthorized: false });
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    requestHandler: new NodeHttpHandler({ httpsAgent: agent }),
    forcePathStyle: true,
  });

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
  const ext = mimeType.includes('json') ? 'json' : mimeType.includes('png') ? 'png' : 'jpg';
  const folder = mimeType.includes('json') ? 'metadata' : 'panels';
  const filename = `${randomUUID()}.${ext}`;

  if (R2_CONFIGURED) {
    return uploadToR2(buffer, mimeType, `${folder}/${filename}`);
  }

  fs.writeFileSync(path.join(LOCAL_DIR, filename), buffer);
  return `${API_URL}/uploads/${filename}`;
}
