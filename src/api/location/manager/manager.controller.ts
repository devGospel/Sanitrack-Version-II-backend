import { AuthenticatedRequest } from "../../../middlewares/security";
import { Request, Response } from "express";
import customResponse from "../../../helpers/response";
import Location from "../../../models/location";
import RoomModel from "../../../models/room";

import { createChildLogger } from "../../../utils/childLogger";
import catchAsync from "../../../utils/catchAsync";
import ManagerFacilityModel from "../../../models/managerFacilities";
import UserRoles from "../../../models/userRoles";
import mongoose, { Types } from "mongoose";
import User from "../../../models/user";
import { managerFacilityCheck } from "../../../services/managerRoomCheck";
import CleanerFacilityModel from "../../../models/cleanerFacilities";

const helloRoute = catchAsync(async( req:AuthenticatedRequest, res:Response) => { 
    return customResponse.successResponse('manager in the location route', {}, res)
})

const getManagerLocation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const managerId = req.auth.userId
    console.log(`manager id => ${managerId}`)
    const managerFacility = await ManagerFacilityModel.findOne({ managerId: managerId }).populate({
        path: 'assignedFacilities',
        model: 'Location'
    })

    if (!managerFacility || !managerFacility.assignedFacilities) {
        return customResponse.successResponse('Manager facility or assigned facilities not found' , {}, res);
    }
    // Add the total count of rooms to each facility
    const facilitiesWithRoomCounts = await Promise.all(managerFacility.assignedFacilities.map(async (facility:any) => {
        const roomCount = await RoomModel.countDocuments({ location_id: facility._id });
        return {
            ...facility.toObject(),
            roomCount
        };
    }));

    const data = {
        managerFacility: {
            ...managerFacility.toObject(),
            assignedFacilities: facilitiesWithRoomCounts
        }
    };
    return customResponse.successResponse('Assigned Facilities', data, res)
})

const getFacilityCleaners = catchAsync(async (req: AuthenticatedRequest, res: Response) => {

    // get the loggedIn user 
    const userId = req.auth.userId
    // Get the facility ID from the request body
    const { facilityId } = req.body;

    //console.log(userId)
    // validate user and facilityId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return customResponse.badRequestResponse('Invalid user Id', res);
    }
    if (!facilityId || !mongoose.Types.ObjectId.isValid(facilityId)) {
        return customResponse.badRequestResponse('Invalid facility Id', res);
    }


    // check if user exists
    const manager = await User.findById(userId)
    if (!manager) {
        return customResponse.badRequestResponse('User not found', res)
    }

    // Check if the facility is assigned to the manager
    const validationMessage = await managerFacilityCheck(userId, new mongoose.Types.ObjectId(facilityId));
    if (validationMessage) {
        return customResponse.forbiddenResponse(validationMessage, res);
    }

    // Find the cleaners in the specified facility
    const FacilityCleaners = await CleanerFacilityModel.findOne({ facilityId }).populate('assignedCleaners');

    // If no cleaners are assigned to the facility, return an appropriate message
    if (!FacilityCleaners || FacilityCleaners.assignedCleaners.length === 0) {
        return customResponse.notFoundResponse('No cleaners found for this facility', res);
    }

    return customResponse.successResponse('cleaners in this facility', FacilityCleaners, res)

})

const facilityRooms = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const managerId = req.auth.userId
    const {facilityId} = req.query

    const existingFacility = await Location.findById(facilityId)
    if(!existingFacility){ 
        return customResponse.notFoundResponse('Such facility does not exist', res)
    }
    // check if he is assigned the facility 
    const assignedFacility = await ManagerFacilityModel.findOne({managerId: managerId, assignedFacilities: {$in: facilityId}})

    if(!assignedFacility){ 
        return customResponse.notFoundResponse('Such facility has not been assigned to you', res)
    }

    // get all the rooms with the passed facility id 
    const rooms = await RoomModel.find({location_id: facilityId})
    return customResponse.successResponse('rooms fetched', rooms, res)
})
export default{ 
    helloRoute,
    getManagerLocation,
    getFacilityCleaners,
    facilityRooms
}