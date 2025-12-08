import { AuthUser } from '@/common/utils/jwt.util.ts';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
