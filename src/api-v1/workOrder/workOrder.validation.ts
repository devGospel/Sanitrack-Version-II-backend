import Joi from "joi";
import mongoose from "mongoose";

// Define and export validation schemas using Joi
interface CreateWorkOrderSchema {
  name: string;
  taskListId?: mongoose.Types.ObjectId;
  evidenceLevel?: mongoose.Types.ObjectId;
  assets?: [{
    assetId: mongoose.Types.ObjectId, 
    roomId: mongoose.Types.ObjectId, 
    exclude: Boolean, 
    assetTaskType: mongoose.Types.ObjectId
  }], 
  assignToIndividual?: Boolean,
  cleanerAssets? :[{
    cleanerId: mongoose.Types.ObjectId, 
    assignedTasks: [
      {
        roomId: mongoose.Types.ObjectId, 
        assetId: mongoose.Types.ObjectId,
        assetTaskType: mongoose.Types.ObjectId
      }
    ]
  }]
  inspectorAssets?: [{
    inspectorId: mongoose.Types.ObjectId, 
    assignedTasks: [
      {
        roomId: mongoose.Types.ObjectId, 
        assetId: mongoose.Types.ObjectId,
        assetTaskType: mongoose.Types.ObjectId
      }
    ]
  }]
  teamIds?: mongoose.Types.ObjectId, 
  inspectors?: mongoose.Types.ObjectId, 
  cleaners?:  mongoose.Types.ObjectId, 
  start_date?: String, 
  end_date? : String, 
  frequency?: String, 
  cleaningValidPeriod?: Number,
  overridePermission?: Boolean
}

interface CreateWorkOrderAssignee { 
    workOrderId: mongoose.Types.ObjectId, 
    teamIds? : mongoose.Types.ObjectId[], 
    cleaners? : mongoose.Types.ObjectId[],
    inspectors?:mongoose.Types.ObjectId[]
}
interface DeleteLocationSchema {
    location_id: string
}
const WorkOrderValidationSchema = {
  // Schema for creating a location
  createWorkOrder: Joi.object<CreateWorkOrderSchema>({
    name: Joi.string().required().label('The work order name is required'),
    taskListId: Joi.string().optional().label('The task list is required'), 
    evidenceLevel: Joi.string().optional().label('The evidence level'),

    assets: Joi.array().items(Joi.object({
      assetId: Joi.string().required().label('The asset Id is required'), 
      roomId: Joi.string().required().label('The room Id is required'),
      exclude: Joi.boolean().required().label('The exclude value is required'),
      assetTaskType: Joi.string().required().label('The asset task type is required')
    })).optional(), 

    assignToIndividual: Joi.boolean().required().label('The option to know if you want to assign assets to individuals is required'),
    cleanerAssets: Joi.array().items(Joi.object({
      cleanerId: Joi.string().required().label('The cleaner id is required'),
      assignedTasks: Joi.array().items(Joi.object({
        roomId: Joi.string().optional().required().label('The room Id is required'), 
        assetId: Joi.string().optional().required().label('The asset Id is required'),
        assetTaskType: Joi.string().required().label('The asset task type is required')
      }))
    })).optional(),

    inspectorAssets: Joi.array().items(Joi.object({
      inspectorId: Joi.string().optional().required().label('The inspector id is required'),
      assignedTasks: Joi.array().items(Joi.object({
        roomId: Joi.string().optional().required().label('The room Id is required'), 
        assetId: Joi.string().optional().required().label('The asset Id is required'),
        assetTaskType: Joi.string().required().label('The asset task type is required')
      }))
    })).optional(),

    teamIds: Joi.array().items(Joi.string().optional()).optional(), 
    inspectors: Joi.array().items(Joi.string().optional()).optional(),
    cleaners: Joi.array().items(Joi.string().optional()).optional(), 
    start_date: Joi.string().optional().label('The start date'), 
    end_date: Joi.string().optional().label('The end date'), 
    frequency: Joi.string().optional().label('The the frequency option'),
    cleaningValidPeriod: Joi.number().optional().label('The cleaning valid period'),
    overridePermission: Joi.boolean().optional().label('The over ride permission given to inspector'),
  }),

  createWorkOrderAssignee: Joi.object<CreateWorkOrderAssignee>({ 
    workOrderId: Joi.string().required().label('The work order Id is required'), 
    teamIds: Joi.array().items(Joi.string().optional()).optional(), 
    cleaners: Joi.array().items(Joi.string().optional()).optional(), 
    inspectors: Joi.array().items(Joi.string().optional()).optional(), 
  })

};

export default WorkOrderValidationSchema;
