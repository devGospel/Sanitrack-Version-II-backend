import { AuthenticatedRequest } from "../../middlewares/security";
import { Request, Response } from "express";
import customResponse from "../../helpers/response";
import Location from "../../models/location";
import RoomModel from "../../models/room";

import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import ManagerFacilityModel from "../../models/managerFacilities";
import UserRoles from "../../models/userRoles";
import mongoose, { Types } from "mongoose";
import cleanerFacilityModel from "../../models/cleanerFacilities";
import User from "../../models/user";
import CleanerFacilityModel from "../../models/cleanerFacilities";
import InspectorFacilityModel from "../../models/inspectorFacilities";
import { managerFacilityCheck } from "../../services/managerRoomCheck";
import { Roles } from "../../constant/roles";
import { getLoggedInUserRoleName } from "../../utils/getLoggedInUserRoleName";

const moduleName = '[location/controller]'
const Logger = createChildLogger(moduleName)

const addLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { country, state, city, postal_code, facility_name, lat, long } = req.body;
    // if the location is being repeated, throw an error
    if(!facility_name) return customResponse.badRequestResponse('A facility name is required', res)
    const existingLocation = await Location.findOne({country, state, city, postal_code})
    if(existingLocation) return customResponse.badRequestResponse('Location already exists', res)
    // proceed to add the location to the database
    const newLocation = await Location.create({
      facility_name,
      country,
      state,
      city,
      postal_code,
      location: {
        type: 'Point',
        coordinates: [lat, long], 
      },
    });
    return customResponse.successResponse(
      "New Location added ",
      "Madam kene asked it to be commented out",
      res
    );
  } catch (error: any) {
    Logger.error(error);
    return customResponse.serverErrorResponse(
      "Oops... Something occurred in the add location endpoint",
      res,
      error
    );
  }
};

const getLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {

        const locationQuery = await Location.find().sort({ _id: -1 });

         // Add the total count of rooms to each facility
        const facilitiesWithRoomCounts = await Promise.all(locationQuery.map(async (facility:any) => {
            const roomCount = await RoomModel.countDocuments({ location_id: facility._id });
            return {
                ...facility.toObject(),
                roomCount
            };
        }));
        const data = { 
            allLocations: facilitiesWithRoomCounts
        }
        return customResponse.successResponse('All facilities', data, res)
    } catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse(
            "Oops... Something occurred in the get all locations endpoint",
            res,
            error
        );
    }
};

const getLocationById = async (req: AuthenticatedRequest, res: Response) => {
    try {

        const locationId = req.query.locationId;
        if (!locationId) return customResponse.badRequestResponse("Enter an Id", res)

        const location = await Location.findById({ _id: locationId }).exec();
        if (!location) {
            return customResponse.badRequestResponse("There is no location with the id", res);
        }
        // get the rooms for this facility
        const facilityRooms = await RoomModel.find({location_id: locationId})
        // get all the people assigned to the facility
        const facilityManagers = await ManagerFacilityModel.find({assignedFacilities: {$in: locationId}}).populate('managerId').select('-assignedFacilities')
        const inspectorManagers = await InspectorFacilityModel.find({facilityId: locationId}).populate('assignedInspectors')
        const cleanerManagers = await CleanerFacilityModel.find({facilityId: locationId}).populate('assignedCleaners')

        const data = {
            location,
            rooms: facilityRooms,
            managers: facilityManagers,
            inspectors: inspectorManagers,
            cleaners: cleanerManagers
        }

        return customResponse.successResponse("Location retrieved successfully", data, res);
    } catch (error: any) {
        Logger.error(error);
        return customResponse.serverErrorResponse(
            "Oops... Something occurred in the get location by id endpoint",
            res,
            error
        );
    }

};

const updateLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const locationId = req.query.locationId;

        const { country, state, city, postal_code, facility_name, lat, long } = req.body
        // Get the room and update its details
        const location = await Location.findById(locationId);
        if (!location) {
            return customResponse.badRequestResponse("Location not found", res);
        }
        // update location 
        location.facility_name = facility_name,
            location.country = country,
            location.state = state,
            location.city = city,
            location.postal_code = postal_code
        location.location = {
            type: "Point",
            coordinates: [lat, long]
        }

        await location.save()

        return customResponse.successResponse('Location updated successfully', location, res)
    } catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the update location endpoint',
            res,
            err
        );
    }
};

const deleteLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // return to this since you need to delete the rooms with the location 
        const location_id = req.query.locationId

        if (!location_id) return customResponse.badRequestResponse("The location's id is required", res)

        // look for that location 
        const location = await Location.findById(location_id)
        if (!location) return customResponse.badRequestResponse('Location not found', res)

        // Delete all the rooms with that location
        await RoomModel.deleteMany({ location_id: location_id })
        // Delete the location
        const locationDelete = await Location.deleteOne({ _id: location_id })
        return customResponse.successResponse('Location deleted', locationDelete, res)
    } catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the delete location endpoint',
            res,
            err
        );
    }

};

const getUnAssignedFacility = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    //Get all assigned facilities
    const assignedFacilities = await ManagerFacilityModel.find().distinct('assignedFacilities');

    //Find unassigned locations
    const unassignedLocations = await Location.find({
        _id: { $nin: assignedFacilities }
    });

    return customResponse.successResponse('Unassigned locations retrieved successfully', unassignedLocations, res);
})

const getFacilityAssignedToAdmin = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { managerId } = req.query
    const managerFacilities = await ManagerFacilityModel.findOne({ managerId: managerId }).populate({
        path: 'assignedFacilities',
        model: 'Location'
    })

    if (!managerFacilities) {
        return customResponse.notFoundResponse('Manager does not have any assigned facilities.', res);
    }

    //Get the rooms for each of the facilities
    const facilityIds = managerFacilities.assignedFacilities.map(facility => facility._id);
    const rooms = await RoomModel.find({ location_id: { $in: facilityIds } });

    // Combine the facilities with their respective rooms
    const facilitiesWithRooms = managerFacilities.assignedFacilities.map(facility => {
        const facilityRooms = rooms.filter(room => room.location_id.toString() === facility._id.toString());
        return {
            facility,
            rooms: facilityRooms
        };
    });

    return customResponse.successResponse('Assigned Facilities', facilitiesWithRooms, res)
})

const assignFacility = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { managers } = req.body
    const {facilityId} = req.query
    // Check if the array is empty 
    if (managers.length == 0) {
        return customResponse.badRequestResponse('Managers are required', res)
    }
    // Ensure cleaners is an array of ObjectId
    if (!Array.isArray(managers) || !managers.every(id => Types.ObjectId.isValid(id))) {
        return customResponse.badRequestResponse('Invalid Managers Ids passed', res)
    }

    // Check if the provided IDs belong to users with the role of "manager"
    const validManagers = await UserRoles.find({
        user_id: { $in: managers },
        role_name: 'Manager'
    }).select('user_id');

    const validManagerIds = validManagers.map(uc => uc.user_id.toString());

    // Filter out invalid cleaner IDs
    const invalidManagers = managers.filter(id => !validManagerIds.includes(id));

    if (invalidManagers.length > 0) {
        return customResponse.badRequestResponse('Some Ids passed do not have the role of Managers', res)
    }
    // // check if the cleaners sent are already part of a facility 
    // Check if the facilityId exists 
    const existingFacility = await ManagerFacilityModel.findOne({ assignedFacilities: facilityId })
    
    // Iterate through each manager and check if a document exists
    for (const managerId of validManagerIds) {
        const existingFacility = await ManagerFacilityModel.findOne({
            managerId: managerId,
        });

        if (!existingFacility) {
            // Create a new document for the manager
            await ManagerFacilityModel.create({
                managerId: managerId,
                assignedFacilities: [facilityId]
            });
        } else {
            // Update the existing document
            await ManagerFacilityModel.updateOne(
                { managerId: managerId },
                { $addToSet: { assignedFacilities: facilityId } }
            );
        }
    }
    return customResponse.successResponse('managers assigned to facility', {}, res)
});

