import { JwtPayload } from '@/common/middlewares/auth.middleware.ts';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
