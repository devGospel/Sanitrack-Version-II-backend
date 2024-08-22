import mongoose, { Document, Schema, model, Types, Date } from 'mongoose';
import RoomModel from './room';
import User from './user';
import Location from './location';
import PlannedTime from './plannedTime';
import RoomCleaningItems from './roomCleaningItems';
import RoomDetailModel from './roomDetail';
import FacilityWorkOrderModel from './workFacility';


// Define interface for task
interface Task extends Document {
  assigned_inspector: mongoose.Types.ObjectId; 
  assigned_manager: mongoose.Types.ObjectId; 
  assigned_cleaner: mongoose.Types.ObjectId; 
  assigned_location: mongoose.Types.ObjectId; 
  assigned_room: mongoose.Types.ObjectId; 
  assigned_cleaning_items: mongoose.Types.ObjectId;
  planned_time: mongoose.Types.ObjectId; 
  work_order_facility: mongoose.Types.ObjectId; 
  task_stage: String;
  isSubmitted: boolean;
  times_approved: Number; 
  date_added: Date;
  scheduled_date: Date; 
  date_approved: Date | null;
  cleaner_general_evidence: String[],
  tasks: [{
    isOverDue: String;
    _id: any;
    roomDetailId: {type: mongoose.Types.ObjectId},
    name: { type: String, required: true },
    isDone: { type: Boolean, required: true, default: false},
    image: {type: String, default: 'empty'}, 
    last_cleaned: {type: Date, default: null}, 
    cleaning_expiry_time: {type: Date, default: null}
  }], 
}

// Create a Mongoose schema for Room
const taskSchema = new Schema<Task>({
    assigned_inspector: [
        { type: mongoose.Schema.Types.ObjectId, ref: User, required: true }
    ],
    assigned_manager: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    assigned_cleaner: [
        { type: mongoose.Schema.Types.ObjectId, ref: User, required: true }
    ],
    assigned_location: {type: mongoose.Schema.Types.ObjectId, ref: Location, required: true},
    assigned_room: {type: mongoose.Schema.Types.ObjectId, ref: RoomModel, required: true },
    work_order_facility: {type: mongoose.Schema.Types.ObjectId, ref: FacilityWorkOrderModel, required: false},
    planned_time: {type: mongoose.Schema.Types.ObjectId, ref: PlannedTime, required:false, default: null},
    task_stage: {type: String, default: "clean", required: true}, 
    isSubmitted: {type: Boolean, default: false},
    times_approved: {type: Number, default: 0, required: true},
    date_added: {type: Date, default: Date.now,  required: true},
    scheduled_date: {type: Date, default: null},
    date_approved: {type: Date, default: null},
    cleaner_general_evidence: [{type: String, required: false}],
    tasks: [{
        roomDetailId: { type: mongoose.Schema.Types.ObjectId, ref: RoomDetailModel, required: true },
        name: { type: String, required: true },
        isDone: { type: Boolean, required: true, default: false },
        image: { type: String, default: "empty" },
        last_cleaned: { type: Date, default: null, }, 
        cleaning_expiry_time: {type: Date, default: null}, 
        isOverDue: { type: String, default: null }
    }],
});

// Create a Mongoose model for Task
const TaskModel = model<Task>('Task', taskSchema);

export default TaskModel;
