import { JwtPayload } from '@/common/utils/jwt.util.ts';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
