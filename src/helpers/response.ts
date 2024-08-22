import { Response } from 'express';

const responseStatusCode = {
  success: 200,
  created: 201,
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  internal_server_error: 500,
};

const createResponse = (message: string, data: any, res: Response): void => {
  res.locals.status = false;
  res.status(responseStatusCode.created).json({
    status: true,
    message,
    data,
  });
};

const successResponse = (message: string, data: any, res: Response): void => {
  res.locals.status = true;
  res.status(responseStatusCode.success).json({
    status: true,
    message,
    data,
  });
};

const badRequestResponse = (message: string, res: Response): void => {
  res.locals.status = false;
  res.status(responseStatusCode.bad_request).json({
    status: false,
    message,
  });
};

const unAuthorizedResponse = (message: string, res: Response): void => {
  res.locals.status = false;
  res.status(responseStatusCode.unauthorized).json({
    status: false,
    message,
  });
};

const forbiddenResponse = (message: string, res: Response): void => {
  res.locals.status = false;
  res.status(responseStatusCode.forbidden).json({
    status: false,
    message,
  });
};

const notFoundResponse = (message: string, res: Response): void => {
  res.locals.status = false;
  res.status(responseStatusCode.not_found).json({
    status: false,
    message,
  });
};

const serverErrorResponse = (message: string, res: Response, err: Error): void => {
  res.locals.status = false;
  res.status(responseStatusCode.internal_server_error).json({
    status: false,
    message,
    err
  });
};

export default {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
  unAuthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  createResponse,
};
