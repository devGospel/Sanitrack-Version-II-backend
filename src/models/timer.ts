import mongoose, { Date, Document, Schema } from "mongoose";
import TaskModel from "./task";
import RoomModel from "./room";

interface Timer extends Document{ 
    taskId: mongoose.Types.ObjectId; 
    roomId: mongoose.Types.ObjectId; 
    start_time: String; 
    stop_time: String
}

const timerSchema = new Schema({ 
    taskId: {type: mongoose.Types.ObjectId, ref: TaskModel, require: true}, 
    roomId:{type:mongoose.Types.ObjectId, ref: RoomModel, require:true}, 
    start_time: {type: String, require:true}, 
    stop_time: {type: String, require: true}
})

const Timer = mongoose.model<Timer>('timer',timerSchema )

export default Timer