// This holds the model data for the minute the cleaner clicks on the start timeer 
import mongoose, { Document, Schema } from 'mongoose';
import User from './user';
import WorkOrderTaskModel from './workOrderTasks';

interface staffStartTime extends Document{ 
    staffId: mongoose.Schema.Types.ObjectId; 
    tasks: {
        workOrderTaskId: mongoose.Schema.Types.ObjectId; 
        startTime?: []
        stopTime?: []
    }
    
}

const staffStartTimeSchema = new Schema<staffStartTime>({ 
    staffId: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true}, 
    tasks: 
        { 
            workOrderTaskId: {type: mongoose.Schema.Types.ObjectId, ref: WorkOrderTaskModel, required: true},
            startTime: [{type:Date, ref: User, required: false}], 
            stopTime: [{type: Date, required: false}]
        }
}, {
    timestamps: true
})

const staffStartTimeModel = mongoose.model<staffStartTime>('staff_start_time', staffStartTimeSchema);

export default staffStartTimeModel
