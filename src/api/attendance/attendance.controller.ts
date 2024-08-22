import { AuthenticatedRequest } from '../../middlewares/security';
import customResponse from "../../helpers/response";
import { Request, Response } from 'express';
import { createChildLogger } from '../../utils/childLogger';
import FacilityAttendanceModel from '../../models/facilityAttendance';
import StaffAttendanceModel from '../../models/staffAttendance';
import mongoose from 'mongoose';
import Location from '../../models/location';
import { getStaffTimeDetails } from '../../utils/time';
import catchAsync from '../../utils/catchAsync';

const moduleName = '[attendance/controller]'
const Logger = createChildLogger(moduleName)

const staffClockIn = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        // staff gets to a facility and is asked to take attendance by scanning 
        const userId = req.auth.userId
        const roleId = req.auth.role_id && req.auth.role_id._id ? req.auth.role_id._id : req.auth.roleId;
        const{lat, long} = req.body

        if(!lat || !long){ 
            return customResponse.badRequestResponse('Please fill all fields', res)
        }

        // now get the time the person clocked in
        const staffClockInTime = getStaffTimeDetails()
        
        // Based on the staff lat and long, look for facilities within 10m
        const staffLocation = {
            type: 'Point',
            coordinates: [lat, long],
        };

        const facilities = await Location.find({ 
            location: {
                $near: {
                    $geometry: staffLocation, 
                    $maxDistance: 1000
                }
            }
        })
        
        if(facilities.length == 0){ 
            return customResponse.notFoundResponse('There is no facility within a 1000 meters', res)
        }else if (facilities.length > 1){ 
            return customResponse.successResponse('Please select a facility to clock into', facilities,res)
        }

        Logger.info(facilities)
        const facility = facilities[0]
        let facilityId = facility._id
        // Get the status of the clock in time for that facility 
        const {status, facilityAttendanceSchedule} = await getFacilityClockInStatus(facilityId,{staffHours: staffClockInTime.getHours(), staffMinute: staffClockInTime.getMinutes()})

        const existingStaffAttendance = await StaffAttendanceModel.findOne({userId: userId, roleId: roleId})
        if(existingStaffAttendance){ 
            // if existing, push to the attendance array
            existingStaffAttendance.attendance.push({
                facilityId: facilityId as unknown as mongoose.Types.ObjectId, 
                clockInTime: staffClockInTime as unknown as mongoose.Schema.Types.Date, 
                facilityAttendanceSchedule: facilityAttendanceSchedule, 
                status: status, 
                location: staffLocation
            })
            await existingStaffAttendance.save()
            return customResponse.successResponse('staff attendance taken and updated', {}, res)
        }else{ 
            await StaffAttendanceModel.create({ 
                userId: userId, 
                roleId: roleId, 
                attendance: [{ 
                    facilityId: facilityId, 
                    clockInTime: staffClockInTime, 
                    facilityAttendanceSchedule: facilityAttendanceSchedule, 
                    status: status, 
                    location: staffLocation
                }]
            })
            return customResponse.successResponse('staff attendance taken', {}, res)
        }
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred while recoding staff attendance', res, error)
    }
}
const selectFacility = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const userId = req.auth.userId
        const roleId = req.auth.role_id && req.auth.role_id._id ? req.auth.role_id._id : req.auth.roleId;
        const{selectedFacility} = req.body

        if(!selectedFacility){ 
            return customResponse.badRequestResponse('Please fill all fields', res)
        }

        // check if the facility selected exists 
        const presentFacility = await Location.findById(selectedFacility)
        if(!presentFacility){ 
            return customResponse.notFoundResponse('There is no facility with such Id', res)
        }

        const staffLocation = {
            type: 'Point',
            coordinates: [presentFacility.location.coordinates[0], presentFacility.location.coordinates[1]], //since they selected the facility, just get the coordinates for the facility
        };

        // now get the time the person clocked in
        const staffClockInTime = getStaffTimeDetails()
        const {status, facilityAttendanceSchedule} = await getFacilityClockInStatus(selectedFacility,{staffHours: staffClockInTime.getHours(), staffMinute: staffClockInTime.getMinutes()})

        // check if the user with the same role has a staffAttendance detail 
        const existingStaffAttendance = await StaffAttendanceModel.findOne({userId: userId, roleId: roleId})
        if(existingStaffAttendance){ 
            // if existing, push to the attendance array
            existingStaffAttendance.attendance.push({
                facilityId: selectedFacility as unknown as mongoose.Types.ObjectId, 
                clockInTime: staffClockInTime as unknown as mongoose.Schema.Types.Date, 
                facilityAttendanceSchedule: facilityAttendanceSchedule, 
                status: status, 
                location: staffLocation
            })
            await existingStaffAttendance.save()
            return customResponse.successResponse('staff attendance taken and updated', {}, res)
        }else{ 
            await StaffAttendanceModel.create({ 
                userId: userId, 
                roleId: roleId, 
                attendance: [{ 
                    facilityId: selectedFacility, 
                    clockInTime: staffClockInTime, 
                    facilityAttendanceSchedule: facilityAttendanceSchedule, 
                    status: status, 
                    location: staffLocation
                }]
            })
            return customResponse.successResponse('staff attendance taken', {}, res)
        }
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred while creating the asset group', res, error)
    }
}

