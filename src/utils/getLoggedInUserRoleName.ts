import { AuthenticatedRequest } from "../middlewares/security";

// get role Name for logged in user 
export const getLoggedInUserRoleName = (req: AuthenticatedRequest) => { 
    return req.auth.role_name == undefined ? req.auth.role_id.role_name : req.auth.role_name;
}