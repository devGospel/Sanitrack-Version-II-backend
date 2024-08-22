import Joi from 'joi';
import mongoose from 'mongoose';

// Define and export validation schemas using Joi
interface CreateTaskSchema {
    roomId: mongoose.Types.ObjectId;
    inspectors: Array<mongoose.Types.ObjectId>; 
    cleaners: Array<mongoose.Types.ObjectId>; 
    locationId: mongoose.Types.ObjectId; 
    clean_hours: number; 
    clean_minutes: number; 
    preop_hours: number; 
    preop_minutes: number; 
    scheduled_date: Date; 
    cleaningData: [
        {cleaning_id: mongoose.Types.ObjectId, item_name: string, quantity: number, unit: string}
    ]; 
    itemsToClean: [
        {roomDetailId: mongoose.Types.ObjectId, name: string}
    ]
}

interface UpdateTaskSchema {
    taskId: string;
    inspectorId: string; 
    cleanerId: string; 
    roomId: string; 
}

interface SubmitTaskSchema {
    cleanTime: number, 
    roomId: string
}

interface DeleteTaskSchema {
    taskId: string;
}


const validationSchemas = {
    // Schema for creating a task
    createTask: Joi.object<CreateTaskSchema>({
        roomId: Joi.string().required().label('Room Id'), 
        inspectors: Joi.array().items(
            Joi.string().required()
        ).required().label('Inspectors to assign'), 
        cleaners: Joi.array().items(
            Joi.string().required().label('Cleaners to assign')
        ).required().label('Cleaners are required'), 
        locationId: Joi.string().required().label('Location Id is required'), 
        clean_hours: Joi.number().required().label('Cleaning hours are required'), 
        clean_minutes: Joi.number().required().label('Cleaning minutes are required'), 
        preop_hours: Joi.number().required().label('Preop hours are required'), 
        preop_minutes: Joi.number().required().label('Preop minutes are required'), 
        scheduled_date: Joi.string().isoDate().optional().label('Scheduled date is required'),
        cleaningData: Joi.array().items(
            Joi.object({
                cleaning_id: Joi.string().required().label('cleaning_id is required'), 
                item_name: Joi.string().required().label('Item name is required'), 
                quantity: Joi.number().min(0).required().label('Quantity is required'), 
                unit: Joi.string().required().label('Unit of cleaning item is required')
            })
        ).required(), 
        itemsToClean: Joi.array().items(
            Joi.object({
                roomDetailId: Joi.string().required().label('The id of the room to clean is required'), 
                name: Joi.string().required().label('The name of the item to clean is required')
            })
        ).required().label('The items to clean in the room are required')
    }),

    // Schema for task update
    updateTask: Joi.object<UpdateTaskSchema>({
        taskId: Joi.string().required(),
        inspectorId: Joi.string().required(),
        cleanerId: Joi.string().required(),
        roomId: Joi.string().required(),
    }),

    // Schema for task submission
    submitTask: Joi.object<SubmitTaskSchema>({
        cleanTime: Joi.number().required().label('The cleaners time is required'), 
        roomId: Joi.string().required().label('The room id is required')
    }),

    // Schema for deleting task by id
    deleteTask: Joi.object<DeleteTaskSchema>({
        taskId: Joi.string().required(),
    }),

};

export default validationSchemas;
