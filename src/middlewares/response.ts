import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from '../utils/childLogger';

const moduleName = '[response-middleware]'
const Logger = createChildLogger(moduleName)
interface CustomResponse {
  status?: boolean;
  message?: string;
  data?:{id:string, userId:string};
  // Add any other properties you expect in the response
}

const responseMessageMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const originalJson = res.json.bind(res);
        if(req.originalUrl !== '/health'){
            res.json = (body: CustomResponse) => {
                if (body && body.hasOwnProperty('status')) {
                    
                    if (body.status === false) {
                        res.locals.errorMessage = body.message || 'Unknown error';
                        // Logger.info(`res.locals.errorMessage => ${res.locals.errorMessage}`);
                    } else if (body.status === true) {
                        res.locals.responseMessage = body.message || 'Success';
                        res.locals.userId = body.data?.userId || 'No user id from body since the request made does not return userId';
                        // Logger.info(`res.locals.userId => ${res.locals.userId}`)
                        // Logger.info(`res.locals.responseMessage => ${res.locals.responseMessage}`);
                    }
                } else {
                    Logger.info('Property "status" not found in response JSON');
                }
    
                // Call the original json method
                return originalJson(body);
            }; 
        }
        

    } catch (error: any) {
        Logger.error('Error in responseMessagesMiddleware:', error || JSON.stringify(error));
    }

    next();
};

export default responseMessageMiddleware;
