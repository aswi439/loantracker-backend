// src/services/s3.ts
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',
});

export async function uploadPhotoToS3(
  fileBuffer: Buffer,
  originalName: string,
  loanId: string
): Promise<string> {
  const ext = path.extname(originalName) || '.jpg';
  const key = `uploads/${loanId}/${uuidv4()}${ext}`;

  const params: AWS.S3.PutObjectRequest = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    Body: fileBuffer,
    ContentType: 'image/jpeg',
    ServerSideEncryption: 'AES256',
    Metadata: {
      loanId,
      uploadedAt: new Date().toISOString(),
    },
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}

export async function deletePhotoFromS3(key: string): Promise<void> {
  await s3.deleteObject({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  }).promise();
}
