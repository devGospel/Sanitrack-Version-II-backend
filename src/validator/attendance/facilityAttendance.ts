import Joi from 'joi';
import mongoose from 'mongoose';

interface createFacilityAttendance{ 
    facilityId: mongoose.Types.ObjectId
    clockInSchedule: [{
        clockInHour: Number,
        clockInMinute: Number,
        isActive: Boolean,
    }]
}

const facilityAttendanceValidation = { 
    createFacilityAttendance: Joi.object<createFacilityAttendance>({ 
        facilityId: Joi.string().required().label('The facility Id is required'), 
        clockInSchedule: Joi.array().items(
            Joi.object({ 
                clockInHour: Joi.number().required().label('The hour to clock into the facility is required'), 
                clockInMinute: Joi.number().required().label('The minute to clock into the facility is required'), 
                isActive: Joi.boolean().required().label('The status is required')
            })
        )
    })
}

export default facilityAttendanceValidation