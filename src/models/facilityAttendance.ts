// this model lets the manager manage the attendance for facilities 
import mongoose, { Date, Document, Schema, model } from "mongoose";

interface FacilityAttendance extends Document{ 
    facilityId: mongoose.Types.ObjectId
    clockInSchedule: [{
        _id: any,
        clockInTime: Date,
        isActive: Boolean,
        dateCreated: Date
    }]
}

const facilityAttendanceSchema = new Schema<FacilityAttendance>({ 
    facilityId: {type: mongoose.Schema.Types.ObjectId, required: true}, 
    clockInSchedule: [{ 
        clockInTime: {type: Date, required: true}, 
        isActive: {type: Boolean, required: true}, 
        dateCreated: {type: Date, default: Date.now(), required: true}
    }]
    
})

const FacilityAttendanceModel = model<FacilityAttendance>('facility_attendance', facilityAttendanceSchema)

export default FacilityAttendanceModel