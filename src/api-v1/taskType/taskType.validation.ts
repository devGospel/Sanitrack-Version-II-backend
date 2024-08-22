import Joi from "joi";
import mongoose from "mongoose";

interface createCleaningType {
    name: string,
    description: string,
    document: string
}

// Interface for updating a cleaning type
interface updateTaskType {
    name?: string,
    description?: string,
    document?: string
}

const CleaningTypeValidationSchema = {
    createCleaningType: Joi.object<createCleaningType>({
        name: Joi.string().required().label('The name is required'),
        description: Joi.string().max(255).optional().label('The description is optional')
    }),

    updateTaskType: Joi.object<updateTaskType>({
        name: Joi.string().optional().label('The name is optional'),
        description: Joi.string().max(255).optional().label('The description is optional'),
        document: Joi.string().optional().label('The document is optional')
    })
}

export default CleaningTypeValidationSchema