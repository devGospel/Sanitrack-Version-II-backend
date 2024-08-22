import mongoose, { Document, Schema, model, Types, Date } from 'mongoose';
import RoomModel from './room';
import AssetGroupModel from './assetsGroup';
import  modelPrefix  from '../constant/codes';
import EvidenceLevelModel from './evidenceLevel';
const AutoIncrement= require('mongoose-sequence')(mongoose) // not sure why import did not work 

export enum workOrderStatus {
    closed = "closed",
    submitted = "submitted",
    pending = "pending",
  }

export interface WorkOrder extends Document{ 
    name: String, 
    taskList?: mongoose.Types.ObjectId[],
    workOrderPrefix: String, 
    workOrderCode: Number,
    status: String,
    evidenceLevel: mongoose.Schema.Types.ObjectId,
    assignAssetToIndividual : Boolean, 
    active: Boolean, 
    overridePermission: Boolean,
}

const workOrderSchema = new Schema<WorkOrder>({
    name: {type: String, required: true}, 
    taskList: [{type: mongoose.Schema.Types.ObjectId, ref: AssetGroupModel, default: null, required: false}], 
    workOrderPrefix: {type: String, default: `${modelPrefix.workOrderPrefix}`}, 
    workOrderCode: {type: Number, required: false, unique: true},
    status: {type: String, enum: Object.values(workOrderStatus) },
    evidenceLevel: {type: mongoose.Types.ObjectId, ref: EvidenceLevelModel, default: null, required: false},
    assignAssetToIndividual: {type:Boolean, default: false},
    active:{type: Boolean, default: true},
    overridePermission: {type: Boolean, default: false}, 
    
},{ 
    timestamps: true
})

workOrderSchema.plugin(AutoIncrement, {
    inc_field: 'workOrderCode',             
    start_seq: 1,                              
    leading_zeros: true
  });

const WorkOrderModel = model<WorkOrder>('work_order', workOrderSchema)

export default WorkOrderModel