const revokeFacility = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { managerId, facilities } = req.body
    // check if the manager has the facilites sent
    const managerFacilities = await ManagerFacilityModel.findOne({ managerId: managerId, assignedFacilities: { $in: facilities } })
    // If no assigned facilities found or the count doesn't match, return a bad request response
    if (!managerFacilities || !facilities.every((facility: mongoose.Types.ObjectId) => managerFacilities.assignedFacilities.includes(facility))) {
        return customResponse.badRequestResponse('Facility ID not assigned to manager passed', res);
    }

    // Remove the facilities passed from the array of assignedFacilities using splice
    facilities.forEach((facility: mongoose.Types.ObjectId) => {
        const index = managerFacilities.assignedFacilities.indexOf(facility);
        if (index > -1) {
            managerFacilities.assignedFacilities.splice(index, 1); // Remove the facility at this index
        }
    });

    await managerFacilities.save();

    return customResponse.successResponse('Facility revoked from admin', {}, res)
})



const getUnAssignedCleaners = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    // Get all assigned cleaners 
    const assignedCleaners = await cleanerFacilityModel.find().distinct('assignedCleaners')

    // Get all unassigned cleaners 
    const unAssignedCleaners = await UserRoles.find({
        user_id: { $nin: assignedCleaners },
        role_name: 'Cleaner'
    })

    return customResponse.successResponse('UnAssigned cleaners fetched', unAssignedCleaners, res)
})

// consider scenario where they want to assign cleaner and inspector at the same time 

const assignCleaner = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    // get the facility ID and the cleaners
    const { cleaners } = req.body
    const {facilityId} = req.query
    // Check if the array is empty 
    if (cleaners.length == 0) {
        return customResponse.badRequestResponse('Cleaners are required', res)
    }
    // Ensure cleaners is an array of ObjectId
    if (!Array.isArray(cleaners) || !cleaners.every(id => Types.ObjectId.isValid(id))) {
        return customResponse.badRequestResponse('Invalid Cleaner Ids passed', res)
    }

    // Check if the provided IDs belong to users with the role of "cleaner"
    const validCleaners = await UserRoles.find({
        user_id: { $in: cleaners },
        role_name: 'Cleaner'
    }).select('user_id');

    const validCleanerIds = validCleaners.map(uc => uc.user_id.toString());

    // Filter out invalid cleaner IDs
    const invalidCleaners = cleaners.filter(id => !validCleanerIds.includes(id));

    if (invalidCleaners.length > 0) {
        return customResponse.badRequestResponse('Some Ids passed do not have the role of Cleaners', res)
    }
    // // check if the cleaners sent are already part of a facility 
    // const existingCleaners = await CleanerFacilityModel.findOne({ assignedCleaners: { $in: cleaners } })
    // if (existingCleaners) {
    //     return customResponse.badRequestResponse('Cleaners sent already belong to a facility', res)
    // }
    // Check if the facilityId exists 
    const existingFacility = await CleanerFacilityModel.findOne({ facilityId: facilityId })
    if (existingFacility) {
        await CleanerFacilityModel.findOneAndUpdate(
            { facilityId: facilityId },
            { $addToSet: { assignedCleaners: { $each: cleaners } } },
            { new: true, upsert: true }
        );
    } else {
        await CleanerFacilityModel.create({
            facilityId: facilityId,
            assignedCleaners: cleaners
        })
    }
    return customResponse.successResponse('cleaner assigned to facility', {}, res)
})

const assignInspector = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    // get the facility ID and the cleaners
    const { inspectors } = req.body
    const {facilityId} = req.query

    // Check if the array is empty 
    if (!inspectors || inspectors.length == 0) {
        return customResponse.badRequestResponse('Inspectors are required', res)
    }

    // Ensure cleaners is an array of ObjectId
    if (!Array.isArray(inspectors) || !inspectors.every(id => Types.ObjectId.isValid(id))) {
        return customResponse.badRequestResponse('Invalid Inspector Ids passed', res)
    }

    // Check if the provided IDs belong to users with the role of "cleaner"
    const validInspector = await UserRoles.find({
        user_id: { $in: inspectors },
        role_name: Roles.INSPECTOR,
    }).select('user_id');

    const validInspectorsIds = validInspector.map(uc => uc.user_id.toString());

    // Filter out invalid Inspectors IDs
    const invalidInspector = inspectors.filter(id => !validInspectorsIds.includes(id));

    if (invalidInspector.length > 0) {
        return customResponse.badRequestResponse('Some Ids passed do not have the role of Inspectors', res)
    }
    // // check if the Inspectors sent are already part of a facility 
    // const existingInspectors = await InspectorFacilityModel.findOne({ assignedInspectors: { $in: inspectors } })
    // if (existingInspectors) {
    //     return customResponse.badRequestResponse('Inspectors sent already belong to a facility', res)
    // }
    // Check if the facilityId exists 
    const existingFacility = await InspectorFacilityModel.findOne({ facilityId: facilityId })
    if (existingFacility) {
        await InspectorFacilityModel.findOneAndUpdate(
                    { facilityId: facilityId },
                    { $addToSet: { assignedInspectors: { $each: inspectors } } },
                    { new: true, upsert: true }
                );
    } else {
        await InspectorFacilityModel.create({
            facilityId: facilityId,
            assignedInspectors: inspectors
        })
    }
    return customResponse.successResponse('inspector assigned to facility', {}, res)
})



