import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@/config/constants.js';

if (!env.AWS_S3_BUCKET || !env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('S3 설정에 필요한 환경 변수가 누락되었습니다.');
}

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

interface FileUploadParams {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export const uploadFile = async ({ buffer, originalname, mimetype }: FileUploadParams) => {
  const key = `${Date.now()}_${originalname}`;

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET, // 어느 버킷에
    Key: key, // 어떤 이름으로
    Body: buffer, // 어떤 파일(내용)을
    ContentType: mimetype, // 어떤 파일 타입으로
  });

  try {
    await s3Client.send(command);
    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 파일 업로드 에러:', error);
    throw new Error('파일 업로드에 실패했습니다.');
  }
};

export const deleteFile = async (fileKey: string) => {
  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: fileKey,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error('S3 파일 삭제 에러:', error);
    throw new Error('파일 삭제에 실패했습니다.');
  }
};
