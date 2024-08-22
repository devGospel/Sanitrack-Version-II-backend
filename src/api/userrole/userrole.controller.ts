import { AuthenticatedRequest } from "../../middlewares/security"
import { Response } from "express"
import customResponse from "../../helpers/response"
import UserRoles from "../../models/userRoles"

const getUserRole = async(req:AuthenticatedRequest, res:Response) => { 
    try{ 
        // get the users role based on their id
        const userId = req.query.userId
        if(!userId) return customResponse.badRequestResponse('Missing required query param <userId>', res);

        const userRole = await UserRoles.find({user_id: userId})
        if(!userRole) return customResponse.successResponse('User has not been assigned a role', userRole, res)

        const data = {userRole}
        return customResponse.successResponse('User roles', data, res)
        
    }catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get user role endpoint',
            res,
            err
        );
    }
}
const deleteUserRole = async(req:AuthenticatedRequest, res:Response) => { 
    try{
        const {userId, roleIds} = req.body
        // Use the deleteMany method to delete user roles with matching role IDs
        const result = await UserRoles.deleteMany({user_id:userId, role_id: { $in: roleIds } });
        if(result.deletedCount == 0) return customResponse.badRequestResponse('User did not delete', res)

        return customResponse.successResponse("User role deleted sucessfully",result, res)
        
    }catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the delete user role endpoint',
            res,
            err
        );
    }
}
export default { 
    getUserRole,
    deleteUserRole
}