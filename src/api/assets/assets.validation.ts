import Joi from 'joi';
import mongoose from 'mongoose';
import { frequency } from '../../models/workOrderSchedule';

// Define and export validation schemas using Joi
interface createAssetSchema {
    roomId: string;
    name: string;
}

interface addAssetTask { 
    roomId: mongoose.Types.ObjectId, 
    assetId: mongoose.Types.ObjectId, 
    assetTask: [{
        cleaningType: mongoose.Schema.Types.ObjectId, 
        frequency: mongoose.Schema.Types.ObjectId,
    }]
}
const assetValidationSchema = {
  // Schema for creating a room
  createAsset: Joi.object<createAssetSchema>({
    roomId: Joi.string().required().label('The room Id is required'),
    name: Joi.string().required().label('The asset name is required')
   }),

   addTaskToAsset: Joi.object<addAssetTask>({ 
    roomId: Joi.string().required().label('The room Id is required'),
    assetId:Joi.string().required().label('The room Id is required'),
    assetTask: Joi.array().items(Joi.object({ 
        cleaningType: Joi.string().required().label('The cleaning type is required'), 
        cleaningTypeFrequency: Joi.string().required().label('The frequency is required'), 
    }))
   })
};

export default assetValidationSchema;
