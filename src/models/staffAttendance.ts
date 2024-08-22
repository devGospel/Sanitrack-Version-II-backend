// this model holds record of staff attendance 
import mongoose, { Date, Document, Schema, model } from "mongoose";
import Location from "./location";
import User from "./user";
import Role from "./role";
import FacilityAttendanceModel from "./facilityAttendance";

export enum staffStatus {
    onTime = "on time",
    late = "late",
    absent = "absent",
  }
interface StaffAttendance extends Document{ 
    userId: mongoose.Types.ObjectId, 
    roleId: mongoose.Types.ObjectId, 
    attendance: [
        {
            location: {
                type: string,
                coordinates: Number[],
            },
            facilityId: mongoose.Types.ObjectId, 
            clockInTime: Date, 
            facilityAttendanceSchedule: mongoose.Types.ObjectId //this would be stored with the most recent facility attendance schedule to know if the staff was late or not 
            status: String
        }
    ]
}

const staffAttendanceSchema = new Schema<StaffAttendance>({ 
    userId: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true}, 
    roleId: {type: mongoose.Schema.Types.ObjectId, ref: Role, required: true}, 
    attendance: [{ 
        location: {
            type: { type: String, enum: ['Point'], required: true },
            coordinates: { type: [Number], required: true },
        },
        facilityId: {type: mongoose.Schema.Types.ObjectId, ref: Location, default: null}, 
        clockInTime: {type: Date, required: true}, 
        facilityAttendanceSchedule: {type: mongoose.Schema.Types.ObjectId,  required: true}, //aftr the check, if there is a facility, get the facility schedule for the facility
        status: {type: String, enum: Object.values(staffStatus)}
    }]
})

const StaffAttendanceModel = model<StaffAttendance>('staff_attendance', staffAttendanceSchema)

export default StaffAttendanceModel