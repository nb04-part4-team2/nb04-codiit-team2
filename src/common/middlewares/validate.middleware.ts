import { ZodObject } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: ZodObject, part: 'body' | 'query' | 'params') =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req[part]);

      // query와 params는 읽기 전용이므로 defineProperty 사용
      if (part === 'query' || part === 'params') {
        Object.defineProperty(req, part, {
          value: validatedData,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        // body는 직접 할당 가능
        req[part] = validatedData;
      }

      next();
    } catch (e) {
      next(e);
    }
  };
