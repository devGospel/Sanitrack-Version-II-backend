import { AuthenticatedRequest } from "../../middlewares/security";
import { Response } from "express";
import customResponse from "../../helpers/response"
import TaskModel from "../../models/task";
import ActualTime from "../../models/actualTime";
import RoomModel from "../../models/room";
import RoomDetailModel from "../../models/roomDetail";

const getPlannedTime = async (req:AuthenticatedRequest, res: Response) => { 
    try{
        // get all the rooms and their tasks if any 
        const allRooms = await RoomModel.find()
        const result = await Promise.all(allRooms.map(async room => { 
            const allTask = await TaskModel.find({assigned_room: room._id}).populate('assigned_cleaner assigned_room assigned_inspector planned_time')
            const actualTime = await ActualTime.findOne({room_id: room._id})
            return {allTask, actualTime}
        }))

        const totalCount = await RoomModel.countDocuments();
        
        return customResponse.successResponse('fetched', {result, totalCount}, res);
       
    }catch(error:any){ 
        return customResponse.serverErrorResponse('An error occured in the get planned time endoint', res, error)
    }
}



export default { 
    getPlannedTime
}