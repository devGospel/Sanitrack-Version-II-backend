// This is the actual time taken to clean a facility/room
import mongoose, { Document, Schema } from 'mongoose';
import TaskModel from './task';
import RoomModel from './room';
import User from './user';

interface actualTime extends Document{ 
    task_id: mongoose.Types.ObjectId,
    room_id: mongoose.Types.ObjectId, 
    clean_time: {
        cleaner_id: mongoose.Types.ObjectId, 
        time: Number[]
    }, 
    preOp_time: {
        inspector_id: mongoose.Types.ObjectId, 
        time: Number[]
    }, 
    release_time: Number,
}

const actualTimeSchema = new Schema<actualTime>({ 
    task_id: {type: mongoose.Schema.Types.ObjectId, ref: TaskModel, required: true}, 
    room_id: {type: mongoose.Schema.Types.ObjectId, ref: RoomModel, required: true}, 
    
    clean_time: {
        cleaner_id:{type:mongoose.Schema.Types.ObjectId, ref: User}, 
        time: [{type: Number, required: true}]
    },
    preOp_time:  {
        inspector_id: {type:mongoose.Schema.Types.ObjectId, ref: User}, 
        time: [{type: Number, required: true}]
    }, 
    
    release_time:  {type: Number, default: 0, required: true}, 
})

const ActualTime = mongoose.model<actualTime>('actual_time', actualTimeSchema);


export default ActualTime;