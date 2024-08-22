import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import customResponse from '../helpers/response';


// Define the type for authData
interface AuthData {
    _id: string;
    username: string;
    roleId: string;
}

// Extend the Request type to include authData and form properties
interface ExtendedRequest extends Request {
    authData?: AuthData;
    form?: Record<string, any>;
}

// Middleware function to validate requests based on a Joi schema
const validateRequest = (obj: Joi.ObjectSchema<any>) => {
    return async (req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> => {
        // Create a Joi schema and specify that unknown keys should be rejected
        const schema = obj.required().unknown(false);

        // Determine whether to validate query parameters or request body based on the HTTP method
        const value = req.method === 'GET' ? req.query : req.body;

        try {
            // Validate the incoming data against the defined schema
            const { error, value: vars } = await schema.validateAsync(value);

            if (error) {
                // If validation fails, respond with a bad request error
                return customResponse.badRequestResponse(error.message, res);
            }

            // Initialize publicData with default values
            let publicData: AuthData = {
                _id: '',
                username: '',
                roleId: '',
            };

            // If authData exists in the request (user is authenticated), update publicData
            if (req.authData) {
                publicData = {
                    _id: req.authData._id,
                    username: req.authData.username,
                    roleId: req.authData.roleId,
                };
            }
            // Combine the validated data and public data to create personalData
            const personalData = {
                ...vars,
                ...publicData,
            };

            // Attach the combined data to the request object as 'form'
            req.form = personalData;
            next();
        } catch (err: any) {
            // If an error occurs during validation, respond with a server error
            return customResponse.serverErrorResponse('Internal Server Error', res, err);
        }
    };
};

export default validateRequest;