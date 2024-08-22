import { Request, Response, NextFunction } from "express"
import { AuthenticatedRequest } from "./security"
import auditLogs from "../models/logs"
import { undefinedConverter } from "../utils/common"

const auditMiddleware = (request:AuthenticatedRequest, response: Response, next:NextFunction) => { 

    let logData = {}
    response.on('finish', () => { 
        const isLoginRoute = request.originalUrl === '/api/login';
        if( request.originalUrl !== '/health' && request.originalUrl !== '/api/login' && request.originalUrl !== '/api/select-role' && request.originalUrl !== '/api/forgot-password' && request.originalUrl !== '/api/reset-password'){ 
            // Logger.info(`display the logged in userId. This is from the audit middleware => ${JSON.stringify(request.auth)}`)
            logData = { 
                ip: request.ip || '---', 
                host: request.hostname || '---',
                method: request.method || '---', 
                url: request.originalUrl || '---', 
                fields: JSON.stringify(request.body) || '---', 
                query: JSON.stringify(request.query) || '---', 
                params: JSON.stringify(request.params) || '---', 
                userId: request.auth.userId || '---', 
                userRole: request.auth.role_id && request.auth.role_id._id ? request.auth.role_id._id : request.auth.roleId || '---',
                permission: request.permissionName || '---',
                timestamp: new Date().toISOString(),
                statusCode: response.statusCode || '---',
                errorMessage: response.locals.errorMessage || '---',
                responseMessage: response.locals.responseMessage || '---'
            }
        }else{ 
            logData = { 
                ip: request.ip || '---', 
                host: request.hostname || '---',
                method: request.method || '---', 
                url: request.originalUrl || '---', 
                fields: JSON.stringify(request.body.username), 
                query: JSON.stringify(request.query) || '---', 
                params: JSON.stringify(request.params) || '---', 
                userId: response.locals.userId || '---', 
                permission: request.permissionName || '---',
                timestamp: new Date().toISOString(),
                statusCode: response.statusCode || '---',
                errorMessage: response.locals.errorMessage || '---',
                responseMessage: response.locals.responseMessage || '---'
            }
        }
        
        
        // if request.method !== 'GET' save in the database
        const sanitizedLogData = undefinedConverter(logData);
        // Logger.info(`obj to save => ${JSON.stringify(sanitizedLogData)}`)
        // if (request.method !== 'GET') auditLogs.create(sanitizedLogData) 
    })

    
    next()
}

export default auditMiddleware