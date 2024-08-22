import { Request, Response, json } from 'express';
import RoomModel from '../../models/room';
import RoomDetailModel from '../../models/roomDetail';
import TaskModel from '../../models/task';
import customResponse from '../../helpers/response'
import { AuthenticatedRequest } from '../../middlewares/security';
import Location from '../../models/location';
import mongoose, { Types } from 'mongoose';
import ActualTime from '../../models/actualTime';
import { createChildLogger } from "../../utils/childLogger";
import { paginationBuilder } from '../../utils/pagination';
import QRCode from 'qrcode'
import fs from 'fs'
import PDFdocument from 'pdfkit'
import path from 'path'
import catchAsync from '../../utils/catchAsync';
import ManagerFacilityModel from '../../models/managerFacilities';
import { Roles } from "../../constant/roles";
import { managerRoomCheck , managerFacilityCheck} from '../../services/managerRoomCheck';
import { getLoggedInUserRoleName } from '../../utils/roleName';


const moduleName = '[rooms/controller]'
const Logger = createChildLogger(moduleName)
/**
 * Create a new room with its details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const deleteMultipleRooms = async(req:AuthenticatedRequest, res:Response) => { 
    try {
        const {roomIds} = req.body
        for(const id of roomIds){ 
            await RoomModel.findByIdAndDelete(id)
        }
        return customResponse.successResponse("done", {}, res)
    } catch (error: any) {
        Logger.error('AN error occurred', error)
        return customResponse.serverErrorResponse('Failed server', res, error)
    }
}
const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const { roomName, location_id, detail } = req.body;
      
        const userId = req.auth.userId
        const roleName = getLoggedInUserRoleName(req)
        let checkManager 
        Logger.info(roleName)

        if(roleName == Roles.MANAGER){
            checkManager = await managerFacilityCheck(userId, location_id)
            if(checkManager){ 
                return customResponse.createResponse('message', checkManager, res)
            }
        }
        // get the facility name for the passed location_id 
        const location = await Location.findById(location_id)
        if(!location) return customResponse.badRequestResponse('Wrong location id passed', res)
  
        // // First, create the RoomDetail documents
        // const roomDetailDocs = await RoomDetailModel.insertMany(detail);

        const room = new RoomModel({
            roomName,
            location_id,
        });
        await room.save()
        //  // Update the RoomDetailModel documents with the roomId
        // await RoomDetailModel.updateMany(
        //     { _id: { $in: roomDetailDocs.map(detail => detail._id) } },
        //     { roomId: room._id }
        // );
        return customResponse.createResponse('Room created successfully', 'room added', res)
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the create room endpoint',
            res,
            err
        );
    }
};
/**
 * Get all rooms with its completed details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */


const getAllRooms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const rooms = await RoomModel.find({ flag: 'PRESENT' })
            .populate('location_id')
            .sort({ _id: -1 });

        const assetDetails = await Promise.all(rooms.map(async (roomId) => { 
            const assetCount = await RoomDetailModel.countDocuments({roomId: roomId._id})
            return {
                ...roomId.toObject(),
                assetCount
            }
        }))
        const data = {
            allRooms: assetDetails
        }
        // Return success response with paginated task information
        return customResponse.successResponse('Get all rooms successful', data, res);
    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all room endpoint',
            res,
            err
        );
    }
};