async function getFacilityClockInStatus(facilityId: any, staffClockInTime: { staffHours: number; staffMinute: number; }) {
    const { staffHours: staffClockInHour, staffMinute: staffClockInMinute } = staffClockInTime;

    const activeFacilityAttendance = await FacilityAttendanceModel.findOne({ facilityId });
    const scheduleId = activeFacilityAttendance?.clockInSchedule.find(schedule => schedule.isActive == true)

    if(!scheduleId) throw new Error('The facility does not have any clockInSchedule to use. Notify Admin')
    const activeSchedule = scheduleId.clockInTime as unknown as Date

    if (!activeSchedule) throw new Error('No active schedule found for the facility');

    const facilityClockInHour = activeSchedule.getHours();
    const facilityClockInMinute = activeSchedule.getMinutes();

    const status = (staffClockInHour < facilityClockInHour || 
                    (staffClockInHour === facilityClockInHour && staffClockInMinute <= facilityClockInMinute)) 
                    ? 'on time' 
                    : 'late';

    return { facilityClockInHour, facilityClockInMinute, status, facilityAttendanceSchedule: scheduleId._id };
}

const currentAttendanceForStaff = async(req:AuthenticatedRequest, res: Response) => { 
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to midnight to get the start of the day

        const latestStaffAttendance = await StaffAttendanceModel.aggregate([
            // Match attendance records for the current day
            {
                $match: {
                    'attendance.clockInTime': { $gte: today }
                }
            },
            // Unwind the attendance array to work with individual attendance records
            { $unwind: '$attendance' },
            // Match attendance records for the current day again (in case there are older records)
            {
                $match: {
                    'attendance.clockInTime': { $gte: today }
                }
            },
            // Sort attendance records in descending order based on clock-in time
            { $sort: { 'attendance.clockInTime': -1 } },
            // Group by userId and take the first attendance record for each group (which will be the latest)
            {
                $group: {
                    _id: {
                        userId: '$userId',
                        roleId: '$roleId'
                    },
                    latestAttendance: { $first: '$attendance' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'roles',
                    localField: '_id.roleId',
                    foreignField: '_id',
                    as: 'role'
                }
            },
            {
                $lookup: {
                    from: 'locations',
                    localField: 'latestAttendance.facilityId',
                    foreignField: '_id',
                    as: 'facility'
                }
            },
            
            {
                $project: {
                    user: 1,
                    role: 1,       
                    facility: 1,
                    latestAttendance: 1 
                }
            }
        ]);
        return customResponse.successResponse('staff attendance fetched', latestStaffAttendance, res)
    } catch (error: any) {
        Logger.error(error)
        return customResponse.serverErrorResponse('An error occurred while creating the asset group', res, error)
    }
}

const staffAttendanceHistory = catchAsync(async (req:AuthenticatedRequest, res: Response) => { 
    const {staffId, roleId} = req.query
    const staffHistory = await StaffAttendanceModel.findOne({userId: staffId, roleId: roleId}).populate('attendance.facilityId')

    return customResponse.successResponse('staff attendance history', staffHistory, res)
})

export default{ 
    staffClockIn, 
    selectFacility, 
    currentAttendanceForStaff,
    staffAttendanceHistory
}