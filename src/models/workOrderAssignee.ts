import mongoose, { Document, Schema, model, Types, Date } from 'mongoose';
import WorkOrderModel from './workorder';
import TeamModel from './teams';
import User from './user';

export interface WorkOrderAssignee extends Document{ 
    workOrderId: mongoose.Types.ObjectId,
    team?: mongoose.Types.ObjectId[],
    cleaner?: mongoose.Types.ObjectId[],
    inspector?: mongoose.Types.ObjectId[]

}

const workOrderAssigneeSchema = new Schema<WorkOrderAssignee>({
    workOrderId: {type: mongoose.Schema.Types.ObjectId, ref: WorkOrderModel,  required: true}, 
    team: [{type: mongoose.Schema.Types.ObjectId, ref: TeamModel, required: false}], 
    cleaner: [{type: mongoose.Schema.Types.ObjectId, ref: User, required: false}], 
    inspector: [{type: mongoose.Schema.Types.ObjectId, ref:User, required: false}]
})

const WorkOrderAssigneeModel = model<WorkOrderAssignee>('work_order_assignee', workOrderAssigneeSchema)

export default WorkOrderAssigneeModel