import mongoose, { Document, Schema, model, Types, Date } from 'mongoose';
import WorkOrderModel from './workorder';
import RoomModel from './room';
import CleanerEvidenceModel from './cleanerEvidence';
import InspectorEvidenceModel from './inspectorEvidenceNew';
import RoomDetailModel from './roomDetail';
import User from './user';
import AssetTaskType from './roomDetailCleaning';

export interface WorkOrderTask extends Document{
    assetId: mongoose.Types.ObjectId, 
    assetTaskType: mongoose.Types.ObjectId,
    workOrderId: mongoose.Types.ObjectId, 
    roomId: mongoose.Types.ObjectId, 
    exclude: Boolean, 
    isDone: Boolean, 
    isApproved: Boolean, 
    lastCleaned?: Date, 
    validCleaningPeriod:Date,
    scheduledDate: Date, 
    assignedCleaner? :mongoose.Types.ObjectId,
    assignedInspector? :mongoose.Types.ObjectId,
    active: Boolean
}

const workOrderTaskSchema = new Schema<WorkOrderTask>({ 
    assetId: {type: mongoose.Schema.Types.ObjectId, ref:RoomDetailModel, required: true}, 
    assetTaskType: {type: mongoose.Schema.Types.ObjectId, ref: AssetTaskType, required: true},
    workOrderId: {type: mongoose.Schema.Types.ObjectId, ref:WorkOrderModel, required: true},
    roomId: {type: mongoose.Schema.Types.ObjectId, ref: RoomModel, require: true}, 
    exclude: {type: Boolean, default: false},
    isDone: {type: Boolean, default: false}, 
    isApproved: {type: Boolean, default: false}, 
    lastCleaned: {type: Date, default: null},
    validCleaningPeriod: {type: Date, default: null}, 
    scheduledDate: {type: Date, default: null}, 
    assignedCleaner: {type:mongoose.Schema.Types.ObjectId, ref:User, required: false},
    assignedInspector: {type:mongoose.Schema.Types.ObjectId, ref:User, require: false},
    active: {type: Boolean, default: true, required: true}
})

const WorkOrderTaskModel = model<WorkOrderTask>('work_order_task', workOrderTaskSchema)

export default WorkOrderTaskModel