import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'projectsmandatory-media';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

// Local Media Vault Directory for offline/local storage fallback
const LOCAL_VAULT_DIR = path.join(process.cwd(), 'media_vault');
if (!fs.existsSync(LOCAL_VAULT_DIR)) {
  try {
    fs.mkdirSync(LOCAL_VAULT_DIR, { recursive: true });
  } catch (err) {
    console.warn('[R2 Service] Could not create local media vault dir:', err);
  }
}

let s3Client: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

function getR2Client(): S3Client | null {
  if (!isR2Configured()) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

/**
 * Generate a pre-signed PUT URL for direct client-to-R2 upload
 */
export async function getPresignedUploadUrl(
  objectKey: string,
  contentType: string,
  expiresIn = 3600
): Promise<{ uploadUrl: string; objectKey: string; method: 'PUT'; headers: Record<string, string> }> {
  const client = getR2Client();
  if (client) {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn });
    return {
      uploadUrl,
      objectKey,
      method: 'PUT',
      headers: { 'Content-Type': contentType },
    };
  }

  // Fallback to internal server upload endpoint
  return {
    uploadUrl: `/api/r2/direct-upload?key=${encodeURIComponent(objectKey)}`,
    objectKey,
    method: 'PUT',
    headers: { 'Content-Type': contentType },
  };
}

/**
 * Upload a raw buffer directly to R2 (or local media vault fallback)
 */
export async function uploadBufferToR2(
  objectKey: string,
  buffer: Buffer,
  contentType: string
): Promise<{ success: boolean; objectKey: string; publicUrl: string }> {
  const client = getR2Client();
  if (client) {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
    });
    await client.send(command);

    const publicUrl = R2_PUBLIC_DOMAIN
      ? `https://${R2_PUBLIC_DOMAIN.replace(/^https?:\/\//, '')}/${objectKey}`
      : `/api/r2/media/${encodeURIComponent(objectKey)}`;

    return { success: true, objectKey, publicUrl };
  }

  // Save to local media vault
  const safeFilename = objectKey.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(LOCAL_VAULT_DIR, safeFilename);
  fs.writeFileSync(filePath, buffer);

  return {
    success: true,
    objectKey,
    publicUrl: `/api/r2/media/${encodeURIComponent(objectKey)}`,
  };
}

/**
 * Stream an audio or artwork object with byte-range support (HTTP 206)
 */
export async function getMediaStream(
  objectKey: string,
  rangeHeader?: string
): Promise<{
  stream: Readable;
  statusCode: number;
  headers: Record<string, string | number>;
}> {
  const client = getR2Client();

  if (client) {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Range: rangeHeader,
    });
    const response = await client.send(command);

    const headers: Record<string, string | number> = {
      'Content-Type': response.ContentType || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
    };
    if (response.ContentLength !== undefined) headers['Content-Length'] = response.ContentLength;
    if (response.ContentRange) headers['Content-Range'] = response.ContentRange;

    const stream = response.Body as Readable;
    return {
      stream,
      statusCode: rangeHeader ? 206 : 200,
      headers,
    };
  }

  // Read from local vault
  const safeFilename = objectKey.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(LOCAL_VAULT_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Media object not found: ${objectKey}`);
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const isAudio = objectKey.endsWith('.mp3') || objectKey.endsWith('.wav') || objectKey.endsWith('.m4a');
  const contentType = isAudio
    ? objectKey.endsWith('.wav')
      ? 'audio/wav'
      : 'audio/mpeg'
    : 'image/jpeg';

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    return {
      stream: fileStream,
      statusCode: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      },
    };
  }

  const fileStream = fs.createReadStream(filePath);
  return {
    stream: fileStream,
    statusCode: 200,
    headers: {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    },
  };
}

/**
 * Generate temporary signed access URL for protected media (tracks / downloads)
 */
export async function getSignedAccessUrl(
  objectKey: string,
  expiresIn = 7200
): Promise<string> {
  const client = getR2Client();
  if (client) {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    });
    return await getSignedUrl(client, command, { expiresIn });
  }

  return `/api/r2/media/${encodeURIComponent(objectKey)}`;
}