/**
 * View room with its details.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const getRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const roomId = req.query.roomId;
       
        // Check if page or documentCount is undefined before using them
        if (!roomId) {
            return customResponse.badRequestResponse('Missing required query param <roomId>', res);
        }
        const room = await RoomModel.findById(roomId).populate('location_id')
        const assets = await RoomDetailModel.find({roomId: roomId})
        const data = { 
            room,
            assets
        }
        return customResponse.successResponse('Room retrieved successfully', data, res);
    } catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get room endpoint',
            res,
            err
        );
    }
};
const getRoomByLocationId = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { locationId } = req.query
        if (!locationId) return customResponse.badRequestResponse('Missing required query param <locationId>', res);

        const location = await Location.findById(locationId)
        if (!location) return customResponse.badRequestResponse("Location not found or not permitted to view this task", res);

        // Get the room that belongs to the location entered
        const room = await RoomModel.find({ location_id: locationId }).populate('detail').exec()
        if (!room) return customResponse.badRequestResponse("There is no room for this location", res);

        return customResponse.successResponse('Room found', room, res)
    } catch (err: any) {
        Logger.error(err)
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get room by location endpoint',
            res,
            err
        );
    }

}
/**
 * Update room
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
// const updateRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//     try {
//         const { roomId, roomName, locationId, details } = req.body;

//         // check if the location id passed in is valid
//         const locationIdObject = new mongoose.Types.ObjectId(locationId);
//         const location = await Location.findById({ _id: locationIdObject }).exec();
//         if (!location) return customResponse.badRequestResponse('Location not found', res)

//         // Get the room and update its details
//         const room = await RoomModel.findById(roomId);
//         if (!room) {
//             return customResponse.badRequestResponse("Room not found", res);
//         }

//         // Get RoomDetail and update
//         const roomDetail = await RoomDetailModel.findById(room.detail);
//         if (!roomDetail) {
//             return customResponse.badRequestResponse("Room details not found", res);
//         }
//         // roomDetail.detail = details
//         await roomDetail.save();

//         // Update room
//         room.roomName = roomName;
//         room.location_id = locationId

//         await room.save();

//         return customResponse.successResponse('Room updated successfully', room, res);
//     } catch (err: any) {
//         console.error(err);
//         return customResponse.serverErrorResponse(
//             'Oops... Something occurred in the update room endpoint',
//             res,
//             err
//         );
//     }
// };

/**
 * Delete room
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */
const deleteRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const roomId = req.query.roomId;
        // Validate the request body
        if (!roomId) {
            return customResponse.badRequestResponse('Missing required field', res);
        }

        // check if the room they want to delete is in assigned_room of the tasks. If it is, do not allow them delete the room 
        const roomInTask = await TaskModel.findOne({ assigned_room: roomId }).exec()

        if (roomInTask) return customResponse.badRequestResponse('You cannot delete this room since it has been assigned to staffs.', res)

        const updateRoom = await RoomModel.findByIdAndUpdate(
            { _id: roomId },
            { $set: { flag: "DELETE" } },
            { $new: true }
        )
        return customResponse.createResponse('Room deleted successfully', updateRoom, res);

    } catch (err: any) {
        console.error(err);
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the delete room endpoint',
            res,
            err
        );
    }
};

const getRoomsNotInTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // just get rooms that are not in the TaskModel. 

        const { locationId } = req.query

// Step 1: Fetch all rooms based on the provided locationId
        const rooms = await RoomModel.find({ location_id: locationId, flag: 'PRESENT' });

        
        if(!rooms) return customResponse.badRequestResponse('Rooms in this location has been deleted', res)

        // Step 2: Get the IDs of all rooms
        const roomIds = rooms.map(room => room._id);

        // Step 3: Find tasks that are assigned to the given rooms
        const tasksForRooms = await TaskModel.find({ assigned_room: { $in: roomIds } });

        // Create a Set to store all assigned room ids from tasks
        const assignedRoomIds = new Set(tasksForRooms.map(task => task.assigned_room.toString()));

        // Filter out rooms that are not in the assignedRoomIds set
        const unassignedRooms = rooms.filter(room => !assignedRoomIds.has(room._id.toString()));

        return customResponse.successResponse('fetched', unassignedRooms, res)
    } catch (err: any) {
        console.error(err);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get all users endpoint',
            res,
            err
        );
    }
}

const getRoomInTask = async (req: AuthenticatedRequest, res: Response) => {
    try {

        // just get all the rooms that are in the Task Model regardless of their isSubmitted value 
        const { locationId } = req.query;

        // Step 1: Fetch all rooms based on the provided locationId
        const rooms = await RoomModel.find({ location_id: locationId, flag: 'PRESENT' });

        if(!rooms) return customResponse.badRequestResponse('Rooms in this location has been deleted', res)

        // Step 2: Get the IDs of all rooms
        const roomIds = rooms.map(room => room._id);


        const unSubmittedTask = await TaskModel.find({assigned_room: {$in: roomIds}})
      
        // Create a Set to store all assigned room ids from unsubmitted tasks
        const assignedButNotSubmittedRoomIds = new Set(unSubmittedTask.map(task => task.assigned_room.toString()));
       
        // Filter out rooms that are not in the assignedButNotSubmittedRoomIds set
        const assignedButNotSubmittedRooms = rooms.filter(room => assignedButNotSubmittedRoomIds.has(room._id.toString()));

        return customResponse.successResponse('assigned rooms fetched', assignedButNotSubmittedRooms, res);

    } catch (error: any) {
        Logger.error(error);

        // Return server error response if an error occurs
        return customResponse.serverErrorResponse(
            'Oops... Something occurred in the get assigned rooms endpoint',
            res,
            error
        )
    }
}
const getTaskForRoom = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const roomId = req.query.roomId
        const roleName = req.auth.role_name == undefined
        ? req.auth.role_id.role_name
        : req.auth.role_name;
        const userId = req.auth.userId
        let checkResponse

        if (!roomId) {
            return customResponse.badRequestResponse('Missing required query param <roomId>', res);
        }
        const room = await RoomModel.findById({ _id: roomId })
        .populate('detail').exec()

        if (!room) {
            return customResponse.badRequestResponse("Room not found", res);
        }

        if(roleName == Roles.MANAGER){ 
            // check if the person has 
            // Fetch the manager's assigned facilities
            checkResponse = await  managerRoomCheck(userId, room)
            if(checkResponse){
                return customResponse.createResponse('response', checkResponse, res)
            }
        }
        const taskDetails = await TaskModel.findOne({ assigned_room: roomId }).populate('planned_time assigned_location assigned_cleaner assigned_inspector')
        if (!taskDetails) return customResponse.badRequestResponse('A task has not been created for this room', res)

        // for the taskDetail, get the actual_time if any 
        // get the total number of items in the facility 
        const allItemsInRoom = await RoomModel.findById(roomId).populate('detail')
        const actualTime = await ActualTime.findOne({ task_id: taskDetails._id })
        const data = { taskDetails, actualTime, allItemsInRoom }

        return customResponse.successResponse('fetched', data, res)
    } catch (error: any) {
        return customResponse.serverErrorResponse('An error has occurred in the get task for room endpoint', res, error)
    }

}