const getFacilityRooms = catchAsync(async(req:AuthenticatedRequest, res:Response) =>{

    // group rooms by location_id
    const results = await RoomModel.aggregate([
        {
          $lookup: {
            from: 'locations',
            localField: 'location_id',
            foreignField: '_id',
            as: 'location'
          }
        },
        {
          $addFields: {
            locationName: { $arrayElemAt: ['$location.facility_name', 0] }
          }
        },
        {
          $project: {
            location_id: 1,
            locationName: 1,
            roomField1: '$roomName', // Replace 'roomField1' with the actual fields you want to include from RoomModel
          }
        },
        {
          $group: {
            _id: '$location_id',
            locationName: { $first: '$locationName' },
            rooms: { $push: '$$ROOT' } // Push the transformed document into the rooms array
          }
        },
        {
          $project: {
            location_id: '$_id',
            locationName: 1,
            rooms: {
              $map: {
                input: '$rooms',
                as: 'room',
                in: {
                  location_id: '$location_id',
                  locationName: '$locationName',
                  roomField1: '$$room.roomField1'
                  // Map additional fields from the room document
                }
              }
            }
          }
        }
      ]);
      
    return customResponse.successResponse('fetched', results, res)
})

const getAllFacilities = catchAsync(async (req:AuthenticatedRequest, res:Response) => {
    const results = await ManagerFacilityModel.find()
    .populate({path:'managerId', select:'email username'})
    .populate({path:'assignedFacilities'}).sort({ _id: -1 }).exec();
    return customResponse.successResponse('list of facilities and related managers', results, res)
});

const getFacilitiesById = catchAsync(async (req:AuthenticatedRequest, res:Response) => {
    const facilityId = req.params.facilityId;
    const results = await Location.findById({_id:facilityId}).exec();
    return customResponse.successResponse('Facility Detail', results, res)
});

const staffFacilities = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const staffId = req.auth.userId
    let result : any
    const roleName = getLoggedInUserRoleName(req)
    if(roleName == Roles.MANAGER){ 
        result = await ManagerFacilityModel.findOne({managerId: staffId}).populate('assignedFacilities')
        if (result && result.assignedFacilities) {
            result = result.assignedFacilities.map((facility:any) => ({
                facilityId: facility._id,
                facilityName: facility.facility_name
            }));
        }
    }
    if(roleName == Roles.CLEANER){ 
        result = await CleanerFacilityModel.find({assignedCleaners: {$in: staffId}}).populate('facilityId')
        if (result) {
            result = result.map((item:any) => ({
                facilityId: item.facilityId._id,
                facilityName: item.facilityId.facility_name
            }));
        }
    }
    if((roleName == Roles.INSPECTOR) || (roleName == Roles.SUPERVISOR)){ 
        result = await InspectorFacilityModel.find({assignedInspectors: {$in: staffId}}).populate('facilityId')
        if (result) {
            result = result.map((item:any) => ({
                facilityId: item.facilityId._id,
                facilityName: item.facilityId.facility_name
            }));
        }
    }

    return customResponse.successResponse('Staff facilities', result, res)
})
export default {
    addLocation,
    getLocation,
    getLocationById,
    updateLocation,
    deleteLocation,
    getUnAssignedFacility,
    assignFacility,
    revokeFacility,
    getFacilityAssignedToAdmin,
    getUnAssignedCleaners,
    assignCleaner,
    assignInspector,
    getFacilityRooms,
    getAllFacilities,
    getFacilitiesById, 
    staffFacilities
};
