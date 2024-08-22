// middleware/roleMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './security';
import { createChildLogger } from '../utils/childLogger';
import customResponse from "../helpers/response"

const moduleName = "[requireRole/middleware]"
const Logger = createChildLogger(moduleName)

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    const userRole = req.auth.role_name == undefined ? req.auth.role_id.role_name : req.auth.role_name
    Logger.info(userRole)

    if (!allowedRoles.includes(userRole)) {
      return customResponse.forbiddenResponse(` ${userRole} Role does not have permission to use this route`, res)
    }

    next();
  };
};
