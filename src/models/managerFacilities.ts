import mongoose, { Schema, model } from "mongoose";
import User from "./user";
import Location from "./location";

interface ManagerFacilities extends Document{ 
    managerId: mongoose.Types.ObjectId, 
    assignedFacilities: mongoose.Types.ObjectId[]

}

const managerFacilitySchema = new Schema<ManagerFacilities>({ 
    managerId: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true}, 
    assignedFacilities: [{type: mongoose.Schema.Types.ObjectId, ref: Location, required: true}]
}, {
    timestamps: true
})

const ManagerFacilityModel = model<ManagerFacilities>('manager_facility', managerFacilitySchema)

export default ManagerFacilityModel