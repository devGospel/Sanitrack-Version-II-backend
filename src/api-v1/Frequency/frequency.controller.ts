import { AuthenticatedRequest } from "../../middlewares/security";
import { Request, Response } from 'express';
import customResponse from "../../helpers/response";
import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import FrequencyModel from "../../models/frequency";
import { generateScheduledDates} from "../../utils/date";

const moduleName = "[frequency management/controller]";
const Logger = createChildLogger(moduleName);

const addFrequency = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
    const {name, interval, unit, excludeWeekend, validStartHour, validStopHour} = req.body

    let availableInterval = null
    let cronExpression = null
    switch(unit){ 
        case 'hourly': 
            break
        case 'daily': 
            availableInterval = interval * 1
            break
        case 'weekly': 
            availableInterval = interval * 7
            break
        case 'yearly': 
            availableInterval = interval * 365
            break
        case 'monthly': 
            break
        default: 
            throw new Error('Invalid unit value passed')
    }
    // count frequency 
    let isDefault = true
    const count = await FrequencyModel.countDocuments()
    if(count > 0){
        isDefault = false
    }
    // save the frequency to the db
    const frequency = await FrequencyModel.create({ 
        name: name, 
        interval: interval, 
        unit: unit, 
        cronExpression: cronExpression, 
        availableInterval: availableInterval, 
        excludeWeekend: excludeWeekend, 
        validStartHour: validStartHour, 
        validStopHour: validStopHour, 
        isDefault: isDefault
    })
    const startDate = '2024-06-28'
    const endDate = '2024-10-28'
    // const dates = generateScheduledDates('0 0 */2 * 1-5', startDate, endDate, 'yearly' )
    // tryingCroner()
    // const hello = newGenerateScheduledDates(startDate, endDate, 3, 'yearly', true)
    return customResponse.successResponse('saved', frequency , res )
})

const getFrequency = catchAsync(async(req:AuthenticatedRequest, res: Response) => { 
    const result = await FrequencyModel.find()
    return customResponse.successResponse('fetched', result, res)
})

const getSingleFrequency = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
    const {id} = req.query
    let scheduledDates
    const startDate = '2024-06-30T05:57:50.467Z'
    const endDate = '2024-07-31T05:57:50.467Z'
    const result = await FrequencyModel.findById(id)
    if(!result){ 
        return customResponse.badRequestResponse('There is no frequency with such id', res)
    }
     
    scheduledDates = generateScheduledDates(startDate, endDate, result.availableInterval as unknown as number, result.interval as unknown as number, result.excludeWeekend as unknown as boolean, result.unit as unknown as string,  result.validStartHour as unknown as number, result.validStopHour as unknown as number)
    
    return customResponse.successResponse('fetched', scheduledDates, res)
})


export default{ 
    addFrequency, 
    getFrequency, 
    getSingleFrequency
}