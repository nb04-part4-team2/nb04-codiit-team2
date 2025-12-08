import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { env } from '@/config/constants.js';

let s3Client: S3Client;

const getS3Client = () => {
  if (!s3Client) {
    if (
      !env.AWS_S3_BUCKET ||
      !env.AWS_REGION ||
      !env.AWS_ACCESS_KEY_ID ||
      !env.AWS_SECRET_ACCESS_KEY
    ) {
      throw new Error('S3 설정에 필요한 환경 변수가 누락되었습니다.');
    }
    s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

interface FileUploadParams {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export const uploadFile = async ({ buffer, originalname, mimetype }: FileUploadParams) => {
  const client = getS3Client();
  const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9._-]/g, '');
  const key = `${randomUUID()}_${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  });

  try {
    await client.send(command);
    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 파일 업로드 에러:', error);
    throw new Error(`파일 업로드에 실패했습니다. (Bucket: ${env.AWS_S3_BUCKET}, Key: ${key})`);
  }
};

export const deleteFile = async (fileKey: string) => {
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: fileKey,
  });

  try {
    await client.send(command);
  } catch (error) {
    console.error('S3 파일 삭제 에러:', error);
    throw new Error(`파일 삭제에 실패했습니다. (Key: ${fileKey})`);
  }
};
