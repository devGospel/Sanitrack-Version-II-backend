import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";
import customResponse from "../../helpers/response";

import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import UserRoles from "../../models/userRoles";

const allLoginLogs = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    // 1. Retrieve users and their roles
    const usersWithRoles = await UserRoles.aggregate([
        {
            $lookup: {
                from: 'login_logs', // The name of the LoginLogs collection
                localField: 'user_id', // Field from UserRoles
                foreignField: 'userId', // Field from LoginLogs
                as: 'loginLogs' // The field to add to the result documents
            }
        },
        {
            $unwind: {
                path: '$loginLogs',
                preserveNullAndEmptyArrays: true // Preserves documents without login logs
            }
        },
        {
            $project: {
                user_name: 1,
                role_name: 1,
                last_login: '$loginLogs.updatedAt', // Extract last login timestamp
                last_logout: '$loginLogs.logoutAt'
            }
        }
    ]);
    return customResponse.successResponse('all users and roles fetched', usersWithRoles, res)
})

export default{ 
    allLoginLogs
}