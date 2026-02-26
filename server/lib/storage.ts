import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

let _s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: process.env.MINIO_REGION || 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT,
      forcePathStyle: true, // Required for MinIO
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || '',
        secretAccessKey: process.env.MINIO_SECRET_KEY || ''
      }
    })
  }
  return _s3Client
}

const BUCKET_NAME = process.env.MINIO_BUCKET || 'midias'

/**
 * Returns the public URL for an object key without making a request.
 */
export function getPublicUrl(key: string): string {
  const base = process.env.MINIO_PUBLIC_URL || `http://localhost:9000/${BUCKET_NAME}`
  return `${base.replace(/\/$/, '')}/${key}`
}

/**
 * Uploads a buffer to MinIO and returns the public URL.
 */
export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const s3 = getS3Client()

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType
  }))

  return getPublicUrl(key)
}

/**
 * Deletes an object from MinIO by key.
 */
export async function deleteFile(key: string): Promise<void> {
  const s3 = getS3Client()

  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  }))
}

/**
 * Extracts the storage key from a full public URL.
 * Useful when you have a stored URL and need to delete the file.
 */
export function urlToKey(url: string): string | null {
  try {
    const publicBase = process.env.MINIO_PUBLIC_URL || `http://localhost:9000/${BUCKET_NAME}`
    const base = publicBase.replace(/\/$/, '')
    if (url.startsWith(base + '/')) {
      return url.slice(base.length + 1)
    }
    return null
  } catch {
    return null
  }
}
