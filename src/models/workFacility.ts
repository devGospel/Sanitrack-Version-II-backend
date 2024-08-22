import mongoose, { Schema, model } from "mongoose";
import User from "./user";
import RoomModel from "./room";
import Location from "./location";

interface WorkFacilityOrder extends Document{ 
    facility_id: mongoose.Types.ObjectId, 
    assigned_supervisors: mongoose.Types.ObjectId, 
    scheduled_date: Date,
    repeat_date: Date,
    stages: [
        { name: String, start_time: Date, note: String }
    ],
    assigned_rooms: [mongoose.Types.ObjectId],
    completed: Boolean
}

const WorkFacilityOrderSchema = new Schema<WorkFacilityOrder>({
    facility_id: {type: mongoose.Schema.Types.ObjectId, ref: Location, required: true},
    assigned_supervisors: [{type: mongoose.Schema.Types.ObjectId, ref: User, required: true}], 
    scheduled_date: {type:Date, required: true},
    repeat_date: {type: Date, required: true},
    stages: [
        {
            name: { type: String, required: true },
            start_time: { type: Date, required: true },
            note: [{ type: String, required: false, default: null }]
        }
    ],
    assigned_rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: RoomModel, required: false }],
    completed: { type: Boolean, default: false }
})

const FacilityWorkOrderModel = model<WorkFacilityOrder>('facility_work_order', WorkFacilityOrderSchema)

export default FacilityWorkOrderModel;