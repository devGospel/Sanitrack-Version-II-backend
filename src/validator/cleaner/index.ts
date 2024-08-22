import Joi from "joi"
import mongoose, { mongo } from "mongoose"

interface params{ 
    locationId: mongoose.Types.ObjectId, 
    taskId: mongoose.Types.ObjectId
}
interface confirmCleaningItems{
    roomId: mongoose.Types.ObjectId, 
    cleanerItems: [{cleaning_id: mongoose.Types.ObjectId, quantityRecevied: number}]

}

interface uploadImage{ 
    general_evidence: String[]
    inputs: [{detail_id: mongoose.Types.ObjectId, image_path: string}]
}
const CleanerValidationSchema = { 
    accessRomms: Joi.object<params>({ 
        locationId: Joi.string().required()
    }), 
    accessTaskForRooms: Joi.object<params>({
        taskId: Joi.string().required()
    }), 
    accessCleaningItems: Joi.object<params>({ 
        taskId: Joi.string().required()
    }), 
    confirmCleaningItems: Joi.object<confirmCleaningItems>({ 
        roomId: Joi.string().required(), 
        cleanerItems: Joi.array().items(
            Joi.object({
                cleaning_id: Joi.string().required(), 
                quantityReceived: Joi.number().min(0).required()
            })
        ).required()

    }), 
    uploadTaskImage: Joi.object<uploadImage>({ 
        general_evidence: Joi.array().optional(), 
        inputs: Joi.array().items(
            Joi.object({
                detail_id: Joi.string().required(), 
                image_path: Joi.string().required()
            })
        ).optional()
    })
}
export default CleanerValidationSchema