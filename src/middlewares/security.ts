import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import customResponse from '../helpers/response';
import user from '../api/users/users.controller';
import RolePermissions from '../models/rolePermission';
import { Logger } from '../utils/logger';



// Extend the Request type to include the 'auth' property
interface AuthenticatedRequest extends Request {
    permissionName?: String; //adding this so I can keep track of the permissions in the audit
    auth?: any;
}

// Define a list of non-restricted paths
const nonRestricted: string[] = [
    // "/api/create-user",
    // "/api/create-user",
    "/api/login",
    "/api/forgot-password", 
    "/api/reset-password",
    
    "/health",
    "/api/task/get-all-tasks-by-qrcode",
    "/api/auth/"
];

// Middleware function to handle authentication and authorization
const middleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Check if the requested path is in the list of non-restricted paths
    if (nonRestricted.includes(req.path)) {
        // If it's a non-restricted path, proceed to the next middleware
        next();
    } else {
        // Verify the token for restricted paths
        let token: string | undefined;

        // Check if the request has an 'Authorization' header
        if (req.headers.authorization) {
            // Parse the 'Authorization' header
            const [authType, authToken] = req.headers.authorization.split(' ');

            // Check the authorization type ('Bearer' in this case)
            if (authType.toLowerCase() === 'bearer') {
                token = authToken;
            } else {
                // If not 'Bearer', consider the entire header as the token
                token = req.headers.authorization;
            }

            // Verify the token using the JWT library
            jwt.verify(token, process.env.JWT_KEY as string, (err: jwt.JsonWebTokenError | null, user: any) => {
                if (err) {
                    // If token verification fails, respond with a forbidden error
                    return customResponse.forbiddenResponse('Token is invalid or has expired!', res);
                }
                // If the token is valid, attach the user information to the request as 'auth'
                req.auth = user;
                // Proceed to the next middleware
                next();
            });
        } else {
            // If no 'Authorization' header is present, respond with an unauthorized error
            return customResponse.unAuthorizedResponse('You are not authorized!', res);
        }
    }
};

const permissionCheck = (validPermissions:String) => async(req:AuthenticatedRequest, res:Response, next:NextFunction) =>{
    const user_id = req.auth.userId
    /* Arrange the role_id for every login option */
    const role_id = req.auth.role_id && req.auth.role_id._id ? req.auth.role_id._id : req.auth.roleId;
    

    req.permissionName = validPermissions
    
    if(!user_id) return customResponse.unAuthorizedResponse('Please authenticate', res)
    // get the role_id of the logged in user and check if he is allowed the permission 

    // get all the permissions that have the logged in user role_id
    const allPermissions = await RolePermissions.find({role_id: role_id})

    if(!allPermissions) return customResponse.unAuthorizedResponse('You do not have the permission for this action', res)
    // Check if 'admin:ADD_ROLE' permission exists in any of the documents
    const hasAddRolePermission = allPermissions.some(role => {
        return role.permissions.some(permission => permission.permission_name === validPermissions);
    });
    // if (hasAddRolePermission) {
    //     Logger.info(`The role has the permission: ${validPermissions}`);
    //   } else {
    //     Logger.info(`The role does not have the permission: ${validPermissions}`);
    //   }
    if (!hasAddRolePermission) return customResponse.unAuthorizedResponse('You do not have the permission to carry out this action', res)
    
    next()
}

export { middleware, AuthenticatedRequest, permissionCheck };