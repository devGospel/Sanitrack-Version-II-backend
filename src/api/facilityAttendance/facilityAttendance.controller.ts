import { AuthenticatedRequest } from '../../middlewares/security';
import customResponse from "../../helpers/response";
import { Request, Response } from 'express';
import { createChildLogger } from '../../utils/childLogger';
import Location from '../../models/location';
import FacilityAttendanceModel from '../../models/facilityAttendance';
import mongoose from 'mongoose';
import catchAsync from '../../utils/catchAsync';
import StaffAttendanceModel from '../../models/staffAttendance';
import { custom } from 'joi';


const moduleName = '[facility attendance/controller]'
const Logger = createChildLogger(moduleName)

// the managers would not be able to edit or delete facility attendance because it will be used by HR to get staff clock in times 
const createFacilityAttendance = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        // which ever new facility attendance time is created, that should be the one in use unless stated otherwise
        const {facilityId, clockInSchedule} = req.body
        const today = new Date()
        if(!facilityId || !mongoose.Types.ObjectId.isValid(facilityId)) return customResponse.badRequestResponse('Invalid facility Id', res)
        

        const {clockInHour, clockInMinute, isActive} = clockInSchedule[0]
        // Check if clockInHour is a valid hour (0-23)
        if (clockInHour === undefined || clockInHour < 0 || clockInHour > 23) {
            return customResponse.badRequestResponse('Invalid clock-in hour. It should be an integer between 0 and 23.', res);
        }

        // Check if clockInMinute is a valid minute (0-59)
        if (clockInMinute === undefined || clockInMinute < 0 || clockInMinute > 59) {
            return customResponse.badRequestResponse('Invalid clock-in minute. It should be an integer between 0 and 59.', res);
        }

        const clockInTime = new Date()
        clockInTime.setHours(clockInHour, clockInMinute, 0, 0)
        // Logger.info(clockInTime)

        const facilityCheck = await Location.findById(facilityId)
        if(!facilityCheck){ 
            return customResponse.badRequestResponse('There is no facility with such Id', res)
        }

        const existingAttendance = await FacilityAttendanceModel.findOne({facilityId: facilityId})
        
        if(existingAttendance){ 
            existingAttendance.clockInSchedule.map( (async schedule => { 
                if(isActive){ 
                    // if the new schedule being set for the facility is yes, update the previous schedules to false. This is so that the staffs will be judged based on the attendance that is active
                    schedule.isActive = false
                }
            })); 

            existingAttendance.clockInSchedule.push({
                clockInTime: clockInTime as unknown as mongoose.Schema.Types.Date,
                isActive: isActive || false,
                dateCreated: new Date() as unknown as mongoose.Schema.Types.Date,
                _id: undefined
            });

            await existingAttendance.save();
            return customResponse.successResponse('Facility attendance updated successfully',existingAttendance, res);
        }else{ 
            await FacilityAttendanceModel.create({ 
                facilityId: facilityId, 
                clockInSchedule: [{
                    clockInTime: clockInTime,
                    isActive: true
                }]
            })
            return customResponse.successResponse('Facility attendance created successfully',{}, res );
        }
        
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred while creating the attendance for the facility', res, error)
    }
}

const getFacilityAttendance = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        // facilities with attendance set already 
        const facilities = await FacilityAttendanceModel.find().populate({
            path: 'facilityId',
            model: 'Location'
        })

        if(!facilities){ 
            return customResponse.successResponse('There are no facility attendance', [], res)
        }
        return customResponse.successResponse('Facility attendance fetched', facilities, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred while getting the facility attendance', res, error)
    }
}

const getSingleAttendance = catchAsync(async(req:AuthenticatedRequest, res: Response) => {
    const attendanceId = req.params.attendanceId;
    const attendance = await FacilityAttendanceModel.find({_id:attendanceId}).exec();
    return customResponse.successResponse('attendanced fetched', attendance, res);
});


const getAllAttendanceForFacility = catchAsync(async(req:AuthenticatedRequest, res: Response) => {
    const facilityId = req.params.facilityId;
    const result = await FacilityAttendanceModel.find({facilityId:facilityId}).exec();
    return customResponse.successResponse('attendanced fetched', result, res);
});


const facilityAttendanceHistory = catchAsync(async (req: AuthenticatedRequest, res: Response) =>{
    // get all clock in time for every staff 
    const result = await StaffAttendanceModel.find().populate('attendance.facilityId userId roleId')
    return customResponse.successResponse('fetched', result, res)
})
export default{ 
    createFacilityAttendance, 
    getFacilityAttendance,
    facilityAttendanceHistory
}