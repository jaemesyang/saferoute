import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export function verifyBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        issues: result.error.issues,
      });
    }

    req.body = result.data;
    next();
  };
}
