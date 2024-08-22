import { Request, Response, NextFunction } from 'express';
/**
 * Catches any error thrown from a controller
 */
const catchAsync = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

export default catchAsync;
