import Joi from "joi"
import mongoose from "mongoose"

interface params{ 
    locationId: mongoose.Types.ObjectId, 
    taskId: mongoose.Types.ObjectId
}

interface ApproveTask{ 
    timer: number,
    passedTasks: [{taskId: mongoose.Types.ObjectId}]
}

const InspectorValidationSchema = { 
    accessLocation: Joi.object<params>({ 
        locationId: Joi.string().required()
    }),
    accessTaskForRooms: Joi.object<params>({
        taskId: Joi.string().required()
    }), 
    accessSingleRequestedCleaningItem: Joi.object<params>({ 
        taskId: Joi.string().required()
    }), 
    updateTask: Joi.object<ApproveTask>({
        timer: Joi.number().integer().min(0).required(),
        passedTasks: Joi.array().items(
            Joi.object({
                taskId: Joi.string().required().label('The id of the task(task asked to clean for the room) they want to approve')
            })
        ).required()
    })
}

export default InspectorValidationSchema