import mongoose, { Document, Schema, model, Types, Date } from 'mongoose';
import WorkOrderModel from './workorder';
import FrequencyModel from './frequency';

export enum frequency {
    oneOff = 'oneOff',
    daily = 'daily',
    weekly = 'weekly',
    monthly = 'monthly',
    yearly = 'yearly'
} 
export interface WorkOrderSchedule extends Document{ 
    workOrderId: mongoose.Types.ObjectId,
    frequency: String,
    cleaningValidPeriod?: Number, //this is the valid duration for the work order.
    startHour: Number,
    startMinute: Number,
    startDate: Date, 
    endDate: Date,
    status: String,
    active: Boolean
}

const workOrderScheduleSchema = new Schema<WorkOrderSchedule>({
    workOrderId: {type: mongoose.Schema.Types.ObjectId, ref: WorkOrderModel, required: true}, 
    frequency: {type: mongoose.Schema.Types.ObjectId, ref: FrequencyModel, default: null, required:false},
    cleaningValidPeriod: {type: Number, min: 0, max: 24, default: 0,  required: false},
    startHour: {type: Number, min: 0, max: 24, default: null, required: false},
    startMinute: {type: Number, min: 0, max: 59, default: null, required: false},
    startDate: {type: Date, default: null, required:false},
    endDate: {type: Date, default: null, required: false}, 
    active: {type: Boolean, default: true, required: true}
})

const WorkOrderScheduleModel = model<WorkOrderSchedule>('work_order_schedule', workOrderScheduleSchema)

export default WorkOrderScheduleModel