import { AuthenticatedRequest } from "../../middlewares/security";
import { Response } from "express";
import TaskModel from "../../models/task";
import customResponse from "../../helpers/response"
import Timer from "../../models/timer";

import { createChildLogger } from "../../utils/childLogger";

const moduleName = '[history/controller]'
const Logger = createChildLogger(moduleName)

const roomHistory = async(req:AuthenticatedRequest, res:Response) => { 
    try{
        
        const roomId = req.query.roomId
        // get the task_id assigned_cleaner, assigned_inspector, room_name, start_time and stop_time.
        
        const task = await TaskModel.find({assigned_room: roomId}).populate([
            { path: 'assigned_cleaner assigned_inspector', select: 'username' },
            { path: 'assigned_room', select: 'roomName' }
        ]);

        // if the room_id is not in the taskModel, just tell them that a work order has not been created for the room hence no history 
        if(!task) return customResponse.successResponse("A work order has not been created for this room hence no history", task, res)
    
        const data = {
            rommHistoy: task
        }
        return customResponse.successResponse('Room history fetched', data, res)
    }catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('Error fetching room history', res, error);
    }
    
}

const cleanerHistory = async(req:AuthenticatedRequest, res:Response) => { 
    try{ 
       
        // display roomName and time taken to clean rooms
        const cleanerId = req.query.cleanerId
        let timeTaken
        if(!cleanerId) return customResponse.badRequestResponse('cleanerId query missing', res)

        const cleaner = await TaskModel.find({assigned_cleaner: cleanerId}).populate([
            { path: 'assigned_cleaner', select: 'username' },
            { path: 'assigned_room', select: 'roomName' }
        ]);

        if(!cleaner) return customResponse.successResponse('This cleaner has not been assigned a work order yet', cleaner, res)

        // Iterate over each task and fetch the corresponding times from TimerModel
        const data = { 
            cleanerHistoy: cleaner
        }

        return customResponse.successResponse('Cleaner history', data, res)

    }catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('Error fetching cleaner history', res, error);
    }
}

const inspectorHistory = async(req:AuthenticatedRequest, res:Response) => { 
    // display the rooms and the rooms they approved of 
    try{
        
        const inspectorId = req.query.inspectorId
        if(!inspectorId) return customResponse.badRequestResponse('inspectorId query missing', res)

        const inspector = await TaskModel.find({assigned_inspector: inspectorId}).populate([
            { path: 'assigned_inspector assigned_cleaner', select: 'username' },
            { path: 'assigned_room', select: 'roomName' }
        ]);
        if(!inspector) return customResponse.successResponse('This inspector has not been assigned a work order yet', inspector, res)

        return customResponse.successResponse('Inspector History', inspector, res)

    }catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('Error fetching inspector history', res, error);
    }
}

const cleanerTaskSummary = async(req:AuthenticatedRequest, res:Response) => {
    try{ 
        
        // match based on the citeria I want
        // Group the result by id and totalrooms cleaned. aaddToSet is used to get unique assigned_rooms ids
        // lookup is used to perform outerjoin with the users table
        const cleanertask = await TaskModel.aggregate([
            {
                $match: { 'isSubmitted': true } // Consider only tasks that have been submitted
            },
            {
                $unwind: '$assigned_cleaner' // Unwind the assigned_cleaner array
            },
            {
                $group: {
                    _id: '$assigned_cleaner',
                    totalRoomsCleaned: { $sum: 1 } // Count the tasks completed by each cleaner
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'cleaner'
                }
            },
            {
                $unwind: '$cleaner'
            },
            {
                $project: {
                    cleanerId: '$_id',
                    cleanerUsername: '$cleaner.username',
                    totalRoomsCleaned: 1 // Include the totalTasksCompleted field
                }
            }
        ])
        return customResponse.successResponse('Cleaner summary', cleanertask, res)
    }catch (error:any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('Internal server error', res, error)
    }
}
export default { 
    roomHistory, 
    cleanerHistory, 
    inspectorHistory, 

    cleanerTaskSummary
}