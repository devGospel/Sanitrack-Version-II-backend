// This is the planned time for every task. Modified by the admin only 
import mongoose, { Document, Schema } from 'mongoose';
import TaskModel from './task';
import RoomModel from './room';

interface PlannedTime extends Document{ 
    clean_time: Number, 
    preOp_time: Number, 
    release_time: Number,
}

const plannedTimeSchema = new Schema<PlannedTime>({ 
    clean_time: {type: Number, required: true}, 
    preOp_time:  {type: Number, required: true}, 
    release_time:  {type: Number, required: true}, 
})

const PlannedTime = mongoose.model<PlannedTime>('planned_time', plannedTimeSchema);

export default PlannedTime;