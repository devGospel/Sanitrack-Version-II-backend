import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/security";
import customResponse from "../../helpers/response";

import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import { getCurrentDateInLosAngelesFormatted } from "../../utils/date";
import WorkOrderScheduleModel from "../../models/workOrderSchedule";

const moduleName = '[work schedule V1/controller]'
const Logger = createChildLogger(moduleName)

const getWorkSchedule = catchAsync(async(req:AuthenticatedRequest, res: Response) => {
    // this endpoint is to get all the schedules where their start and end date is between the current date
    const currentDate = getCurrentDateInLosAngelesFormatted()
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0); // Start of the current day
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999); // End of the current day
    
    const workSchedules = await WorkOrderScheduleModel.find({
        startDate: { $lte: endOfDay },
        endDate: { $gte: startOfDay }
    }).populate('workOrderId').sort({ _id: -1 });

    if (workSchedules.length === 0) {
        return customResponse.successResponse('There are no work schedules that fall within the current date', [], res);
    }
    
    return customResponse.successResponse('Work Schedules', workSchedules, res);
})

export default{ 
    getWorkSchedule
}