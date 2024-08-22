import { AuthenticatedRequest } from "../../middlewares/security";
import { Response, Request } from "express";
import customResponse from "../../helpers/response"
import TaskModel from "../../models/task";
import User from "../../models/user";
import RoomModel from "../../models/room";

import { createChildLogger } from "../../utils/childLogger";
const moduleName = '[search/controller]'
const Logger = createChildLogger(moduleName)
interface TaskQuery {
    assigned_cleaner?: string;
    date_added?: { $gte: Date; $lte: Date };
    assigned_room?: string;
}

const handleEvidenceSearch = async (req:Request, res: Response) => { 
    try{ 
        // collect the details passed 
            const {cleaner_name, start_date, end_date, room_name} = req.query

        // Construct the base query
        let query: TaskQuery = {};

        // Add parameters to the query if they are provided
        if (cleaner_name) {
            const cleaner = await User.findOne({ username: cleaner_name });
            if (!cleaner) return customResponse.badRequestResponse('There is no cleaner with that name', res)
            query.assigned_cleaner = cleaner._id;
            // Logger.info(`cleaner => ${query.assigned_cleaner}`)
        }

        if (room_name) {
            const room = await RoomModel.findOne({ roomName: room_name });
            if (!room) return customResponse.badRequestResponse('There is no room by that name', res)
            query.assigned_room = room._id;
            // Logger.info(`room_name => ${room._id}`)
        }

        // Logger.info(`query => ${JSON.stringify(query)} `)
        // Execute the query against MongoDB
        const tasks = await TaskModel.find(query).populate('assigned_cleaner').populate('assigned_room');

            return customResponse.successResponse('data returned', tasks, res)
    }catch(error:any){ 
        Logger.error(error)
        return customResponse.serverErrorResponse('Something occured in the search evidence endpoint', res, error)
    }
}

export default{
    handleEvidenceSearch
}