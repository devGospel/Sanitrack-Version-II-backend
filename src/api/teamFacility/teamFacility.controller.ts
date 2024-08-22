import { AuthenticatedRequest } from "../../middlewares/security";
import { Response } from "express";
import catchAsync from "../../utils/catchAsync";
import customResponse from "../../helpers/response";
import TeamFacilityModel from "../../models/teamFacility";

const createTeamFacility = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const {
        teamId, 
        locationId,
    } = req.body;

    if (!teamId || !locationId) return customResponse.badRequestResponse('locationId and teamId is required', res);

    const result = TeamFacilityModel.create({
        teamId, 
        locationId
    });
    return customResponse.successResponse('Teams linked to facility sucessfully', result, res);
});


export default {
    createTeamFacility
}