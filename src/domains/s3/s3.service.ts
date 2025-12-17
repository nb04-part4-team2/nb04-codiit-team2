import { uploadFile } from '@/common/utils/s3.util.js';

export class S3Service {
  async uploadImage(file: Express.Multer.File) {
    const { url, key } = await uploadFile({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });

    return {
      message: '업로드 성공',
      url,
      key,
    };
  }
}
