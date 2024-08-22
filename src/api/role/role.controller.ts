import { Request, Response } from "express"
import { AuthenticatedRequest } from "../../middlewares/security"
import Role from "../../models/role"
import customResponse from '../../helpers/response';
import UserRoles from "../../models/userRoles";
import User from "../../models/user";
import RolePermissions from "../../models/rolePermission";
import { createChildLogger } from "../../utils/childLogger";

const moduleName = '[role/controller]'
const Logger = createChildLogger(moduleName)

const getRole = async (req:AuthenticatedRequest, res:Response) => { 
    const roleQuery = Role.find()
    .sort({ createdAt: -1 });

    const [totalRole, allRole] = await Promise.all([
        Role.countDocuments(),
        roleQuery.exec(),
    ]);

    // Prepare data to send in the response
    const data = {
        totalRole,
        allRole,
    };

    // Return success response with paginated task information
    return customResponse.successResponse('Get all roles successful', data, res);
}

const addRole = async (req: AuthenticatedRequest, res:Response) => { 
   
    const {role_name} = req.body

    const existingRole = await Role.findOne({role_name: role_name})
    if(existingRole) return customResponse.badRequestResponse('This role already exists', res)

    const roleNew = await Role.create({ 
        role_name: role_name
    })

    const newRole = {id: roleNew._id, role_name: roleNew.role_name}
    return customResponse.createResponse('Role added', newRole, res)
}

const assignRole = async(req: AuthenticatedRequest, res:Response) =>{
    
    const passedRoleDetails = req.body;
    const errorResponses = [];

    // Logger.info(JSON.stringify(passedRoleDetails))
    for (const roleDetails of passedRoleDetails) {
        const existingRole = await UserRoles.findOne({ user_id: roleDetails.user_id, role_id: roleDetails.role_id });

        if (existingRole) {
            errorResponses.push(existingRole);
        } else {
            await UserRoles.create({
                user_id: roleDetails.user_id,
                role_id: roleDetails.role_id,
                user_name: roleDetails.user_name,
                role_name: roleDetails.role_name
            });
        }
    }

    if (errorResponses.length > 0) {
        // Send error responses
        // res.locals.errorMessage = 'Cannot assign the same role to a user'
        res.locals.status = false
        return customResponse.badRequestResponse("Cannot assign the same role to a user", res)
    }

    const data = { passedRoleDetails };
    // Send success response
    // res.locals.responseMessage = 'Roles assigned successfully'
    return customResponse.successResponse('Roles assigned successfully', data, res);

}

// work on delete role. If a role is deleted, all the permissions for that role is deleted. 
const deleteRole = async(req:AuthenticatedRequest, res:Response) => { 
    try{ 
        const roleId = req.query.roleId
        if(!roleId) return customResponse.badRequestResponse('Missing required query param <roleId>', res);
    
        const role = await Role.findById(roleId)
        if(!role) return customResponse.badRequestResponse('Wrong role Id passed', res);
    
        await Role.deleteOne({_id: roleId})
        // Delete every permission that role has 
        const permissionWithId = await RolePermissions.findOne({role_id: roleId})
        if(!permissionWithId) return customResponse.successResponse('This role does not have a permission to delete', permissionWithId, res)
        await RolePermissions.deleteOne({role_id: roleId})

        // delete the role from the userroles table too 
        const userRoleWithId = await UserRoles.findOne({role_id: roleId})
        if(!userRoleWithId) return customResponse.successResponse('This role was not assigned to a user', userRoleWithId, res)
        await UserRoles.deleteOne({role_id: roleId})
    
        return customResponse.successResponse('Role deleted', {}, res)
    }catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse(
          "Oops... Something occurred in the assign permission endpoint",
          res,
          error
        );
    }
}

const getStaffRole = async(req:AuthenticatedRequest, res:Response) => { 
    try{ 
        const userRoles = await User.aggregate([
            {
                $match: {'role' : {$ne: 'manager'}}
            },
            {
                $group: {
                    _id: '$_id',
                    username: { $first: '$username' }
                }
            },
            {
                $lookup: {
                    from: 'userroles', 
                    localField: '_id', 
                    foreignField: 'user_id', 
                    as: 'user_roles'
                }
            }, 
            { 
                $unwind: '$user_roles'
            },
            {
                $project: {
                    _id: 1, 
                    username: 1,
                    role_name: '$user_roles.role_name'
                }
            }
        ])
        const data = {userRoles}
        return customResponse.successResponse('Users and their roles fetched', data, res)
    }catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse(
          "Oops... Something occurred in the get staff role endpoint",
          res,
          error
        );
    }
}

export default{ 
    getRole,
    addRole, 
    assignRole, 
    deleteRole, 
    getStaffRole
}