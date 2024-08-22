import Joi from "joi";
import mongoose from "mongoose";

interface createFrequency {
    name: string,
    interval: Number, 
    unit: string, 
    occurrences: Number, 
    validStartHour?: Number, 
    validStopHour?: Number,
    cronExpression?: String
    availableInterval?: Number,
    excludeWeekend: Boolean
}

// Interface for updating a cleaning type
interface updateFrequency {
    name?: string
}

const FrequencyValidationSchema = {
    createFrequency: Joi.object<createFrequency>({
        name: Joi.string().required().label('The name is required'),
        interval: Joi.number().required().label('The interval is required'),
        unit: Joi.string().required().label('The unit is required'), 
        occurrences: Joi.number().required().label('The occurrence is required'),
        validStartHour: Joi.number().optional().label('The valid start hours for the frequency'), 
        validStopHour: Joi.number().optional().label("The valid stop hour for the frequency"),
        cronExpression: Joi.string().optional().label('The cron expression'), 
        availableInterval: Joi.number().optional().label('The available interval'), 
        excludeWeekend: Joi.boolean().required().label('The weekend option')
    }),

    updateTaskType: Joi.object<updateFrequency>({
        name: Joi.string().optional().label('The name is optional')
    })
}

export default FrequencyValidationSchema