import mongoose, { Schema, model } from "mongoose";
import User from "./user";
import RoomModel from "./room";
import Location from "./location";

interface PreWorkFacility extends Document{ 
    facility_id: mongoose.Types.ObjectId, 
    stages: [
        {name: String, start_time: Date}
    ], 
}

const PreWorkFacilityOrderSchema = new Schema<PreWorkFacility>({
    facility_id: {type: mongoose.Schema.Types.ObjectId, ref: Location, required: true},
    stages: [
        {
            name: {type: String, required: true}, 
            start_time: {type: Date, required: true},
        }
    ]
})

const PreWorkFacilityModel = model<PreWorkFacility>('predefined_work_facility', PreWorkFacilityOrderSchema)

export default PreWorkFacilityModel