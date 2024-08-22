import mongoose, { Schema, model } from "mongoose";
import User from "./user";
import Location from "./location";

interface CleanerFacilities extends Document{ 
    facilityId: mongoose.Types.ObjectId, 
    assignedCleaners: mongoose.Types.ObjectId[]

}

const cleanerFacilitySchema = new Schema<CleanerFacilities>({ 
    facilityId: {type: mongoose.Schema.Types.ObjectId, ref: Location, required: true}, 
    assignedCleaners: [{type: mongoose.Schema.Types.ObjectId, ref: User, required: true}]
}, {
    timestamps: true
})

const CleanerFacilityModel = model<CleanerFacilities>('cleaner_facility', cleanerFacilitySchema)

export default CleanerFacilityModel