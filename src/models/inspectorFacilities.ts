import mongoose, { Schema, model } from "mongoose";
import User from "./user";
import Location from "./location";

interface InspectorFacilities extends Document{ 
    facilityId: mongoose.Types.ObjectId, 
    assignedInspectors: mongoose.Types.ObjectId[]
}

const inspectorFacilitySchema = new Schema<InspectorFacilities>({ 
    facilityId: {type: mongoose.Schema.Types.ObjectId, ref: Location, required: true}, 
    assignedInspectors: [{type: mongoose.Schema.Types.ObjectId, ref: User, required: true}]
}, {
    timestamps: true
})

const InspectorFacilityModel = model<InspectorFacilities>('inspector_facility', inspectorFacilitySchema)

export default InspectorFacilityModel