const roomItemComparison = async (req:AuthenticatedRequest, res:Response) => {
    try {
        const result = await RoomModel.aggregate([
            {
              $lookup: {
                from: "tasks",
                localField: "_id",
                foreignField: "assigned_room",
                as: "task"
              }
            },
            {
              $unwind: "$task"
            }, 
            {
                $group: {
                  _id: "$_id",
                  roomName: { $first: "$roomName" },
                  totalTasks: { $sum: 1 }, // Count total number of tasks for the room
                  totalAssignedItems: { $sum: { $size: "$task.tasks" } }, // Sum of lengths of tasks array in each task
                  totalCleanedItems: { $sum: { $size: { $filter: { input: "$task.tasks", as: "task", cond: "$$task.isDone" } } } } // Sum of cleaned items for each room
                }
            }, 
            { 
                $project: { 
                    _id: 1, 
                    roomName: 1, 
                    totalTasks: 1, 
                    totalAssignedItems: 1, 
                    totalCleanedItems: 1 
                }
            }
          ]);
          
        //   Logger.info(JSON.stringify(result))
          
        return customResponse.successResponse('aggregate', result, res)
        //get all the items in the room from the room detail model, then from the Task Model get all the items that isDone is set to true
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred in the get clean vs uncleaned room item for each room', res, error)
    }
}

const managerRooms = catchAsync(async(req:AuthenticatedRequest, res: Response ) => { 
    const managerId = req.auth.userId
    // get all his facilities 
    const {facilityId} = req.query

    if (!facilityId || !mongoose.Types.ObjectId.isValid(facilityId as string)) {
        return customResponse.badRequestResponse('Invalid Facility ID', res);
    }
    const managerFacilities = await ManagerFacilityModel.findOne({managerId: managerId})
    if(!managerFacilities) return customResponse.successResponse('Manager has no facility', {}, res)

     // Check if the facilityId is part of the manager's assigned facilities
    const assignedFacility = managerFacilities.assignedFacilities.find(facility => facility._id.toString() === facilityId);
    if (!assignedFacility) {
        return customResponse.badRequestResponse('Facility ID not assigned to the manager', res);
    }

    // Get the rooms from the facility ID
    const rooms = await RoomModel.find({ location_id: new Types.ObjectId(facilityId as string) }).populate('location_id')
    const assetDetails = await Promise.all(rooms.map(async (roomId) => { 
        const assetCount = await RoomDetailModel.countDocuments({roomId: roomId._id})
        return {
            ...roomId.toObject(),
            assetCount
        }
    }))

    // const data = { 
    //     roomDetails: {
    //         ...rooms.toObject(),
    //         assetCount: assetDetails
    //     }
    // }

    return customResponse.successResponse('Manager rooms', assetDetails, res);
});

const getAllRooms2 = catchAsync(async(req:AuthenticatedRequest, res: Response ) => { 
    const rooms = await RoomModel.find().populate({path:'location_id', model: 'Location'}).exec();
    return customResponse.successResponse('all rooms', rooms, res)
});

const getRoomsByFacilityId = catchAsync(async(req:AuthenticatedRequest, res: Response ) => { 
    const facilityId = req.params.facilityId;
    const rooms = await RoomModel.find({location_id: facilityId}).populate({path:'location_id', model: 'Location'}).exec();
    return customResponse.successResponse('room details by facility', rooms, res)
});

export default {
    createRoom,
    deleteMultipleRooms, 
    getRoom,
    getAllRooms,
    getRoomByLocationId,
    // updateRoom,
    deleteRoom,
    getRoomsNotInTask,
    getRoomInTask,
    getTaskForRoom,
    roomItemComparison,
    managerRooms,
    getAllRooms2,
    getRoomsByFacilityId
};
